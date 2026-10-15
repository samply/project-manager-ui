<script lang="ts">
import {Options, Vue} from "vue-class-component";
import DownloadButton from "./DownloadButton.vue";
import {
  Action,
  PmRequestParameter,
  Module,
  ProjectManagerBackendService,
  ProjectManagerContext
} from "@/services/projectManagerBackendService";
import {PropType} from "vue";

export interface FormTemplate {
  template: string;
  displayName: string;
}

@Options({
  name: "DownloadFormTemplatePdfButtons",
  components: {DownloadButton},
  computed: {
    PmRequestParameter() {
      return PmRequestParameter;
    }
  },
  props: {
    formTemplates: {type: Array as PropType<FormTemplate[]>, required: true},
    context: {type: Object as PropType<ProjectManagerContext>, required: true},
    projectManagerBackendService: {type: Object as PropType<ProjectManagerBackendService>, required: true}
  }
})
export default class DownloadFormTemplatePdfButtons extends Vue {

  readonly formTemplates!: FormTemplate[];
  readonly context!: ProjectManagerContext;
  readonly projectManagerBackendService!: ProjectManagerBackendService;
  readonly module: Module = Module.PROJECT_EDITION_MODULE;
  readonly action: Action = Action.DOWNLOAD_FORM_AS_PDF_ACTION;

  getParams(template: string): Map<string, unknown> {
    return new Map([[PmRequestParameter.FORM_TEMPLATE, template]]);
  }
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 10px;">
    <DownloadButton
        v-for="formTemplate in formTemplates"
        :key="formTemplate.template"
        :context="context"
        :projectManagerBackendService="projectManagerBackendService"
        :module="module"
        :action="action"
        :text="`Generate PDF for form '${formTemplate.displayName}'`"
        :params="getParams(formTemplate.template)"
    />
  </div>
</template>

<style scoped>
/* optional styling */
</style>
