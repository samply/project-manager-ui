<script lang="ts">
import {Options, Vue} from "vue-class-component";
import '@/assets/styles/table.css'
import {Project, ProjectState} from "@/services/projectManagerBackendService";
import {
  Action,
  Bridgehead,
  Module,
  PmRequestParameter,
  ProjectManagerBackendService,
  ProjectManagerContext,
  User
} from "@/services/projectManagerBackendService";
import UserAndEmail from "@/components/UserAndEmail.vue";
import StatusDot from "@/components/StatusDot.vue";
import ActionDialog from "@/components/ActionDialog.vue";
import {describeEmailRecipients} from "@/services/emailRecipients";
import {PropType, watch} from "vue";

// The People card's content: who takes part in the current phase and, for those who may, "Invite user",
// which opens a dialog (site, email) instead of an always-open form.
@Options({
  name: "UserInput",
  components: {UserAndEmail, StatusDot, ActionDialog},
  props: {
    callRefreshContext: {type: Function as unknown as () => () => void, required: true},
    projectManagerBackendService: {type: Object as PropType<ProjectManagerBackendService>, required: true},
    context: {type: Object as PropType<ProjectManagerContext>, required: true},
    project: {type: Object as PropType<Project>, required: true},
    bridgeheads: {type: Array as PropType<Bridgehead[]>, required: true},
    currentUsers: {type: Array as PropType<User[]>, required: true}
  }
})
export default class UserInput extends Vue {
  readonly callRefreshContext!: () => void;
  readonly projectManagerBackendService!: ProjectManagerBackendService;
  readonly context!: ProjectManagerContext;
  readonly project!: Project;
  readonly bridgeheads!: Bridgehead[];
  readonly currentUsers!: User[];

  isActive = false;
  // The bridgeheads where the user may invite (docs/bridgehead-context.md: each bridgehead with its own permissions)
  inviteBridgeheads: Bridgehead[] = [];
  // Invite dialog
  email = '';
  selectedBridgehead: Bridgehead | undefined = undefined;
  suggestions: User[] = [];
  recipientsText = '';
  dialogError = '';
  isPending = false;

  mounted() {
    watch(
        () => this.projectManagerBackendService,
        () => this.updateIsActive(),
        {immediate: true, deep: true}
    );
    // The invite action depends on the phase, and after a phase change the
    // backend service is replaced before the project is fetched again.
    watch(() => this.project?.state, () => this.updateIsActive());
    watch(() => this.bridgeheads, () => this.updateIsActive());
  }

  created() {
    this.updateIsActive();
  }

  async updateIsActive() {
    const action = this.fetchAction();
    const allowed = await Promise.all(this.bridgeheads.map(bridgehead => this.projectManagerBackendService
        .isModuleActionActive(Module.USER_MODULE, action, this.createContext(bridgehead))));
    this.inviteBridgeheads = this.bridgeheads.filter((_bridgehead, index) => allowed[index]);
    this.isActive = this.inviteBridgeheads.length > 0;
    if (!this.inviteBridgeheads.some(bridgehead => bridgehead.bridgehead === this.selectedBridgehead?.bridgehead)) {
      this.selectedBridgehead = this.inviteBridgeheads[0];
    }
  }

  fetchAction(): Action {
    let action: Action = Action.SET_DEVELOPER_USER_ACTION;
    if (this.project.state === ProjectState.PILOT) {
      action = Action.SET_PILOT_USER_ACTION;
    } else if (this.project.state === ProjectState.FINAL) {
      action = Action.SET_FINAL_USER_ACTION;
    }
    return action;
  }

  // "develop", "pilot", "final"
  get phaseName(): string {
    return (this.project?.state ?? '').toLowerCase();
  }

  get datalistId(): string {
    return `invite-suggestions-${this.$.uid}`;
  }

  get dialog(): InstanceType<typeof ActionDialog> {
    return this.$refs.dialog as InstanceType<typeof ActionDialog>;
  }

  async openInviteDialog() {
    this.email = '';
    this.suggestions = [];
    this.dialogError = '';
    this.selectedBridgehead = this.selectedBridgehead ?? this.inviteBridgeheads[0];
    this.recipientsText = describeEmailRecipients(
        await this.projectManagerBackendService.getActionEmailRecipients(Module.USER_MODULE, this.fetchAction()));
    this.dialog.open();
    this.$nextTick(() => (this.$refs.emailInput as HTMLInputElement | undefined)?.focus());
  }

  onEmailInput() {
    this.dialogError = '';
    this.autocomplete(this.email);
  }

