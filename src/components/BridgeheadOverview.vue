<template>
  <div class="table-container">
    <button v-if="bridgeheads.length > numberBridgeheadShown" title="left" @click="scrollBridgehead('left')" class="btn btn-primary bridgehead-arrow">
      <i class="bi bi-caret-left-fill"></i>
    </button>
    <table class="bridgehead-table">
      <tbody>
      <tr v-for="(header, index) in headers" :key="index">
        <!-- Header in the first column -->
        <td class="header-cell">{{ header }}</td>
        <td v-if="header === 'Bridgeheads'" class="header-summary-cell" style="border-top: 1px solid #dddddd">{{ bridgeheads.length }}</td>
        <td v-if="header === 'Votum'" class="header-summary-cell status-cell">{{ getVotumStatus()[0] }} <div class="exist-votum-small green"></div> / {{ getVotumStatus()[1]}}<div class="exist-votum-small red"></div></td>
        <td v-if="header === 'User Access Control'" class="header-summary-cell status-cell">{{ getBridgeheadStatus()[0] }} <div class="exist-votum-small green"></div> / {{ getBridgeheadStatus()[1]}}<div class="exist-votum-small red"></div></td>
        <td v-if="header === 'DataSHIELD Status'" class="header-summary-cell status-cell">{{ getDatashieldStatus()[0] }} <div class="exist-votum-small green"></div> / {{ getDatashieldStatus()[1]}}<div class="exist-votum-small red"></div></td>
        <td v-if="header === 'Query Status'" class="header-summary-cell status-cell">{{ getQueryStatus()[0] }} <div class="exist-votum-small green"></div> / {{ getQueryStatus()[1]}}<div class="exist-votum-small red"></div></td>
        <!-- Data for each bridgehead in subsequent columns -->
        <td
            v-for="(bridgehead, bridgeheadIndex) in bridgeheads.slice(scrollIndex,(scrollIndex + numberBridgeheadShown))"
            :key="bridgeheadIndex"
            class="data-cell"
            :class="{ 'selected': selectedBridgehead === bridgeheadIndex }"
        >
          <!-- First row: bridgehead.bridgehead -->
          <div v-if="index === 0"
               @click="selectBridgehead(bridgeheadIndex)"
          >{{ bridgehead.humanReadable }}</div>
          <!-- Second row: existVotum -->
          <div v-else-if="index === 1">
            <div v-if="existsVotums.length > 0 && existsVotums[bridgeheadIndex]" class="state_circle green">
              <DownloadButton
                  :context="fetchContext(bridgehead)"
                  :project-manager-backend-service="projectManagerBackendService"
                  icon-class="bi bi-download"
                  :module="Module.PROJECT_DOCUMENTS_MODULE"
                  :action="Action.DOWNLOAD_VOTUM_ACTION"
              />
            </div>
            <div v-else class="state_circle red"></div>
          </div>
          <!-- Third row: bridgehead.state -->
          <div v-else-if="index === 2" class="state_circle" :class="bridgehead?.state.toLowerCase()" v-b-tooltip.hover :title="bridgehead?.state"></div>
          <div v-else-if="index === 3" class="state_circle" :class="bridgehead?.queryState.toLowerCase()" v-b-tooltip.hover :title="bridgehead?.queryState"></div>
          <div v-else> <!-- We assume that the DataSHIELD Status is the last header -->
            <div v-if="dataShieldStatusArray[bridgeheadIndex]" class="state_circle" :class="dataShieldStatusArray[bridgeheadIndex]?.project_status?.toLowerCase()" v-b-tooltip.hover :title="dataShieldStatusArray[bridgeheadIndex]?.project_status"></div>
            <div v-else></div>
          </div>
        </td>
      </tr>
      </tbody>
    </table>
    <button v-if="bridgeheads.length > numberBridgeheadShown" title="right" @click="scrollBridgehead('right')" class="btn btn-primary bridgehead-arrow">
      <i class="bi bi-caret-right-fill"></i>
    </button>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import {
  Action,
  Bridgehead,
  DataShieldProjectStatus,
  Module,
  Project,
  ProjectManagerContext,
  ProjectManagerBackendService
} from "@/services/projectManagerBackendService";
import DownloadButton from "@/components/DownloadButton.vue";

@Options({
  name: "BridgeheadOverview",
  components: {DownloadButton},
  props: {
    activeBridgehead: {
      type: Object,
      required: true
    }
  }
})
export default class BridgeheadOverview extends Vue {
  @Prop() readonly context!: ProjectManagerContext;
  @Prop() readonly projectManagerBackendService!: ProjectManagerBackendService;
  @Prop() readonly bridgeheads!: Bridgehead[];
  @Prop() readonly project!: Project;
  @Prop({type: Function, required: true}) readonly callUpdateActiveBridgehead!: (param: Bridgehead) => void;


