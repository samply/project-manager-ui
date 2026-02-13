<script lang="ts">

import {Prop, Watch} from 'vue-property-decorator';
import {
  Action,
  Module,
  ProjectManagerBackendService,
  ProjectManagerContext
} from "@/services/projectManagerBackendService";
import {Options, Vue} from "vue-class-component";

@Options({
  name: "ProjectManagerButton"
})
export default class ProjectManagerButton extends Vue {
  @Prop() readonly projectManagerBackendService!: ProjectManagerBackendService;
  @Prop() readonly module!: Module;
  @Prop() readonly action!: Action;
  @Prop() readonly text!: string;
  @Prop() readonly action2?: Action;
  @Prop() readonly text2?: string;
  @Prop() readonly buttonClass!: string;
  @Prop() readonly withMessage!: boolean;
  @Prop() readonly visibility?: boolean;
  @Prop({type: Boolean, default: false}) readonly isDisabled!: boolean;
  @Prop() readonly context!: ProjectManagerContext;
  @Prop() readonly params: Map<string, string> = new Map();
  @Prop({type: Function, required: true}) readonly callRefreshContext!: () => void;
  @Prop({type: String, default: ''}) readonly tooltipText!: string;
  @Prop({type: Function}) readonly doActionOnClick?: () => void;

  isActive = false;
  inputText = '';
  hideInput = true;
  checkboxChecked = !!this.action2;


  @Watch('visibility', {immediate: true, deep: true})
  @Watch('projectManagerBackendService', {immediate: true, deep: true})
  onContextChange() {
    this.updateIsActive()
  }

  async created() {
    this.updateIsActive()
  }

  updateIsActive() {
    this.inputText = '';
    const visibility = this.visibility !== undefined ? this.visibility : true
    this.projectManagerBackendService.isModuleActionActive(this.module, this.action).then(result => this.isActive = result && visibility)
  }

  async handleButtonClick() {
    if (this.doActionOnClick) {
      this.doActionOnClick();
    } else {
      const actionToUse = this.checkboxChecked && this.action2 ? this.action2 : this.action;
      this.params.set('message', this.inputText);
      this.projectManagerBackendService.fetchData(this.module, actionToUse, this.context, this.params).then(() => this.callRefreshContext());
      this.toggleVisibility();
    }
  }

  toggleVisibility() {
    this.hideInput = !this.hideInput;
  }

  handleCancelClick() {
    // Reset state to initial defaults
    this.inputText = "";
    this.checkboxChecked = !!this.action2;
    this.hideInput = true;
  }

}
</script>

<template>
  <span v-if="isActive" class="pm-button">
    <template v-if="withMessage">
      <input type="text" v-model="inputText" :class="{ 'hidden': hideInput }" class="input-field"
             placeholder="optional message"/>
      <div :title="tooltipText">
        <button :class="[buttonClass, 'button-spacing', { 'hidden': !hideInput }]" @click="toggleVisibility"
                :disabled="isDisabled">{{ text }}</button>
      </div>
      <button :class="[buttonClass, 'button-spacing', { 'hidden': hideInput }]" @click="handleButtonClick"
              :disabled="isDisabled">Submit</button>
      <button v-if="!hideInput" :class="[buttonClass, 'button-spacing']" @click="handleCancelClick"
              :disabled="isDisabled">Cancel</button>
    </template>
    <template v-else>
      <div :title="tooltipText">
        <button :class="buttonClass" @click="handleButtonClick" :disabled="isDisabled">{{ text }}</button>
      </div>
    </template>
    <label v-if="action2" class="pm-checkbox">
      <br v-if="!withMessage"/>
      <input type="checkbox" v-model="checkboxChecked"/> {{ text2 }}
    </label>
  </span>
</template>


<style scoped>
.hidden {
  display: none;
}

.pm-button {
  margin-right: 20px;
}

.input-field {
  margin-right: 10px;
  height: 37px;
  padding-bottom: 7px;
  border: 1px solid #dee2e6;
  border-radius: 5px;
}

/* Add spacing for buttons */
.button-spacing {
  margin-right: 10px; /* Adds consistent space */
}

/* Remove margin for the last button */
.pm-button button:last-of-type {
  margin-right: 0; /* Keeps layout clean */
}

</style>
