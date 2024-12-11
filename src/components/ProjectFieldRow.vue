<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {Prop, Watch} from "vue-property-decorator";
import {
  Action,
  EditProjectParam, Explanation,
  Module,
  ProjectManagerBackendService,
  ProjectManagerContext
} from "@/services/projectManagerBackendService";
import DownloadButton from "@/components/DownloadButton.vue";
import UploadButton from "@/components/UploadButton.vue";

@Options({
  name: "ProjectFieldRow",
  components: {DownloadButton, UploadButton}
})
export default class ProjectFieldRow extends Vue {
  @Prop() readonly fieldKey!: string;
  // The index of editProjectParam, fieldValue, editedValue and tempFieldValue is the same
  @Prop() readonly editProjectParam!: EditProjectParam[];
  @Prop() readonly fieldValue!: string[];
  @Prop() readonly projectManagerBackendService!: ProjectManagerBackendService;
  @Prop() readonly context!: ProjectManagerContext;
  @Prop({default: null}) readonly redirectUrl!: string | null;
  @Prop() readonly possibleValues!: string[];
  @Prop() readonly isEditable!: boolean;
  @Prop({type: Function, required: true}) readonly callRefrehContext!: () => void;
  @Prop() readonly uploadAction!: Action;
  @Prop() readonly downloadAction!: Action;
  @Prop() readonly downloadModule!: Module;
  @Prop() readonly todos?: Explanation;
  @Prop() readonly existsFile!: boolean;
  @Prop() readonly draftDialogCurrentStep!: number;
  @Prop({
    type: Function,
    default: (input: string): string => input
  }) readonly transformForSending!: (input: string) => string;


  editing = false;
  editedValue: string[] = [];
  tempFieldValue: string[] = [];
  isActionEnabled = false;
  progress = 0;
  Module = Module;
  Action = Action;
  showInputs = false;
  newValue = "";
  newKey = "";
  toggleHumanReadable = true;

  @Watch("projectManagerBackendService", {immediate: true, deep: true})
  onProjetManagerBackendServiceChange(
      newValue: ProjectManagerBackendService,
      oldValue: ProjectManagerBackendService
  ) {
    this.resetIsActionEnabled();
  }

  @Watch("fieldValue", {immediate: true, deep: true})
  onFieldValueChange(newValue: string[], oldValue: string[]) {
    this.tempFieldValue = newValue;
  }

  @Watch("redirectUrl", {immediate: true, deep: true})
  onRedirectUrlChange(newValue: string | null, oldValue: string | null) {
    console.log("redirectURL:" + newValue);
  }

  created() {
    this.tempFieldValue = this.fieldValue.slice(); // Copy fieldValue to tempFieldValue
    this.editedValue = this.fieldValue.slice(); // Copy fieldValue to editedValue
    this.resetIsActionEnabled();
  }

  resetIsActionEnabled() {
    const action = (this.uploadAction) ? this.uploadAction : Action.EDIT_PROJECT_ACTION;
    const module = (this.uploadAction) ? Module.PROJECT_DOCUMENTS_MODULE : Module.PROJECT_EDITION_MODULE;
    this.projectManagerBackendService
        .isModuleActionActive(module, action)
        .then((isActive) => (this.isActionEnabled = isActive));
  }

  editField() {
    this.editing = true;
    // Copy tempFieldValue to editedValue when editing starts
    this.editedValue = this.tempFieldValue.slice();
  }

  isFieldValueEditable() {
    return !this.editing && this.isEditable && this.isActionEnabled;
  }

  saveField() {
    this.showInputs = false;
    this.editing = false;
    this.tempFieldValue = this.editedValue.slice(); // Copy editedValue back to tempFieldValue
    const params = new Map<string, string>();

    if (this.editProjectParam && this.editProjectParam.length > 0) {
      //TODO: Please remove hardcoded output format and template id. These values only make sense for DKTK and not always
      if (this.includesEditProjectParam(EditProjectParam.PROJECT_TYPE) && this.tempFieldValue[0] === "DATASHIELD") {
        params.set("output-format", "OPAL");
        params.set("template-id", "opal-ccp");
      }
      for (let i = 0; i < this.editProjectParam.length; i++) {
        if (i < this.editedValue.length) {
          params.set(this.editProjectParam[i], this.applyTransformToSend(this.editedValue[i]));
        }
      }
      if (this.includesEditProjectParam(EditProjectParam.PROJECT_CONFIGURATION)) {
        this.projectManagerBackendService
            .fetchData(Module.PROJECT_EDITION_MODULE, Action.SET_PROJECT_CONFIGURATION_ACTION, this.context, params)
            .then((result) => this.callRefrehContext());
      } else {
        this.projectManagerBackendService
            .fetchData(Module.PROJECT_EDITION_MODULE, Action.EDIT_PROJECT_ACTION, this.context, params)
            .then((result) => this.callRefrehContext());
      }
    }

  }

