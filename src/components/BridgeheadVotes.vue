<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {PropType} from "vue";
import {
  Action,
  Bridgehead,
  Module,
  ProjectDocument,
  ProjectManagerBackendService,
  ProjectManagerContext
} from "@/services/projectManagerBackendService";
import {BatchEntry} from "@/services/actionsBatch";
import DownloadButton from "@/components/DownloadButton.vue";
import UploadButton from "@/components/UploadButton.vue";

// The ethics vote of each bridgehead, one row per bridgehead, each with its own bridgehead (docs/bridgehead-context.md).
// A bridgehead without its own vote uses the ethics vote for all bridgeheads, as in the bridgehead overview and the
// single-bridgehead status.
interface BridgeheadVote {
  bridgehead: Bridgehead;
  exists: boolean;
  document?: ProjectDocument;
}

@Options({
  name: "BridgeheadVotes",
  components: {DownloadButton, UploadButton},
  props: {
    context: {type: Object as PropType<ProjectManagerContext>, required: true},
    projectManagerBackendService: {type: Object as PropType<ProjectManagerBackendService>, required: true},
    bridgeheads: {type: Array as PropType<Bridgehead[]>, required: true},
    editable: {type: Boolean, default: false},
    mandatory: {type: Boolean, default: false},
    projectManagerAdmin: {type: Boolean, default: false},
    callRefreshContext: {type: Function as unknown as () => () => void, required: true}
  },
  watch: {
    bridgeheads: 'loadVotes',
    projectManagerBackendService: 'loadVotes'
  }
})
export default class BridgeheadVotes extends Vue {

  readonly context!: ProjectManagerContext;
  readonly projectManagerBackendService!: ProjectManagerBackendService;
  readonly bridgeheads!: Bridgehead[];
  readonly editable!: boolean;
  readonly mandatory!: boolean;
  readonly projectManagerAdmin!: boolean;
  readonly callRefreshContext!: () => void;

  readonly Action = Action;
  readonly Module = Module;

  votes: BridgeheadVote[] = [];
  existsVoteForAllBridgeheads = false;

  created() {
    void this.loadVotes();
  }

  createContext(bridgehead: Bridgehead): ProjectManagerContext {
    return new ProjectManagerContext(this.context.projectCode, bridgehead);
  }

  bridgeheadName(bridgehead: Bridgehead): string {
    return bridgehead.humanReadable ?? bridgehead.bridgehead;
  }

  // Whether each bridgehead has its own vote, its description, and whether there is a vote for all bridgeheads: one
  // request.
  async loadVotes(): Promise<void> {
    const bridgeheads = this.bridgeheads;
    const entries: BatchEntry<Module, Action, ProjectManagerContext>[] = [
      {
        id: 'all', module: Module.PROJECT_DOCUMENTS_MODULE, action: Action.EXISTS_VOTUM_FOR_ALL_BRIDGEHEADS_ACTION,
        params: new Map<string, unknown>()
      },
      ...bridgeheads.flatMap((bridgehead, index) => [
        {
          id: `exists-${index}`, module: Module.PROJECT_DOCUMENTS_MODULE, action: Action.EXISTS_VOTUM_ACTION,
          params: new Map<string, unknown>(), context: this.createContext(bridgehead)
        },
        {
          id: `description-${index}`, module: Module.PROJECT_DOCUMENTS_MODULE, action: Action.FETCH_VOTUM_DESCRIPTION_ACTION,
          params: new Map<string, unknown>(), context: this.createContext(bridgehead)
        }
      ])
    ];
    try {
      const results = await this.projectManagerBackendService.fetchBatch(entries, this.context);
      if (bridgeheads !== this.bridgeheads) return; // the bridgeheads changed meanwhile: their own load applies
      this.existsVoteForAllBridgeheads = results.get('all')?.response === true;
      this.votes = bridgeheads.map((bridgehead, index) => {
        const exists = results.get(`exists-${index}`)?.response === true;
        return {
          bridgehead,
          exists,
          document: exists ? results.get(`description-${index}`)?.response as ProjectDocument | undefined : undefined
        };
      });
    } catch (error) {
      console.error('Error loading the ethics votes of the bridgeheads:', error);
    }
  }

  // After an upload or a removal: this table and the rest of the page (the bridgehead overview shows the votes too).
  refreshAfterChange(): void {
    void this.loadVotes();
    this.callRefreshContext();
  }

  missingText(): string {
    if (this.existsVoteForAllBridgeheads) return 'The ethics vote for all sites applies';
    return this.mandatory ? 'Missing — required' : 'No ethics vote';
  }
}
</script>

<template>
  <div v-if="votes.length > 0" class="table-scroll bridgehead-votes">
    <table class="pm-table">
      <thead>
      <tr>
        <th>Site</th>
        <th>Ethics vote</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="vote in votes" :key="vote.bridgehead.bridgehead">
        <td class="bridgehead-cell">{{ bridgeheadName(vote.bridgehead) }}</td>
        <td>
          <UploadButton v-if="editable"
                        :context="createContext(vote.bridgehead)"
                        :project-manager-backend-service="projectManagerBackendService"
                        :module="Module.PROJECT_DOCUMENTS_MODULE" :upload-action="Action.UPLOAD_VOTUM_ACTION"
                        :download-action="Action.DOWNLOAD_VOTUM_ACTION"
                        text="" :call-refresh-context="refreshAfterChange"
                        :project-manager-admin="projectManagerAdmin"
                        :is-file="true" :toggle-input="true"
                        :file-name="vote.document?.originalFilename" :exists-file="vote.exists"
                        :project-document="vote.document"/>
          <div v-if="!vote.exists" class="vote-missing"
               :class="{ 'summary-missing': mandatory && !existsVoteForAllBridgeheads }">
            {{ missingText() }}
          </div>
          <div v-else-if="!editable" class="vote-file">
            <span>{{ vote.document?.label || vote.document?.originalFilename }}</span>
            <DownloadButton :context="createContext(vote.bridgehead)" :project-manager-backend-service="projectManagerBackendService"
                            :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.DOWNLOAD_VOTUM_ACTION"
                            icon-class="bi bi-download" :filename="vote.document?.originalFilename"/>
          </div>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.bridgehead-votes {
  width: 100%;
}

.bridgehead-cell {
  white-space: nowrap;
  vertical-align: top;
}

.vote-file {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.vote-missing {
  color: #5f6368;
  font-style: italic;
  font-size: 0.875rem;
}

.summary-missing {
  color: #b42318;
  font-weight: 600;
}
</style>
