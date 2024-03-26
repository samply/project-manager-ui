<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {Prop, Watch} from "vue-property-decorator";
import {
  Action,
  Module,
  ProjectManagerContext,
  ProjetManagerBackendService,
  UPLOAD_DOCUMENT_PARAM, UPLOAD_DOCUMENT_URL_PARAM
} from "@/services/projetManagerBackendService";

@Options({
  name: "UploadButton"
})

export default class UploadButton extends Vue {
  @Prop({type: Function, required: true}) readonly callRefrehContext!: () => void;
  @Prop() readonly context!: ProjectManagerContext;
  @Prop() readonly projectManagerBackendService!: ProjetManagerBackendService;
  @Prop() readonly module!: Module;
  @Prop() readonly action!: Action;
  @Prop() readonly text!: string;
  @Prop() readonly isFile!: boolean;
  @Prop() existsApplicationForm!: boolean;
  file: File | undefined = undefined;
  label = '';
  url = '';
  isActive = false;

  @Watch('projectManagerBackendService', {immediate: true, deep: true})
  onContextChange(newValue: ProjetManagerBackendService, oldValue: ProjetManagerBackendService) {
    this.updateIsActive()
  }

  async created() {
    this.updateIsActive()
  }

  updateIsActive() {
    this.projectManagerBackendService.isModuleActionActive(this.module, this.action).then(result => this.isActive = result)
   if(this.text==='Upload application form'){this.existsApplicationForm = true;}
  }

  handleFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const fileList: FileList | null = target.files;
    if (fileList && fileList.length > 0) {
      this.file = fileList[0];
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
    });
  }
}
</script>

<template>
  <div v-if="isActive">
    <div class="row align-items-center" style="display: flex; width: 100%;">
      <div style="display: flex; width: 100%;">
        <div class="form-group" style="width: 100%; flex-flow: column;">
          <label for="labelInput" class="form-label font-weight-bold"><strong>{{ text }}:</strong></label>

          <div style="display: flex; width: 100%; flex-flow: row;">

            <div v-if="isFile" style="display: flex; flex-flow: row; align-items: center; width: 100%; ">
              <input id="labelInput" type="text" v-model="label" placeholder="Enter label" class="form-control" style="border-radius: 5px 0px 0px 5px; width: 100%;">
              <label for="fileInput" class="btn btn-primary" style="background: none; height: 100%; border: solid 0.5px lightgrey; color: black; border-radius: 0px 5px 5px 0px;">
                <i class="bi bi-file-plus"></i>
                <input id="fileInput" type="file" ref="fileInput" @change="handleFileChange" style="display: none;">
              </label>
              <button style="background: none; height: 100%; color: black; border: none;" @click="uploadFile" class="btn btn-primary">
                <i class="bi bi-cloud-upload"></i>
              </button>
            </div>

            <div v-else style="display: flex; flex-flow: row; align-items: center; width: 100%; ">
              <input id="labelInput" type="text" v-model="label" placeholder="Enter label" class="form-control" style="border-radius: 5px 5px 5px 5px; margin-right: 2%; width: 50%;">

              <input id="labelInput" type="text" v-model="url" placeholder="Enter URL" class="form-control" style="border-radius: 5px 5px 5px 5px; width: 50%;">

              <button style="background: none; height: 100%; color: black; border: none;" @click="uploadFile" class="btn btn-primary">
                <i class="bi bi-cloud-upload"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>










<style scoped>

</style>
