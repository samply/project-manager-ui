<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {Prop, Watch} from "vue-property-decorator";
import {
  Action, Bridgehead,
  Module, ProjectDocument,
  ProjectManagerContext,
  ProjetManagerBackendService
} from "@/services/projetManagerBackendService";
import DownloadButton from "@/components/DownloadButton.vue";
import UploadButton from "@/components/UploadButton.vue";

@Options({
  name: "ProjectFieldRow",
  components: {DownloadButton, UploadButton}

})
export default class ProjectFieldRow extends Vue {
  @Prop() readonly fieldKey!: string;
  @Prop() readonly fieldValue!: string;
  @Prop() readonly editProjectParam!: string;
  @Prop() readonly projectManagerBackendService!: ProjetManagerBackendService;
  @Prop() readonly context!: ProjectManagerContext;
  @Prop({default: null}) readonly redirectUrl!: string | null;
  @Prop() readonly possibleValues!: string[];
  @Prop() readonly isEditable!: boolean;
  @Prop({ type: Function, required: true }) readonly callRefrehContext!: () => void;
  @Prop() readonly module!: Module;
  @Prop() readonly action!: Action;
  @Prop() readonly existsApplicationForm!: boolean;
  @Prop() readonly bridgeheads!: string[];
  @Prop() readonly fetchListAction!: Action;
  @Prop() readonly downloadAction!: Action;
  @Prop() readonly label!: string;


  editing = false; // Flag to indicate if the field is being edited
  editedValue = ''; // Store edited value temporarily
  tempFieldValue = ''; // Initialize tempFieldValue with empty string
  isActionEnabled = false;
  progress = 0;
  Module = Module; // Bind the Module enum to the component instance
  Action = Action; // Bind the Action enum to the component instance
  showInputs = false;
  newValue = '';
  newKey = '';

  @Watch('projectManagerBackendService', { immediate: true, deep: true })
  onProjetManagerBackendServiceChange(newValue: ProjetManagerBackendService, oldValue: ProjetManagerBackendService) {
    this.resetIsActionEnabled();

  }

  @Watch('fieldValue', { immediate: true, deep: true })
  onFieldValueChange(newValue: string, oldValue: string) {
    this.tempFieldValue = this.fieldValue;
  }

  @Watch('redirectUrl', { immediate: true, deep: true })
  onRedirectUrlChange(newValue: string, oldValue: string) {
    console.log('redirectURL:' + newValue)
  }

  createContext(bridgehead: string | undefined) {
    return new ProjectManagerContext(this.context.projectCode, this.context.bridgehead);

  }


  // Initialize tempFieldValue with the initial value of fieldValue
  created() {
    this.tempFieldValue = Array.isArray(this.fieldValue) ? this.fieldValue.join(',') : (this.fieldValue || '');
    this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_EDITION_MODULE, Action.EDIT_PROJECT_ACTION).then(isActive => this.isActionEnabled = isActive);
    this.resetIsActionEnabled();
  }

  resetIsActionEnabled(){
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
    if (this.fieldKey === 'Configuration'){
      this.projectManagerBackendService.fetchData(Module.PROJECT_EDITION_MODULE, Action.SET_PROJECT_CONFIGURATION_ACTION, this.context, params).then(result => this.callRefrehContext());
    } else {
      this.projectManagerBackendService.fetchData(Module.PROJECT_EDITION_MODULE, Action.EDIT_PROJECT_ACTION, this.context, params).then(result => this.callRefrehContext());
    }

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

  redirectToURL() {
    if (this.redirectUrl){
      window.location.href = this.redirectUrl;
    }
  }

  showInputFields() {
    this.showInputs = true;
  }

  addBridgehead() {
    if (this.newValue) {
      if (this.tempFieldValue !== '') {
        this.tempFieldValue += `,${this.newValue}`;
      } else {
        this.tempFieldValue += `${this.newValue}`;
      }
      this.newValue = '';
      this.showInputs = false;

      // Convert tempFieldValue to string if it's not already
      if (Array.isArray(this.tempFieldValue)) {
        this.tempFieldValue = this.tempFieldValue.join(',');
      }
    }
  }
  removeBridgehead(index: any) {
    const bridgeheads = this.tempFieldValue.split(',').filter(Boolean);
    bridgeheads.splice(index, 1);
    this.tempFieldValue = bridgeheads.join(',');
  }

  addVariable() {
    if (this.newKey && this.newValue) {
      if (this.tempFieldValue !== '') {
        this.tempFieldValue += `;${this.newKey}=${this.newValue}`;
      } else {
        this.tempFieldValue += `${this.newKey}=${this.newValue}`;
      }
      this.newKey = '';
      this.newValue = '';
      this.showInputs = false;
    }
  }
  removeVariable(index: any) {
    const pairs = this.tempFieldValue.split(';').filter(Boolean);
    pairs.splice(index, 1);
    this.tempFieldValue = pairs.join(';');
  }


}
</script>

