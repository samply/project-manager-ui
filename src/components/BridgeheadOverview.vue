<template>
  <div class="timeline-outer">
    <button v-if="needsArrows" type="button" class="timeline-arrow" aria-label="Show earlier steps"
            :disabled="effectiveTimelineScrollIndex === 0" @click="scrollTimeline('left')">
      <i class="bi bi-caret-left-fill"></i>
    </button>
    <div class="timeline-body">
      <div class="timeline-header-row">
        <div class="site-col-spacer"></div>
        <div class="steps-area" :ref="setTimelineStepsRef" :style="stepsGridStyle">
          <span v-for="step in visibleStepDefs" :key="step.key" class="col-label">{{ step.label }}</span>
        </div>
      </div>
      <div v-for="site in siteTimelines" :key="site.bridgehead.bridgehead"
           class="timeline-row" :class="{ selected: selectedBridgehead === site.bridgehead.bridgehead }"
           @click="selectBridgehead(site.bridgehead)">
        <div class="site-name">
          <span>{{ site.bridgehead.humanReadable ?? site.bridgehead.bridgehead }}</span>
          <BridgeheadContacts :contacts="site.bridgehead.contacts ?? []" />
        </div>
        <div class="steps-area" :style="stepsGridStyle">
          <div v-for="(step, index) in visibleSteps(site.steps)" :key="step.key" class="t-step">
            <div v-if="index > 0" class="t-line" :class="{ done: step.visual === 'done' }"></div>
            <!-- "Data export authorised" can be several project types at once - when
                 they don't all share one state, show one small dot per group instead
                 of a single node standing in for all of them. -->
            <div v-if="step.subSteps && step.subSteps.length > 1" class="t-node-cluster"
                 data-toggle="tooltip" data-placement="top" :title="step.tooltip ?? undefined">
              <div v-for="subStep in step.subSteps" :key="subStep.label"
                   class="t-node t-node-mini" :class="subStep.classification"
                   :title="subStep.tooltip ?? undefined"></div>
            </div>
            <div v-else class="t-node" :class="step.visual"
                 data-toggle="tooltip" data-placement="top" :title="step.tooltip ?? undefined">
              <svg v-if="step.visual === 'done'" viewBox="0 0 16 16" width="8" height="8" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3 3 7-7"/></svg>
              <svg v-else-if="step.visual === 'failed'" viewBox="0 0 16 16" width="7" height="7" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
              <svg v-else-if="step.visual === 'warning'" viewBox="0 0 16 16" width="2" height="8" fill="#fff"><rect x="0" y="0" width="2" height="6"/><rect x="0" y="7" width="2" height="2"/></svg>
              <svg v-else-if="step.visual === 'not_required'" viewBox="0 0 16 16" width="8" height="8" fill="#fff"><rect x="3" y="7" width="10" height="2" rx="1"/></svg>
            </div>
            <DownloadButton
                v-if="step.downloadAction"
                :context="fetchContext(site.bridgehead)"
                :project-manager-backend-service="projectManagerBackendService"
                icon-class="bi bi-download"
                button-class="timeline-download-button"
                :module="Module.PROJECT_DOCUMENTS_MODULE"
                :action="step.downloadAction"
            />
          </div>
        </div>
      </div>
    </div>
    <button v-if="needsArrows" type="button" class="timeline-arrow" aria-label="Show later steps"
            :disabled="effectiveTimelineScrollIndex >= (stepDefs.length - timelineStepsShown)"
            @click="scrollTimeline('right')">
      <i class="bi bi-caret-right-fill"></i>
    </button>
  </div>
  <div class="legend">
    <span class="legend-item"><span class="t-node done"></span> Done</span>
    <span class="legend-item"><span class="t-node warning"></span> In progress</span>
    <span class="legend-item"><span class="t-node failed"></span> Failed / rejected</span>
    <span class="legend-item"><span class="t-node not_required"></span> Not required</span>
    <span class="legend-item"><span class="t-node next"></span> Next</span>
    <span class="legend-item"><span class="t-node future"></span> Not started</span>
  </div>
