<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import {
  Action,
  Bridgehead,
  Module,
  ProjectDocument,
  ProjectManagerContext,
  ProjetManagerBackendService
} from "@/services/projetManagerBackendService";
import DownloadButton from "@/components/DownloadButton.vue";
import UploadButton from "@/components/UploadButton.vue";

@Options({
  name: "ProjectFieldRow",
  components: { DownloadButton, UploadButton }
})
export default class ProjectFieldRow extends Vue {
  @Prop() readonly fieldKey!: string;
  @Prop() readonly fieldValue!: string[];
  @Prop() readonly editProjectParam!: string;
  @Prop() readonly projectManagerBackendService!: ProjetManagerBackendService;
  @Prop() readonly context!: ProjectManagerContext;
  @Prop({ default: null }) readonly redirectUrl!: string | null;
  @Prop() readonly possibleValues!: string[];
  @Prop() readonly isEditable!: boolean;
  @Prop({ type: Function, required: true }) readonly callRefrehContext!: () => void;
  @Prop() readonly module!: Module;
  @Prop() readonly action!: Action;
  @Prop() existsApplicationForm!: boolean;
  @Prop() readonly existsVotum!: boolean;
  @Prop() readonly existsAuthenticationScript!: boolean;
  @Prop() readonly existsScript!: boolean;
  @Prop() readonly bridgeheads!: string[];
  @Prop() readonly fetchListAction!: Action;
  @Prop() readonly downloadAction!: Action;
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

  @Watch("projectManagerBackendService", { immediate: true, deep: true })
  onProjetManagerBackendServiceChange(
      newValue: ProjetManagerBackendService,
      oldValue: ProjetManagerBackendService
  ) {
    this.resetIsActionEnabled();
  }

  @Watch("fieldValue", { immediate: true, deep: true })
  onFieldValueChange(newValue: string[], oldValue: string[]) {
    this.tempFieldValue = newValue;
  }

  @Watch("redirectUrl", { immediate: true, deep: true })
  onRedirectUrlChange(newValue: string | null, oldValue: string | null) {
    console.log("redirectURL:" + newValue);
  }

  createContext(bridgehead: string | undefined) {
    return new ProjectManagerContext(this.context.projectCode, this.context.bridgehead);
  }

  created() {
    this.tempFieldValue = this.fieldValue.slice(); // Copy fieldValue to tempFieldValue
    this.editedValue = this.fieldValue.slice(); // Copy fieldValue to editedValue
    this.projectManagerBackendService
        .isModuleActionActive(Module.PROJECT_EDITION_MODULE, Action.EDIT_PROJECT_ACTION)
        .then((isActive) => (this.isActionEnabled = isActive));
    this.resetIsActionEnabled();
  }

