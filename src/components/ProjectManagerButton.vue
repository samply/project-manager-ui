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
  @Prop() readonly buttonClass!: string;
  @Prop() readonly text!: string;
  @Prop() readonly withMessage!: boolean;
  @Prop() readonly context!: ProjectManagerContext;
  @Prop() readonly params: Map<string, string> = new Map();
  @Prop({ type: Function, required: true }) readonly callRefrehContext!: () => void;

  isActive = false;
  inputText = '';

  @Watch('projectManagerBackendService', { immediate: true, deep: true })
  onContextChange(newValue: ProjetManagerBackendService, oldValue: ProjetManagerBackendService) {
    this.updateIsActive()
  }
  async created() {
    this.updateIsActive()
  }

  updateIsActive(){
    this.inputText = '';
    this.projectManagerBackendService.isModuleActionActive(this.module, this.action).then(result => this.isActive = result)
  }

  async handleButtonClick() {
    this.params.set('message', this.inputText);
    this.projectManagerBackendService.fetchData(this.module, this.action, this.context, this.params).then(result => this.callRefrehContext());
  }

}
</script>

<template>
  <input v-if="isActive && withMessage" type="text" v-model="inputText">
  <button :class="buttonClass" v-if="isActive" @click="handleButtonClick">{{ text }}</button>
</template>

<style scoped>

</style>
