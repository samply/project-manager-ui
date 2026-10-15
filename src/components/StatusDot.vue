<template>
  <div class="status-dot" :class="visual" :title="title ?? undefined"
       data-toggle="tooltip" data-placement="top">
    <svg v-if="visual === 'done'" viewBox="0 0 16 16" width="9" height="9" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3 3 7-7"/></svg>
    <svg v-else-if="visual === 'failed'" viewBox="0 0 16 16" width="8" height="8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
    <svg v-else-if="visual === 'warning'" viewBox="0 0 16 16" width="2" height="9" fill="#fff"><rect x="0" y="0" width="2" height="7"/><rect x="0" y="8" width="2" height="1"/></svg>
    <svg v-else-if="visual === 'not_required'" viewBox="0 0 16 16" width="10" height="10" fill="#fff"><rect x="3" y="7" width="10" height="2" rx="1"/></svg>
  </div>
</template>

<script lang="ts">
// A standalone version of the pipeline/timeline node look (see
// pipelineStatus.ts, ProjectView.vue, BridgeheadOverview.vue) for the places
// in the app that show a single isolated status value rather than a
// sequence of steps - e.g. UserInput.vue's "Results Acceptance" column,
// ResultsBox.vue's "User Access"/"Applicant Acceptance" columns. Same
// classification, same colors, same icon-based clarity (not relying on
// color alone) - just without the "next step in a sequence" concept, which
// doesn't apply to a single dot.
import {defineComponent, PropType} from "vue";
import {classifyStateCircle, PipelineClassification} from "@/services/pipelineStatus";

export default defineComponent({
  name: "StatusDot",
  props: {
    // Raw backend state value (e.g. "ACCEPTED", "REQUEST_CHANGES") - run
    // through the shared classifier. Ignored if `classification` is set.
    state: {type: String as PropType<string | null | undefined>, required: false, default: undefined},
    // Pre-computed classification, for the rare case a caller already knows
    // it isn't a plain state_circle.css value (e.g. a boolean-derived
    // "not_required" fact, the way the ethics vote works elsewhere).
    classification: {type: String as PropType<PipelineClassification>, required: false, default: undefined},
    title: {type: String as PropType<string | null | undefined>, required: false, default: undefined}
  },
  computed: {
    visual(): PipelineClassification {
      return this.classification ?? classifyStateCircle(this.state);
    }
  }
});
</script>

<style scoped>
.status-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex-shrink: 0;
}

.status-dot.done {
  background: #3f8f45;
}

.status-dot.failed {
  background: #c0504d;
}

.status-dot.warning {
  background: #e0ab18;
}

.status-dot.not_required {
  background: #7a8699;
}

.status-dot.grey {
  background: #e3e6ea;
  border: 1px solid #ccc;
}
</style>
