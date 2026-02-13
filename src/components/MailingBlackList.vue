<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {Prop, Watch} from "vue-property-decorator";
import {
  Action,
  Module,
  ProjectManagerBackendService,
  ProjectManagerContext,
  User
} from "@/services/projectManagerBackendService";

@Options({
  name: "MailingBlackList"
})
export default class MailingBlackList extends Vue {
  @Prop() readonly projectManagerBackendService!: ProjectManagerBackendService;

  isActive = false;
  mailingBlackList: User[] = [];
  suggestions: User[] = [];
  showSuggestions = false;
  inputEmail = '';

  @Watch('projectManagerBackendService', {immediate: true, deep: true})
  onContextChange() {
    this.updateIsActive();
  }

  updateIsActive() {
    this.projectManagerBackendService
        .isModuleActionActive(Module.USER_MODULE, Action.FETCH_MAILING_BLACK_LIST_ACTION)
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
        .fetchData(Module.USER_MODULE, Action.FETCH_USERS_FOR_AUTOCOMPLETE_IN_MAILING_BLACK_LIST_ACTION, this.createContext(), new Map([['email', this.inputEmail.trim()]]))
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
        .fetchData(Module.USER_MODULE, Action.ADD_USER_TO_MAILING_BLACK_LIST_ACTION, this.createContext(), new Map([['email', email]]))
        .then(() => {
          this.updateMailingBlackList();
          this.initializeSuggestions();
        });
  }

  removeUserFromMailingBlackList(email: string) {
    this.inputEmail = "";
    this.projectManagerBackendService
        .fetchData(Module.USER_MODULE, Action.REMOVE_USER_FROM_MAILING_BLACK_LIST_ACTION, this.createContext(), new Map([['email', email]]))
        .then(() => {
          this.updateMailingBlackList();
        });
  }

  createContext() {
    return new ProjectManagerContext(undefined, undefined);
  }
}
</script>

<template>
  <div v-if="isActive" class="mailing-blacklist">
    <!-- Explanation -->
    <p class="explanation">
      Users added to the mailing blacklist will not receive any automatic emails.
      These users can be added or removed from the blacklist at any time.
    </p>
    <!-- Mailing Blacklist -->
    <ul v-if="mailingBlackList.length">
      <li v-for="user in mailingBlackList" :key="user.email">
        - {{ user.firstName || 'N/A' }} {{ user.lastName || 'N/A' }} ( {{ user.email }} )
        <button class="btn btn-danger btn-secondary mr-2" @click="removeUserFromMailingBlackList(user.email)">Remove
        </button>
      </li>
    </ul>
    <p v-else>No users in the mailing blacklist.</p>

    <!-- Add User -->
    <div>
      <input
          v-model="inputEmail"
          type="text"
          placeholder="Enter email to add"
          @input="updateSuggestions"
      />
      <ul v-if="showSuggestions" style="padding:10px 20px">
        <li v-for="user in suggestions" :key="user.email">
          {{ user.email }}
          <button class="btn btn-primary mr-2" @click="addUserToMailingBlackList(user.email)">Add</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.mailing-blacklist {
  border-radius: 8px;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

button {
  margin-left: 1rem;
}

.explanation {
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 1rem;
}

</style>