  applyTransformToSend(editedValue: any): any {
    if (editedValue) {
      return (Array.isArray(editedValue)) ? editedValue.map(input => this.transformForSending(input)) : this.transformForSending(editedValue);
    }
    return "";
  }

  includesEditProjectParam(param: EditProjectParam): boolean {
    return this.editProjectParam && this.editProjectParam.includes(param);
  }

  cancelEdit() {
    this.editing = false;
    this.showInputs = false;

  }

  redirectToURL() {
    if (this.redirectUrl) {
      window.location.href = this.redirectUrl;
    }
  }


  showInputFields() {
    this.showInputs = true;
  }

  addFieldValue() {
    if (this.newValue) {
      if (Array.isArray(this.tempFieldValue) && this.tempFieldValue.length > 0 && Array.isArray(this.tempFieldValue[0])) {
        const targetArray = this.tempFieldValue[0];
        targetArray.push(this.newValue);
        this.tempFieldValue[0] = targetArray;
      }
      this.newValue = '';
    }
  }

  areThereMoreBridgeheadsAvailableToAdd(): boolean {
    return (this.fieldValue !== null && this.fieldValue.length >= 2
        && this.fieldValue[0] !== null && this.fieldValue[1] !== null
        && Array.isArray(this.fieldValue[0]) && Array.isArray(this.fieldValue[1])
        && (this.fieldValue[0] as string[]).length < (this.fieldValue[1] as string[]).length);
  }

  fetchOtherAvailableBridgeheadsToAdd(): string[] {
    return (this.fieldValue !== null && this.fieldValue.length >= 2
        && this.fieldValue[0] !== null && this.fieldValue[1] !== null
        && Array.isArray(this.fieldValue[0]) && Array.isArray(this.fieldValue[1])) ?
        (this.fieldValue[1] as string[]).filter((element: string) => !this.fieldValue[0].includes(element)) : [];


  }

  removeBridgehead(index: any) {
    if (Array.isArray(this.tempFieldValue) && this.tempFieldValue.length > 0 && Array.isArray(this.tempFieldValue[0])) {
      const targetArray = this.tempFieldValue[0]; // Direkt auf das Ziel-Array zugreifen
      if (index >= 0 && index < targetArray.length) {
        targetArray.splice(index, 1);
        this.tempFieldValue[0] = targetArray;
      }
    }
  }


  addEnvVariable() {
    if (this.newKey && this.newValue) {
      this.editedValue[0] != null ? this.editedValue[0] += ';' : this.editedValue[0] = '';
      this.editedValue[0] += this.newKey + '=' + this.newValue;
      this.newKey = '';
      this.newValue = '';
    }
  }

  removeEnvVariable(index: any) {
    if (this.editedValue.length > 0) {
      const pairs = this.editedValue[0].split(';');
      pairs.splice(index, 1);
      this.editedValue[0] = pairs.join(';');
    }
  }

  exitAndCallRefreshContext() {
    this.cancelEdit();
    this.callRefrehContext();
  }

  isQuery(): boolean {
    return this.includesEditProjectParam(EditProjectParam.HUMAN_READABLE);
  }

  isDescription(): boolean {
    return this.includesEditProjectParam(EditProjectParam.DESCRIPTION);
  }

  isBridgeheads(): boolean {
    return this.includesEditProjectParam(EditProjectParam.BRIDGEHEADS);
  }
  isConfiguration(): boolean {
    return this.includesEditProjectParam(EditProjectParam.PROJECT_CONFIGURATION);
  }
  isConfigType(): boolean {
    return this.includesEditProjectParam(EditProjectParam.PROJECT_TYPE) && this.fieldKey === 'Type';
  }
  isEnvironmentVariables(): boolean {
    return this.includesEditProjectParam(EditProjectParam.QUERY_CONTEXT);
  }

  isSelection(): boolean {
    return this.possibleValues && this.possibleValues.length > 0;
  }

