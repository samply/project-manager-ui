<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {
  Action,
  Bridgehead,
  Module,
  ProjectDocument,
  ProjectManagerBackendService,
  ProjectManagerContext
} from "@/services/projectManagerBackendService";
import DownloadButton from "@/components/DownloadButton.vue";
import {PropType, watch} from "vue";

@Options({
  name: "DocumentsTable",
  components: {DownloadButton},
  props: {
    context: {type: Object as PropType<ProjectManagerContext>, required: true},
    projectManagerBackendService: {type: Object as PropType<ProjectManagerBackendService>, required: true},
    downloadAction: {type: String as PropType<Action>, required: true},
    fetchListAction: {type: String as PropType<Action>, required: true},
    iconClass: {type: String, required: false},
    text: {type: String, required: true},
    bridgeheads: {type: Array as PropType<Bridgehead[]>, required: true}
  }
})
export default class DocumentsTable extends Vue {

  readonly context!: ProjectManagerContext;
  readonly projectManagerBackendService!: ProjectManagerBackendService;
  readonly downloadAction!: Action;
  readonly fetchListAction!: Action;
  // Used in template:
  // noinspection JSUnusedGlobalSymbols
  readonly iconClass?: string;
  readonly text!: string;
  readonly bridgeheads!: Bridgehead[];

  canDownload = false;
  Module = Module;
  projectDocuments: ProjectDocument[] = [];
  projectDocumentIds = new Set<string>();

  mounted() {
    this.updateCanDownload();

    watch(
        () => this.projectManagerBackendService,
        () => {
          this.updateCanDownload();
        },
        {immediate: true, deep: true}
    );
  }

  async created() {
    this.updateCanDownload()
  }

  fetchProjectDocuments() {
    this.projectDocuments = [];
    this.projectDocumentIds = new Set<string>();
    this.bridgeheads.forEach(bridgehead => this.projectManagerBackendService
        .fetchData(Module.PROJECT_DOCUMENTS_MODULE, this.fetchListAction, this.createContext(bridgehead), new Map())
        .then(results => (results as ProjectDocument[]).forEach(result => {
          let key = JSON.stringify(result);
          if (!this.projectDocumentIds.has(key)) {
            this.projectDocuments.push(result);
            this.projectDocumentIds.add(key);
          }
        })));
  }

  updateCanDownload() {
    this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_DOCUMENTS_MODULE, this.downloadAction).then(result => {
      this.canDownload = result;
      if (this.canDownload) {
        this.fetchProjectDocuments();
      }
    })
  }

  createContext(bridgehead: Bridgehead) {
    return new ProjectManagerContext(this.context.projectCode, bridgehead);
  }


}
</script>

<template>
  <div v-if="projectDocuments && projectDocuments.length > 0" class="project-document-table">
    <span v-if="text"><strong>{{ text }}</strong></span>
    <br/>
    <table>
      <thead>
      <tr>
        <th>Label</th>
        <th>Original Filename</th>
        <th>URL</th>
        <th>Created At</th>
        <th>Bridgehead</th>
        <th>Applicant Email</th>
        <th>Type</th>
        <th>Download</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(projectDocument, index) in projectDocuments" :key="index">
        <td>{{ projectDocument.label }}</td>
        <td>{{ projectDocument.originalFilename }}</td>
        <td><a :href="projectDocument.url">{{ projectDocument.url }}</a></td>
        <td>{{ projectDocument.createdAt }}</td>
        <td v-if="projectDocument.bridgehead != 'NONE'">{{ projectDocument.humanReadableBridgehead }}</td>
        <td v-if="projectDocument.bridgehead === 'NONE'"></td>
        <td>{{ projectDocument.creatorEmail }}</td>
        <td>{{ projectDocument.type }}</td>
        <td>
          <DownloadButton v-if="canDownload && projectDocument.originalFilename"
                          :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="downloadAction" :icon-class="iconClass"
                          :filename="projectDocument.originalFilename"/>
        </td>
      </tr>
      </tbody>
    </table>
    <br>
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
