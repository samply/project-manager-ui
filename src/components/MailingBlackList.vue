<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {
  Action,
  Module,
  ProjectManagerBackendService,
  PmRequestParameter,
  ProjectManagerContext,
  User
} from "@/services/projectManagerBackendService";
import {PropType, watch} from "vue";

@Options({
  name: "MailingBlackList",
  props: {
    projectManagerBackendService: {type: Object as PropType<ProjectManagerBackendService>, required: true}
  }
})
export default class MailingBlackList extends Vue {

  readonly projectManagerBackendService!: ProjectManagerBackendService;

  isActive = false;
  mailingBlackList: User[] = [];
  suggestions: User[] = [];
  showSuggestions = false;
  inputEmail = '';

  mounted() {
    watch(
        () => this.projectManagerBackendService,
        () => {
          this.updateIsActive();
        },
        {immediate: true, deep: true}
    );
  }

  updateIsActive() {
    this.projectManagerBackendService
        .isModuleActionActive(Module.USER_MODULE, Action.FETCH_MAILING_BLACK_LIST_ACTION, this.createContext())
        .then(isActive => {
          this.isActive = isActive;
          if (isActive) {
            this.updateMailingBlackList();
          }
        });
  }

  updateMailingBlackList() {
    this.projectManagerBackendService
        .fetchData(Module.USER_MODULE, Action.FETCH_MAILING_BLACK_LIST_ACTION, this.createContext(), new Map())
        .then(users => {
          this.mailingBlackList = users;
        });
  }

  updateSuggestions() {
    if (!this.inputEmail.trim()) {
      this.initializeSuggestions();
      return;
    }

    this.projectManagerBackendService
        .fetchData(Module.USER_MODULE, Action.FETCH_USERS_FOR_AUTOCOMPLETE_IN_MAILING_BLACK_LIST_ACTION, this.createContext(), new Map([[PmRequestParameter.EMAIL, this.inputEmail.trim()]]))
        .then(users => {
          this.suggestions = users;
          this.showSuggestions = users.length > 0;
        });
  }

  initializeSuggestions() {
    this.suggestions = [];
    this.showSuggestions = false;
  }

  addUserToMailingBlackList(email: string) {
    this.inputEmail = "";
    this.projectManagerBackendService
        .fetchData(Module.USER_MODULE, Action.ADD_USER_TO_MAILING_BLACK_LIST_ACTION, this.createContext(), new Map([[PmRequestParameter.EMAIL, email]]))
        .then(() => {
          this.updateMailingBlackList();
          this.initializeSuggestions();
        });
  }

  removeUserFromMailingBlackList(email: string) {
    this.inputEmail = "";
    this.projectManagerBackendService
        .fetchData(Module.USER_MODULE, Action.REMOVE_USER_FROM_MAILING_BLACK_LIST_ACTION, this.createContext(), new Map([[PmRequestParameter.EMAIL, email]]))
        .then(() => {
          this.updateMailingBlackList();
        });
  }

  createContext() {
    return new ProjectManagerContext(undefined, undefined);
  }

  // One "N/A" when the name is unknown (the user has never logged in), not one per missing part
  userName(user: User): string {
    return [user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A';
  }
}
</script>

<!-- Same layout as the role lists (RoleUserList.vue) on the configuration page -->
<template>
  <div v-if="isActive" class="mailing-blacklist">
    <p class="explanation">
      Users added to the mailing blacklist will not receive any automatic emails.
      These users can be added or removed from the blacklist at any time.
    </p>

    <table v-if="mailingBlackList.length" class="table table-sm">
      <tbody>
      <tr v-for="user in mailingBlackList" :key="user.email">
        <td class="name-cell">{{ userName(user) }}</td>
        <td>{{ user.email }}</td>
        <td class="action-cell">
          <button type="button" class="btn btn-link remove-button" :title="'Remove ' + user.email"
                  :aria-label="'Remove ' + user.email" @click="removeUserFromMailingBlackList(user.email)">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </td>
      </tr>
      </tbody>
    </table>
    <p v-else>No users in the mailing blacklist.</p>

    <!-- Only users known to the project manager can be added: the suggestions come from them -->
    <div class="add-row">
      <input v-model="inputEmail" type="text" class="form-control form-control-sm"
             placeholder="Email address of a user" aria-label="Email address of a user" @input="updateSuggestions"/>
    </div>
    <table v-if="showSuggestions" class="table table-sm suggestions">
      <tbody>
      <tr v-for="user in suggestions" :key="user.email">
        <td>{{ user.email }}</td>
        <td class="action-cell">
          <button type="button" class="btn btn-primary btn-sm" @click="addUserToMailingBlackList(user.email)">Add</button>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.explanation {
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.75rem;
}

.action-cell {
  text-align: right;
}

/* Same width as in the role lists (RoleUserList.vue), so that the addresses line up */
.name-cell {
  width: 14rem;
}

/* The x used to remove things elsewhere (feasibility table, documents) */
.remove-button {
  color: #64748b;
  padding: 0 0 0 0.75rem;
}

.remove-button:hover {
  color: var(--status-danger-color);
}

.add-row {
  display: flex;
  gap: 0.5rem;
  max-width: 40rem;
}

.suggestions {
  max-width: 40rem;
  margin-top: 0.5rem;
}
</style>
