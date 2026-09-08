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
import UserAndEmail from "@/components/UserAndEmail.vue";
import {PropType, watch} from "vue";
import {AuthService} from "@/services/auth";

@Options({
  name: "DocumentsTable",
  components: {DownloadButton, UserAndEmail},
  props: {
    context: {type: Object as PropType<ProjectManagerContext>, required: true},
    projectManagerBackendService: {type: Object as PropType<ProjectManagerBackendService>, required: true},
    downloadAction: {type: String as PropType<Action>, required: true},
    fetchListAction: {type: String as PropType<Action>, required: false},
    iconClass: {type: String, required: false},
    text: {type: String, required: true},
    bridgeheads: {type: Array as PropType<Bridgehead[]>, required: false, default: () => []},
    documents: {type: Array as PropType<ProjectDocument[]>, required: false},
    projectManagerAdmin: {type: Boolean, default: false},
    callRefreshContext: {type: Function as unknown as () => () => void, required: false}
  }
})
export default class DocumentsTable extends Vue {

  readonly context!: ProjectManagerContext;
  readonly projectManagerBackendService!: ProjectManagerBackendService;
  readonly downloadAction!: Action;
  readonly fetchListAction?: Action;
  // Used in template:
  // noinspection JSUnusedGlobalSymbols
  readonly iconClass?: string;
  readonly text!: string;
  readonly bridgeheads!: Bridgehead[];
  readonly documents?: ProjectDocument[];
  readonly projectManagerAdmin!: boolean;
  readonly callRefreshContext?: () => void;

  canDownload = false;
  canRemove = false;
  removingDocumentIds = new Set<number>();
  Module = Module;
  projectDocuments: ProjectDocument[] = [];
  projectDocumentIds = new Set<string>();

  get usesProvidedDocuments(): boolean {
    return this.documents !== undefined;
  }

  mounted() {
    this.updateCanDownload();

    watch(
        () => this.projectManagerBackendService,
        () => {
          this.updateCanDownload();
        },
        {immediate: true, deep: true}
    );
    watch(
        () => this.documents,
        (documents) => {
          if (documents) this.projectDocuments = documents;
        },
        {deep: true}
    );
  }

  async created() {
    this.updateCanDownload()
  }

  beforeMount() {
    if (this.documents) {
      this.projectDocuments = this.documents;
    }
  }

  fetchProjectDocuments() {
    this.projectDocuments = [];
    this.projectDocumentIds = new Set<string>();
    const fetchListAction = this.fetchListAction;
    if (!fetchListAction) return;
    this.bridgeheads.forEach(bridgehead => this.projectManagerBackendService
        .fetchData(Module.PROJECT_DOCUMENTS_MODULE, fetchListAction, this.createContext(bridgehead), new Map())
        .then(results => (results as ProjectDocument[]).forEach(result => {
          let key = result.id != null ? String(result.id) : JSON.stringify(result);
          if (!this.projectDocumentIds.has(key)) {
            this.projectDocuments.push(result);
            this.projectDocumentIds.add(key);
          }
        })));
  }

  updateCanDownload() {
    this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_DOCUMENTS_MODULE, this.downloadAction).then(result => {
      this.canDownload = result;
      if (this.canDownload && !this.usesProvidedDocuments) {
        this.fetchProjectDocuments();
      }
    })
    this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_DOCUMENTS_MODULE, Action.REMOVE_DOCUMENT_ACTION)
        .then(result => this.canRemove = result);
  }

  async removeDocument(projectDocument: ProjectDocument): Promise<void> {
    const isCreator = projectDocument.creatorEmail === AuthService.getEmail();
    if (projectDocument.id == null || !this.canRemove || (!isCreator && !this.projectManagerAdmin) ||
        !window.confirm(`Remove document "${projectDocument.originalFilename || projectDocument.label || 'unnamed'}"?`)) return;
    this.removingDocumentIds.add(projectDocument.id);
    try {
      await this.projectManagerBackendService.fetchData(
          Module.PROJECT_DOCUMENTS_MODULE,
          Action.REMOVE_DOCUMENT_ACTION,
          this.context,
          new Map([["document-id", projectDocument.id]]));
      this.projectDocuments = this.projectDocuments.filter(document => document.id !== projectDocument.id);
      this.callRefreshContext?.();
    } finally {
      this.removingDocumentIds.delete(projectDocument.id);
    }
  }

  canRemoveDocument(projectDocument: ProjectDocument): boolean {
    return this.canRemove && (this.projectManagerAdmin ||
        projectDocument.creatorEmail === AuthService.getEmail());
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
        <th>Site</th>
        <th>Uploaded by</th>
        <th>Type</th>
        <th>Actions</th>
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
        <td>
          <UserAndEmail :first-name="projectDocument.creatorName" :email="projectDocument.creatorEmail"/>
        </td>
        <td>{{ projectDocument.type }}</td>
        <td>
          <div class="document-actions">
          <DownloadButton v-if="canDownload && projectDocument.originalFilename"
                          :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="downloadAction" :icon-class="iconClass"
                          :filename="projectDocument.originalFilename"/>
          <button v-if="canRemoveDocument(projectDocument) && projectDocument.id != null" type="button"
                  class="btn btn-link p-0 ms-2 document-remove-button" title="Remove document"
                  :disabled="removingDocumentIds.has(projectDocument.id)"
                  @click="removeDocument(projectDocument)">
            <i class="bi bi-trash"></i>
          </button>
          </div>
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
  max-width: 100%;
  min-width: 0;
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
  white-space: nowrap;
}

.document-actions {
  display: flex;
  align-items: center;
}

.document-remove-button:hover:not(:disabled) {
  color: #b45353;
}

th {
  background-color: #f2f2f2;
}

</style>
