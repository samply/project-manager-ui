<template>
  <div class="feasibility-table-wrapper">
    <table v-if="bridgeheads.length" class="feasibility-table">
      <thead>
        <tr>
          <th :rowspan="hasAnyBreakdown ? 2 : 1" class="feasibility-sortable" @click="sortBy('site')">
            <span class="th-label">Site<svg v-if="sortKey === 'site'" class="sort-caret" :class="{ desc: sortDirection === 'desc' }" viewBox="0 0 10 10" fill="currentColor"><path d="M5 1l4 5H1z"/></svg></span>
          </th>
          <template v-for="item in topLevelItems" :key="item.label">
            <th v-if="item.children.length" :colspan="item.children.length">{{ item.label }}</th>
            <th v-else :rowspan="hasAnyBreakdown ? 2 : 1" class="feasibility-sortable" @click="sortBy(item.label)">
              <span class="th-label">{{ item.label }}<svg v-if="sortKey === item.label" class="sort-caret" :class="{ desc: sortDirection === 'desc' }" viewBox="0 0 10 10" fill="currentColor"><path d="M5 1l4 5H1z"/></svg></span>
            </th>
          </template>
          <th v-if="!columns.length">Statistics</th>
        </tr>
        <tr v-if="hasAnyBreakdown">
          <template v-for="item in topLevelItems" :key="item.label">
            <th
                v-for="child in item.children"
                :key="child"
                class="feasibility-breakdown-label feasibility-sortable"
                @click="sortBy(child)"
            >
              <span class="th-label">{{ child }}<svg v-if="sortKey === child" class="sort-caret" :class="{ desc: sortDirection === 'desc' }" viewBox="0 0 10 10" fill="currentColor"><path d="M5 1l4 5H1z"/></svg></span>
            </th>
          </template>
        </tr>
      </thead>
      <tbody>
        <tr v-for="bridgehead in pagedBridgeheads" :key="bridgehead.bridgehead">
          <td class="feasibility-bridgehead-name">
            <span>{{ bridgehead.humanReadable ?? bridgehead.bridgehead }}</span>
            <button v-if="editable" type="button" class="btn btn-link feasibility-remove-button"
                    title="Remove site" aria-label="Remove site"
                    @click="removeBridgehead(bridgehead.bridgehead)">
              <i class="bi bi-x-lg"></i>
            </button>
          </td>
          <td
              v-if="hasError(bridgehead.bridgehead)"
              :colspan="Math.max(columns.length, 1)"
              class="feasibility-error-cell"
          >
            Oops! Something went wrong...
          </td>
          <td
              v-else-if="isLoading(bridgehead.bridgehead)"
              :colspan="Math.max(columns.length, 1)"
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
        <tr v-if="editable && availableBridgeheadsToAdd.length" class="feasibility-add-row">
          <td :colspan="totalColumns">
            <button v-if="!showAddBridgehead" type="button" class="add-row-trigger"
                    title="Add site" aria-label="Add site" @click="showAddBridgehead = true">
              <i class="bi bi-plus"></i>
              <span>Add site</span>
            </button>
            <div v-else class="add-row-form">
              <select v-model="newBridgeheadId" class="form-select" aria-label="Site to add">
                <option disabled value="">Site</option>
                <option v-for="bridgehead in availableBridgeheadsToAdd" :key="bridgehead.bridgehead"
                        :value="bridgehead.bridgehead">
                  {{ bridgehead.humanReadable ?? bridgehead.bridgehead }}
                </option>
              </select>
              <button type="button" class="btn btn-primary" :disabled="!newBridgeheadId"
                      title="Add site" aria-label="Add site" @click="addBridgehead">
                <i class="bi bi-check"></i>
              </button>
              <button type="button" class="btn btn-primary" title="Cancel" aria-label="Cancel"
                      @click="cancelAddBridgehead">
                <i class="bi bi-x"></i>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="totalPages > 1" class="pager">
      <button type="button" class="pager-btn" :disabled="currentPage === 1" @click="previousPage"
              style="rotate: 180deg" aria-label="Previous page">
        <i class="bi bi-play-fill"></i>
      </button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button type="button" class="pager-btn" :disabled="currentPage === totalPages" @click="nextPage"
              aria-label="Next page">
        <i class="bi bi-play-fill"></i>
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
import {formatDisplayNumber} from "@/services/displayFormatService";

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
    },
    editable: {
      type: Boolean,
      default: false
    },
    availableBridgeheads: {
      type: Array as PropType<Bridgehead[]>,
      default: () => []
    }
  },
  data() {
    return {
      currentPage: 1,
      // 'site' sorts by bridgehead name; any other value is a column label.
      sortKey: "site" as string,
      sortDirection: "asc" as "asc" | "desc",
      showAddBridgehead: false,
      newBridgeheadId: ""
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
    },
    availableBridgeheadsToAdd(): Bridgehead[] {
      const selectedIds = new Set(this.bridgeheads.map(bridgehead => bridgehead.bridgehead));
      return this.availableBridgeheads.filter(bridgehead => !selectedIds.has(bridgehead.bridgehead));
    },
    // Site column plus the metric columns - or the single "Statistics"
    // placeholder column shown when no metric columns are known yet - so the
    // add-row spans the full width of whatever the table currently renders.
    totalColumns(): number {
      return 1 + Math.max(this.columns.length, 1);
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
      return value !== undefined ? formatDisplayNumber(value) : "-";
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
    removeBridgehead(bridgeheadId: string) {
      this.$emit('update-bridgeheads', this.bridgeheads.filter(bridgehead => bridgehead.bridgehead !== bridgeheadId));
    },
    addBridgehead() {
      const bridgehead = this.availableBridgeheadsToAdd.find(candidate => candidate.bridgehead === this.newBridgeheadId);
      if (!bridgehead) return;

      this.$emit('update-bridgeheads', [...this.bridgeheads, bridgehead]);
      this.newBridgeheadId = "";
      this.showAddBridgehead = false;
    },
    cancelAddBridgehead() {
      this.newBridgeheadId = "";
      this.showAddBridgehead = false;
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
  font-size: 14px;
}

.feasibility-table th {
  background: #e9eef8;
  color: #2655a2;
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: uppercase;
  padding: 12px 22px;
  border-bottom: 1px solid #d7e2ed;
  white-space: nowrap;
}

.feasibility-table td {
  padding: 14px 22px;
  border-bottom: 1px solid #d7e2ed;
  vertical-align: middle;
  text-align: left;
  font-variant-numeric: tabular-nums;
}

.feasibility-table tbody tr:last-child td {
  border-bottom: none;
}

.feasibility-table tbody tr:hover td {
  background: #e9eef8;
}

.th-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.sort-caret {
  width: 9px;
  height: 9px;
  opacity: .7;
  transition: transform .15s ease-in-out;
}

.sort-caret.desc {
  transform: rotate(180deg);
}

.feasibility-sortable {
  cursor: pointer;
  user-select: none;
}

.feasibility-bridgehead-name {
  font-weight: 600;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.feasibility-remove-button {
  color: #64748b;
  padding: 0 0 0 0.75rem;
}

.feasibility-remove-button:hover {
  color: var(--status-danger-color);
}

.feasibility-add-row td {
  padding: 0;
  border-bottom: none;
}

.add-row-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  border-top: 1px dashed #d7e2ed;
  color: #2655a2;
  font-size: 14px;
  font-weight: 600;
  padding: 14px 22px;
  cursor: pointer;
  text-align: left;
}

.add-row-trigger:hover {
  background: #e9eef8;
}

.add-row-form {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 10px 22px;
  border-top: 1px dashed #2655a2;
  background: #e9eef8;
}

.add-row-form select {
  max-width: 24rem;
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
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.pager span {
  font-size: 13px;
  color: #5b6b7c;
  font-variant-numeric: tabular-nums;
  padding: 0 6px;
}

.pager-btn {
  border: 1px solid #d7e2ed;
  background: #fff;
  color: #5b6b7c;
  width: 30px;
  height: 30px;
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.pager-btn:hover:not(:disabled) {
  border-color: #2655a2;
  color: #2655a2;
}

.pager-btn:disabled {
  opacity: .4;
  cursor: default;
}
</style>
