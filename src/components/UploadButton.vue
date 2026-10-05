<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {
  Action,
  Bridgehead,
  Module,
  ProjectManagerBackendService,
  ProjectManagerContext,
  ProjectDocument,
  PmRequestParameter
} from "@/services/projectManagerBackendService";
import {PropType, watch} from "vue";
import DownloadButton from "@/components/DownloadButton.vue";
import DocumentsTable from "@/components/DocumentsTable.vue";

@Options({
  name: "UploadButton",
  components: {DownloadButton, DocumentsTable},
  props: {
    callRefreshContext: {type: Function as unknown as () => () => void, required: true},
    context: {type: Object as PropType<ProjectManagerContext>, required: true},
    projectManagerBackendService: {type: Object as PropType<ProjectManagerBackendService>, required: true},
    module: {type: String as PropType<Module>, required: true},
    uploadAction: {type: String as PropType<Action>, required: true},
    downloadAction: {type: String as PropType<Action>, required: false},
    text: {type: String, required: true},
    isFile: {type: Boolean, required: true},
    toggleInput: {type: Boolean, required: false},

    existsFile: {type: Boolean, required: false},
    fileName: {type: String, required: false},
    projectDocument: {type: Object as PropType<ProjectDocument>, required: false},
    projectManagerAdmin: {type: Boolean, default: false},
    // For whom the file is uploaded: null for the whole project, or a bridgehead (docs/bridgehead-context.md). Without it, the
    // upload uses the context as it is; with no choice at all, it is not offered.
    bridgeheadChoices: {type: Array as PropType<(Bridgehead | null)[]>, required: false},

  }
})
export default class UploadButton extends Vue {

  readonly callRefreshContext!: () => void;
  readonly context!: ProjectManagerContext;
  readonly projectManagerBackendService!: ProjectManagerBackendService;
  readonly module!: Module;
  readonly uploadAction!: Action;
  readonly downloadAction?: Action;
  readonly text!: string;
  readonly isFile!: boolean;
  readonly toggleInput?: boolean;
  readonly existsFile?: boolean;
  readonly fileName?: string;
  readonly projectDocument?: ProjectDocument;
  readonly projectManagerAdmin!: boolean;
  readonly bridgeheadChoices?: (Bridgehead | null)[];

  file: File | undefined = undefined;
  label = '';
  url = '';
  isActive = false;
  fileSelected = false;
  visible: boolean = true
  uniqueId = Math.random().toString(36).slice(2)
  // The chosen entry of bridgeheadChoices: the bridgehead id, or '' for the whole project
  selectedBridgehead = ''

  mounted() {
    // The first choice, unless the current one is still offered
    watch(
        () => this.bridgeheadChoices?.map(bridgehead => this.bridgeheadKey(bridgehead)) ?? [],
        (keys) => {
          if (!keys.includes(this.selectedBridgehead)) this.selectedBridgehead = keys[0] ?? '';
          this.updateIsActive();
        },
        {immediate: true}
    );
    watch(
        () => this.projectManagerBackendService,
        () => {
          this.updateIsActive();
        },
        {immediate: true, deep: true}
    );
  }

  async created() {
    this.updateIsActive()
    this.visible = !this.toggleInput
  }

  updateIsActive() {
    this.projectManagerBackendService.isModuleActionActive(this.module, this.uploadAction, this.context)
        .then(result => this.isActive = result && this.bridgeheadChoices?.length !== 0)
  }

  bridgeheadKey(bridgehead: Bridgehead | null): string {
    return bridgehead?.bridgehead ?? '';
  }

  bridgeheadLabel(bridgehead: Bridgehead | null): string {
    return bridgehead ? (bridgehead.humanReadable ?? bridgehead.bridgehead) : 'Whole request';
  }

  uploadContext(): ProjectManagerContext {
    if (!this.bridgeheadChoices) return this.context;
    const bridgehead = this.bridgeheadChoices.find(choice => this.bridgeheadKey(choice) === this.selectedBridgehead);
    return new ProjectManagerContext(this.context.projectCode, bridgehead ?? undefined);
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const fileList: FileList | null = target.files;
    if (fileList && fileList.length > 0) {
      this.file = fileList[0];
      this.fileSelected = false;
      this.fileSelected = true;
    }
  }

  uploadFile(): void {
    const params = new Map<string, unknown>();
    if (this.isFile) {
      if (!this.file) {
        console.error('No file selected.');
        return;
      }
      params.set(PmRequestParameter.DOCUMENT, this.file);
    } else {
      params.set(PmRequestParameter.DOCUMENT_URL, this.url);
    }
    params.set(PmRequestParameter.LABEL, this.label);

    this.projectManagerBackendService.fetchHttpResponse(this.module, this.uploadAction, this.uploadContext(), params).then(() => {
      this.file = undefined;
      this.label = '';
      this.url = '';
      this.callRefreshContext();
      this.updateIsActive();
      this.fileSelected = false;
    });
  }

}
</script>

