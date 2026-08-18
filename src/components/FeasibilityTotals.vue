<template>
  <dl v-if="totalEntries.length" class="feasibility-totals">
    <template v-for="[label, total] in totalEntries" :key="label">
      <dt>{{ formatLabel(label) }}</dt>
      <dd>{{ total.toLocaleString() }}</dd>
    </template>
  </dl>
</template>

<script lang="ts">
import {defineComponent, PropType} from "vue";
import {FeasibilityResult} from "@/services/projectManagerBackendService";

export default defineComponent({
  name: "FeasibilityTotals",
  props: {
    result: {
      type: Object as PropType<FeasibilityResult>,
      required: true
    }
  },
  computed: {
    totalEntries(): [string, number][] {
      return Object.entries(this.result.totals ?? {});
    }
  },
  methods: {
    formatLabel(label: string): string {
      const normalized = label.replace(/[_-]+/g, ' ');
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }
  }
});
</script>

<style scoped>
.feasibility-totals {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.125rem 0.5rem;
  margin: 0;
  text-align: left;
}

.feasibility-totals dt,
.feasibility-totals dd {
  margin: 0;
}

.feasibility-totals dt {
  font-weight: normal;
}

.feasibility-totals dd {
  font-weight: bold;
  text-align: right;
}
</style>
