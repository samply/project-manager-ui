<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {Prop} from "vue-property-decorator";
import {
  Action,
  Module,
  ProjectManagerContext,
  ProjetManagerBackendService
} from "@/services/projetManagerBackendService";
import DownloadButton from "@/components/DownloadButton.vue";
import UploadButton from "@/components/UploadButton.vue";
import DocumentsTable from "@/components/DocumentsTable.vue";
import UserInput from "@/components/UserInput.vue";

@Options({
  computed: {

  },
  name: "ProjectFieldRow",
  components: {
    DocumentsTable,
    DownloadButton,
    UploadButton,
    UserInput}
})
export default class ProjectFieldRow extends Vue {
  @Prop() readonly fieldKey!: string;
  @Prop() readonly fieldValue!: string;
  @Prop() readonly editProjectParam!: string;
  @Prop() readonly projectManagerBackendService!: ProjetManagerBackendService;
  @Prop() readonly possibleValues!: string[];
  @Prop() readonly isEditable!: boolean;
  @Prop({ type: Function, required: true }) readonly callRefrehContext!: () => void;
  @Prop() readonly module!: Module;
  @Prop() readonly action!: Action;
  @Prop() readonly existsApplicationForm!: boolean;


  editing = false; // Flag to indicate if the field is being edited
  editedValue = ''; // Store edited value temporarily
  tempFieldValue = ''; // Initialize tempFieldValue with empty string
  isActionEnabled = false;
  context = new ProjectManagerContext('', undefined);
  Module = Module; // Bind the Module enum to the component instance
  Action = Action; // Bind the Action enum to the component instance

  // Initialize tempFieldValue with the initial value of fieldValue
  created() {
    this.tempFieldValue = this.fieldValue;
    this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_EDITION_MODULE, Action.EDIT_PROJECT_ACTION).then(isActive => this.isActionEnabled = isActive);
  }

  editField() {
    this.editing = true; // Set editing flag to true
    this.editedValue = this.tempFieldValue; // Initialize editedValue with current fieldValue
  }

  isFieldValueEditable(){
    return !this.editing && this.isEditable && this.isActionEnabled;
  }

  saveField() {
    // Perform actions to save the edited value, e.g., update database
    this.editing = false; // Reset editing flag
    this.tempFieldValue = this.editedValue;
    const params = new Map<string, string>();

    // Attention: HardCoded. Be very careful with it!
    if (this.fieldKey === 'Type' && this.tempFieldValue === 'DATASHIELD'){
      params.set('output-format', 'OPAL');
      params.set('template-id','opal-ccp');
    }
    params.set(this.editProjectParam, this.editedValue);
    this.projectManagerBackendService.fetchData(Module.PROJECT_EDITION_MODULE, Action.EDIT_PROJECT_ACTION, this.context, params).then(result => this.callRefrehContext());
  }


  cancelEdit() {
    this.editing = false; // Cancel editing, reset editing flag
  }

  getSelectedOption(): string {
    if (this.tempFieldValue && this.tempFieldValue.trim().length > 0){
      return this.tempFieldValue;
    }
    if (this.possibleValues && this.possibleValues.length > 0 && this.possibleValues[0]){
      return this.possibleValues[0];
    }
    return '';
  }

  refreshContext() {
    this.context = new ProjectManagerContext(this.context.projectCode, this.context.bridgehead);
  }}


</script>

<template>
  <tr>
    <!-- FIRST COLUMN TITLE-->
    <td class="bold-text thinner-column"  style="background-color: #f2f2f2;">{{ fieldKey }}</td>


    <!-- MIDDLE COLUMN VALUES-->

    <td class="wider-column">
      <div class="user-input-container">

        <div style="display:flex; flex-flow: row" v-if="editing && !possibleValues && fieldKey!='Application form' && fieldKey!='Other Documents' && fieldKey!='Other URL'  && fieldKey!='Publications'">
            <input id="labelInput" type="text" v-model="editedValue"  class="form-control">
          <div class="button-container">
            <button @click="saveField" class="btn btn-primary">Save</button>
            <button @click="cancelEdit" class="btn btn-secondary">Cancel</button>
          </div>
        </div>

        <div v-else-if="editing && fieldKey!='Application form' && fieldKey!='Other Documents' && fieldKey!='Other URL' && fieldKey!='Publications'">
          <select v-model="editedValue" class="form-select">
            <option v-for="value in possibleValues" :key="value" :value="value">{{ value }}</option>
          </select>

          <div class="button-container">
            <button @click="saveField" class="btn btn-primary">Save</button>
            <button @click="cancelEdit" class="btn btn-secondary">Cancel</button>
          </div>
        </div>

        <div style="display:flex; flex-flow:row; width:100%;" v-if="editing && fieldKey === 'Application form'">
        <div><DownloadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                             :module="Module.PROJECT_DOCUMENTS_MODULE"
                             :action="Action.DOWNLOAD_APPLICATION_FORM_TEMPLATE_ACTION" text="Download application form template:"/> <br/>
          <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                        :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.UPLOAD_APPLICATION_FORM_ACTION"
                        text="Upload application form" :call-refreh-context="refreshContext" :is-file="true" />
        </div>
          <div class="button-container">
            <button @click="saveField" class="btn btn-primary">Save</button>
            <button @click="cancelEdit" class="btn btn-secondary">Cancel</button>
          </div>
        </div>

        <div v-if="editing && fieldKey === 'Publications'">
          <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                        :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.UPLOAD_PUBLICATION_ACTION"
                        text="Upload publication" :call-refreh-context="refreshContext" :is-file="true" />

          <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                        :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.ADD_PUBLICATION_URL_ACTION"
                        text="Upload other document URL" :call-refreh-context="refreshContext" :is-file="false" />
          <button @click="saveField" class="btn btn-primary">Save</button>
          <button @click="cancelEdit" class="btn btn-secondary">Cancel</button>
        </div>
        <div style="display:flex; flex-flow:row; width:100%" v-if="editing && fieldKey === 'Other Documents'">
        <div>  <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                        :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.UPLOAD_OTHER_DOCUMENT_ACTION"
                        text="Upload Document" :call-refreh-context="refreshContext" :is-file="true"/>

          <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                        :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.ADD_OTHER_DOCUMENT_URL_ACTION"
                        text="Add URL" :call-refreh-context="refreshContext" :is-file="false" />
        </div>
          <div class="button-container">
            <button @click="saveField" class="btn btn-primary">Save</button>
            <button @click="cancelEdit" class="btn btn-secondary">Cancel</button>
          </div>
        </div>



        <div v-if="!editing ">
          <div class="field-value">{{ tempFieldValue }}</div>
        </div>

      </div>
    </td>

    <!-- LAST COLUMN ACTION BUTTONS-->

    <td>
      <div v-if="fieldKey==='Application form'">
        <DownloadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                        :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.DOWNLOAD_APPLICATION_FORM_ACTION" text="Download application form"
                        v-if="existsApplicationForm"/>
      </div>
    <div v-if="isFieldValueEditable()">
      <i class="bi bi-pencil me-2" @click="editField"></i>
    </div>
    <div v-else>
    </div>
    </td>
  </tr>
</template>

<style scoped>
.bold-text {
  font-weight: bold;
}

.user-input-container {
  display: flex;
  align-items: center;
  width:100%;
}

.button-container {
  margin-left: auto;
  floast:right;
  display:flex;
  flex-flow: row;
  width:100%;
  float:right;
  justify-content: flex-end;
  align-items: end;
}

.field-value {
  flex-grow: 1;
}

.bi-pencil {
  width: 100%;
  text-align: center;
}

</style>
