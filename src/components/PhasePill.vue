<template>
  <span class="phase-pill">{{ label }}</span>
</template>

<script lang="ts">
// The identical "phase pill" widget ProjectDashboard.vue's Phase column and
// ProjectView.vue's "At a Glance" Phase cell both render - pulled out once
// both had grown byte-for-byte identical markup, formatting logic
// (projectStateLabel) and CSS, unlike the rest of those two tables' layout,
// which genuinely differs (a table row vs. a single-record label/value
// strip) and isn't worth forcing into one shared component.
import {defineComponent, PropType} from "vue";
import {ProjectState, projectStateLabel} from "@/services/projectManagerBackendService";

export default defineComponent({
  name: "PhasePill",
  props: {
    state: {type: String as PropType<ProjectState>, required: true}
  },
  computed: {
    label(): string {
      return projectStateLabel(this.state);
    }
  }
});
</script>

<style scoped>
.phase-pill {
  display: inline-block;
  padding: 3px 11px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: .03em;
  text-transform: uppercase;
  background: #dce9f4;
  color: #2655a2;
  white-space: nowrap;
}
</style>
