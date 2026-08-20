<template>
  <div v-if="columns.length" class="feasibility-table-wrapper">
    <table class="feasibility-table">
      <thead>
        <tr>
          <th :rowspan="hasAnyBreakdown ? 2 : 1" class="feasibility-sortable" @click="sortBy('site')">
            Site{{ sortIndicator('site') }}
          </th>
          <template v-for="item in topLevelItems" :key="item.label">
            <th v-if="item.children.length" :colspan="item.children.length">{{ item.label }}</th>
            <th v-else :rowspan="hasAnyBreakdown ? 2 : 1" class="feasibility-sortable" @click="sortBy(item.label)">
              {{ item.label }}{{ sortIndicator(item.label) }}
            </th>
          </template>
        </tr>
        <tr v-if="hasAnyBreakdown">
          <template v-for="item in topLevelItems" :key="item.label">
            <th
                v-for="child in item.children"
                :key="child"
                class="feasibility-breakdown-label feasibility-sortable"
                @click="sortBy(child)"
            >
              {{ child }}{{ sortIndicator(child) }}
            </th>
          </template>
        </tr>
      </thead>
      <tbody>
        <tr v-for="bridgehead in pagedBridgeheads" :key="bridgehead.bridgehead">
          <td class="feasibility-bridgehead-name">{{ bridgehead.humanReadable }}</td>
          <td
              v-if="hasError(bridgehead.bridgehead)"
              :colspan="columns.length"
              class="feasibility-error-cell"
          >
            Oops! Something went wrong...
          </td>
          <td
              v-else-if="isLoading(bridgehead.bridgehead)"
              :colspan="columns.length"
              class="feasibility-loading"
          >
            loading...
          </td>
          <template v-else>
            <td v-for="column in columns" :key="column.label" :class="{ 'feasibility-breakdown-value': column.depth > 0 }">
              {{ cellText(bridgehead.bridgehead, column.label) }}
            </td>
          </template>
        </tr>
      </tbody>
    </table>
    <div v-if="totalPages > 1" class="pager">
      <button type="button" class="btn btn-primary" :disabled="currentPage === 1" @click="previousPage" style="rotate: 180deg">
        <i class="bi bi-play-fill" style="font-size: medium"></i>
      </button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button type="button" class="btn btn-primary" :disabled="currentPage === totalPages" @click="nextPage">
        <i class="bi bi-play-fill" style="font-size: medium"></i>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
// This component renders one combined feasibility table for every visible
// bridgehead, instead of a separate box per bridgehead. Bridgeheads are the
// table's rows (first column), matching the convention already used by
// other production tables in this app (see DocumentsTable.vue,
// ResultsBox.vue). The metric columns (the labels, and their one level of
// breakdown children, grouped under their parent label) are taken from the
// first bridgehead in the list that has answered - other bridgeheads'
// values are matched into that structure by label.
//
// A bridgehead that has not answered yet shows a single "loading..." cell
// spanning its row; a bridgehead whose fetch failed shows a single "Oops!"
// cell spanning its row instead. If the metric columns don't fit
// horizontally, the table scrolls; vertically, bridgeheads are paged.
import {defineComponent, PropType} from "vue";
import {Bridgehead, FeasibilityResult, hasFeasibilityResult} from "@/services/projectManagerBackendService";

interface FeasibilityColumn {
  label: string;
  depth: number;
}

interface FeasibilityTopLevelItem {
  label: string;
  children: string[];
}