</template>

<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {
  Action,
  Bridgehead,
  DataShieldProjectStatus,
  getAllProjectTypes,
  getMergedQueryStates,
  hasProjectType,
  Module,
  Project,
  ProjectManagerBackendService,
  ProjectManagerContext,
  ProjectType,
  UserProjectState
} from "@/services/projectManagerBackendService";
import DownloadButton from "@/components/DownloadButton.vue";
import BridgeheadContacts from "@/components/BridgeheadContacts.vue";
import '@/assets/styles/state-circle.css'
import {PropType, watch} from "vue";
import {BridgeheadOverviewHeader} from "@/services/BridgeheadOverviewHeaders";
import {
  assignPipelineVisuals,
  classifyStateCircle,
  describeCreatorStatus,
  describeQueryState,
  PipelineClassification,
  PipelineStepVisual
} from "@/services/pipelineStatus";

interface TimelineStepDef {
  key: string;
  label: string;
}

interface TimelineSubStep {
  label: string;
  classification: PipelineClassification;
  tooltip?: string;
}

interface ClassifiedTimelineStep {
  key: string;
  label: string;
  classification: PipelineClassification;
  tooltip?: string;
  downloadAction?: Action;
  subSteps?: TimelineSubStep[];
}

interface TimelineStep {
  key: string;
  label: string;
  visual: PipelineStepVisual;
  tooltip?: string;
  downloadAction?: Action;
  subSteps?: TimelineSubStep[];
}

interface SiteTimeline {
  bridgehead: Bridgehead;
  steps: TimelineStep[];
}

// This is the same lifecycle-pipeline concept as ProjectView.vue's
// single-bridgehead Status card (see pipelineStatus.ts), rendered once per
// site instead of once for the whole request, so progress across sites can
// be compared at a glance - see
// project-manager-ui/plans/2026-09-21-plan-unify-table-design.md, Step 5.
@Options({
  name: "BridgeheadOverview",
  components: {DownloadButton, BridgeheadContacts},
  props: {
    context: {
      type: Object as PropType<ProjectManagerContext>,
      required: true
    },
    projectManagerBackendService: {
      type: Object as PropType<ProjectManagerBackendService>,
      required: true
    },
    bridgeheads: {
      type: Array as PropType<Bridgehead[]>,
      required: true
    },
    project: {
      type: Object as PropType<Project>,
      required: false
    },
    existsVotumForAllBridgeheads: {
      type: Boolean,
      required: true
    },
    existsPublication: {
      type: Boolean,
      required: true
    },
    existsFinalReport: {
      type: Boolean,
      required: true
    },
    callUpdateActiveBridgehead: {
      type: Function as PropType<(param: Bridgehead) => void>,
      required: true
    }
  }
})
export default class BridgeheadOverview extends Vue {

  readonly context!: ProjectManagerContext;
  readonly projectManagerBackendService!: ProjectManagerBackendService;
  readonly bridgeheads!: Bridgehead[];
  readonly project?: Project;
  readonly existsVotumForAllBridgeheads!: boolean;
  readonly existsFinalReport!: boolean;
  readonly existsPublication!: boolean;
  readonly callUpdateActiveBridgehead!: (param: Bridgehead) => void;

  Module = Module;
  Action = Action;

  DATASHIELD_STATUS_HEADER = 'DataSHIELD Status';

  // noinspection SpellCheckingInspection
  existsVotums: boolean[] = [];
  dataShieldStatusArray: DataShieldProjectStatus[] = [];
  selectedBridgehead: string | null = null;

  timelineScrollIndex: number | null = null;
  timelineRowWidth = 0;
  timelineResizeObserver?: ResizeObserver;
  observedTimelineStepsArea?: HTMLElement;

