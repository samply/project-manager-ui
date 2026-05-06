<template>
  <div class="table-container">
    <button v-if="bridgeheads.length > numberBridgeheadShown" title="left" @click="scrollBridgehead('left')"
            class="btn btn-primary bridgehead-arrow">
      <i class="bi bi-caret-left-fill"></i>
    </button>
    <table class="bridgehead-table">
      <tbody>
      <tr v-for="(header, index) in headers" :key="index">
        <!-- Header in the first column -->
        <td class="header-cell">{{ header }}</td>
        <td v-if="header === Header.SITES" class="header-summary-cell" style="border-top: 1px solid #dddddd">
          {{ bridgeheads.length }}
        </td>
        <td v-else-if="header === 'Votum'" class="header-summary-cell status-cell">{{ getVotumStatus()[0] }}
          <div class="exist-small green"></div>
          / {{ getVotumStatus()[1] }}
          <div class="exist-small red"></div>
        </td>
        <td v-else-if="THeader.isHeaderOfHeaderType(header, Header.TEILER)" class="header-summary-cell status-cell">{{
            fetchQueryStatus(THeader.extractProjectType(header))[0]
          }}
          <div class="exist-small green"></div>
          / {{ fetchQueryStatus(THeader.extractProjectType(header))[1] }}
          <div class="exist-small red"></div>
        </td>
        <td v-if="header === DATASHIELD_STATUS_HEADER " class="header-summary-cell status-cell">
          {{ getDatashieldStatus()[0] }}
          <div class="exist-small green"></div>
          / {{ getDatashieldStatus()[1] }}
          <div class="exist-small red"></div>
        </td>
        <td v-else-if="header === 'User Access'" class="header-summary-cell status-cell">{{ getBridgeheadStatus()[0] }}
          <div class="exist-small green"></div>
          / {{ getBridgeheadStatus()[1] }}
          <div class="exist-small red"></div>
        </td>
        <td v-else-if="header === Header.APPLICANT_RESULTS_ACCEPTANCE" class="header-summary-cell status-cell">
          {{ getCreatorStatus()[0] }}
          <div class="exist-small green"></div>
          / {{ getCreatorStatus()[1] }}
          <div class="exist-small red"></div>
        </td>
        <!-- Data for each bridgehead in subsequent columns -->
        <td
            v-for="(bridgehead, bridgeheadIndex) in bridgeheads.slice(scrollIndex, scrollIndex + numberBridgeheadShown)"
            :key="bridgeheadIndex"
            class="data-cell"
            :class="{ 'selected': selectedBridgehead === bridgeheadIndex }"
        >
          <div v-if="header === Header.SITES" style="font-weight: bold; text-align: center"
               @click="selectBridgehead(bridgeheadIndex)">
            {{ bridgehead.humanReadable }}
          </div>
          <div v-else-if="header === Header.VOTUM">
            <div v-if="existsVotums.length > 0 && existsVotums[bridgeheadIndex]" class="states-circle-container">
              <div class="state_circle green"></div>
              <DownloadButton
                  :context="fetchContext(bridgehead)"
                  :project-manager-backend-service="projectManagerBackendService"
                  icon-class="bi bi-download"
                  button-class="download-button no-y-padding"
                  :module="Module.PROJECT_DOCUMENTS_MODULE"
                  :action="Action.DOWNLOAD_VOTUM_ACTION"
              />
            </div>
            <div v-else-if="existsVotumForAllBridgeheads" class="states-circle-container">
              <div class="state_circle green"></div>
              <DownloadButton
                  :context="fetchContext(bridgehead)"
                  :project-manager-backend-service="projectManagerBackendService"
                  icon-class="bi bi-download"
                  button-class="download-button no-y-padding"
                  :module="Module.PROJECT_DOCUMENTS_MODULE"
                  :action="Action.DOWNLOAD_VOTUM_FOR_ALL_BRIDGEHEADS_ACTION"
              />
            </div>
            <div v-else class="states-circle-container">
              <div class="state_circle red"></div>
            </div>
          </div>
          <div v-else-if="THeader.isHeaderOfHeaderType(header, Header.TEILER)" class="states-circle-container">
            <div class="state_circle"
                 :class="fetchQueryState(bridgehead, THeader.extractProjectType(header))?.toLowerCase()"
                 data-toggle="tooltip"
                 data-placement="top"
                 :title="fetchQueryState(bridgehead, THeader.extractProjectType(header)) ?? undefined"/>
          </div>
          <div v-else-if="header === Header.USER_ACCESS" class="states-circle-container">
            <div class="state_circle" :class="bridgehead?.state?.toLowerCase()" data-toggle="tooltip"
                 data-placement="top" :title="bridgehead?.state ?? undefined"/>
          </div>
          <div v-else-if="header === Header.APPLICANT_RESULTS_ACCEPTANCE" class="states-circle-container">
            <div class="state_circle" :class="getCreatorStatusForBridgehead(bridgehead)?.toLowerCase()"
                 data-toggle="tooltip" data-placement="top"
                 :title="getCreatorStatusForBridgehead(bridgehead) ?? undefined"/>
          </div>
          <div v-else-if="header === 'DataSHIELD Status'">
            <div v-if="dataShieldStatusArray[bridgeheadIndex]" class="states-circle-container">
              <div class="state_circle" :class="dataShieldStatusArray[bridgeheadIndex]?.project_status?.toLowerCase()"
                   data-toggle="tooltip" data-placement="top"
                   :title="dataShieldStatusArray[bridgeheadIndex]?.project_status">
              </div>
            </div>
            <div v-else></div>
          </div>

        </td>

      </tr>
      </tbody>
    </table>
    <button v-if="bridgeheads.length > numberBridgeheadShown" title="right" @click="scrollBridgehead('right')"
            class="btn btn-primary bridgehead-arrow">
      <i class="bi bi-caret-right-fill"></i>
    </button>
  </div>
