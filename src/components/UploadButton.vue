<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {
  Action,
  Bridgehead,
  Module,
  ProjectManagerBackendService,
  ProjectManagerContext,
  UPLOAD_DOCUMENT_PARAM,
  UPLOAD_DOCUMENT_URL_PARAM
} from "@/services/projectManagerBackendService";
import {PropType, watch} from "vue";
import DownloadButton from "@/components/DownloadButton.vue";

@Options({
  name: "UploadButton",
  components: {DownloadButton},
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

    useBridgeheadChooser: {type: Boolean, default: false},
    visibleBridgeheads: {type: Array as PropType<Bridgehead[]>, default: () => []},
    existsFile: {type: Boolean, required: false},
    fileName: {type: String, required: false},

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
  readonly useBridgeheadChooser!: boolean;
  readonly visibleBridgeheads!: Bridgehead[];
  readonly toggleInput?: boolean;
  readonly existsFile?: boolean;
  readonly fileName?: string;

  file: File | undefined = undefined;
  label = '';
  url = '';
  isActive = false;
  fileSelected = false;
  selectedBridgehead: string | undefined = undefined;
  visible: boolean = true
  uniqueId = Math.random().toString(36).slice(2)

  mounted() {
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
    this.projectManagerBackendService.isModuleActionActive(this.module, this.uploadAction).then(result => this.isActive = result)
    this.selectedBridgehead = this.context.bridgehead?.bridgehead
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
      params.set(UPLOAD_DOCUMENT_PARAM, this.file);
    } else {
      params.set(UPLOAD_DOCUMENT_URL_PARAM, this.url);
    }
    params.set('label', this.label);

    this.projectManagerBackendService.fetchHttpResponse(this.module, this.uploadAction, this.getContext(), params).then(() => {
      this.file = undefined;
      this.label = '';
      this.url = '';
      this.callRefreshContext();
      this.updateIsActive();
      this.fileSelected = false;
    });
  }

  getContext(): ProjectManagerContext {
    const bridgehead = this.visibleBridgeheads.find((bridgehead) => bridgehead.bridgehead === this.selectedBridgehead)
    if (this.useBridgeheadChooser) {
      return new ProjectManagerContext(this.context.projectCode, bridgehead)
    } else {
      return this.context
    }
  }
}
</script>

<template>
  <div v-if="isActive" style="width: auto; margin-right: 2%">
    <div class="row align-items-center" style="display: flex;width: 100%">
      <div style="display: flex; width: 100%;">
        <div class="form-group" style="display:flex; width: 100%; flex-flow: column;">
          <div style="display: flex;flex-direction: row;align-items: baseline">
          <label for="labelInput" class="form-label font-weight-bold"><strong>{{ text }}: </strong></label>
          <template v-if="!text.toLowerCase().endsWith('url')">
            <span v-if="!fileSelected && !existsFile" class="filename blue" @click="visible = !visible">no file selected</span>
            <span v-if="fileSelected || existsFile" data-toggle="tooltip" data-placement="top" :title="existsFile && !fileSelected ? fileName : file?.name"
                  class="filename green" @click="visible = !visible">{{ existsFile && !fileSelected ? fileName : file?.name }}</span>
            <DownloadButton v-if="existsFile && downloadAction"
                            :context="context" :project-manager-backend-service="projectManagerBackendService"
                            :module="module" :action="downloadAction" icon-class="bi bi-download"
                            :filename="fileName"/>
          </template>
          </div>
          <div style="display: none; width: 100%; flex-flow: row;" :class="{ 'visible': visible }">
            <template v-if="useBridgeheadChooser && visibleBridgeheads.length > 1">
              <select v-model="selectedBridgehead" class="form-select">
                <option v-for="value in visibleBridgeheads" :key="value.bridgehead" :value="value.bridgehead">
                  {{ value.humanReadable ? value.humanReadable : value.bridgehead }}
                </option>
              </select>
            </template>
            <div v-if="isFile">
              <div style="display: flex; flex-flow: row; align-items: center; width: 110%;">
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
                  <span style="font-size: small; padding: 2px 0 0 5px">Upload File</span>
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
                <span style="font-size: small; padding: 2px 0 0 5px">Upload File</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filename {
  display: inline;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(30 * 1ch);
  font-size: small;
  cursor: pointer;
  padding-left: 5px;
}

.green {
  color: #009a00;
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
}

.inputField {
  border-radius: 5px;
  width: 100%;
  font-size: small;
  padding: .5rem .75rem;
  margin-right: 3%;
}

.form-select {
  height: fit-content;
  width: fit-content;
  margin-right: 3%;
}
.visible {
  display: flex!important;
}
</style>