  isApplicationForm(): boolean {
    return this.uploadAction === Action.UPLOAD_APPLICATION_FORM_ACTION;
  }

  getEditFieldCssClass() {
    if (this.isQuery()) {
      return 'query-edit-field';
    }
    if (this.isDescription()) {
      return 'description-edit-field';
    }
    if (this.isBridgeheads()) {
      return 'bridgeheads-edit-field';
    }
    if (this.isEnvironmentVariables()) {
      return 'environment-variables-edit-field';
    }
    if (this.isSelection()) {
      return 'selection-edit-fields';
    }
    if (this.uploadAction) {
      return 'upload-edit-field'
    }
    return 'other-edit-fields';
  }

  getButtonContainerCssClass() {
    if (this.isQuery()) {
      return 'query-button-container';
    }
    if (this.isSelection()) {
      return 'selection-button-container';
    }
    if (this.isDescription()) {
      return 'description-button-container';
    }
    if (this.isBridgeheads()) {
      return 'bridgeheads-button-container';
    }
    if (this.isEnvironmentVariables()) {
      return 'environment-variables-button-container';
    }
    if (this.isApplicationForm()) {
      return 'application-form-button-container';
    }
    if (this.uploadAction) {
      return 'upload-button-container';
    }
    return 'other-button-container';
  }

  async copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Query copied to clipboard!");
    } catch ($e) {
      console.log($e)
      alert("Query copied to clipboard!");
    }
  }

}
</script>