  Module = Module;
  Action = Action;

  DATASHIELD_STATUS_HEADER = 'DataSHIELD Status';
  headers = ['Bridgeheads', 'Votum', 'User Access Control', 'Query Status'];
  existsVotums: boolean[] = [];
  dataShieldStatusArray: DataShieldProjectStatus[] = [];
  selectedBridgehead: number | null = null;
  scrollIndex = 0;
  numberBridgeheadShown = 4;


  @Watch('projectManagerBackendService', {immediate: true, deep: true})
  onContextChange(newValue: ProjectManagerBackendService, oldValue: ProjectManagerBackendService) {
    this.updateBridgeheadExtraInfo();
  }

  async created() {
    this.updateBridgeheadExtraInfo();
    this.selectedBridgehead = 0;
  }

  async updateBridgeheadExtraInfo() {
    this.existsVotums = await this.fetchExistsVotums();
    if (this.project && this.project.type === 'DATASHIELD') {
      if (!this.headers.includes(this.DATASHIELD_STATUS_HEADER)) {
        this.headers.push(this.DATASHIELD_STATUS_HEADER); // We assume that the DataSHIELD Status is the last header
      }
      this.dataShieldStatusArray = await this.fetchDataShieldStates();
    }
  }

  fetchContext(bridgehead: Bridgehead) {
    return new ProjectManagerContext(this.context.projectCode, bridgehead);
  }

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
    return [hasVotum.length, noVotum.length]
  }
  getBridgeheadStatus(): number[] {
    const isAccepted = this.bridgeheads.filter((bridgehead) => bridgehead.state === 'ACCEPTED');
    const notAccepted = this.bridgeheads.filter((bridgehead) => bridgehead.state !== 'ACCEPTED');
    return [isAccepted.length, notAccepted.length]
  }
  getDatashieldStatus(): number[] {
    const withData = this.dataShieldStatusArray.filter((datashield) => datashield.project_status === 'WITH_DATA');
    const withoutData = this.dataShieldStatusArray.filter((datashield) => datashield.project_status !== 'WITH_DATA');
    return [withData.length, withoutData.length]
  }
  getQueryStatus(): number[] {
    const isFinished = this.bridgeheads.filter((bridgehead) => bridgehead.queryState === 'FINISHED');
    const notFinished = this.bridgeheads.filter((bridgehead) => bridgehead.queryState !== 'FINISHED');
    return [isFinished.length, notFinished.length]
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
  padding: 4px; /* Verringere die Padding-Größe */
  font-size: 14px; /* Reduziere die Schriftgröße */
  text-align: left;
  width: min-content;
  font-weight: bold;
}
.header-summary-cell {
  background-color: #f2f2f2;
  border-bottom: 1px solid #dddddd;
  padding: 5px; /* Verringere die Padding-Größe */
  font-size: 14px; /* Reduziere die Schriftgröße */
  text-align: center;
  width: 12%;
}
.data-cell {
  border: 1px solid #dddddd;
  padding: 4px; /* Verringere die Padding-Größe */
  font-size: 14px; /* Reduziere die Schriftgröße */
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
.exist-votum {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}
.exist-votum-small {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin: 0 5px;
}
.bridgehead-arrow {
  background: none;
  border:none;
  color:#007bff;
  padding: 0;
}
.bridgehead-arrow i {
  font-size: xx-large;
}
.green {
  background-color: #009a00;
}

.red {
  background-color: red;
}

.accepted-state {
  background-color: #009a00;
}

.selected {
  background-color: lightblue;
}
.state_circle {
  border-radius: 50%;
  width: 20px;
  height: 20px;
  margin: auto;
}
.state_circle.created {
  border: 1px solid #cccccc;
  background-color: #f2f2f2;
}
.state_circle.request_changes, .state_circle.not_found, .state_circle.inactive {
  border: 1px solid #cccccc;
  background-color: #fff200;
}
.state_circle.accepted, .state_circle.with_data, .state_circle.finished {
  border: 1px solid #cccccc;
  background-color: #009a00;
}
.state_circle.rejected, .state_circle.error {
  border: 1px solid #cccccc;
  background-color: red;
}
.state_circle.not_available {
  border: 1px solid #cccccc;
  background-color: #bbbbbb;
}
</style>
