<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {Prop, Watch} from "vue-property-decorator";
import {
  Action,
  Module,
  ProjectDocument,
  ProjectManagerContext,
  ProjetManagerBackendService
} from "@/services/projetManagerBackendService";
import DownloadButton from "@/components/DownloadButton.vue";

@Options({
  name: "DocumentsTable",
  components: {DownloadButton}
})
export default class DocumentsTable extends Vue {
  @Prop() readonly context!: ProjectManagerContext;
  @Prop() readonly projectManagerBackendService!: ProjetManagerBackendService;
  @Prop() readonly module!: Module;
  @Prop() readonly action!: Action;
  @Prop() readonly projectDocuments!: ProjectDocument[];
  @Prop() readonly iconClass: string | undefined = undefined;
  @Prop() readonly text!: string;
  canDownload = false;

  @Watch('projectManagerBackendService', {immediate: true, deep: true})
  onContextChange(newValue: ProjetManagerBackendService, oldValue: ProjetManagerBackendService) {
    this.updateCanDownload()
  }

  async created() {
    this.updateCanDownload()
  }

  updateCanDownload() {
    this.projectManagerBackendService.isModuleActionActive(this.module, this.action).then(result => this.canDownload = result)
  }

}
</script>

<template>
  <div v-if="projectDocuments && projectDocuments.length > 0" class="project-document-table">
    <span v-if="text">{{text}}</span>
    <br/>
    <table>
      <thead>
      <tr>
        <th>Original Filename</th>
        <th>URL</th>
        <th>Created At</th>
        <th>Bridgehead</th>
        <th>Creator Email</th>
        <th>Label</th>
        <th>Type</th>
        <th>Download</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(projectDocument, index) in projectDocuments" :key="index">
        <td>{{ projectDocument.originalFilename }}</td>
        <td>{{ projectDocument.url }}</td>
        <td>{{ projectDocument.createdAt }}</td>
        <td v-if="projectDocument.bridgehead != 'NONE'">{{ projectDocument.bridgehead }}</td>
        <td v-if="projectDocument.bridgehead === 'NONE'"></td>
        <td>{{ projectDocument.creatorEmail }}</td>
        <td>{{ projectDocument.label }}</td>
        <td>{{ projectDocument.type }}</td>
        <td v-if="canDownload">
          <DownloadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="module" :action="action" :icon-class="iconClass" :filename="projectDocument.originalFilename"/>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.project-document-table {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}

</style>
