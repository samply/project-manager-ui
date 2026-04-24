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

@Options({
  name: "UploadButton",
  props: {
    callRefreshContext: {type: Function as unknown as () => () => void, required: true},
    context: {type: Object as PropType<ProjectManagerContext>, required: true},
    projectManagerBackendService: {type: Object as PropType<ProjectManagerBackendService>, required: true},
    module: {type: String as PropType<Module>, required: true},
    action: {type: String as PropType<Action>, required: true},
    text: {type: String, required: true},
    isFile: {type: Boolean, required: true},
    toggleInput: {type: Boolean, required: false},

    useBridgeheadChooser: {type: Boolean, default: false},
    visibleBridgeheads: {type: Array as PropType<Bridgehead[]>, default: () => []},
  }
})
export default class UploadButton extends Vue {

  readonly callRefreshContext!: () => void;
  readonly context!: ProjectManagerContext;
  readonly projectManagerBackendService!: ProjectManagerBackendService;
  readonly module!: Module;
  readonly action!: Action;
  readonly text!: string;
  readonly isFile!: boolean;
  readonly useBridgeheadChooser!: boolean;
  readonly visibleBridgeheads!: Bridgehead[];
  readonly toggleInput?: boolean;

  file: File | undefined = undefined;
  label = '';
  url = '';
  isActive = false;
  fileSelected = false;
  selectedBridgehead: string | undefined = undefined;
  visible: boolean = false

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
  }

  updateIsActive() {
    console.log(this.module)
    console.log(this.action)
    this.projectManagerBackendService.isModuleActionActive(this.module, this.action).then(result => this.isActive = result)
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

    this.projectManagerBackendService.fetchHttpResponse(this.module, this.action, this.getContext(), params).then(() => {
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
          <div>
          <label for="labelInput" class="form-label font-weight-bold"><strong>{{ text }}: </strong></label>
          <template v-if="!text.toLowerCase().endsWith('url')">
            <span v-if="!fileSelected" class="filename blue" @click="visible = !visible">no file selected</span>
            <span v-if="fileSelected" data-toggle="tooltip" data-placement="top" :title="file?.name"
                  class="filename green" @click="visible = !visible">{{ file?.name }}</span>
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
                <label for="fileInput" class="btn btn-primary fileChooser">
                  Choose File
                  <input id="fileInput" type="file" ref="fileInput" @change="onFileSelected($event)"
                         style="display: none;">
                </label>

                <input id="labelInput" type="text" v-model="label" placeholder="Enter label (optional)"
                       class="form-control inputField" :disabled="!fileSelected">
                <button style="display: flex; flex-flow: row;" @click="uploadFile"
                        class="btn btn-primary fileChooser" :disabled="!fileSelected">
                  <i class="bi bi-cloud-upload" style="font-size: medium"></i>
                  <span style="font-size: small; padding: 2px 0 0 5px">Upload File</span>
                </button>
              </div>
            </div>

            <div v-else style="display: flex; flex-flow: row; align-items: center; width: 100%;">
              <input id="labelInput" type="text" v-model="label" placeholder="Enter label"
                     class="form-control inputField"
                     style="border-radius: 5px 5px 5px 5px; margin-right: 2%; width: 50%;">

              <input id="urlInput" type="text" v-model="url" placeholder="Enter URL" class="form-control inputField"
                     style="border-radius: 5px 5px 5px 5px; width: 50%;">

              <button style="display: flex; flex-flow: row;" @click="uploadFile" class="btn btn-primary fileChooser"
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
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(30 * 1ch);
  font-size: small;
  cursor: default;
  padding-left: 5px;
}

.green {
  color: #009a00;
  background-color: transparent;
}
.blue {
  color: #00489c;
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