  async created() {
    // Created here (not mounted()) so the observer already exists by the
    // time setTimelineStepsRef can first fire.
    if (typeof ResizeObserver !== 'undefined') {
      this.timelineResizeObserver = new ResizeObserver(() => this.updateTimelineRowWidth());
    }
    watch(() => this.projectManagerBackendService,
        () => {
          this.updateBridgeheadExtraInfo();
        },
        {immediate: true, deep: true}
    );
    watch(() => this.bridgeheads,
        () => {
          this.timelineScrollIndex = null;
        }
    );
    await this.updateBridgeheadExtraInfo();
    this.selectedBridgehead = this.context.bridgehead?.bridgehead ?? this.bridgeheads[0]?.bridgehead ?? null;
  }

  mounted() {
    window.addEventListener('resize', this.updateTimelineRowWidth);
  }

  beforeUnmount() {
    this.timelineResizeObserver?.disconnect();
    window.removeEventListener('resize', this.updateTimelineRowWidth);
  }

  // The step sequence is fixed and shared by every site's row so columns
  // stay aligned; DataSHIELD only appears when the project actually uses it.
  // Order preserved from the original table (DataSHIELD before "Data
  // accessible") - not necessarily the same order as ProjectView.vue's
  // single-bridgehead pipeline, which is a separate pre-existing difference,
  // not something introduced here.
  get stepDefs(): TimelineStepDef[] {
    const defs: TimelineStepDef[] = [
      {key: 'votum', label: BridgeheadOverviewHeader.VOTUM},
      {key: 'teiler', label: BridgeheadOverviewHeader.TEILER}
    ];
    if (hasProjectType(this.project, ProjectType.DATASHIELD)) {
      defs.push({key: 'datashield', label: this.DATASHIELD_STATUS_HEADER});
    }
    defs.push({key: 'user_access', label: BridgeheadOverviewHeader.USER_ACCESS});
    defs.push({key: 'creator_acceptance', label: BridgeheadOverviewHeader.APPLICANT_RESULTS_ACCEPTANCE});
    defs.push({key: 'report', label: BridgeheadOverviewHeader.REPORT_OR_PUBLICATION});
    return defs;
  }

  get siteTimelines(): SiteTimeline[] {
    return this.bridgeheads.map((bridgehead, index) => ({
      bridgehead,
      steps: assignPipelineVisuals(this.buildSiteSteps(bridgehead, index))
    }));
  }

