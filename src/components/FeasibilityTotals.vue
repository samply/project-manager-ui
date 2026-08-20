<template>
  <dl v-if="result.length" class="feasibility-totals">
    <template v-for="item in result" :key="item.label">
      <dt>{{ item.label }}</dt>
      <dd>{{ item.value.toLocaleString() }}</dd>
      <template v-if="item.breakdown?.length">
        <template v-for="child in item.breakdown" :key="child.label">
          <dt class="feasibility-breakdown-label">{{ child.label }}</dt>
          <dd class="feasibility-breakdown-value">{{ child.value.toLocaleString() }}</dd>
        </template>
      </template>
    </template>
  </dl>
</template>

<script lang="ts">
// This component renders the feasibility summary returned by the backend.
// What is shown and how items are labelled is controlled entirely by the
// deployment's application.yaml (feasibility.display). The frontend stays
// generic and requires no changes between deployments.
//
// If your deployment needs a fundamentally different visual representation
// (e.g. charts, heatmaps, or grouped tables that cannot be expressed as a
// flat or two-level list), the recommended path is to register a custom
// micro-frontend in the Single-SPA root configuration of your deployment.
// That micro-frontend can mount into any DOM element and consume the same
// /project/bridgehead/feasibility endpoint independently.
//
// Example — add the following to your deployment's Single-SPA root config:
//
//   // importmap.json
//   {
//     "imports": {
//       "@your-org/feasibility-ui": "https://your-cdn/feasibility-ui.js"
//     }
//   }
//
//   // root-config.ts
//   singleSpa.registerApplication({
//     name: "@your-org/feasibility-ui",
//     app: () => System.import("@your-org/feasibility-ui"),
//     activeWhen: ["/project"],
//   });
//
// The custom micro-frontend is responsible for mounting itself into a
// container element and for calling the feasibility endpoint directly.

import {defineComponent, PropType} from "vue";
import {FeasibilityResult} from "@/services/projectManagerBackendService";

export default defineComponent({
  name: "FeasibilityTotals",
  props: {
    result: {
      type: Array as PropType<FeasibilityResult>,
      required: true
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

.feasibility-breakdown-label,
.feasibility-breakdown-value {
  padding-left: 1rem;
  font-size: 0.875em;
  opacity: 0.75;
}
</style>
