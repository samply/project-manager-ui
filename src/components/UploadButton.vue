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

  handleFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const fileList: FileList | null = target.files;
    if (fileList && fileList.length > 0) {
      this.file = fileList[0];
    }
    this.uploadFile();
  }
}
</script>

<template>
  <div v-if="isActive">
    <div class=" row align-items-center" style="display:flex; width:100%;">
      <div style="display:flex;">
        <div class="form-group" style="display:flex;  width:100%; flex-flow:column">
        <label for="labelInput" class="form-label font-weight-bold" style="display:flex; width:70%">{{ text }}:</label>

       <div style="display:flex; flex-flow:row;">
         <input id="labelInput" type="text" v-model="label" placeholder="Enter label" class="form-control">

        <div style="padding-left: 2%">
          <label for="fileInput" class="btn btn-primary" style="background:none; color:black; border:none; margin-top:8%; font-size: larger" >
            <i class="bi bi-cloud-upload"></i>
            <input id="fileInput" type="file" ref="fileInput" @change="handleFileChange" style="display: none;">
          </label>
        </div>
       </div>
        </div>
      </div>
    </div>
<!--    <button style="background: none; color:black; border: none" @click="uploadFile" class="btn btn-primary mt-2"><i class="bi bi-cloud-upload"></i></button>-->

  </div>
</template>







<style scoped>

</style>