<template>
  <tr>
    <td class="bold-text thinner-column" style="background-color: #f2f2f2;">{{ fieldKey }}</td>

    <td style="width:70%">
      <div class="user-input-container">
        <!-- FOR CELL THAT ARE JUST TEXT-FIELDS EDITABLE-->
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;" v-if="editing && !possibleValues && fieldKey !== 'Application form' && fieldKey !== 'Votum' && fieldKey !== 'Description' && fieldKey !== 'Script' && fieldKey !== 'Bridgeheads' && fieldKey !== 'Environment Variables' && fieldKey !== 'Samples'">
          <div style="width: 70%;">
            <input id="labelInput" type="text" v-model="editedValue" class="form-control" style="width: 100%;">
          </div>
          <div class="button-container" style="width: 25%; display:flex; gap:3%">
            <button @click="cancelEdit" class="btn btn-outline-secondary" style="padding: 4px 15px;">Cancel</button>
            <button @click="saveField" class="btn btn-outline-primary" style="padding: 4px 20px;">Save</button>
          </div>
        </div>

        <!-- CELL FOR DROPDOWNS EDITABLE-->
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;" v-else-if="editing && possibleValues && fieldKey !== 'Application form' && fieldKey !== 'Votum' && fieldKey !== 'Description' && fieldKey !== 'Script' && fieldKey !== 'Bridgeheads' && fieldKey !== 'Environment Variables' && fieldKey !== 'Samples'">
          <div style="width: 70%;">
            <select v-model="editedValue" class="form-select" style="width: 100%;">
              <option v-for="value in possibleValues" :key="value" :value="value" :selected="value === getSelectedOption()">{{ value }}</option>
            </select>
          </div>
          <div class="button-container" style="width: 25%; display: flex; gap: 3%;">
            <button @click="cancelEdit" class="btn btn-outline-secondary" style="padding: 4px 15px;">Cancel</button>
            <button @click="saveField" class="btn btn-outline-primary" style="padding: 4px 20px;">Save</button>
          </div>
        </div>

        <!-- CELL FOR DESCRIPTION WITH TEXTAREA EDITABLE-->
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;" v-if="editing && fieldKey === 'Description'">
          <div style="width:70%">
            <textarea  id="labelInput" type="text" v-model="editedValue"  class="form-control"></textarea></div>
          <div class="button-container" style="width: 25%; display: flex; gap: 3%;">
            <button @click="cancelEdit" class="btn btn-outline-secondary" style="padding:4px 15px 4px 15px;">Cancel</button>
            <button @click="saveField" class="btn btn-outline-primary" style="padding:4px 20px 4px 20px;">Save</button>
          </div>
        </div>

        <!-- CELL FOR BRIDGEHEADS EDITABLE -->
        <div v-if="editing && fieldKey === 'Bridgeheads'">
          <div class="field-value" style="width: 70%">
            <div v-if="tempFieldValue" class="field-value">
        <span v-for="(bridgehead, index) in tempFieldValue" :key="index" class="btn btn-primary" style="margin-right: 2%;">
          <span>{{ bridgehead }}</span>
        <button @click="removeBridgehead(index)" class="btn btn-sm" style="padding: 0px"><i style="color: white; font-size: 18px" class="bi bi-x"></i></button>
        </span>
            </div>
            <button @click="showInputFields" class="btn btn-secondary"><i class="bi bi-plus"></i></button>
            <div v-if="showInputs" style="display: flex; flex-flow: row; gap: 2%; padding-top: 2%">
              <input type="text" class="form-control" v-model="newValue" placeholder="Bridgehead">
              <button class="btn btn-primary" @click="addBridgehead"><i style="font-size: 18px" class="bi bi-check"></i></button>
            </div>
          </div>
          <div class="button-container" style="width: 25%; display: flex; height: 20%; gap: 3%;">
            <button @click="saveField" class="btn btn-outline-secondary" style="padding: 4px 15px 4px 15px;">Cancel</button>
            <button @click="cancelEdit" class="btn btn-outline-primary" style="padding: 4px 20px 4px 20px;">Save</button>
          </div>
        </div>

        <!-- CELL FOR ENVIRONMENT VARIABLE EDITABLE -->
        <div v-if="editing && fieldKey === 'Environment Variables'">
          <div class="field-value" style="width: 70%">
            <div v-for="(pair, index) in tempFieldValue.split(';').filter(Boolean)" :key="index" style="margin-right: 2%;" class="btn btn-primary">
              <span>{{ pair }}</span>
              <button @click="removeVariable(index)" class="btn btn-sm" style="padding: 0px"><i style="color: white; font-size: 18px" class="bi bi-x"></i></button>
            </div>
            <button @click="showInputFields" class="btn btn-secondary"><i class="bi bi-plus"></i></button>
            <div v-if="showInputs" style="display: flex; flex-flow: row; gap: 2%; padding-top: 2%">
              <input type="text" class="form-control" v-model="newKey" placeholder="Key">
              <input type="text" class="form-control" v-model="newValue" placeholder="Value">
              <button class="btn btn-primary" @click="addVariable"><i style="font-size: 18px" class="bi bi-check"></i></button>
            </div>
          </div>
          <div class="button-container" style="width: 25%; display: flex; height: 20%; gap: 3%;">
            <button @click="saveField" class="btn btn-outline-secondary" style="padding: 4px 15px 4px 15px;">Cancel</button>
            <button @click="cancelEdit" class="btn btn-outline-primary" style="padding: 4px 20px 4px 20px;">Save</button>
          </div>
        </div>


        <!-- CELL FOR APPLICATION FORM EDITABLE-->
        <div style="display:flex; flex-flow:row; width:100%;" v-if="editing && fieldKey === 'Application form'">
          <div style="width:75%">
            <DownloadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                            :module="Module.PROJECT_DOCUMENTS_MODULE"
                            :action="Action.DOWNLOAD_APPLICATION_FORM_TEMPLATE_ACTION"
                            text="Download application form template" />
            <br/>
            <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.UPLOAD_APPLICATION_FORM_ACTION"
                          text="Upload application form" :call-refreh-context="callRefrehContext" :is-file="true" />
          </div>
          <div class="button-container" style="width:25%; gap:3%">
            <button @click="cancelEdit" class="btn btn-outline-secondary" style="padding:4px 15px 4px 15px;">Cancel</button>
            <button @click="saveField" class="btn btn-outline-primary" style="padding:4px 20px 4px 20px;">Save</button>
          </div>
        </div>