  resetIsActionEnabled() {
    this.projectManagerBackendService
        .isModuleActionActive(Module.PROJECT_EDITION_MODULE, Action.EDIT_PROJECT_ACTION)
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

  splitPairs(pairString: string): { key: string; value: string }[] {
    // Trennen Sie den String an den Kommas
    const pairs: string[] = pairString.split(',');
    // Erstellen Sie ein Array, um die Schlüssel-Wert-Paare zu speichern
    const keyValuePairs: { key: string; value: string }[] = [];
    pairs.forEach(pair => {
      // Überprüfen, ob das Paar das erwartete Format hat
      if (pair.includes(':')) {
        // Trennen Sie jedes Paar an den Doppelpunkten
        const [key, value]: string[] = pair.split(':');
        // Fügen Sie das Schlüssel-Wert-Paar nur hinzu, wenn beide Teile vorhanden sind
        if (key && value) {
          // Rückgabe des Schlüssel-Wert-Paares als Objekt
          keyValuePairs.push({ key: key.trim(), value: value.trim() });
        }
      }
    });
    return keyValuePairs;
  }

  showInputFields() {
    this.showInputs = true;
  }

  addBridgehead() {
    if (this.newValue) {
      if (this.tempFieldValue) {
        if (this.tempFieldValue[0].length > 0) {
          this.tempFieldValue[0] += ',' + this.newValue; // Füge das neue Bridgehead dem String hinzu
        } else {
          this.tempFieldValue[0] = this.newValue; // Setze den String auf das neue Bridgehead
        }
      } else {
        this.tempFieldValue = [this.newValue]; // Erstelle ein neues Array mit dem neuen Bridgehead
      }
      this.newValue = '';
      this.showInputs = false;
    }
  }

  removeBridgehead(index: any) {
    if (this.tempFieldValue && this.tempFieldValue[0].length > 0) {
      const bridgeheads = this.tempFieldValue[0].split(','); // Teile den String an den Kommas
      bridgeheads.splice(index, 1); // Entferne das Bridgehead an der angegebenen Indexposition
      this.tempFieldValue[0] = bridgeheads.join(','); // Setze den String wieder zusammen
    }
  }

  // Method to add an environment variable
  addVariable() {
    // Überprüfen, ob sowohl ein neuer Schlüssel als auch ein Wert vorhanden sind
    if (this.newKey && this.newValue) {
      // Hinzufügen des neuen Schlüssel-Wert-Paares zum Array tempFieldValue
      this.tempFieldValue[0] += ',' + this.newKey + '=' + this.newValue;
      // Zurücksetzen der Eingabefelder für den nächsten Eintrag
      this.newKey = '';
      this.newValue = '';
    }
  }
  removeVariable(index:any) {
    // Trennen des Strings in Paare
    const pairs = this.tempFieldValue[0].split(',');
    // Entfernen des gewählten Paares basierend auf dem Index
    pairs.splice(index, 1);
    // Aktualisieren des tempFieldValue mit den verbleibenden Paaren
    this.tempFieldValue[0] = pairs.join(',');
  }



}
</script>

<template>
  <tr>
    <td class="bold-text thinner-column" style="background-color: #f2f2f2;">{{ fieldKey }}</td>

    <td style="width:70%">
      <div class="user-input-container">
        <!-- FOR CELL THAT ARE JUST TEXT-FIELDS EDITABLE-->
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;" v-if="editing && !possibleValues && fieldKey !== 'Application form' && fieldKey !== 'Votum' && fieldKey !== 'Description' && fieldKey !== 'Script'  && fieldKey !== 'Environment Variables' && fieldKey !== 'Samples' && fieldKey !== 'Query (Human readable)' && fieldKey !== 'Bridgeheads'">
          <div style="width: 70%;">
            <input id="labelInput" type="text" v-model="editedValue[0]" class="form-control" style="width: 100%;">
          </div>
          <div class="button-container" style="width: 25%; display:flex; gap:3%">
            <button @click="cancelEdit" class="btn btn-outline-secondary" style="padding: 4px 15px;">Cancel</button>
            <button @click="saveField" class="btn btn-outline-primary" style="padding: 4px 20px;">Save</button>
          </div>
        </div>

        <!-- CELL FOR QUERY EDITABLE -->
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;" v-if="editing && !possibleValues && fieldKey === 'Query (Human readable)'">
          <div style="width: 70%;">
            <input id="labelInput" type="text" v-model="editedValue[0]" class="form-control" style="width: 100%;"><br/>
            <input id="labelInput" type="text" v-model="editedValue[1]" class="form-control" style="width: 100%;">

          </div>
          <div class="button-container" style="width: 25%; display:flex; gap:3%">
            <button @click="cancelEdit" class="btn btn-outline-secondary" style="padding: 4px 15px;">Cancel</button>
            <button @click="saveField" class="btn btn-outline-primary" style="padding: 4px 20px;">Save</button>
          </div>
        </div>

        <!-- CELL FOR DROPDOWNS EDITABLE-->
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;" v-else-if="editing && possibleValues && fieldKey !== 'Application form' && fieldKey !== 'Votum' && fieldKey !== 'Description' && fieldKey !== 'Script' && fieldKey !== 'Bridgeheads' && fieldKey !== 'Environment Variables' && fieldKey !== 'Bridgeheads' && fieldKey !== 'Samples' && fieldKey !== 'Query (Human readable)'">
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
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;" v-if="editing && fieldKey === 'Description'">
          <div style="width:70%">
            <textarea  id="labelInput" type="text" v-model="editedValue[0]"  class="form-control"></textarea></div>
          <div class="button-container" style="width: 25%; display: flex; gap: 3%;">
            <button @click="cancelEdit" class="btn btn-outline-secondary" style="padding:4px 15px 4px 15px;">Cancel</button>
            <button @click="saveField" class="btn btn-outline-primary" style="padding:4px 20px 4px 20px;">Save</button>
          </div>
        </div>

