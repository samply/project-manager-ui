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

@Options({
  name: "ProjectFieldRow",
  components: {DownloadButton}
})
export default class ProjectFieldRow extends Vue {
  @Prop() readonly fieldKey!: string;
  @Prop() readonly fieldValue!: string;
  @Prop() readonly editProjectParam!: string;
  @Prop() readonly projectManagerBackendService!: ProjetManagerBackendService;
  @Prop() readonly context!: ProjectManagerContext;
  @Prop() readonly possibleValues!: string[];
  @Prop() readonly isEditable!: boolean;
  @Prop({ type: Function, required: true }) readonly callRefrehContext!: () => void;

  editing = false; // Flag to indicate if the field is being edited
  editedValue = ''; // Store edited value temporarily
  tempFieldValue = ''; // Initialize tempFieldValue with empty string
  isActionEnabled = false;

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
}
</script>

<template>
  <tr>
    <td class="bold-text thinner-column" style="background-color: #f2f2f2;">{{ fieldKey }}</td>
    <td class="wider-column">
      <div class="user-input-container">
        <div v-if="editing && !possibleValues">
          <input type="text" v-model="editedValue"/>
          <div class="button-container">
            <button @click="saveField">Save</button>
            <button @click="cancelEdit">Cancel</button>
          </div>
        </div>
        <div v-else-if="editing && possibleValues">
          <select v-model="editedValue">
            <option v-for="value in possibleValues" :key="value" :value="value" :selected="value === getSelectedOption()">{{ value }}</option>
          </select>
          <div class="button-container">
            <button @click="saveField">Save</button>
            <button @click="cancelEdit">Cancel</button>
          </div>
        </div>
        <div v-else>
          <div class="field-value">{{ tempFieldValue }}</div>
        </div>
      </div>
    </td>
    <td>
    <div v-if="isFieldValueEditable()">
      <i class="bi bi-pencil me-2" @click="editField"></i>
    </div>
    <div v-if="isFieldValueEditable()">
<!--      <DownloadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                                  :module="Module.TOKEN_MANAGER_MODULE"
                                  :action="Action.DOWNLOAD_AUTHENTICATION_SCRIPT_ACTION" icon-class="bi bi-download"/>-->
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

</style>
