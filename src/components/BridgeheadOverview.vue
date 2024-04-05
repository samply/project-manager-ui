<template>
  <div>
    <table class="bridgehead-table">
      <tbody>
      <tr v-for="(header, index) in headers" :key="index">
        <!-- Header in the first column -->
        <td class="header-cell">{{ header }}</td>
        <!-- Data for each bridgehead in subsequent columns -->
        <td
            v-for="(bridgehead, bridgeheadIndex) in bridgeheads"
            :key="bridgeheadIndex"
            class="data-cell"
            :class="{ 'selected': selectedBridgehead === bridgeheadIndex }"
        >
          <!-- First row: bridgehead.bridgehead -->
          <div v-if="index === 0"
               @click="selectBridgehead(bridgeheadIndex)"
          >{{ bridgehead.bridgehead }}</div>
          <!-- Second row: existVotum -->
          <div v-else-if="index === 1">
            <div v-if="existsVotums.length > 0 && existsVotums[bridgeheadIndex]" class="exist-votum green">
              <DownloadButton
                  :context="fetchContext(bridgehead)"
                  :project-manager-backend-service="projectManagerBackendService"
                  icon-class="bi bi-download"
                  :module="Module.PROJECT_DOCUMENTS_MODULE"
                  :action="Action.DOWNLOAD_VOTUM_ACTION"
              />
            </div>
            <div v-else class="exist-votum red"></div>
          </div>
          <!-- Third row: bridgehead.state -->
          <div v-else-if="index === 2" :class="{ 'accepted-state': bridgehead.state === 'ACCEPTED' }">
            {{ bridgehead.state }}
          </div>
          <div v-else> <!-- We assume that the DataSHIELD Status is the last header -->
            <div v-if="dataShieldStatusArray[bridgeheadIndex]">
              {{ dataShieldStatusArray[bridgeheadIndex].project_status }}
            </div>
            <div v-else></div>
          </div>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import {
  Action,
  Bridgehead,
  DataShieldProjectStatus,
  Module, Project,
  ProjectManagerContext,
  ProjetManagerBackendService
} from "@/services/projetManagerBackendService";
import DownloadButton from "@/components/DownloadButton.vue";

@Options({
  name: "BridgeheadOverview",
  components: { DownloadButton },
  props: {
    activeBridgehead: {
      type: Object,
      required: true
    }
  }
})
export default class BridgeheadOverview extends Vue {
  @Prop() readonly context!: ProjectManagerContext;
  @Prop() readonly projectManagerBackendService!: ProjetManagerBackendService;
  @Prop() readonly bridgeheads!: Bridgehead[];
  @Prop() readonly project!: Project;
  @Prop({ type: Function, required: true }) readonly callUpdateActiveBridgehead!: (param: Bridgehead) => void;



  Module = Module;
  Action = Action;

  DATASHIELD_STATUS_HEADER = 'DataSHIELD Status';
  headers = ['Bridgeheads', 'Votum', 'Project State'];
  existsVotums: boolean[] = [];
  dataShieldStatusArray: DataShieldProjectStatus[] = [];
  selectedBridgehead: number | null = null;

  @Watch('projectManagerBackendService', { immediate: true, deep: true })
  onContextChange(newValue: ProjetManagerBackendService, oldValue: ProjetManagerBackendService) {
    this.updateBridgeheadExtraInfo();
  }

  async created() {
    this.updateBridgeheadExtraInfo();
    this.selectedBridgehead = 0;
  }

  async updateBridgeheadExtraInfo() {
    this.existsVotums = await this.fetchExistsVotums();
    if (this.project && this.project.type === 'DATASHIELD'){
      if (!this.headers.includes(this.DATASHIELD_STATUS_HEADER)){
        this.headers.push(this.DATASHIELD_STATUS_HEADER); // We assume that the DataSHIELD Status is the last header
      }
      this.dataShieldStatusArray = await this.fetchDataShieldStates();
    }
  }

  fetchContext(bridgehead: Bridgehead) {
    return new ProjectManagerContext(this.context.projectCode, bridgehead.bridgehead);
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
          project_status: 'NOT AVAILABLE'
        });
  }

  selectBridgehead(index: number) {
    this.selectedBridgehead = index;
    this.callUpdateActiveBridgehead(this.bridgeheads[index]);
  }
}
</script>

<style scoped>
.bridgehead-table {
  border-collapse: collapse;
  width: 100%;
}

.header-cell {
  background-color: #f2f2f2;
  border: 1px solid #dddddd;
  padding: 4px; /* Verringere die Padding-Größe */
  font-size: 14px; /* Reduziere die Schriftgröße */
  text-align: left;
}

.data-cell {
  border: 1px solid #dddddd;
  padding: 4px; /* Verringere die Padding-Größe */
  font-size: 14px; /* Reduziere die Schriftgröße */

  vertical-align: top;
  cursor: pointer;
}

.exist-votum {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.green {
  background-color: green;
}

.red {
  background-color: red;
}

.accepted-state {
  background-color: green;
}

.selected {
  background-color: lightblue;
}
</style>
