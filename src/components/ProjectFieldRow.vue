<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {Prop, Watch} from "vue-property-decorator";
import {
  Action,
  EditProjectParam,
  Module,
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
  // The index of editProjectParam, fieldValue, editedValue and tempFieldValue is the same
  @Prop() readonly editProjectParam!: EditProjectParam[];
  @Prop() readonly fieldValue!: string[];
  @Prop() readonly projectManagerBackendService!: ProjetManagerBackendService;
  @Prop() readonly context!: ProjectManagerContext;
  @Prop({default: null}) readonly redirectUrl!: string | null;
  @Prop() readonly possibleValues!: string[];
  @Prop() readonly isEditable!: boolean;
  @Prop({type: Function, required: true}) readonly callRefrehContext!: () => void;
  @Prop() readonly uploadAction!: Action;
  @Prop() readonly downloadAction!: Action;
  @Prop() readonly downloadModule!: Module;
  @Prop() readonly existsFile!: boolean;
  @Prop() readonly bridgeheads!: string[];
  @Prop() readonly fetchListAction!: Action;
  @Prop() readonly label!: string;

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

  @Watch("projectManagerBackendService", {immediate: true, deep: true})
  onProjetManagerBackendServiceChange(
      newValue: ProjetManagerBackendService,
      oldValue: ProjetManagerBackendService
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

  createContext(bridgehead: string | undefined) {
    return new ProjectManagerContext(this.context.projectCode, this.context.bridgehead);
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
      if (this.includesEditProjectParam(EditProjectParam.PROJECT_TYPE) && this.tempFieldValue[0] === "DATASHIELD") {
        params.set("output-format", "OPAL");
        params.set("template-id", "opal-ccp");
      }
      for (let i = 0; i < this.editProjectParam.length; i++) {
        if (i < this.editedValue.length) {
          params.set(this.editProjectParam[i], this.editedValue[i]);
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

  addBridgehead() {
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


  addVariable() {
    if (this.newKey && this.newValue) {
      this.tempFieldValue[0] += ',' + this.newKey + '=' + this.newValue;
      this.newKey = '';
      this.newValue = '';
    }
  }

  removeVariable(index: any) {
    if (this.tempFieldValue.length > 0) {
      const pairs = this.tempFieldValue[0].split(',');
      pairs.splice(index, 1);
      this.tempFieldValue[0] = pairs.join(',');
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

}
</script>

<template>
  <tr>
    <!-- FIRST COLUMN: HEADERS -->
    <td class="bold-text thinner-column" style="background-color: #f2f2f2;">{{ fieldKey }}</td>

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
                      <select class="form-control" v-model="newValue" placeholder="Bridgehead">
                        <option
                            v-for="(value, index) in fetchOtherAvailableBridgeheadsToAdd()"
                            :key="index" :value="value">{{ value }}
                        </option>
                      </select>
                      <button class="btn btn-primary" @click="addBridgehead"><i style="font-size: 18px"
                                                                                class="bi bi-check"></i>
                      </button>
                    </div>
                  </span>
                </div>
                <div v-else-if="isEnvironmentVariables()" style="display:flex; width:75%; flex-flow:column">
                  <div v-if="tempFieldValue && tempFieldValue.length > 0 && tempFieldValue[0] " style="width: 75%">
                    <div v-for="(pair, index) in tempFieldValue[0].split(',')" :key="index"
                         style="margin-right: 2%;  display: inline;" class="btn btn-primary">
                      <span style="display: inline; margin-bottom: 2%">{{ pair }}</span>
                      <button @click="removeVariable(index)" class="btn btn-sm" style="padding: 0px"><i
                          style="color: white; font-size: 18px" class="bi bi-x"></i></button>
                    </div>
                  </div>
                  <button style="display: inline; margin-top: 1%; margin-bottom: 0.5%; width:5%;"
                          @click="showInputFields"
                          class="btn btn-secondary"><i class="bi bi-plus"></i></button>
                  <div v-if="showInputs" style="display: flex; flex-flow: row; gap: 2%; padding-top: 2%; width:80%">
                    <input type="text" class="form-control" v-model="newKey" placeholder="Key">
                    <input type="text" class="form-control" v-model="newValue" placeholder="Value">
                    <button class="btn btn-primary" @click="addVariable"><i style="font-size: 18px"
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
              <button @click="cancelEdit" class="btn btn-outline-secondary" style="padding:4px 15px 4px 15px;margin-left: auto">Cancel
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
            <div v-for="(pair, index) in tempFieldValue[0].split(',').filter(Boolean)" :key="index"
                 style="margin-right: 2%;  display: inline;" class="btn btn-primary">
              <span style="display: inline; margin-bottom: 1%">{{ pair }}</span>
            </div>
          </div>
          <div v-else-if="tempFieldValue && tempFieldValue.length > 0" style="width:70%">
            <div class="field-value truncate">{{ tempFieldValue[0] }}</div>
          </div>
        </div>
      </div>
    </td>

    <!-- THIRD COLUMN: ACTIONS -->
    <td>
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
  max-width: calc(50 * 1ch); /* 1ch is the width of one character */
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

</style>
