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
    <span>{{ text }}:</span>&nbsp;
    <input type="text" v-model="label" placeholder="Enter label">
    <div v-if="isFile">
      <input type="file" ref="fileInput" @change="handleFileChange">
    </div>
    <div v-if="!isFile">
      <input type="text" v-model="url" placeholder="Enter URL">
    </div>
    <button @click="uploadFile">Upload</button>
  </div>
</template>

<style scoped>

</style>