  buildSiteSteps(bridgehead: Bridgehead, bridgeheadIndex: number): ClassifiedTimelineStep[] {
    const steps: ClassifiedTimelineStep[] = [];

    // Same fact ProjectView.vue's pipeline shows for the active bridgehead,
    // here per site: no failure state, only "not received" - which per the
    // real workflow means no ethics vote is required for that site, not
    // that one is awaiting review. Classified separately from warning/amber
    // (reserved exclusively for "actively in progress" elsewhere in this row,
    // e.g. Data export authorised) since the two mean opposite things.
    const hasOwnVotum = this.existsVotums.length > 0 && this.existsVotums[bridgeheadIndex];
    const votumDone = hasOwnVotum || this.existsVotumForAllBridgeheads;
    steps.push({
      key: 'votum',
      label: BridgeheadOverviewHeader.VOTUM,
      classification: votumDone ? 'done' : 'not_required',
      tooltip: votumDone ? undefined : 'No ethics vote required',
      downloadAction: votumDone
          ? (hasOwnVotum ? Action.DOWNLOAD_VOTUM_ACTION : Action.DOWNLOAD_VOTUM_FOR_ALL_BRIDGEHEADS_ACTION)
          : undefined
    });

    // A project can query several project types at once for the same site,
    // each with its own state; one failure taints the step, "done" needs
    // every type finished, any type actively in progress makes it amber.
    const teilerGroups = getMergedQueryStates(bridgehead, getAllProjectTypes(this.project));
    const teilerClassifications = teilerGroups.map(group => classifyStateCircle(group.state));
    let teilerClassification: PipelineClassification;
    if (teilerClassifications.includes('failed')) teilerClassification = 'failed';
    else if (teilerClassifications.includes('warning')) teilerClassification = 'warning';
    else if (teilerClassifications.length > 0 && teilerClassifications.every(c => c === 'done')) teilerClassification = 'done';
    else teilerClassification = 'grey';
    steps.push({
      key: 'teiler',
      label: BridgeheadOverviewHeader.TEILER,
      classification: teilerClassification,
      tooltip: teilerGroups.map(group => `${group.types.join(', ')}: ${describeQueryState(group.state)}`).join(' | ') || undefined,
      // Only worth breaking out as a cluster of sub-dots when the project
      // types don't all agree on one state - matches ProjectView.vue's
      // pipeline treatment of the same fact.
      subSteps: teilerGroups.length > 1
          ? teilerGroups.map(group => ({
            label: group.types.join(', '),
            classification: classifyStateCircle(group.state),
            tooltip: `${group.types.join(', ')}: ${describeQueryState(group.state)}`
          }))
          : undefined
    });

    if (hasProjectType(this.project, ProjectType.DATASHIELD)) {
      const status = this.dataShieldStatusArray[bridgeheadIndex];
      steps.push({
        key: 'datashield',
        label: this.DATASHIELD_STATUS_HEADER,
        classification: classifyStateCircle(status?.project_status),
        tooltip: status?.project_status
      });
    }

    steps.push({
      key: 'user_access',
      label: BridgeheadOverviewHeader.USER_ACCESS,
      classification: classifyStateCircle(bridgehead?.state),
      tooltip: bridgehead?.state ?? undefined
    });

    const creatorStatus = this.getCreatorStatusForBridgehead(bridgehead);
    steps.push({
      key: 'creator_acceptance',
      label: BridgeheadOverviewHeader.APPLICANT_RESULTS_ACCEPTANCE,
      classification: classifyStateCircle(creatorStatus),
      tooltip: creatorStatus ? describeCreatorStatus(creatorStatus) : undefined
    });

    // Whether a final report/publication exists is a project-wide fact, not
    // a per-site one - same value and download action on every row, exactly
    // matching the original table's behavior for this column.
    const reportDone = this.existsFinalReport || this.existsPublication;
    steps.push({
      key: 'report',
      label: BridgeheadOverviewHeader.REPORT_OR_PUBLICATION,
      classification: reportDone ? 'done' : 'grey',
      downloadAction: reportDone
          ? (this.existsPublication ? Action.DOWNLOAD_PUBLICATION_ACTION : Action.DOWNLOAD_FINAL_REPORT_ACTION)
          : undefined
    });

    return steps;
  }

  // How many step columns fit the grid's current width, so the shared
  // arrows only appear when columns would actually overflow - mirrors
  // ProjectView.vue's pipelineStepsShown/.pipeline-step's min-width.
  get timelineStepsShown(): number {
    const totalSteps = this.stepDefs.length;
    if (totalSteps === 0) return 0;
    if (this.timelineRowWidth === 0) return totalSteps; // not measured yet
    const STEP_MIN_WIDTH = 84;
    if (totalSteps * STEP_MIN_WIDTH <= this.timelineRowWidth) return totalSteps;
    return Math.max(1, Math.floor(this.timelineRowWidth / STEP_MIN_WIDTH));
  }

  get needsArrows(): boolean {
    return this.stepDefs.length > this.timelineStepsShown;
  }

  get stepsGridStyle(): Record<string, string> {
    return {gridTemplateColumns: `repeat(${Math.max(this.timelineStepsShown, 1)}, minmax(84px, 1fr))`};
  }

