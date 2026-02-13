<script lang="ts">

import {
  Action,
  Module,
  ProjectManagerBackendService,
  ProjectManagerContext
} from "@/services/projectManagerBackendService";
import {Options, Vue} from "vue-class-component";
import {watch} from "vue";

@Options({
  name: "ProjectManagerButton",
  props: {
    projectManagerBackendService: {type: Object as () => ProjectManagerBackendService, required: true},
    module: {type: Object as () => Module, required: true},
    action: {type: Object as () => Action, required: true},
    text: {type: String, required: true},
    action2: {type: Object as () => Action, required: false},
    text2: {type: String, required: false},
    buttonClass: {type: String, required: true},
    withMessage: {type: Boolean, required: true},
    visibility: {type: Boolean, required: false},
    isDisabled: {type: Boolean, default: false},
    context: {type: Object as () => ProjectManagerContext, required: true},
    params: {type: Object as () => Map<string, string>, default: () => new Map()},
    callRefreshContext: {type: Function as unknown as () => () => void, required: true},
    tooltipText: {type: String, default: ''},
    doActionOnClick: {type: Function as unknown as () => void, required: false}
  }
})
export default class ProjectManagerButton extends Vue {

  readonly projectManagerBackendService!: ProjectManagerBackendService;
  readonly module!: Module;
  readonly action!: Action;
  readonly text!: string;
  readonly action2?: Action;
  // For the templates:
  // noinspection JSUnusedGlobalSymbols
  readonly text2?: string;
  // noinspection JSUnusedGlobalSymbols
  readonly buttonClass!: string;
  // noinspection JSUnusedGlobalSymbols
  readonly withMessage!: boolean;
  // noinspection JSUnusedGlobalSymbols
  readonly isDisabled!: boolean;
  // noinspection JSUnusedGlobalSymbols
  readonly tooltipText!: string;
  readonly visibility?: boolean;
  readonly context!: ProjectManagerContext;
  readonly params!: Map<string, string>;
  readonly callRefreshContext!: () => void;
  readonly doActionOnClick?: () => void;


  isActive = false;
  inputText = '';
  hideInput = true;
  checkboxChecked = !!this.action2;

  mounted() {
    // Replace @Watch for 'visibility' and 'projectManagerBackendService'
    watch(
        () => [this.visibility, this.projectManagerBackendService],
        () => {
          this.updateIsActive();
        },
        {immediate: true, deep: true}
    );
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
