<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {Prop, Watch} from "vue-property-decorator";
import {
  Action,
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
  @Prop() readonly fieldValue!: string[];
  @Prop() readonly editProjectParam!: string;
  @Prop() readonly projectManagerBackendService!: ProjetManagerBackendService;
  @Prop() readonly context!: ProjectManagerContext;
  @Prop({default: null}) readonly redirectUrl!: string | null;
  @Prop() readonly possibleValues!: string[];
  @Prop() readonly isEditable!: boolean;
  @Prop({type: Function, required: true}) readonly callRefrehContext!: () => void;
  @Prop() readonly uploadAction!: Action;
  @Prop() readonly downloadAction!: Action;
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

    if (this.fieldKey === "Type" && this.tempFieldValue[0] === "DATASHIELD") {
      params.set("output-format", "OPAL");
      params.set("template-id", "opal-ccp");
    }
    params.set(this.editProjectParam, this.editedValue[0]);
    if (this.fieldKey === "Configuration") {
      this.projectManagerBackendService
          .fetchData(Module.PROJECT_EDITION_MODULE, Action.SET_PROJECT_CONFIGURATION_ACTION, this.context, params)
          .then((result) => this.callRefrehContext());
    } else {
      this.projectManagerBackendService
          .fetchData(Module.PROJECT_EDITION_MODULE, Action.EDIT_PROJECT_ACTION, this.context, params)
          .then((result) => this.callRefrehContext());
    }
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
        this.tempFieldValue[0] = targetArray.join(',');
      }
      this.newValue = '';
    }
  }


  removeBridgehead(index: any) {
    if (Array.isArray(this.tempFieldValue) && this.tempFieldValue.length > 0 && Array.isArray(this.tempFieldValue[0])) {
      const targetArray = this.tempFieldValue[0]; // Direkt auf das Ziel-Array zugreifen
      if (index >= 0 && index < targetArray.length) {
        targetArray.splice(index, 1);
        this.tempFieldValue[0] = targetArray.join(',');
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
    const pairs = this.tempFieldValue[0].split(',');
    pairs.splice(index, 1);
    this.tempFieldValue[0] = pairs.join(',');
  }

}
</script>

<template>
  <tr>
    <td class="bold-text thinner-column" style="background-color: #f2f2f2;">{{ fieldKey }}</td>

    <td style="width:80%">
      <div class="user-input-container">
        <!-- FOR CELL THAT ARE JUST TEXT-FIELDS EDITABLE-->
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"
             v-if="editing && !possibleValues && fieldKey !== 'Application form' && fieldKey !== 'Votum' && fieldKey !== 'Description' && fieldKey !== 'Script'  && fieldKey !== 'Environment Variables' && fieldKey !== 'Samples' && fieldKey !== 'Query' && fieldKey !== 'Bridgeheads' && fieldKey !== 'Authentication Script'">
          <div style="width: 70%;">
            <input type="text" v-model="editedValue[0]" class="form-control" style="width: 100%;">
          </div>
          <div class="button-container" style="width: 25%; display:flex; gap:3%">
            <button @click="cancelEdit" class="btn btn-outline-secondary" style="padding: 4px 15px;">Cancel</button>
            <button @click="saveField" class="btn btn-outline-primary" style="padding: 4px 20px;">Save</button>
          </div>
        </div>

        <!-- CELL FOR QUERY EDITABLE -->
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"
             v-if="editing && !possibleValues && fieldKey === 'Query'">
          <div style="width: 70%;">
            <span><strong>Human readable</strong></span>
            <input type="text" v-model="editedValue[0]" class="form-control" style="width: 100%;"><br/>
            <span><strong>Query</strong></span>
            <input type="text" v-model="editedValue[1]" class="form-control" style="width: 100%;">

          </div>
          <div class="button-container" style="width: 25%; display:flex; gap:3%">
            <button @click="cancelEdit" class="btn btn-outline-secondary" style="padding: 4px 15px;">Cancel</button>
            <button @click="saveField" class="btn btn-outline-primary" style="padding: 4px 20px;">Save</button>
          </div>
        </div>

        <!-- CELL FOR DROPDOWNS EDITABLE-->
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"
             v-else-if="editing && possibleValues && fieldKey !== 'Application form' && fieldKey !== 'Votum' && fieldKey !== 'Description' && fieldKey !== 'Script' && fieldKey !== 'Bridgeheads' && fieldKey !== 'Environment Variables' && fieldKey !== 'Bridgeheads' && fieldKey !== 'Samples' && fieldKey !== 'Query' && fieldKey !== 'Authentication Script'">
          <div style="width: 70%;">
            <select v-model="editedValue[0]" class="form-select" style="width: 100%;">
              <option v-for="value in possibleValues" :key="value" :value="value">{{ value }}</option>
            </select>
          </div>
          <div class="button-container" style="width: 25%; display: flex; gap: 3%;">
            <button @click="cancelEdit" class="btn btn-outline-secondary" style="padding: 4px 15px;">Cancel</button>
            <button @click="saveField" class="btn btn-outline-primary" style="padding: 4px 20px;">Save</button>
          </div>
        </div>


        <!-- CELL FOR DESCRIPTION WITH TEXTAREA EDITABLE-->
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"
             v-if="editing && fieldKey === 'Description'">
          <div style="width:70%">
            <textarea type="text" v-model="editedValue[0]" class="form-control"></textarea></div>
          <div class="button-container" style="width: 25%; display: flex; gap: 3%;">
            <button @click="cancelEdit" class="btn btn-outline-secondary" style="padding:4px 15px 4px 15px;">Cancel
            </button>
            <button @click="saveField" class="btn btn-outline-primary" style="padding:4px 20px 4px 20px;">Save</button>
          </div>
        </div>

        <!-- CELL FOR BRIDGEHEADS EDITABLE -->
        <div v-if="editing && fieldKey === 'Bridgeheads'" style="display:flex; flex-flow:row; width:100%">
          <div class="field-value" style="width: 75%">
            <div v-if="tempFieldValue && tempFieldValue[0]">
              <span v-for="(bridgehead, index) in tempFieldValue[0]" :key="index" class="btn btn-primary"
                    style="margin-right: 2%; margin-bottom: 0.5%">
                   <span>{{ bridgehead }}</span>
                <button @click="removeBridgehead(index)" class="btn btn-sm" style="padding: 0px"><i
                    style="color: white; font-size: 18px" class="bi bi-x"></i></button>
              </span>
            </div>
            <button @click="showInputFields" class="btn btn-secondary"><i class="bi bi-plus"></i></button>
            <div v-if="showInputs" style="display: flex; flex-flow: row; gap: 2%; padding-top: 2%">
              <input type="text" class="form-control" v-model="newValue" placeholder="Bridgehead">
              <button class="btn btn-primary" @click="addBridgehead"><i style="font-size: 18px" class="bi bi-check"></i>
              </button>
            </div>
          </div>
          <div class="button-container" style="width: 25%; display: flex; height: 20%; gap: 3%;">
            <button @click="cancelEdit" class="btn btn-outline-secondary" style="padding: 4px 15px 4px 15px;">Cancel
            </button>
            <button @click="saveField" class="btn btn-outline-primary" style="padding: 4px 20px 4px 20px;">Save</button>
          </div>
        </div>


        <!-- CELL FOR ENVIRONMENT VARIABLE EDITABLE -->
        <div v-if="editing && fieldKey === 'Environment Variables'" style="display:flex; width:100%">
          <div style="display:flex; width:75%; flex-flow:column">
            <div v-if="tempFieldValue && tempFieldValue[0] " style="width: 75%">
              <div v-for="(pair, index) in tempFieldValue[0].split(',')" :key="index"
                   style="margin-right: 2%;  display: inline;" class="btn btn-primary">
                <span style="display: inline; margin-bottom: 2%">{{ pair }}</span>
                <button @click="removeVariable(index)" class="btn btn-sm" style="padding: 0px"><i
                    style="color: white; font-size: 18px" class="bi bi-x"></i></button>
              </div>
            </div>
            <button style="display: inline; margin-top: 1%; margin-bottom: 0.5%; width:5%;" @click="showInputFields"
                    class="btn btn-secondary"><i class="bi bi-plus"></i></button>

            <div v-if="showInputs" style="display: flex; flex-flow: row; gap: 2%; padding-top: 2%; width:80%">
              <input type="text" class="form-control" v-model="newKey" placeholder="Key">
              <input type="text" class="form-control" v-model="newValue" placeholder="Value">
              <button class="btn btn-primary" @click="addVariable"><i style="font-size: 18px" class="bi bi-check"></i>
              </button>
            </div>
          </div>
          <div class="button-container" style="width: 25%; display: flex; height: 20%; gap: 3%;">
            <button @click="cancelEdit" class="btn btn-outline-secondary" style="padding: 4px 15px 4px 15px;">Cancel
            </button>
            <button @click="saveField" class="btn btn-outline-primary" style="padding: 4px 20px 4px 20px;">Save
            </button>
          </div>
        </div>


        <!-- CELL FOR APPLICATION FORM EDITABLE-->
        <div style="display:flex; flex-flow:row; width:100%;" v-if="editing && fieldKey === 'Application form'">
          <div style="width:75%">
            <DownloadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                            :module="Module.PROJECT_DOCUMENTS_MODULE"
                            :action="Action.DOWNLOAD_APPLICATION_FORM_TEMPLATE_ACTION"
                            text="Download application form template"/>
            <br/>
            <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="uploadAction"
                          text="Upload application form" :call-refreh-context="callRefrehContext" :is-file="true"/>
          </div>
          <div class="button-container" style="width: 25%; display: flex; height: 20%; gap: 3%;">
            <button @click="cancelEdit" class="btn btn-outline-secondary" style="padding:4px 15px 4px 15px;">Cancel
            </button>
            <button @click="saveField" class="btn btn-outline-primary" style="padding:4px 20px 4px 20px;">Save</button>
          </div>
        </div>

        <!-- CELL FOR AUTHENTICATION SCRIPT EDITABLE-->
        <div style="display:flex; flex-flow:row; width:100%;" v-if="editing && fieldKey === 'Authentication Script'">
          <div style="width:75%">
            <DownloadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                            :module="Module.TOKEN_MANAGER_MODULE"
                            :action="downloadAction" icon-class="bi bi-download"/>
          </div>
          <div class="button-container" style="width:25%; gap:3%">
            <button @click="cancelEdit" class="btn btn-outline-secondary" style="padding:4px 15px 4px 15px;">Cancel
            </button>
            <button @click="saveField" class="btn btn-outline-primary" style="padding:4px 20px 4px 20px;">Save</button>
          </div>
        </div>

        <!--CELL FOR VOTUMN EDITABLE-->
        <div style="display:flex; flex-flow:row; width:100%" v-if="editing && fieldKey === 'Votum'">
          <div style="width:75%">
            <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="uploadAction"
                          text="Upload Votum" :call-refreh-context="callRefrehContext" :is-file="true"/>
          </div>
          <div class="button-container" style="width:25%; gap:3%">
            <button @click="cancelEdit" class="btn btn-outline-secondary" style="padding:4px 15px 4px 15px;">Cancel
            </button>
            <button @click="saveField" class="btn btn-outline-primary" style="padding:4px 20px 4px 20px;">Save</button>
          </div>
        </div>

        <!--CELL FOR Script EDITABLE-->
        <div style="display:flex; flex-flow:row; width:100%" v-if="editing && fieldKey === 'Script'">
          <div style="width:75%">
            <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="uploadAction"
                          text="Upload script" :call-refreh-context="callRefrehContext" :is-file="true"/>

          </div>
          <div class="button-container" style="width:25%; gap:3%">
            <button @click="cancelEdit" class="btn btn-outline-secondary" style="padding:4px 15px 4px 15px;">Cancel
            </button>
            <button @click="saveField" class="btn btn-outline-primary" style="padding:4px 20px 4px 20px;">Save</button>
          </div>
        </div>

        <!-- CELL FOR ALL VALUES READONLY -->
        <div style="width:70%"
             v-if="!editing && fieldKey !== 'Bridgeheads' && fieldKey !== 'Application form'  && fieldKey !== 'Environment Variables' && fieldKey !== 'Samples' && fieldKey !== 'Votum' && fieldKey !== 'Script' && fieldKey !== 'Authentication Script' ">
          <div class="field-value truncate">{{ tempFieldValue[0] }}</div>
        </div>

        <!-- READONLY CELL FOR BRIDGEHEADS -->
        <div v-else-if="!editing && fieldKey === 'Bridgeheads'" style="display:flex; width:100%">
          <div style="width: 100%">
            <div v-if="tempFieldValue" class="field-value">
               <span v-for="(bridgehead, index) in tempFieldValue[0]" :key="index" class="btn btn-primary"
                     style="margin-right: 2%; margin-bottom: 0.5%">
                   <span>{{ bridgehead }}</span>
               </span>
            </div>
          </div>
        </div>

        <!-- READONLY CELL FOR ENVIRONMENT VARIABLES -->
        <div v-if="!editing && fieldKey === 'Environment Variables'" style="display:flex; width:100%">
          <div v-if=" tempFieldValue && tempFieldValue[0]  " style="width: 70%">
            <div v-for="(pair, index) in tempFieldValue[0].split(',').filter(Boolean)" :key="index"
                 style="margin-right: 2%;  display: inline;" class="btn btn-primary">
              <span style="display: inline; margin-bottom: 1%">{{ pair }}</span>
            </div>
          </div>
        </div>
      </div>
    </td>

    <!-- THIRD COLUMN ACTION TOOLS -->
    <td>
      <div style="display:inline-flex; flex-flow:row; align-items: baseline">
        <button v-if="isFieldValueEditable() && redirectUrl === null" class="btn btn-primary" data-toggle="tooltip" data-placement="top" title="Edit"
                style="background:none; border:none; color:black"><i class="bi bi-pencil me-2" @click="editField"></i></button>
        <DownloadButton v-if="existsFile && downloadAction" :context="context"
                        :project-manager-backend-service="projectManagerBackendService"
                        :module="Module.PROJECT_DOCUMENTS_MODULE" :action="downloadAction"/>
      </div>
      <div v-if="isFieldValueEditable() && redirectUrl !== null">
        <i class="bi bi-arrow-right-circle" @click="redirectToURL"></i>
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
