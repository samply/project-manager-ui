<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {
  Action,
  Bridgehead,
  Module,
  PmRequestParameter,
  ProjectManagerBackendService,
  ProjectManagerContext,
  User
} from "@/services/projectManagerBackendService";
import {PropType, watch} from "vue";

// The email list of one role (project manager admins, committee members or site admins): who gets the emails of the
// role. The list gives no permissions: the role itself comes from the group in the identity provider. Entries set in
// the configuration (configured) can only be removed there. Backend: docs/user-lists.md.
@Options({
  name: "RoleUserList",
  props: {
    projectManagerBackendService: {type: Object as PropType<ProjectManagerBackendService>, required: true},
    roleName: {type: String, required: true},
    fetchAction: {type: String as PropType<Action>, required: true},
    addAction: {type: String as PropType<Action>, required: true},
    removeAction: {type: String as PropType<Action>, required: true},
    // Site admins: every entry belongs to a site
    withBridgehead: {type: Boolean, default: false}
  }
})
export default class RoleUserList extends Vue {

  readonly projectManagerBackendService!: ProjectManagerBackendService;
  readonly roleName!: string;
  readonly fetchAction!: Action;
  readonly addAction!: Action;
  readonly removeAction!: Action;
  readonly withBridgehead!: boolean;

  isActive = false;
  users: User[] = [];
  bridgeheads: Bridgehead[] = [];
  inputEmail = '';
  inputBridgehead = '';
  error = '';

  mounted() {
    watch(() => this.projectManagerBackendService, () => this.updateIsActive(), {immediate: true, deep: true});
  }

  updateIsActive() {
    this.projectManagerBackendService.isModuleActionActive(Module.USER_MODULE, this.fetchAction, this.createContext())
        .then(isActive => {
          this.isActive = isActive;
          if (isActive) {
            this.updateUsers();
            if (this.withBridgehead) {
              this.updateBridgeheads();
            }
          }
        });
  }

  updateUsers() {
    this.projectManagerBackendService.fetchData(Module.USER_MODULE, this.fetchAction, this.createContext(), new Map())
        .then(users => this.users = users);
  }

  updateBridgeheads() {
    this.projectManagerBackendService.fetchData(Module.PROJECT_BRIDGEHEAD_MODULE,
        Action.FETCH_ALL_REGISTERED_BRIDGEHEADS_ACTION, this.createContext(), new Map())
        .then((bridgeheads: Bridgehead[]) => this.bridgeheads = [...bridgeheads]
            .sort((a, b) => this.bridgeheadName(a).localeCompare(this.bridgeheadName(b))));
  }

  get canAdd(): boolean {
    return !!this.inputEmail.trim() && (!this.withBridgehead || !!this.inputBridgehead);
  }

  addUser() {
    this.change(this.addAction, this.inputEmail.trim(), this.inputBridgehead,
        'Could not add the address: please check it.', () => this.inputEmail = '');
  }

  removeUser(user: User) {
    this.change(this.removeAction, user.email, user.bridgehead, 'Could not remove the address.', () => undefined);
  }

  change(action: Action, email: string, bridgehead: string | undefined, errorMessage: string, onSuccess: () => void) {
    this.error = '';
    const params = new Map<string, string>([[PmRequestParameter.EMAIL, email]]);
    if (this.withBridgehead && bridgehead) {
      params.set(PmRequestParameter.BRIDGEHEAD, bridgehead);
    }
    this.projectManagerBackendService.fetchData(Module.USER_MODULE, action, this.createContext(), params)
        .then(() => {
          onSuccess();
          this.updateUsers();
        })
        .catch(() => this.error = errorMessage);
  }

  bridgeheadName(bridgehead: Bridgehead): string {
    return bridgehead.humanReadable || bridgehead.bridgehead;
  }

  userName(user: User): string {
    return [user.firstName, user.lastName].filter(Boolean).join(' ');
  }

  createContext() {
    return new ProjectManagerContext(undefined, undefined);
  }
}
</script>

<template>
  <div v-if="isActive" class="role-user-list">
    <p class="explanation">
      These people get the emails sent to the {{ roleName }}, also before their first login. Everyone with the role
      is added here when they log in.
    </p>
    <p class="explanation warning">
      <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
      Adding someone here does <strong>not</strong> give them the role: they only get the emails. For the role, they
      must also be added to its group in the login (identity provider). Removing someone here stops the emails, not
      the role; with the group they are added again at their next login.
    </p>

    <table v-if="users.length" class="table table-sm">
      <tbody>
      <tr v-for="user in users" :key="(user.bridgehead ?? '') + user.email">
        <td v-if="withBridgehead" class="nowrap">{{ user.humanReadableBridgehead || user.bridgehead }}</td>
        <td>{{ userName(user) }}</td>
        <td>{{ user.email }}</td>
        <td class="action-cell">
          <span v-if="user.configured" class="configured"
                title="Set in the configuration of this deployment: it can only be removed there">
            <i class="bi bi-lock" aria-hidden="true"></i> In the configuration
          </span>
          <button v-else class="btn btn-outline-danger btn-sm" @click="removeUser(user)">Remove</button>
        </td>
      </tr>
      </tbody>
    </table>
    <p v-else>Nobody yet.</p>

    <form class="add-row" @submit.prevent="addUser">
      <select v-if="withBridgehead" v-model="inputBridgehead" class="form-select form-select-sm" aria-label="Site">
        <option value="" disabled>Site</option>
        <option v-for="bridgehead in bridgeheads" :key="bridgehead.bridgehead" :value="bridgehead.bridgehead">
          {{ bridgeheadName(bridgehead) }}
        </option>
      </select>
      <input v-model="inputEmail" type="email" class="form-control form-control-sm" placeholder="Email address"
             aria-label="Email address"/>
      <button type="submit" class="btn btn-primary btn-sm" :disabled="!canAdd">Add</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.explanation {
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.75rem;
}

.warning {
  color: #7a4d00;
}

.configured {
  font-size: 0.85rem;
  color: #5b6b7c;
  white-space: nowrap;
}

.action-cell {
  text-align: right;
}

.nowrap {
  white-space: nowrap;
}

.add-row {
  display: flex;
  gap: 0.5rem;
  max-width: 40rem;
}

.add-row select {
  max-width: 14rem;
}

.error {
  color: #b42318;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}
</style>