  async invite() {
    const email = this.email.trim();
    if (!this.isEmailValid(email)) {
      this.dialogError = 'Please enter a valid email address.';
      return;
    }
    if (this.currentUsers.some(user => user.email === email &&
        (!this.selectedBridgehead || user.bridgehead === this.selectedBridgehead.bridgehead))) {
      this.dialogError = 'This user already takes part in this phase.';
      return;
    }
    const params = new Map<string, string>();
    params.set(PmRequestParameter.EMAIL, email);
    this.isPending = true;
    try {
      await this.projectManagerBackendService.fetchData(Module.USER_MODULE, this.fetchAction(),
          this.createContext(this.selectedBridgehead), params);
    } catch (error) {
      console.error('Error inviting the user:', error);
      this.dialogError = (await this.projectManagerBackendService.getActionFeedbackMessages(Module.USER_MODULE, this.fetchAction())).errorMessage
          || 'The user could not be invited.';
      this.isPending = false;
      return;
    }
    this.dialog.close();
    try {
      await this.callRefreshContext();
    } finally {
      this.isPending = false;
    }
  }

  autocomplete(partialEmail: string) {
    if (!partialEmail) {
      this.suggestions = [];
      return;
    }
    const params = new Map<string, string>();
    params.set(PmRequestParameter.PARTIAL_EMAIL, partialEmail);
    this.projectManagerBackendService.fetchData(Module.USER_MODULE, Action.FETCH_USERS_FOR_AUTOCOMPLETE_ACTION,
        this.createContext(this.selectedBridgehead), params).then(users => {
      this.suggestions = users ?? [];
    });
  }

  createContext(bridgehead: Bridgehead | undefined) {
    return (bridgehead) ? new ProjectManagerContext(this.context.projectCode, bridgehead) : this.context;
  }

  suggestionLabel(user: User): string {
    return [user.firstName, user.lastName].filter(Boolean).join(' ');
  }

  private isEmailValid(email: string): boolean {
    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
</script>

<template>
  <div class="people-toolbar">
    <span class="people-caption">
      {{ currentUsers.length > 0 ? `Users taking part in the ${phaseName} phase` : `Nobody has been invited to the ${phaseName} phase yet.` }}
    </span>
    <button v-if="isActive" type="button" class="btn btn-primary btn-sm" aria-haspopup="dialog"
            @click="openInviteDialog">
      <i class="bi bi-person-plus" aria-hidden="true"></i> Invite user
    </button>
  </div>

  <div v-if="currentUsers.length > 0" class="table-scroll">
    <table class="pm-table">
      <thead>
      <tr>
        <th>User</th>
        <th v-if="bridgeheads.length > 0">Site</th>
        <th>Results Acceptance</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(user, index) in currentUsers" :key="index">
        <td>
          <UserAndEmail
              :first-name="user.firstName"
              :last-name="user.lastName"
              :email="user.email"
          />
        </td>
        <td v-if="bridgeheads.length > 0">{{ user.humanReadableBridgehead }}</td>
        <td>
          <div class="states-circle-container">
            <StatusDot :state="user?.projectState" :title="user?.projectState"/>
          </div>
        </td>
      </tr>
      </tbody>
    </table>
  </div>

  <Teleport to="body">
    <ActionDialog v-if="isActive" ref="dialog"
                  :title="`Invite a user to the ${phaseName} phase`" confirm-text="Invite"
                  description="The user can then work on this request at the chosen site."
                  :recipients="recipientsText" :pending="isPending" :error-message="dialogError"
                  @confirm="invite">
      <div class="invite-field">
        <template v-if="inviteBridgeheads.length > 1">
          <label :for="`${datalistId}-site`" class="invite-label">Site</label>
          <select :id="`${datalistId}-site`" v-model="selectedBridgehead" class="form-select">
            <option v-for="bridgehead in inviteBridgeheads" :key="bridgehead.bridgehead" :value="bridgehead">
              {{ bridgehead.humanReadable }}
            </option>
          </select>
        </template>
        <template v-else>
          <span class="invite-label">Site</span>
          <div class="invite-site">{{ selectedBridgehead?.humanReadable }}</div>
        </template>
      </div>
      <div class="invite-field">
        <label :for="`${datalistId}-email`" class="invite-label">Email<span aria-hidden="true">&nbsp;*</span></label>
        <input :id="`${datalistId}-email`" ref="emailInput" v-model="email" type="email" class="form-control"
               autocomplete="off" aria-required="true" :list="datalistId" @input="onEmailInput"/>
        <datalist :id="datalistId">
          <option v-for="user in suggestions" :key="user.email" :value="user.email">{{ suggestionLabel(user) }}</option>
        </datalist>
      </div>
    </ActionDialog>
  </Teleport>
</template>

<style scoped>
.people-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) 0 var(--space-3);
}

.people-caption {
  font-size: 14px;
  color: #5b6b7c;
}

.people-toolbar .btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.table-scroll {
  overflow-x: auto;
}

.states-circle-container {
  display: flex;
  justify-content: center;
}

/* Fields of the invite dialog (rendered inside ActionDialog) */
.invite-field {
  margin-top: var(--space-4);
}

.invite-label {
  display: block;
  font-weight: 600;
  color: #00489cf2;
  margin-bottom: var(--space-1);
}

.invite-site {
  font-size: 14px;
}
</style>