  // The step columns are shared by every row, so there's no single site's
  // "next" step to center on - instead, center on the step right after the
  // last non-grey step of whichever site has made the most progress (the
  // one closest to needing attention next).
  get sharedNextIndex(): number {
    const indexes = this.siteTimelines
        .map(site => site.steps.findIndex(step => step.visual === 'next'))
        .filter(index => index !== -1);
    return indexes.length ? Math.max(...indexes) : 0;
  }

  get effectiveTimelineScrollIndex(): number {
    const totalSteps = this.stepDefs.length;
    const maxStart = Math.max(0, totalSteps - this.timelineStepsShown);
    if (this.timelineScrollIndex !== null) {
      return Math.min(this.timelineScrollIndex, maxStart);
    }
    const centered = this.sharedNextIndex - Math.floor((this.timelineStepsShown - 1) / 2);
    return Math.min(Math.max(centered, 0), maxStart);
  }

  get visibleStepDefs(): TimelineStepDef[] {
    const start = this.effectiveTimelineScrollIndex;
    return this.stepDefs.slice(start, start + this.timelineStepsShown);
  }

  visibleSteps(steps: TimelineStep[]): TimelineStep[] {
    const start = this.effectiveTimelineScrollIndex;
    return steps.slice(start, start + this.timelineStepsShown);
  }

  scrollTimeline(direction: 'left' | 'right') {
    const maxStart = Math.max(0, this.stepDefs.length - this.timelineStepsShown);
    const current = this.effectiveTimelineScrollIndex;
    this.timelineScrollIndex = direction === 'left'
        ? Math.max(0, current - 1)
        : Math.min(maxStart, current + 1);
  }

  updateTimelineRowWidth() {
    this.timelineRowWidth = this.observedTimelineStepsArea ? this.observedTimelineStepsArea.clientWidth : 0;
  }

  // Bound as a Vue function :ref on the header row's .steps-area - every
  // row's .steps-area shares the same width (both are flex:1 siblings of the
  // same fixed-width site-name column), so measuring just this one is enough.
  setTimelineStepsRef(el: Element | null) {
    const htmlEl = (el as HTMLElement | null) ?? undefined;
    if (htmlEl === this.observedTimelineStepsArea) return;
    this.timelineResizeObserver?.disconnect();
    this.observedTimelineStepsArea = htmlEl;
    if (htmlEl) this.timelineResizeObserver?.observe(htmlEl);
    this.updateTimelineRowWidth();
  }

  fetchContext(bridgehead: Bridgehead) {
    return new ProjectManagerContext(this.context.projectCode, bridgehead);
  }

  async updateBridgeheadExtraInfo() {
    this.existsVotums = await this.fetchExistsVotums();
    if (hasProjectType(this.project, ProjectType.DATASHIELD)) {
      this.dataShieldStatusArray = await this.fetchDataShieldStates();
    }
  }

  // noinspection SpellCheckingInspection
  async fetchExistsVotums(): Promise<boolean[]> {
    const promises = this.bridgeheads.map(bridgehead => this.existsVotum(bridgehead));
    return Promise.all(promises);
  }

  async existsVotum(bridgehead: Bridgehead): Promise<boolean> {
    return this.projectManagerBackendService.fetchData(Module.PROJECT_DOCUMENTS_MODULE, Action.EXISTS_VOTUM_ACTION, this.fetchContext(bridgehead), new Map());
  }

  async fetchDataShieldStates(): Promise<DataShieldProjectStatus[]> {
    const promises = this.bridgeheads.map(bridgehead => this.fetchDataShieldState(bridgehead));
    return Promise.all(promises);
  }

  async fetchDataShieldState(bridgehead: Bridgehead): Promise<DataShieldProjectStatus> {
    return this.projectManagerBackendService.isModuleActionActive(Module.TOKEN_MANAGER_MODULE, Action.FETCH_DATASHIELD_STATUS_ACTION).then(condition =>
        (condition) ? this.projectManagerBackendService.fetchData(Module.TOKEN_MANAGER_MODULE, Action.FETCH_DATASHIELD_STATUS_ACTION, this.fetchContext(bridgehead), new Map()) : {
          project_id: this.context.projectCode,
          bk: bridgehead.bridgehead,
          project_status: 'NOT_AVAILABLE'
        });
  }

