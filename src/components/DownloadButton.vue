<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {
  Action,
  Module,
  ProjectManagerBackendService,
  ProjectManagerContext
} from "@/services/projectManagerBackendService";
import {PropType, watch} from "vue";

@Options({
  name: "DownloadButton",
  props: {
    context: {type: Object as PropType<ProjectManagerContext>, required: true},
    projectManagerBackendService: {type: Object as PropType<ProjectManagerBackendService>, required: true},
    module: {type: String as PropType<Module>, required: true},
    action: {type: String as PropType<Action>, required: true},
    filename: {type: String, required: false},
    iconClass: {type: String, required: false},
    buttonClass: {type: String, required: false},
    text: {type: String, required: false},
    params: {type: Object as PropType<Map<string, unknown>>, required: false, default: () => new Map<string, unknown>()}
  }
})
export default class DownloadButton extends Vue {
  readonly context!: ProjectManagerContext;
  readonly projectManagerBackendService!: ProjectManagerBackendService;
  readonly module!: Module;
  readonly action!: Action;
  readonly filename?: string;
  // Used in template:
  // noinspection JSUnusedGlobalSymbols
  readonly iconClass?: string;
  // noinspection JSUnusedGlobalSymbols
  readonly buttonClass?: string;
  readonly text?: string;
  readonly params?: Map<string, unknown>;

  isActive = false;

  mounted() {
    this.updateIsActive();

    watch(
        () => this.projectManagerBackendService,
        () => {
          this.updateIsActive();
        },
        {immediate: true, deep: true}
    );
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
.no-y-padding {
  padding-top: 0;
  padding-bottom: 0;
}
</style>