<!-- CELL FOR SAMPLES EDITABLE -->
        <div style="display:flex; flex-flow:row; width:100%;" v-if="editing && fieldKey === 'Samples'">
          <div style="width:75%">
            <DownloadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                            :module="Module.PROJECT_DOCUMENTS_MODULE"
                            :action="Action.DOWNLOAD_APPLICATION_FORM_TEMPLATE_ACTION"
                            text="Download sample form template" />
            <br/>
            <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.UPLOAD_APPLICATION_FORM_ACTION"
                          text="Upload sample form" :call-refreh-context="callRefrehContext" :is-file="true" />
          </div>
          <div class="button-container" style="width:25%; gap:3%">
            <button @click="cancelEdit" class="btn btn-outline-secondary" style="padding:4px 15px 4px 15px;">Cancel</button>
            <button @click="saveField" class="btn btn-outline-primary" style="padding:4px 20px 4px 20px;">Save</button>
          </div>
        </div>

        <!--CELL FOR VOTUMN EDITABLE-->
        <div style="display:flex; flex-flow:row; width:100%" v-if="editing && fieldKey === 'Votum'">
          <div style="width:75%">
            <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.UPLOAD_OTHER_DOCUMENT_ACTION"
                          text="Upload Votum" :call-refreh-context="callRefrehContext" :is-file="true"/>
          </div>
          <div class="button-container" style="width:25%; gap:3%">
            <button @click="cancelEdit" class="btn btn-outline-secondary" style="padding:4px 15px 4px 15px;">Cancel</button>
            <button @click="saveField" class="btn btn-outline-primary" style="padding:4px 20px 4px 20px;">Save</button>
          </div>
        </div>

        <!--CELL FOR Script EDITABLE-->
        <div style="display:flex; flex-flow:row; width:100%" v-if="editing && fieldKey === 'Script'">
          <div style="width:75%">
            <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.UPLOAD_SCRIPT_ACTION"
                          text="Upload script" :call-refreh-context="callRefrehContext" :is-file="true"/>

          </div>
          <div class="button-container" style="width:25%; gap:3%">
            <button @click="cancelEdit" class="btn btn-outline-secondary" style="padding:4px 15px 4px 15px;">Cancel</button>
            <button @click="saveField" class="btn btn-outline-primary" style="padding:4px 20px 4px 20px;">Save</button>
          </div>
        </div>

        <!-- CELL FOR ALL VALUES READONLY -->
        <div style="width:70%" v-if="!editing && fieldKey !== 'Bridgeheads' && fieldKey !== 'Application form'  && fieldKey !== 'Environment Variables' && fieldKey !== 'Samples' && fieldKey !== 'Votum' && fieldKey !== 'Script' ">
          <div class="field-value truncate">{{ tempFieldValue }}</div>
        </div>

        <div style="width:70%" v-if="!editing && fieldKey === 'Application form' ">
          <div  class="field-value truncate" v-if="existsApplicationForm">available</div>
          <div  class="field-value truncate" v-if="!existsApplicationForm"> </div>
        </div>

        <div style="width:70%" v-if="!editing && fieldKey === 'Samples' ">
          <div  class="field-value truncate" v-if="existsApplicationForm">available</div>
          <div  class="field-value truncate" v-if="!existsApplicationForm"> </div>
        </div>
        <div style="width:70%" v-if="!editing && fieldKey === 'Votum' ">
          <div  class="field-value truncate" v-if="existsApplicationForm">available</div>
          <div  class="field-value truncate" v-if="!existsApplicationForm"> </div>
        </div>
        <div style="width:70%" v-if="!editing && fieldKey === 'Script' ">
          <div  class="field-value truncate" v-if="existsApplicationForm">available</div>
          <div  class="field-value truncate" v-if="!existsApplicationForm"> </div>
        </div>

        <!-- READONLY CELL FOR BRIDGEHEADS -->
        <div v-else-if="!editing && fieldKey === 'Bridgeheads'">
          <div style="width: 70%">
            <div v-if="tempFieldValue" class="field-value">
        <span v-for="(bridgehead, index) in tempFieldValue" :key="index" class="btn btn-primary" style="margin-right: 2%;">
          <span>{{ bridgehead }}</span>
        </span>
            </div>
          </div>
        </div>
        <!-- READONLY CELL FOR ENVIRONMENT VARIABLES -->
        <div v-else-if="!editing && fieldKey === 'Environment Variables'">
          <div style="width: 70%">
            <div v-for="(variable, index) in tempFieldValue.split(';')" :key="index" style="margin-right: 2%;  display: inline;" class="btn btn-primary">
              <span style=" display: inline; margin-bottom: 1%">{{ variable }}</span>
            </div>
          </div>
        </div>

