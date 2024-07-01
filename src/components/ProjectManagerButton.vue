<script lang="ts">

import {Prop, Watch} from 'vue-property-decorator';
import {
  Action,
  Module,
  ProjectManagerContext,
  ProjetManagerBackendService
} from "@/services/projetManagerBackendService";
import {Options, Vue} from "vue-class-component";

@Options({
  name: "ProjectManagerButton"
})
export default class ProjectManagerButton extends Vue {
  @Prop() readonly projectManagerBackendService!: ProjetManagerBackendService;
  @Prop() readonly module!: Module;
  @Prop() readonly action!: Action;
  @Prop() readonly text!: string;
  @Prop() readonly action2?: Action;
  @Prop() readonly text2?: string;
  @Prop() readonly buttonClass!: string;
  @Prop() readonly withMessage!: boolean;
  @Prop() readonly context!: ProjectManagerContext;
  @Prop() readonly params: Map<string, string> = new Map();
  @Prop({type: Function, required: true}) readonly callRefrehContext!: () => void;

  isActive = false;
  inputText = '';
  hideInput = true;
  checkboxChecked = this.action2 ? true : false;


  @Watch('projectManagerBackendService', {immediate: true, deep: true})
  onContextChange(newValue: ProjetManagerBackendService, oldValue: ProjetManagerBackendService) {
    this.updateIsActive()
  }

  async created() {
    this.updateIsActive()
  }

  updateIsActive() {
    this.inputText = '';
    this.projectManagerBackendService.isModuleActionActive(this.module, this.action).then(result => this.isActive = result)
  }

  async handleButtonClick() {
    const actionToUse = this.checkboxChecked && this.action2 ? this.action2 : this.action;
    this.params.set('message', this.inputText);
    this.projectManagerBackendService.fetchData(this.module, actionToUse, this.context, this.params).then(result => this.callRefrehContext());
    this.toggleVisibility();
  }

  toggleVisibility() {
    this.hideInput = !this.hideInput;
  }
}
</script>

<template>
  <span v-if="isActive && withMessage" class="pm-button">
    <input type="text" v-model="inputText" :class="{ 'hidden': hideInput }" class="inputfield" placeholder="optional message">
    <button :class="[buttonClass, {'hidden': !hideInput }]" @click="toggleVisibility">{{ text }}</button>
    <button :class="[buttonClass, {'hidden': hideInput }]" @click="handleButtonClick">Submit</button>
    <label v-if="action2" class="pm-checkbox">
      <input type="checkbox" v-model="checkboxChecked" />
      {{ text2 }}
    </label>
  </span>
  <span v-if="isActive && !withMessage" class="pm-button">
    <button :class="buttonClass" @click="handleButtonClick">{{ text }}</button>
    <label v-if="action2" class="pm-checkbox">
      <br>
      <input type="checkbox" v-model="checkboxChecked" />
      {{ text2 }}
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
.inputfield {
  margin-right: 10px;
  height: 37px;
  padding-bottom: 7px;
  border: 1px solid #dee2e6;
  border-radius: 5px;
}
</style>
