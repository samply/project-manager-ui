<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {Prop, Watch} from "vue-property-decorator";
import {
  Action,
  Module,
  ProjectManagerContext,
  ProjetManagerBackendService
} from "@/services/projetManagerBackendService";

@Options({
  name: "DownloadButton"
})

export default class DownloadButton extends Vue {
  @Prop() readonly context!: ProjectManagerContext;
  @Prop() readonly projectManagerBackendService!: ProjetManagerBackendService;
  @Prop() readonly module!: Module;
  @Prop() readonly action!: Action;
  @Prop() readonly filename: string | undefined = undefined;
  @Prop() readonly iconClass: string | undefined = undefined;
  @Prop() readonly text: string | undefined = undefined;
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

  downloadFile(): void {
    const params = new Map<string, unknown>();
    if (this.filename) {
      params.set('filename', this.filename);
    }
    this.projectManagerBackendService.downloadFile(this.module, this.action, this.context, params).then(httpResponse => {
      this.updateIsActive();
    });
  }
}
</script>

<template>
  <div v-if="isActive" style="display:flex; flex-flow: row">
    <span v-if="text" style=" margin-bottom: 1%; padding-right:10px">{{ text }}</span>

    <div v-if="!iconClass">
      <button data-toggle="tooltip" data-placement="top" title="Download" @click="downloadFile" class="btn btn-primary" style="background:none; border:black; color:black;  ">
        <i class="bi bi-download"></i>
      </button>
    </div>

    <div v-if="iconClass">
      <button data-toggle="tooltip" data-placement="top" title="Download" @click="downloadFile" class="btn btn-primary" style="background:none; border:none; color:black">
        <i :class="iconClass" class="bi bi-download"></i>
      </button>
    </div>

  </div>
</template>

<style scoped>

</style>
