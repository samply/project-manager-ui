<script lang="ts">
import {Options, Vue} from "vue-class-component";
import '@/assets/styles/table.css'
import {
  Action,
  Bridgehead,
  Module,
  ProjectDocument,
  ProjectManagerBackendService,
  ProjectManagerContext
} from "@/services/projectManagerBackendService";
import {PmRequestParameter} from "@/services/projectManagerBackendService";
import DownloadButton from "@/components/DownloadButton.vue";
import UserAndEmail from "@/components/UserAndEmail.vue";
import {PropType, watch} from "vue";
import {AuthService} from "@/services/auth";
import {DisplayFormatKey, formatDisplayDate, resolveDisplayFormatKey} from "@/services/displayFormatService";
import {getConfig} from "@/services/configLoader";

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
    // The bridgeheads to list the documents for, each with its own bridgehead; null: without a bridgehead, which lists
    // the documents of the whole project and of every bridgehead (for the creator and the project manager admin,
    // docs/bridgehead-context.md)
    listBridgeheads: {type: Array as PropType<(Bridgehead | null)[]>, required: false, default: () => []},
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
  readonly listBridgeheads!: (Bridgehead | null)[];
  readonly documents?: ProjectDocument[];
  readonly projectManagerAdmin!: boolean;
  readonly callRefreshContext?: () => void;

  canDownload = false;
  canRemove = false;
  removingDocumentIds = new Set<number>();
  Module = Module;
  projectDocuments: ProjectDocument[] = [];
  projectDocumentIds = new Set<string>();
  // The context each listed document was found with: downloading and removing it use the same one
  documentContexts = new Map<string, ProjectManagerContext>();
  createdAtDisplayFormat: DisplayFormatKey = DisplayFormatKey.DATE_TIME_FORMAT;

  get usesProvidedDocuments(): boolean {
    return this.documents !== undefined;
  }

  async fetchCreatedAtDisplayFormat() {
    const config = await getConfig();
    this.createdAtDisplayFormat = resolveDisplayFormatKey(
        config.DOCUMENT_CREATED_AT_DISPLAY_FORMAT, DisplayFormatKey.DATE_TIME_FORMAT);
  }

  mounted() {
    this.updateCanDownload();
    this.fetchCreatedAtDisplayFormat();

    watch(
        () => this.projectManagerBackendService,
        () => {
          this.updateCanDownload();
        },
        {immediate: true, deep: true}
    );
    watch(
        () => this.listBridgeheads.map(bridgehead => bridgehead?.bridgehead ?? '').join(','),
        () => {
          if (this.canDownload && !this.usesProvidedDocuments) this.fetchProjectDocuments();
        }
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
    this.documentContexts = new Map<string, ProjectManagerContext>();
    const fetchListAction = this.fetchListAction;
    if (!fetchListAction) return;
    this.listBridgeheads.forEach(bridgehead => {
      const context = this.createContext(bridgehead);
      this.projectManagerBackendService
          .fetchData(Module.PROJECT_DOCUMENTS_MODULE, fetchListAction, context, new Map())
          .then(results => (results as ProjectDocument[]).forEach(result => {
            const key = this.documentKey(result);
            if (!this.projectDocumentIds.has(key)) {
              this.projectDocuments.push(result);
              this.projectDocumentIds.add(key);
              this.documentContexts.set(key, context);
            }
          }));
    });
  }

  documentKey(projectDocument: ProjectDocument): string {
    return projectDocument.id != null ? String(projectDocument.id) : JSON.stringify(projectDocument);
  }

  // Provided documents come with the context of whoever shows them.
  documentContext(projectDocument: ProjectDocument): ProjectManagerContext {
    return this.documentContexts.get(this.documentKey(projectDocument)) ?? this.context;
  }

  updateCanDownload() {
    this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_DOCUMENTS_MODULE, this.downloadAction, this.context).then(result => {
      this.canDownload = result;
      if (this.canDownload && !this.usesProvidedDocuments) {
        this.fetchProjectDocuments();
      }
    })
    this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_DOCUMENTS_MODULE, Action.REMOVE_DOCUMENT_ACTION, this.context)
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
          this.documentContext(projectDocument),
          new Map([[PmRequestParameter.DOCUMENT_ID, projectDocument.id]]));
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

  createContext(bridgehead: Bridgehead | null) {
    return new ProjectManagerContext(this.context.projectCode, bridgehead ?? undefined);
  }

  formatCreatedAt(createdAt: string): string {
    return formatDisplayDate(createdAt, this.createdAtDisplayFormat);
  }


}
</script>

<template>
  <div v-if="projectDocuments && projectDocuments.length > 0" class="project-document-table">
    <div v-if="text" class="documents-table-label"><strong>{{ text }}</strong></div>
    <div class="table-scroll">
      <table class="pm-table documents-table">
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
          <td class="created-cell">{{ formatCreatedAt(projectDocument.createdAt) }}</td>
          <td v-if="projectDocument.bridgehead != 'NONE'">{{ projectDocument.humanReadableBridgehead }}</td>
          <td v-if="projectDocument.bridgehead === 'NONE'"></td>
          <td>
            <UserAndEmail :first-name="projectDocument.creatorName" :email="projectDocument.creatorEmail"/>
          </td>
          <td>{{ projectDocument.type }}</td>
          <td>
            <div class="document-actions">
            <DownloadButton v-if="canDownload && projectDocument.originalFilename"
                            :context="documentContext(projectDocument)" :project-manager-backend-service="projectManagerBackendService"
                            :module="Module.PROJECT_DOCUMENTS_MODULE" :action="downloadAction" :icon-class="iconClass"
                            :filename="projectDocument.originalFilename"/>
            <button v-if="canRemoveDocument(projectDocument) && projectDocument.id != null" type="button"
                    class="btn btn-link p-0 ms-2 document-remove-button" title="Remove document"
                    :disabled="removingDocumentIds.has(projectDocument.id)"
                    @click="removeDocument(projectDocument)">
              <i class="bi bi-x-lg"></i>
            </button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.project-document-table {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.documents-table-label {
  margin-bottom: var(--space-2);
}

.table-scroll {
  overflow-x: auto;
}

.documents-table tbody td {
  white-space: nowrap;
}

.created-cell {
  font-variant-numeric: tabular-nums;
}

.document-actions {
  display: flex;
  align-items: center;
}

.document-remove-button:hover:not(:disabled) {
  color: var(--status-danger-color);
}

</style>