<template>
  <div v-if="isActive" style="width: 100%; min-width: 0;">
    <div class="row align-items-center g-0" style="display: flex;width: 100%; min-width: 0;">
      <div style="display: flex; width: 100%; min-width: 0;">
        <div class="form-group" style="display:flex; width: 100%; min-width: 0; flex-flow: column;">
          <div style="display: flex;flex-direction: row;align-items: baseline">
          <label v-if="text?.trim()" for="labelInput" class="upload-description">{{ text }}: </label>
          <template v-if="!text.toLowerCase().endsWith('url')">
            <span v-if="!fileSelected" class="filename upload-description blue" @click="visible = !visible">no file selected</span>
            <span v-else data-toggle="tooltip" data-placement="top" :title="file?.name"
                  class="filename upload-description green" @click="visible = !visible">{{ file?.name }}</span>
            <DownloadButton v-if="existsFile && downloadAction && !projectDocument"
                            :context="context" :project-manager-backend-service="projectManagerBackendService"
                            :module="module" :action="downloadAction" icon-class="bi bi-download"
                            :filename="fileName"/>
          </template>
          </div>
          <div v-if="bridgeheadChoices && bridgeheadChoices.length > 0" class="upload-bridgehead">
            <label :for="'bridgehead-'+uniqueId" class="upload-description">For:</label>
            <select v-if="bridgeheadChoices.length > 1" :id="'bridgehead-'+uniqueId" v-model="selectedBridgehead"
                    class="form-select form-select-sm upload-bridgehead-select">
              <option v-for="bridgehead in bridgeheadChoices" :key="bridgeheadKey(bridgehead)" :value="bridgeheadKey(bridgehead)">{{ bridgeheadLabel(bridgehead) }}</option>
            </select>
            <span v-else class="upload-description">{{ bridgeheadLabel(bridgeheadChoices[0]) }}</span>
          </div>
          <div style="display: none; width: 100%; flex-flow: row;" :class="{ 'visible': visible }">
            <div v-if="isFile" style="width: 100%; min-width: 0;">
              <div style="display: flex; flex-flow: row; align-items: center; width: 100%;">
                <label :for="'file-'+uniqueId" class="btn btn-primary fileChooser dktk-darkblue">
                  Choose File
                  <input :id="'file-'+uniqueId" type="file" ref="fileInput" @change="onFileSelected($event)"
                         style="display: none;">
                </label>

                <input :id="'label-'+uniqueId" type="text" v-model="label" placeholder="Enter label (optional)"
                       class="form-control inputField" :disabled="!fileSelected">
                <button style="display: flex; flex-flow: row;" @click="uploadFile"
                        class="btn btn-primary fileChooser dktk-darkblue" :disabled="!fileSelected">
                  <i class="bi bi-cloud-upload" style="font-size: medium"></i>
                  <span class="upload-description upload-button-text">Upload File</span>
                </button>
              </div>
            </div>

            <div v-else style="display: flex; flex-flow: row; align-items: center; width: 100%;">
              <input :id="'label-'+uniqueId" type="text" v-model="label" placeholder="Enter label"
                     class="form-control inputField"
                     style="border-radius: 5px 5px 5px 5px; margin-right: 2%; width: 50%;">

              <input :id="'url-'+uniqueId" type="text" v-model="url" placeholder="Enter URL" class="form-control inputField"
                     style="border-radius: 5px 5px 5px 5px; width: 50%;">

              <button style="display: flex; flex-flow: row;" @click="uploadFile" class="btn btn-primary fileChooser darkblue"
                      :disabled="url.length === 0">
                <i class="bi bi-cloud-upload" style="font-size: medium"></i>
                <span class="upload-description upload-button-text">Upload File</span>
              </button>
            </div>
          </div>
          <DocumentsTable
              v-if="projectDocument && existsFile"
              :context="context"
              :project-manager-backend-service="projectManagerBackendService"
              :download-action="downloadAction"
              :documents="[projectDocument]"
              :project-manager-admin="projectManagerAdmin"
              :call-refresh-context="callRefreshContext"
              :text="''"/>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-description {
  font-size: 12px;
  font-weight: normal;
  margin-bottom: 3px;
}

.upload-button-text {
  padding: 2px 0 0 5px;
}

.filename {
  display: inline;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(30 * 1ch);
  cursor: pointer;
  padding-left: 5px;
}

.green {
  color: var(--status-success-color);
  background-color: transparent;
}
.blue {
  color: #00489c;
}
.dktk-darkblue {
  background-color: #00529c !important;
}
.fileChooser {
  font-size: 10pt;
  white-space: nowrap;
  padding: 0.4rem 0.75rem;
  margin-right: 3%;
  flex-shrink: 0;
}

/* Shrinks instead of pushing the buttons out of the widget's width. */
.inputField {
  border-radius: 5px;
  width: 100%;
  min-width: 0;
  font-size: small;
  padding: .5rem .75rem;
  margin-right: 3%;
}

.upload-bridgehead {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.upload-bridgehead-select {
  width: fit-content;
}

.visible {
  display: flex!important;
}
</style>