        <!-- CELL FOR BRIDGEHEADS EDITABLE -->
        <div v-if="editing && fieldKey === 'Bridgeheads'">
          <div class="field-value" style="width: 70%">
            <div v-if="tempFieldValue">
      <span v-for="(bridgehead, index) in tempFieldValue[0]" :key="index" class="btn btn-primary" style="margin-right: 2%;">
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
          <div>
          <div v-if=" tempFieldValue[0]!=='' " style="width: 70%">
            <div v-for="(pair, index) in tempFieldValue[0].split(',')" :key="index" style="margin-right: 2%;  display: inline;" class="btn btn-primary">
              <span style="display: inline; margin-bottom: 1%">{{ pair }}</span>
              <button @click="removeVariable(index)" class="btn btn-sm" style="padding: 0px"><i style="color: white; font-size: 18px" class="bi bi-x"></i></button>
            </div>
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
                          text="Upload application form" :call-refreh-context="callRefrehContext" :is-file="true"  />
          </div>
          <div class="button-container" style="width:25%; gap:3%">
            <button @click="cancelEdit" class="btn btn-outline-secondary" style="padding:4px 15px 4px 15px;">Cancel</button>
            <button @click="saveField" class="btn btn-outline-primary" style="padding:4px 20px 4px 20px;">Save</button>
          </div>
        </div>

        <!-- CELL FOR AUTHENTICATION SCRIPT EDITABLE-->
        <div style="display:flex; flex-flow:row; width:100%;" v-if="editing && fieldKey === 'Authentication Script'">
          <div style="width:75%">
            <DownloadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                            :module="Module.TOKEN_MANAGER_MODULE"
                            :action="Action.DOWNLOAD_AUTHENTICATION_SCRIPT_ACTION" icon-class="bi bi-download"/>
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
          <div class="field-value truncate">{{ tempFieldValue[0] }}</div>
        </div>

        <div style="width:70%" v-if="!editing && fieldKey === 'Application form' ">
          <div  class="field-value truncate" v-if="existsApplicationForm">available</div>
          <div  class="field-value truncate" v-if="!existsApplicationForm"> </div>
        </div>

<!--        <div style="width:70%" v-if="!editing && fieldKey === 'Samples' ">
          <div  class="field-value truncate" v-if="existsApplicationForm">available</div>
          <div  class="field-value truncate" v-if="!existsApplicationForm"> </div>
        </div>-->

        <div style="width:70%" v-if="!editing && fieldKey === 'Authentication Script' ">
          <div  class="field-value truncate" v-if="existsAuthenticationScript">available</div>
          <div  class="field-value truncate" v-if="!existsAuthenticationScript"> </div>
        </div>
        <div style="width:70%" v-if="!editing && fieldKey === 'Votum' ">
          <div  class="field-value truncate" v-if="existsVotum">available</div>
          <div  class="field-value truncate" v-if="!existsVotum"> </div>
        </div>
        <div style="width:70%" v-if="!editing && fieldKey === 'Script' ">
          <div  class="field-value truncate" v-if="existsScript">available</div>
          <div  class="field-value truncate" v-if="!existsScript"> </div>
        </div>

        <!-- READONLY CELL FOR BRIDGEHEADS -->
        <div v-else-if="!editing && fieldKey === 'Bridgeheads'">
          <div style="width: 70%">
            <div v-if="tempFieldValue" class="field-value">
               <span v-for="(bridgehead, index) in tempFieldValue[0]" :key="index" class="btn btn-primary" style="margin-right: 2%;">
                   <span>{{ bridgehead }}</span>
               </span>
            </div>
          </div>
        </div>

        <!-- READONLY CELL FOR ENVIRONMENT VARIABLES -->
        <div v-else-if="!editing && fieldKey === 'Environment Variables'">
          <div v-if=" tempFieldValue[0]!=='' " style="width: 70%">
            <div v-for="(pair, index) in tempFieldValue[0].split(',')" :key="index" style="margin-right: 2%;  display: inline;" class="btn btn-primary">
              <span style="display: inline; margin-bottom: 1%">{{ pair }}</span>
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
        <DownloadButton v-if="existsApplicationForm" :context="context" :project-manager-backend-service="projectManagerBackendService"
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