export default defineComponent({
  name: "FeasibilityTable",
  props: {
    bridgeheads: {
      type: Array as PropType<Bridgehead[]>,
      required: true
    },
    results: {
      type: Map as PropType<Map<string, FeasibilityResult>>,
      required: true
    },
    errors: {
      type: Set as PropType<Set<string>>,
      required: true
    },
    pageSize: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      currentPage: 1,
      // 'site' sorts by bridgehead name; any other value is a column label.
      sortKey: "site" as string,
      sortDirection: "asc" as "asc" | "desc"
    };
  },
  computed: {
    // Structural detection of the canonical column layout must stay
    // independent of the user's chosen display sort (which can be based on
    // a column's values), so it always uses a fixed alphabetical order.
    alphabeticalBridgeheads(): Bridgehead[] {
      return [...this.bridgeheads].sort((a, b) =>
          (a.humanReadable ?? a.bridgehead).localeCompare(b.humanReadable ?? b.bridgehead)
      );
    },
    canonicalResult(): FeasibilityResult | undefined {
      for (const bridgehead of this.alphabeticalBridgeheads) {
        const result = this.results.get(bridgehead.bridgehead);
        if (hasFeasibilityResult(result)) return result;
      }
      return undefined;
    },
    topLevelItems(): FeasibilityTopLevelItem[] {
      const result = this.canonicalResult;
      if (!result) return [];

      return result.map(item => ({
        label: item.label,
        children: (item.breakdown ?? []).map(child => child.label)
      }));
    },
    hasAnyBreakdown(): boolean {
      return this.topLevelItems.some(item => item.children.length > 0);
    },
    columns(): FeasibilityColumn[] {
      const columns: FeasibilityColumn[] = [];
      for (const item of this.topLevelItems) {
        columns.push({label: item.label, depth: 0});
        for (const child of item.children) {
          columns.push({label: child, depth: 1});
        }
      }
      return columns;
    },
    // The order actually rendered: sorted by whichever column the user
    // picked (defaulting to Site). Sorting by a data column pushes
    // bridgeheads with no value yet (still loading, or errored) to the
    // bottom, in their normal alphabetical order among themselves - sorting
    // by Site itself never has that problem, since the name is always known.
    displayedBridgeheads(): Bridgehead[] {
      const direction = this.sortDirection === "asc" ? 1 : -1;

      if (this.sortKey === "site") {
        return [...this.alphabeticalBridgeheads].sort((a, b) =>
            direction * (a.humanReadable ?? a.bridgehead).localeCompare(b.humanReadable ?? b.bridgehead)
        );
      }

      const withValue: Bridgehead[] = [];
      const withoutValue: Bridgehead[] = [];
      this.alphabeticalBridgeheads.forEach(bridgehead => {
        const value = this.valuesByBridgehead.get(bridgehead.bridgehead)?.get(this.sortKey);
        (value !== undefined ? withValue : withoutValue).push(bridgehead);
      });

      withValue.sort((a, b) => {
        const valueA = this.valuesByBridgehead.get(a.bridgehead)!.get(this.sortKey)!;
        const valueB = this.valuesByBridgehead.get(b.bridgehead)!.get(this.sortKey)!;
        return direction * (valueA - valueB);
      });

      return [...withValue, ...withoutValue];
    },
    totalPages(): number {
      return Math.max(1, Math.ceil(this.displayedBridgeheads.length / this.pageSize));
    },
    pagedBridgeheads(): Bridgehead[] {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.displayedBridgeheads.slice(start, start + this.pageSize);
    },
    valuesByBridgehead(): Map<string, Map<string, number>> {
      const map = new Map<string, Map<string, number>>();
      this.alphabeticalBridgeheads.forEach(bridgehead => {
        const result = this.results.get(bridgehead.bridgehead);
        if (!hasFeasibilityResult(result)) return;

        const values = new Map<string, number>();
        for (const item of result) {
          values.set(item.label, item.value);
          for (const child of item.breakdown ?? []) {
            values.set(child.label, child.value);
          }
        }
        map.set(bridgehead.bridgehead, values);
      });
      return map;
    }
  },
  watch: {
    totalPages(newValue: number) {
      if (this.currentPage > newValue) this.currentPage = newValue;
    }
  },
  methods: {
    hasError(bridgeheadId: string): boolean {
      return this.errors.has(bridgeheadId);
    },
    isLoading(bridgeheadId: string): boolean {
      return !hasFeasibilityResult(this.results.get(bridgeheadId));
    },
    cellText(bridgeheadId: string, label: string): string {
      const value = this.valuesByBridgehead.get(bridgeheadId)?.get(label);
      return value !== undefined ? value.toLocaleString() : "-";
    },
    previousPage() {
      if (this.currentPage > 1) this.currentPage--;
    },
    nextPage() {
      if (this.currentPage < this.totalPages) this.currentPage++;
    },
    sortBy(key: string) {
      if (this.sortKey === key) {
        this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
      } else {
        this.sortKey = key;
        this.sortDirection = "asc";
      }
      this.currentPage = 1;
    },
    sortIndicator(key: string): string {
      if (this.sortKey !== key) return "";
      return this.sortDirection === "asc" ? " ▲" : " ▼";
    }
  }
});
</script>

<style scoped>
.feasibility-table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.feasibility-table {
  width: 100%;
  border-collapse: collapse;
}

.feasibility-table th,
.feasibility-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.feasibility-table th {
  background-color: #f2f2f2;
}

.feasibility-sortable {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.feasibility-sortable:hover {
  background-color: #e9ecef;
}

.feasibility-bridgehead-name {
  font-weight: 600;
  white-space: nowrap;
}

.feasibility-breakdown-label,
.feasibility-breakdown-value {
  opacity: 0.75;
}

.feasibility-loading,
.feasibility-error-cell {
  text-align: center;
  font-style: italic;
  opacity: 0.75;
}

.pager {
  display: flex;
  justify-content: end;
}

.pager span {
  display: flex;
  border: 1px solid #cccccc;
  border-radius: 5px;
  padding: 0 10px 1px 10px;
  background-color: white;
}

.pager button {
  padding-top: 3px;
  padding-bottom: 3px;
}

.pager button, .pager span {
  margin-left: 10px;
  align-items: center;
}
</style>
