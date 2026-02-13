<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {Prop, Watch} from "vue-property-decorator";
import {
  Action,
  Module,
  ProjectManagerBackendService,
  ProjectManagerContext
} from "@/services/projectManagerBackendService";

@Options({
  name: "DownloadButton"
})
export default class DownloadButton extends Vue {
  @Prop() readonly context!: ProjectManagerContext;
  @Prop() readonly projectManagerBackendService!: ProjectManagerBackendService;
  @Prop() readonly module!: Module;
  @Prop() readonly action!: Action;
  @Prop() readonly filename: string | undefined = undefined;
  @Prop() readonly iconClass: string | undefined = undefined;
  @Prop() readonly buttonClass: string | undefined = undefined;
  @Prop() readonly text: string | undefined = undefined;
  @Prop({default: () => new Map<string, unknown>()}) readonly params!: Map<string, unknown>;

  isActive = false;

  @Watch('projectManagerBackendService', {immediate: true, deep: true})
  onContextChange() {
    this.updateIsActive();
  }

  async created() {
    this.updateIsActive();
  }

  updateIsActive() {
    this.projectManagerBackendService
        .isModuleActionActive(this.module, this.action)
        .then(result => this.isActive = result);
  }

  downloadFile(): void {
    // Use a new Map and populate it with the prop if provided
    const params = new Map<string, unknown>();

    // Merge filename
    if (this.filename) {
      params.set('filename', this.filename);
    }

    // Merge additional params if provided
    if (this.params && this.params.size > 0) {
      this.params.forEach((value, key) => {
        params.set(key, value);
      });
    }

    this.projectManagerBackendService
        .downloadFile(this.module, this.action, this.context, params)
        .then(() => {
          this.updateIsActive();
        });
  }
}
</script>


<template>
  <div v-if="isActive" style="display:flex; flex-flow: row">
    <span v-if="text" style=" margin-bottom: 1%; padding-right:10px"><strong>{{ text }}:</strong></span>

    <div v-if="!iconClass">
      <button data-toggle="tooltip" data-placement="top" title="Download" @click="downloadFile" class="btn btn-primary"
              :class="buttonClass" style="background:none; border:black; color:black;">
        <i class="bi bi-download"></i>
      </button>
    </div>

    <div v-if="iconClass">
      <button data-toggle="tooltip" data-placement="top" title="Download" @click="downloadFile" class="btn btn-primary"
              :class="buttonClass" style="background:none; border:none; color:black;">
        <i :class="iconClass" class="bi bi-download"></i>
      </button>
    </div>

  </div>
</template>

<style scoped>

</style>
