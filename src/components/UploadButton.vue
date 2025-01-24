<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {Prop, Watch} from "vue-property-decorator";
import {
  Action,
  Module,
  ProjectManagerContext,
  ProjectManagerBackendService,
  UPLOAD_DOCUMENT_PARAM, UPLOAD_DOCUMENT_URL_PARAM
} from "@/services/projectManagerBackendService";

@Options({
  name: "UploadButton"
})

export default class UploadButton extends Vue {
  @Prop({type: Function, required: true}) readonly callRefrehContext!: () => void;
  @Prop() readonly context!: ProjectManagerContext;
  @Prop() readonly projectManagerBackendService!: ProjectManagerBackendService;
  @Prop() readonly module!: Module;
  @Prop() readonly action!: Action;
  @Prop() readonly text!: string;
  @Prop() readonly isFile!: boolean;
  file: File | undefined = undefined;
  label = '';
  url = '';
  isActive = false;
  fileSelected = false;

  @Watch('projectManagerBackendService', {immediate: true, deep: true})
  onContextChange(newValue: ProjectManagerBackendService, oldValue: ProjectManagerBackendService) {
    this.updateIsActive()
  }

  async created() {
    this.updateIsActive()
  }

  updateIsActive() {
    this.projectManagerBackendService.isModuleActionActive(this.module, this.action).then(result => this.isActive = result)
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
    if (this.isFile){
      if (!this.file) {
        console.error('No file selected.');
        return;
      }
      params.set(UPLOAD_DOCUMENT_PARAM, this.file);
    } else {
      params.set(UPLOAD_DOCUMENT_URL_PARAM, this.url);
    }
    params.set('label', this.label);
    this.projectManagerBackendService.fetchHttpResponse(this.module, this.action, this.context, params).then(httpResponse => {
      this.file = undefined;
      this.label = '';
      this.url = '';
      this.callRefrehContext();
      this.updateIsActive();
      this.fileSelected = false;
    });
  }
}
</script>

<template>
  <div v-if="isActive" style="width: auto; margin-right: 2%">
    <div class="row align-items-center" style="display: flex;width: 100%">
      <div style="display: flex; width: 100%;">
        <div class="form-group" style="width: 100%; flex-flow: column;">
          <label for="labelInput" class="form-label font-weight-bold"><strong>{{ text }}: </strong></label>
          <template v-if="!text.toLowerCase().endsWith('url')">
            <span v-if="!fileSelected" class="filename">no file selected</span>
            <span v-if="fileSelected" data-toggle="tooltip" data-placement="top" :title="file?.name" class="filename green">{{file?.name}}</span>
          </template>

          <div style="display: flex; width: 100%; flex-flow: row;">

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
              <input id="labelInput" type="text" v-model="label" placeholder="Enter label" class="form-control inputField" style="border-radius: 5px 5px 5px 5px; margin-right: 2%; width: 50%;">

              <input id="urlInput" type="text" v-model="url" placeholder="Enter URL" class="form-control inputField" style="border-radius: 5px 5px 5px 5px; width: 50%;">

              <button style="display: flex; flex-flow: row;" @click="uploadFile" class="btn btn-primary fileChooser" :disabled="url.length === 0">
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
.red {
  color: red;
  background-color: transparent;
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
</style>
