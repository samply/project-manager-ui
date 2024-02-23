<script lang="ts">

import {Options, Vue} from "vue-class-component";
import {Prop, Watch} from "vue-property-decorator";
import {
  Action,
  Module,
  Project,
  ProjectManagerContext,
  ProjetManagerBackendService
} from "@/services/projetManagerBackendService";

interface User {
  email: string;
  bridgehead: string;
}

@Options({
  name: "UserInput"
})
export default class UserInput extends Vue {
  @Prop() readonly projectManagerBackendService!: ProjetManagerBackendService;
  @Prop() readonly context!: ProjectManagerContext;
  @Prop() readonly project!: Project;

  partialEmail = '';
  suggestions: User[] = [];
  isActive = false;
  currentUsers: User[] = [];
  canInvite = true;

  @Watch('projectManagerBackendService', {immediate: true, deep: true})
  onContextChange(newValue: ProjetManagerBackendService, oldValue: ProjetManagerBackendService) {
    this.updateIsActive()
  }

  created() {
    this.updateIsActive();
  }

  updateIsActive() {
    this.projectManagerBackendService.isModuleActionActive(Module.USER_MODULE, Action.FETCH_USERS_FOR_AUTOCOMPLETE_ACTION).then(isActive => {
      this.isActive = isActive;
      if (isActive) {
        this.updateCurrentUsers();
      }
    });
  }

  handleInput(event: Event): void {
    this.partialEmail = (event.target as HTMLInputElement).value;
    this.canInvite = true;
    for (let user of this.currentUsers){
      if (user.email === this.partialEmail){
        this.canInvite = false;
      }
    }
    this.autocomplete(this.partialEmail);
  }

  handleSave(): void {
    let action: Action = Action.SET_DEVELOPER_USER_ACTION;
    if (this.project.state === 'PILOT') {
      action = Action.SET_PILOT_USER_ACTION;
    } else if (this.project.state === 'FINAL') {
      action = Action.SET_FINAL_USER_ACTION;
    }
    const params = new Map<string, string>();
    params.set('email', this.partialEmail);
    this.projectManagerBackendService.fetchData(Module.USER_MODULE, action, this.context, params).then(result => {
      this.partialEmail = '';
      this.updateCurrentUsers();
    });
  }

  autocomplete(partialEmail: string) {
    const params = new Map<string, string>();
    if (partialEmail && partialEmail.length > 0) {
      params.set('partial-email', partialEmail);
      this.projectManagerBackendService.fetchData(Module.USER_MODULE, Action.FETCH_USERS_FOR_AUTOCOMPLETE_ACTION, this.context, params).then(users => this.suggestions = users);
    } else {
      this.suggestions = [];
    }
  }

  updateCurrentUsers() {
    this.projectManagerBackendService.fetchData(Module.USER_MODULE, Action.FETCH_PROJECT_USERS_ACTION, this.context, new Map()).then(currentUsers => this.currentUsers = currentUsers)
  }

  selectSuggestion(suggestion: User) {
    this.partialEmail = suggestion.email;
    this.suggestions = this.suggestions.filter(item => item != suggestion);
  }

}
</script>

<template>
  <div v-if="isActive">
    <span>Invite user to this stage:</span>&nbsp;
    <div class="user-input-container">
      <input class="user-input" type="text" v-model="partialEmail" @input="handleInput" @keyup.enter="handleSave"/>
      <ul class="suggestions" v-if="suggestions.length > 0">
        <li v-for="(suggestion, index) in suggestions" :key="index" @click="selectSuggestion(suggestion)">
          {{ suggestion.email }}
        </li>
      </ul>&nbsp;
    <button @click="handleSave" v-if="partialEmail.length > 0 && this.canInvite">Invite</button>
    </div>
  </div>
  <div v-if="currentUsers.length > 0">
    <span>Current users involved in this stage:</span>
    <ul>
      <li v-for="(user, index) in currentUsers" :key="index">{{ user.email }}</li>
    </ul>
  </div>
</template>

<style scoped>

.user-input-container {
  position: relative;
}

.user-input {
  width: 200px; /* Adjust width as needed */
}

.suggestions {
  list-style-type: none; /* Removes bullets */
  position: absolute;
  width: 200px; /* Adjust width to match the input field */
  padding: 0;
  margin: 0;
  border: 1px solid #ccc; /* Add border for the rectangle appearance */
  background-color: #fff; /* Add background color */
  border-radius: 5px; /* Optional: Add border-radius for rounded corners */
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2); /* Optional: Add box shadow for a raised effect */
}

</style>