<!--        <div style="width:70%" v-if="!editing && fieldKey === 'Environment Variables'">
          <div class="field-value">
            <div v-for="(bridgehead, index) in tempFieldValue" :key="index" style="margin-right:2%;  display: inline;" class="btn btn-primary"  >
              <span style=" display: inline; margin-bottom: 1%">{{ tempFieldValue }}</span>
            </div>
          </div>
        </div>-->


      </div>
    </td>

    <!-- THIRD COLUMN ACTION TOOLS -->
    <td>
      <div v-if="isFieldValueEditable() && redirectUrl === null && fieldKey != 'Application form' && fieldKey != 'Script'" style="display:inline-flex; flex-flow:row; align-items: baseline">
        <button class="btn btn-primary" data-toggle="tooltip" data-placement="top" title="Edit" style="background:none; border:none; color:black"> <i class="bi bi-pencil me-2" @click="editField"></i> </button>
      </div>
      <div v-if="isFieldValueEditable() && redirectUrl === null && fieldKey === 'Application form'" style="display:inline-flex; flex-flow:row; align-items: baseline">
        <button class="btn btn-primary" data-toggle="tooltip" data-placement="top" title="Edit" style="background:none; border:none; color:black"> <i class="bi bi-pencil me-2" @click="editField"></i> </button>
        <DownloadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                        :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.DOWNLOAD_APPLICATION_FORM_ACTION"
        />
      </div>

      <div v-if="isFieldValueEditable() && redirectUrl === null && fieldKey === 'Script'" style="display:inline-flex; flex-flow:row; align-items: baseline" >
        <button class="btn btn-primary" data-toggle="tooltip" data-placement="top" title="Edit" style="background:none; border:none; color:black"> <i class="bi bi-pencil me-2" @click="editField"></i> </button>
        <DownloadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                        :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.DOWNLOAD_SCRIPT_ACTION"
                        icon-class="bi bi-download"/>
      </div>

      <div v-else-if="isFieldValueEditable() && redirectUrl !== null">
      <i class="bi bi-arrow-right-circle" @click="redirectToURL"></i>
    </div>
    <div v-else></div>
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
}

.button-container {
  margin-left: auto; /* Push buttons to the right */
}

.field-value {
  flex-grow: 1; /* Allow fieldValue to grow and occupy available space */
}

.bi-pencil {
  width: 100%; /* Make bi-pencil icon occupy all available space */
  text-align: center; /* Center the icon */
}

.progress-container {
  width: 100%;
  height: 5px;
  background-color: #ddd;
  margin-top: 5px;
}

.progress {
  height: 100%;
  background-color: #4caf50;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(50 * 1ch); /* 1ch is the width of one character */
}

</style>