<template>
  <div v-if="isConfiguration() && !isConfigType() && draftDialogCurrentStep === 1" style="position:absolute;margin:20px 0">
    <div style="display: flex;padding-left:0;max-width:200px">
      <div v-for="(step, index) in possibleValues" :key="index" class="config-box"
           :class="{ 'active': editedValue[0] === step }">
        <button class="config-button"
                @click="editedValue[0]=step;saveField()"
                style="background: none; border:none; color: black; padding:0; height:100%;min-width: fit-content">
          <div style="height:100%; display: flex; flex-direction: column;">
            <div class="config-box-header">{{ step }}</div>
            <div class="config-box-body">
              <table style="text-align: left; font-size: smaller;border-spacing: 3px">
                <tr><td style="font-weight: bold">Type: </td><td>{{step === 'CUSTOM' ? 'Custom' : ''}}</td></tr>
                <tr><td style="font-weight: bold">Output Format: </td><td>{{step === 'CUSTOM' ? 'Custom' : ''}}</td></tr>
                <tr><td style="font-weight: bold">Template ID: </td><td>{{step === 'CUSTOM' ? 'Custom' : ''}}</td></tr>
              </table>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
  <div v-if="isConfiguration() && !isConfigType() && draftDialogCurrentStep === 1" style="height:210px"></div>
  <tr v-else>
    <!-- FIRST COLUMN: HEADERS -->
    <td class="bold-text thinner-column" style="background-color: #f2f2f2; max-width: 170px;">
      <div style="display: flex;">
        <span>{{ fieldKey }}</span>
        <span v-if="todos?.get(this.uploadAction)" class="todo-circle-small">#{{todos?.get(this.uploadAction)?.number}}</span>
        <span v-if="todos?.get(this.downloadAction) && this.existsFile" class="todo-circle-small">#{{todos?.get(this.downloadAction)?.number}}</span>
      </div>
    </td>

    <!-- SECOND COLUMN: CONTENT -->
    <td style="width:80%">
      <div class="user-input-container">
        <!-- If editing -->
        <div v-if="editing" style="width:100%">
          <div :class="getEditFieldCssClass()">
            <div v-if="uploadAction" style="width:75%"> <!-- If uploading a file -->
              <div v-if="uploadAction === Action.UPLOAD_APPLICATION_FORM_ACTION">
                <DownloadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                                :module="Module.PROJECT_DOCUMENTS_MODULE"
                                :action="Action.DOWNLOAD_APPLICATION_FORM_TEMPLATE_ACTION"
                                text="Download application form template"/>
                <br/>
              </div>
              <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                            :module="Module.PROJECT_DOCUMENTS_MODULE" :action="uploadAction"
                            :text="'Upload '+ fieldKey" :call-refreh-context="exitAndCallRefreshContext"
                            :is-file="true"/>
            </div>
            <div v-else style="width:75%"> <!-- If not uploading a file -->
              <div>
                <div v-if="isQuery()" style="width: 70%;">
                  <span><strong>Human readable</strong></span>
                  <input type="text" v-model="editedValue[0]" class="form-control" style="width: 100%;"><br/>
                  <span><strong>Query</strong></span>
                  <input type="text" v-model="editedValue[1]" class="form-control" style="width: 100%;">
                </div>
                <div v-else-if="isDescription()" style="width:70%">
                  <textarea type="text" v-model="editedValue[0]" class="form-control"></textarea>
                </div>
                <div v-else-if="isBridgeheads()" style="width: 75%">
                  <span v-if="tempFieldValue && tempFieldValue[0]">
                    <span v-for="(bridgehead, index) in tempFieldValue[0]" :key="index" class="btn btn-primary"
                          style="margin-right: 2%; margin-bottom: 0.5%">
                         <span>{{ bridgehead }}</span>
                      <button @click="removeBridgehead(index)" class="btn btn-sm" style="padding: 0px"><i
                          style="color: white; font-size: 18px" class="bi bi-x"></i></button>
                    </span>
                  </span>
                  <span v-if="areThereMoreBridgeheadsAvailableToAdd()">
                    <button @click="showInputFields" class="btn btn-secondary"><i class="bi bi-plus"></i></button>
                    <div v-if="showInputs" style="display: flex; flex-flow: row; gap: 2%; padding-top: 2%">
                      <select class="form-select" v-model="newValue" placeholder="Bridgehead">
                        <option
                            v-for="(value, index) in fetchOtherAvailableBridgeheadsToAdd()"
                            :key="index" :value="value">{{ value }}
                        </option>
                      </select>
                      <button class="btn btn-primary" @click="addFieldValue"><i style="font-size: 18px"
                                                                                class="bi bi-check"></i>
                      </button>
                    </div>
                  </span>
                </div>
                <div v-else-if="isEnvironmentVariables()" style="width:75%;">
                  <span v-if="editedValue && editedValue.length > 0 && editedValue[0] " style="width: 75%">
                    <span v-for="(pair, index) in editedValue[0].split(';')" :key="index"
                          style="margin-right: 2%;  display: inline;" class="btn btn-primary">
                      <span style="display: inline; margin-bottom: 2%">{{ pair }}</span>
                      <button @click="removeEnvVariable(index)" class="btn btn-sm" style="padding: 0px"><i
                          style="color: white; font-size: 18px" class="bi bi-x"></i></button>
                    </span>
                  </span>
                  <button @click="showInputFields" class="btn btn-secondary"><i class="bi bi-plus"></i></button>
                  <div v-if="showInputs" style="display: flex; flex-flow: row; gap: 2%; padding-top: 2%; width:80%">
                    <input type="text" class="form-control" v-model="newKey" placeholder="Key">
                    <input type="text" class="form-control" v-model="newValue" placeholder="Value">
                    <button class="btn btn-primary" @click="addEnvVariable"><i style="font-size: 18px"
                                                                               class="bi bi-check"></i>
                    </button>
                  </div>
                </div>
                <div v-else-if="isSelection()" style="width: 70%;">
                  <select v-model="editedValue[0]" class="form-select" style="width: 100%;">
                    <option v-for="value in possibleValues" :key="value" :value="value">{{ value }}</option>
                  </select>
                </div>
                <div v-else style="width: 70%;">
                  <!-- Normal case -->
                  <input type="text" v-model="editedValue[0]" class="form-control" style="width: 100%;">
                </div>
              </div>
            </div>
            <div class="button-container" :class="getButtonContainerCssClass()">
              <button @click="cancelEdit" class="btn btn-outline-secondary"
                      style="padding:4px 15px 4px 15px;margin-left: auto">Cancel
              </button>
              <button v-if="!uploadAction" @click="saveField" class="btn btn-outline-primary"
                      style="padding:4px 20px 4px 20px;">Save
              </button>
            </div>
          </div>
        </div>
        <!-- If not editing -->
        <div v-else style="display:flex; width:100%">
          <div v-if="isBridgeheads()" style="width:100%">
            <div v-if="tempFieldValue" class="field-value">
               <span v-for="(bridgehead, index) in tempFieldValue[0]" :key="index" class="btn btn-primary"
                     style="margin-right: 2%; margin-bottom: 0.5%">
                   <span>{{ bridgehead }}</span>
               </span>
            </div>
          </div>
          <div
              v-else-if="tempFieldValue && tempFieldValue.length > 0 && tempFieldValue[0] && isEnvironmentVariables()"
              style="display:flex; width:100%">
            <div v-for="(pair, index) in tempFieldValue[0].split(';').filter(Boolean)" :key="index"
                 style="margin-right: 2%;  display: inline;" class="btn btn-primary">
              <span style="display: inline; margin-bottom: 1%">{{ pair }}</span>
            </div>
          </div>
          <div v-else-if="tempFieldValue && tempFieldValue.length > 0" style="width:70%">
            <template v-if="isQuery()">
              <div class="field-value clickable" :class="{ truncate: toggleHumanReadable }"
                   @click="toggleHumanReadable = !toggleHumanReadable" v-b-tooltip.hover :title="tempFieldValue[0]">{{ tempFieldValue[0] }}</div>
            </template>
            <template v-else>
              <div class="field-value truncate">{{ tempFieldValue[0] }}</div>
            </template>
          </div>
        </div>
      </div>
    </td>

    <!-- THIRD COLUMN: ACTIONS -->
    <td style="min-width: 50px">
      <span style="display:flex; flex-flow:row; align-items: baseline">
          <div style="display:inline-flex; flex-flow:row; align-items: baseline">
            <button v-if="isFieldValueEditable() && (redirectUrl === null || isBridgeheads())" class="btn btn-primary"
                    data-toggle="tooltip"
                    data-placement="top" title="Edit"
                    style="background:none; border:none; color:black"><i class="bi bi-pencil me-2" @click="editField"></i>
            </button>
            <DownloadButton v-if="existsFile && downloadAction" :context="context"
                            :project-manager-backend-service="projectManagerBackendService"
                            :module="downloadModule" :action="downloadAction"/>
        </div>
        <button v-if="isFieldValueEditable() && redirectUrl !== null" class="btn btn-primary"
                data-toggle="tooltip"
                data-placement="top" title="CCP Explorer"
                style="background:none; border:none; color:black"><i class="bi bi-arrow-right-circle" @click="redirectToURL"></i>
        </button>
        <button v-if="isQuery() && fieldValue[0]" class="btn btn-primary"
                data-toggle="tooltip"
                data-placement="top" title="Copy Query to Clipboard"
                style="background:none; border:none; color:black"><i class="bi bi-copy" @click="copyToClipboard(editedValue[1])"></i>
        </button>
      </span>
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
  max-width: calc(60 * 1ch); /* 1ch is the width of one character */
}

