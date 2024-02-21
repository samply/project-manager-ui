<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {Emit, Prop} from "vue-property-decorator";
import {
  Action,
  Module,
  ProjectManagerContext,
  ProjetManagerBackendService
} from "@/services/projetManagerBackendService";

@Options({
  name: "ProjectFieldRow"
})
export default class ProjectFieldRow extends Vue {
  @Prop() readonly fieldKey!: string;
  @Prop() readonly fieldValue!: string;
  @Prop() readonly editProjectParam!: string;
  @Prop() readonly projectManagerBackendService!: ProjetManagerBackendService;
  @Prop() readonly context!: ProjectManagerContext;

  editing = false; // Flag to indicate if the field is being edited
  editedValue = ''; // Store edited value temporarily
  tempFieldValue = ''; // Initialize tempFieldValue with empty string

  // Initialize tempFieldValue with the initial value of fieldValue
  created() {
    this.tempFieldValue = this.fieldValue;
  }

  editField() {
    this.editing = true; // Set editing flag to true
    this.editedValue = this.tempFieldValue; // Initialize editedValue with current fieldValue
  }

  saveField() {
    // Perform actions to save the edited value, e.g., update database
    this.editing = false; // Reset editing flag
    this.tempFieldValue = this.editedValue;
    const params = new Map<string, string>();
    params.set(this.editProjectParam, this.editedValue);
    this.projectManagerBackendService.fetchData(Module.PROJECT_EDITION_MODULE, Action.EDIT_PROJECT_ACTION, this.context, params);
  }

  cancelEdit() {
    this.editing = false; // Cancel editing, reset editing flag
  }
}
</script>

<template>
  <tr>
    <td class="bold-text thinner-column">{{ fieldKey }}</td>
    <td class="wider-column">
      <div class="input-container">
        <!-- Show input field if editing is true, otherwise display fieldValue -->
        <template v-if="editing">
          <input type="text" v-model="editedValue"/>
          <div class="button-container">
            <button @click="saveField">Save</button>
            <button @click="cancelEdit">Cancel</button>
          </div>
        </template>
        <template v-else>
          <div class="field-value">{{ tempFieldValue }}</div>
        </template>
      </div>
    </td>
    <template v-if="!editing">
      <td><i class="bi bi-pencil me-2" @click="editField"></i></td>
    </template>
    <template v-else>
      <td></td>
    </template>
  </tr>
</template>

<style scoped>
.bold-text {
  font-weight: bold;
}

.input-container {
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
