<script lang="ts">

import {
  Action,
  Module,
  ProjectManagerBackendService,
  ProjectManagerContext
} from "@/services/projectManagerBackendService";
import {Options, Vue} from "vue-class-component";
import {PropType, watch} from "vue";
import store, {ActionFeedbackType} from '@/services/store';
import ActionDialog, {ReasonMode} from "@/components/ActionDialog.vue";
import {describeEmailRecipients} from "@/services/emailRecipients";

@Options({
  name: "ProjectManagerButton",
  components: {ActionDialog},
  props: {
    projectManagerBackendService: {type: Object as PropType<ProjectManagerBackendService>, required: true},
    module: {type: String as PropType<Module>, required: true},
    action: {type: String as PropType<Action>, required: true},
    text: {type: String, required: true},
    action2: {type: Object as PropType<Action>, required: false},
    text2: {type: String, required: false},
    buttonClass: {type: String, required: true},
    // The action sends a message to the people it notifies: asked for in the confirmation dialog.
    withMessage: {type: Boolean, required: true},
    // The message is what the others need (reject, request changes): the dialog does not confirm without it.
    messageRequired: {type: Boolean, default: false},
    // Ask for confirmation even without a message (the action notifies others or cannot be undone).
    confirmation: {type: Boolean, default: false},
    // What happens, shown in the confirmation dialog
    confirmationText: {type: String, default: ''},
    // Red confirm button; by default when the button itself is red.
    danger: {type: Boolean, default: undefined},
    visibility: {type: Boolean, required: false, default: true},
    isDisabled: {type: Boolean, required: false, default: false},
    context: {type: Object as PropType<ProjectManagerContext>, required: true},
    params: {type: Object as PropType<Map<string, string>>, default: () => new Map()},
    callRefreshContext: {type: Function as unknown as () => () => void, required: true},
    tooltipText: {type: String, default: ''},
    // e.g. "menuitem" when the button is an entry of a menu
    buttonRole: {type: String, required: false},
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
  readonly withMessage!: boolean;
  readonly messageRequired!: boolean;
  readonly confirmation!: boolean;
  // noinspection JSUnusedGlobalSymbols
  readonly confirmationText!: string;
  readonly danger?: boolean;
  // noinspection JSUnusedGlobalSymbols
  // Button cannot be clicked (it could be visible, but the user cannot click on it)
  readonly isDisabled!: boolean;
  // Button cannot be displayed
  readonly visibility!: boolean;
  // noinspection JSUnusedGlobalSymbols
  readonly tooltipText!: string;
  // noinspection JSUnusedGlobalSymbols
  readonly buttonRole?: string;
  readonly context!: ProjectManagerContext;
  readonly params!: Map<string, string>;
  readonly callRefreshContext!: () => void;
  readonly doActionOnClick?: () => void;

  isActive = false;
  checkboxChecked = !!this.action2;
  isPending = false;
  // Confirmation dialog
  recipientsText = '';
  dialogError = '';

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
    this.projectManagerBackendService.isModuleActionActive(this.module, this.action, this.context)
        .then(result => this.isActive = result && this.visibility)
  }

  get actionToUse(): Action {
    return this.checkboxChecked && this.action2 ? this.action2 : this.action;
  }

  get needsDialog(): boolean {
    return this.withMessage || this.confirmation;
  }

  get reasonMode(): ReasonMode {
    if (!this.withMessage) return 'none';
    return this.messageRequired ? 'required' : 'optional';
  }

  get isDanger(): boolean {
    return this.danger ?? this.buttonClass.includes('danger');
  }

  get dialog(): InstanceType<typeof ActionDialog> {
    return this.$refs.dialog as InstanceType<typeof ActionDialog>;
  }

  async handleButtonClick() {
    if (this.doActionOnClick) {
      this.doActionOnClick();
    } else if (this.needsDialog) {
      this.dialogError = '';
      this.recipientsText = describeEmailRecipients(
          await this.projectManagerBackendService.getActionEmailRecipients(this.module, this.actionToUse));
      this.dialog.open();
    } else {
      await this.runAction('');
    }
  }

  async runAction(message: string) {
    const actionToUse = this.actionToUse;
    const feedbackMessages = await this.projectManagerBackendService.getActionFeedbackMessages(
        this.module, actionToUse
    );
    this.params.set('message', message);
    this.isPending = true;
    this.dialogError = '';
    try {
      await this.projectManagerBackendService.fetchData(
          this.module, actionToUse, this.context, this.params
      );
    } catch (error) {
      console.error(`Error calling action '${actionToUse}' of module '${this.module}':`, error);
      // Use the deployment-provided fallback only for this direct user action.
      const errorMessage = feedbackMessages.errorMessage ||
          await this.projectManagerBackendService.getDefaultErrorMessageForUserActions();
      if (this.needsDialog) {
        // The dialog stays open, so the user can try again or cancel.
        this.dialogError = errorMessage || 'The action could not be completed.';
      } else {
        this.showFeedback(ActionFeedbackType.ERROR, errorMessage);
      }
      this.isPending = false;
      return;
    }
    // Closed before the refresh: the refresh may remove this button, and the dialog with it.
    if (this.needsDialog) this.dialog.close();
    this.showFeedback(ActionFeedbackType.SUCCESS, feedbackMessages.successMessage);
    try {
      await this.callRefreshContext();
    } catch (error) {
      console.error(`Action '${actionToUse}' succeeded, but refreshing its context failed:`, error);
    } finally {
      this.isPending = false;
      this.checkboxChecked = !!this.action2;
    }
  }

  showFeedback(type: ActionFeedbackType, message?: string) {
    if (message) {
      store.commit('showActionFeedback', {type, message});
    }
  }
}
</script>

<template>
  <span v-if="isActive" class="pm-button">
    <div :title="tooltipText">
      <button :class="buttonClass" @click="handleButtonClick" :disabled="isDisabled || isPending" :aria-busy="isPending"
              :aria-haspopup="needsDialog ? 'dialog' : undefined" :role="buttonRole">
        <span v-if="isPending && !needsDialog" class="spinner-border spinner-border-sm me-1" role="status"
              aria-hidden="true"></span>{{ text }}
      </button>
    </div>
    <label v-if="action2" class="pm-checkbox">
      <br/>
      <input type="checkbox" v-model="checkboxChecked"/> {{ text2 }}
    </label>
    <!-- In the body: the button may sit in a menu that is hidden once the dialog opens. -->
    <Teleport to="body">
      <ActionDialog v-if="needsDialog" ref="dialog"
                    :title="text" :description="confirmationText" :recipients="recipientsText"
                    :reason-mode="reasonMode" :danger="isDanger" :pending="isPending" :error-message="dialogError"
                    @confirm="runAction"/>
    </Teleport>
  </span>
</template>


<style scoped>
.pm-button {
  margin-right: 20px;
}

.btn:disabled {
  background-color: #777777;
  border-color: #777777;
}

</style>