.query-edit-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.description-edit-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.bridgeheads-edit-field {
  display: flex;
  flex-flow: row;
  width: 100%;
}

.environment-variables-edit-field {
  display: flex;
  width: 100%;
}

.selection-edit-fields {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.upload-edit-field {
  display: flex;
  flex-flow: row;
  width: 100%;
}

.other-edit-fields {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.other-button-container,
.query-button-container,
.selection-button-container,
.description-button-container {
  width: 25%;
  display: flex;
  gap: 5%;
}

.bridgeheads-button-container,
.environment-variables-button-container,
.application-form-button-container {
  width: 25%;
  display: flex;
  height: 20%;
  gap: 3%;
}

.upload-button-container {
  width: 25%;
  gap: 3%;
}
.todo-circle-small {
  min-width: 22px;
  height: 22px;
  background-color:gold;
  color: #000;
  border: 1px solid black;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 10px;
  font-weight: bold;
  font-size: 9pt;
}
.clickable {
  cursor: pointer;
}
.config-box {
  width: fit-content;
  text-align: center;
  margin: 10px;
  border: 1px solid #0000001E;
  border-radius: 10px;
  min-width: 150px;
  font-size: 14px;
}
.config-box.active {
  box-shadow: 0px 2px 1px -1px rgba(149, 200, 220, 0.8),0px 1px 1px 0px rgba(149, 200, 220, 0.5),0px 1px 3px 0px rgba(149, 200, 220, 0.3);
}
.config-box-header {
  background-color: #95c8dc;
  padding: 10px 15px;
  border-radius: 10px 10px 0 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height:62px;
}
.config-box.active .config-box-header {
  color: white;
  background-color: #007bff;
  font-weight: bold;
}
.config-box-body {
  padding: 15px;
  height:100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: white;
  border-radius: 0 0 10px 10px;
}
.config-button {
  color: black;
  width: 100%;
}
</style>