</template>

<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {
  Action,
  Bridgehead,
  DataShieldProjectStatus,
  getAllProjectTypes,
  getQueryState,
  hasProjectType,
  Module,
  Project,
  ProjectBridgeheadState,
  ProjectManagerBackendService,
  ProjectManagerContext,
  ProjectType,
  UserProjectState
} from "@/services/projectManagerBackendService";
import DownloadButton from "@/components/DownloadButton.vue";
import '@/assets/styles/state-circle.css'
import {PropType, watch} from "vue";
import {BridgeheadOverviewHeader, MultiHeader} from "@/services/BridgeheadOverviewHeaders";

@Options({
  name: "BridgeheadOverview",
  methods: {fetchQueryState: getQueryState},
  computed: {
    BridgeheadOverview() {
      return BridgeheadOverview
    }
  },
  components: {DownloadButton},
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
  readonly callUpdateActiveBridgehead!: (param: Bridgehead) => void;

  Module = Module;
  Action = Action;

  DATASHIELD_STATUS_HEADER = 'DataSHIELD Status';

  Header = BridgeheadOverviewHeader;
  THeader = MultiHeader;
  fetchQueryState = getQueryState;

  headers: string[] = [];

  // noinspection SpellCheckingInspection
  existsVotums: boolean[] = [];
  dataShieldStatusArray: DataShieldProjectStatus[] = [];
  selectedBridgehead: number | null = null;
  scrollIndex = 0;
  numberBridgeheadShown = 4;

  mounted() {
    // Replace the old @Watch
    watch(() => this.projectManagerBackendService,
        () => {
          this.updateBridgeheadExtraInfo();
        },
        {immediate: true, deep: true}
    );
  }

  async created() {
    await this.updateBridgeheadExtraInfo();
    this.selectedBridgehead = 0;
  }

  buildHeaders(): void {
    this.headers = []; // reset headers
    Object.values(this.Header).forEach(header => {
      if (header === this.Header.TEILER) {
        getAllProjectTypes(this.project).forEach(pt => {
          this.headers.push(MultiHeader.build(pt, BridgeheadOverviewHeader.TEILER));
        });
      } else {
        this.headers.push(header);
      }
    });
  }

  async updateBridgeheadExtraInfo() {
    this.existsVotums = await this.fetchExistsVotums();
    this.buildHeaders();
    if (hasProjectType(this.project, ProjectType.DATASHIELD)) {
      if (!this.headers.includes(this.DATASHIELD_STATUS_HEADER)) {
        const userAccessIndex = this.headers.indexOf(this.Header.USER_ACCESS);
        if (userAccessIndex !== -1) {
          this.headers.splice(userAccessIndex, 0, this.DATASHIELD_STATUS_HEADER);
        } else {
          // If Header.USER_ACCESS is not found, append the header as a fallback
          this.headers.push(this.DATASHIELD_STATUS_HEADER);
        }
      }
      this.dataShieldStatusArray = await this.fetchDataShieldStates();
    }
  }

  fetchContext(bridgehead: Bridgehead) {
    return new ProjectManagerContext(this.context.projectCode, bridgehead);
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

  selectBridgehead(index: number) {
    this.selectedBridgehead = index;
    this.callUpdateActiveBridgehead(this.bridgeheads[index]);
  }

  scrollBridgehead(direction: string) {
    if (direction === "left") {
      if (this.scrollIndex > 0) {
        this.scrollIndex--;
      }
    }
    if (direction === "right") {
      if (this.scrollIndex < (this.bridgeheads.length - this.numberBridgeheadShown)) {
        this.scrollIndex++;
      }
    }
  }

  getVotumStatus(): number[] {
    const hasVotum = this.existsVotums.filter((votum) => votum);
    const noVotum = this.existsVotums.filter((votum) => !votum);
    if (this.existsVotumForAllBridgeheads) {
      if (hasVotum.length == 0) {
        return [1, 0];
      } else {
        return [hasVotum.length, 0];
      }
    }
    return [hasVotum.length, noVotum.length]
  }

  getBridgeheadStatus(): number[] {
    const isAccepted = this.bridgeheads.filter((bridgehead) => bridgehead.state === ProjectBridgeheadState.ACCEPTED);
    const notAccepted = this.bridgeheads.filter((bridgehead) => bridgehead.state !== ProjectBridgeheadState.ACCEPTED);
    return [isAccepted.length, notAccepted.length]
  }

  getDatashieldStatus(): number[] {
    const withData = this.dataShieldStatusArray.filter((datashield) => datashield.project_status === 'WITH_DATA');
    const withoutData = this.dataShieldStatusArray.filter((datashield) => datashield.project_status !== 'WITH_DATA');
    return [withData.length, withoutData.length]
  }

  fetchQueryStatus(projectType: ProjectType | undefined): number[] {
    if (!this.bridgeheads || projectType === undefined) return [0, 0];

    // Flatten all executions and filter by projectType
    const executions = this.bridgeheads
        .flatMap(b => b.executions ?? [])
        .filter(e => e.projectType === projectType);

    const isFinished = executions.filter(e => e.queryState === 'FINISHED');
    const notFinished = executions.filter(e => e.queryState !== 'FINISHED');

    return [isFinished.length, notFinished.length];
  }

  getCreatorStatus(): number[] {
    if (this.project?.creatorState === UserProjectState.ACCEPTED && this.project?.resultsUrl) {
      return [1, 0];
    }
    if (this.project?.creatorState === UserProjectState.REJECTED && this.project?.resultsUrl) {
      return [0, 1];
    }
    const isFinished = this.bridgeheads.filter((bridgehead) => this.isBridgeheadAcceptedByCreator(bridgehead));
    const notFinished = this.bridgeheads.filter((bridgehead) => !this.isBridgeheadAcceptedByCreator(bridgehead));
    return [isFinished.length, notFinished.length]
  }

  isBridgeheadAcceptedByCreator(bridgehead: Bridgehead): boolean {
    return bridgehead?.state === 'ACCEPTED' && bridgehead?.creatorState === 'ACCEPTED';
  }

  getCreatorStatusForBridgehead(bridgehead: Bridgehead): string | null | undefined {
    if (this.project?.creatorState === UserProjectState.ACCEPTED || this.project?.creatorState === UserProjectState.REJECTED) {
      return this.project?.creatorState;
    }
    return (bridgehead?.state === 'ACCEPTED') ? bridgehead?.creatorState : ProjectBridgeheadState.CREATED;
  }

}
</script>

<style scoped>
.table-container {
  margin-bottom: 2em;
  display: flex;
}

.bridgehead-table {
  border-collapse: collapse;
  width: 100%;
}

.header-cell {
  background-color: #f2f2f2;
  border-top: 1px solid #dddddd;
  border-left: 1px solid #dddddd;
  border-bottom: 1px solid #dddddd;
  padding: 4px; /* Reduce the padding size */
  font-size: 14px; /* Reduce the font size */
  text-align: left;
  width: min-content;
  font-weight: bold;
}

.header-summary-cell {
  background-color: #f2f2f2;
  border-bottom: 1px solid #dddddd;
  padding: 7px; /* Reduce the padding size */
  font-size: 14px; /* Reduce the font size */
  text-align: center;
  width: 12%;
}

.data-cell {
  border: 1px solid #dddddd;
  padding: 4px; /* Reduce the padding size */
  font-size: 14px; /* Reduce the font size */
  vertical-align: top;
  cursor: pointer;
  width: min-content;
}

.status-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.exist-small {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin: 0 5px;
}

.bridgehead-arrow {
  background: none;
  border: none;
  color: #007bff;
  padding: 0;
}

.bridgehead-arrow i {
  font-size: xx-large;
}

.selected {
  background-color: lightblue;
}

.states-circle-container {
  display: flex;
  justify-content: center;
}
</style>