  selectBridgehead(bridgehead: Bridgehead) {
    this.selectedBridgehead = bridgehead.bridgehead;
    this.callUpdateActiveBridgehead(bridgehead);
  }

  getCreatorStatusForBridgehead(bridgehead: Bridgehead): string | null | undefined {
    if (this.project?.creatorState === UserProjectState.ACCEPTED || this.project?.creatorState === UserProjectState.REJECTED) {
      return this.project?.creatorState;
    }
    return (bridgehead?.state === 'ACCEPTED') ? bridgehead?.creatorState : undefined;
  }

}
</script>

<style scoped>
.timeline-outer {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 22px 4px;
}

.timeline-body {
  flex: 1;
  min-width: 0;
}

.timeline-header-row, .timeline-row {
  display: flex;
  align-items: center;
}

.timeline-header-row {
  padding: 6px 0 10px 8px;
  border-bottom: 1px solid #d7e2ed;
}

.timeline-row {
  padding: 12px 0 12px 8px;
  border-bottom: 1px solid #d7e2ed;
  cursor: pointer;
}

.timeline-row:last-child {
  border-bottom: none;
}

.timeline-row:hover {
  background: #f4f7fb;
}

.timeline-row.selected {
  box-shadow: inset 4px 0 0 #2655a2;
}

.timeline-row.selected .site-name {
  color: #2655a2;
}

.site-col-spacer, .site-name {
  width: 190px;
  flex-shrink: 0;
  padding-right: 12px;
}

.site-name {
  display: flex;
  align-items: center;
  gap: 2px;
  font-weight: 600;
  font-size: 14px;
  color: #1f2a37;
}

.steps-area {
  display: grid;
  flex: 1;
  min-width: 0;
}

.col-label {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: #5b6b7c;
  text-align: center;
  line-height: 1.3;
  padding: 0 4px;
}

.t-step {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.t-line {
  position: absolute;
  top: 9px;
  left: -50%;
  width: 100%;
  height: 2px;
  background: #e3e6ea;
  z-index: 0;
}

.t-step:first-child .t-line {
  display: none;
}

.t-line.done {
  background: #3f8f45;
}

.t-node {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  box-sizing: border-box;
  flex-shrink: 0;
}

.t-node.done {
  background: #3f8f45;
}

.t-node.failed {
  background: #c0504d;
}

.t-node.warning {
  background: #e0ab18;
}

.t-node.not_required {
  background: #7a8699;
}

.t-node.next {
  background: #fff;
  border: 2px solid #2655a2;
  box-shadow: 0 0 0 3px #e9eef8;
}

.t-node.future {
  background: #e3e6ea;
}

.t-node-cluster {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 2px;
  z-index: 1;
}

.t-node-mini {
  width: 7px;
  height: 7px;
}

.t-node-mini.grey {
  background: #e3e6ea;
}

.t-step :deep(.timeline-download-button) {
  margin-top: 2px;
  padding: 0 !important;
  width: 16px;
  height: 16px;
  font-size: 10px;
  color: #5b6b7c !important;
}

.t-step :deep(.timeline-download-button:hover) {
  color: #2655a2 !important;
}

.timeline-arrow {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  margin-top: 2px;
  border-radius: 7px;
  border: 1px solid #d7e2ed;
  background: #fff;
  color: #5b6b7c;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.timeline-arrow:hover:not(:disabled) {
  border-color: #2655a2;
  color: #2655a2;
}

.timeline-arrow:disabled {
  opacity: .4;
  cursor: default;
}

.legend {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  padding: 12px 22px 16px;
  border-top: 1px solid #d7e2ed;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #5b6b7c;
}

.legend-item .t-node {
  position: static;
  width: 12px;
  height: 12px;
}
</style>
