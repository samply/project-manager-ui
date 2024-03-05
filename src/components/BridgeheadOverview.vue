<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {Prop, Watch} from "vue-property-decorator";
import {
  Action,
  Bridgehead,
  Module,
  ProjectManagerContext,
  ProjetManagerBackendService
} from "@/services/projetManagerBackendService";
import DownloadButton from "@/components/DownloadButton.vue";

@Options({
  name: "BridgeheadOverview",
  components: {DownloadButton}
})
export default class BridgeheadOverview extends Vue {
  @Prop() readonly context!: ProjectManagerContext;
  @Prop() readonly projectManagerBackendService!: ProjetManagerBackendService;
  @Prop() readonly bridgeheads!: Bridgehead[];

  // Accessing enums directly
  Module = Module;
  Action = Action;

  headers = ['Bridgeheads', 'Votum', 'State'];
  existsVotums: boolean[] = [];

  @Watch('projectManagerBackendService', {immediate: true, deep: true})
  onContextChange(newValue: ProjetManagerBackendService, oldValue: ProjetManagerBackendService) {
    this.updateExistVotums();
  }

  async created() {
    this.updateExistVotums();
  }

  async updateExistVotums() {
    this.existsVotums = await this.fetchExistsVotums();
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


}
</script>

<template>
  <div>
    <table class="bridgehead-table">
      <tbody>
      <tr v-for="(header, index) in headers" :key="index">
        <!-- Header in the first column -->
        <td class="header-cell">{{ header }}</td>
        <!-- Data for each bridgehead in subsequent columns -->
        <td v-for="(bridgehead, bridgeheadIndex) in bridgeheads" :key="bridgeheadIndex" class="data-cell">
          <!-- First row: bridgehead.bridgehead -->
          <div v-if="index === 0">{{ bridgehead.bridgehead }}</div>
          <!-- Second row: existVotum -->
          <div v-else-if="index === 1">
            <div v-if="existsVotums.length > 0 && existsVotums[bridgeheadIndex]" class="exist-votum green">
              <DownloadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                              icon-class="bi bi-download"
                              :module="Module.PROJECT_DOCUMENTS_MODULE"
                              :action="Action.DOWNLOAD_VOTUM_ACTION"/>
            </div>
            <div v-else class="exist-votum red"></div>
          </div>
          <!-- Third row: bridgehead.state -->
          <div v-else :class="{ 'accepted-state': bridgehead.state === 'ACCEPTED' }">{{ bridgehead.state }}</div>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>

.bridgehead-table {
  border-collapse: collapse;
  width: 100%;
}

.header-cell {
  background-color: #f2f2f2;
  border: 1px solid #dddddd;
  padding: 8px;
  text-align: left;
}

.data-cell {
  border: 1px solid #dddddd;
  padding: 8px;
  vertical-align: top;
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
</style>
