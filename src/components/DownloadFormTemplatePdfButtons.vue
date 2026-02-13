<script lang="ts">
import {Options, Vue} from "vue-class-component";
import DownloadButton from "./DownloadButton.vue";
import {
  Action,
  EditProjectParam,
  Module,
  ProjectManagerBackendService,
  ProjectManagerContext
} from "@/services/projectManagerBackendService";

export interface FormTemplate {
  template: string;
  displayName: string;
}

@Options({
  name: "DownloadFormTemplatePdfButtons",
  components: {DownloadButton},
  computed: {
    EditProjectParam() {
      return EditProjectParam;
    }
  },
  props: {
    formTemplates: {type: Array as () => FormTemplate[], required: true},
    context: {type: Object as () => ProjectManagerContext, required: true},
    projectManagerBackendService: {type: Object as () => ProjectManagerBackendService, required: true}
  }
})
export default class DownloadFormTemplatePdfButtons extends Vue {

  readonly formTemplates!: FormTemplate[];
  readonly context!: ProjectManagerContext;
  readonly projectManagerBackendService!: ProjectManagerBackendService;
  readonly module: Module = Module.PROJECT_EDITION_MODULE;
  readonly action: Action = Action.DOWNLOAD_FORM_AS_PDF_ACTION;

  getParams(template: string): Map<string, unknown> {
    return new Map([[EditProjectParam.FORM_TEMPLATE, template]]);
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
