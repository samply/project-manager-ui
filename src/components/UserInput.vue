<script lang="ts">

import {Options, Vue} from "vue-class-component";
import {Prop, Watch} from "vue-property-decorator";
import {
  Action,
  Bridgehead,
  Module,
  Project,
  ProjectManagerContext,
  ProjectManagerBackendService, Explanation
} from "@/services/projectManagerBackendService";

interface User {
  email: string;
  firstName: string | null;
  lastName: string | null;
  bridgehead: string;
  humanReadableBridgehead: string | null;
  projectRole: string;
  projectState: string;
}

@Options({
  name: "UserInput",
  computed: {
    Action() {
      return Action
    }
  }
})
export default class UserInput extends Vue {
  @Prop() readonly projectManagerBackendService!: ProjectManagerBackendService;
  @Prop() readonly context!: ProjectManagerContext;
  @Prop() readonly project!: Project;
  @Prop() readonly bridgeheads!: Bridgehead[];
  @Prop() readonly todos?: Explanation;

  partialEmail = '';
  selectedBridgehead: Bridgehead | undefined = undefined;
  suggestions: User[] = [];
  isActive = false;
  currentUsers: User[] = [];
  canInvite = true;
  showSuggestions = false;

  @Watch('projectManagerBackendService', {immediate: true, deep: true})
  onContextChange(newValue: ProjectManagerBackendService, oldValue: ProjectManagerBackendService) {
    this.selectedBridgehead = this.bridgeheads[0];
    this.updateIsActive()
  }

  created() {
    this.selectedBridgehead = this.bridgeheads[0];
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
    for (let user of this.currentUsers) {
      if (user.email === this.partialEmail) {
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
    const context = (this.selectedBridgehead) ? this.createContext(this.selectedBridgehead) : this.context;
    this.projectManagerBackendService.fetchData(Module.USER_MODULE, action, context, params).then(result => {
      this.partialEmail = '';
      this.updateCurrentUsers();
    });
  }

  autocomplete(partialEmail: string) {
    const params = new Map<string, string>();
    if (partialEmail && partialEmail.length > 0) {
      params.set('partial-email', partialEmail);
      this.projectManagerBackendService.fetchData(Module.USER_MODULE, Action.FETCH_USERS_FOR_AUTOCOMPLETE_ACTION, this.createContext(this.selectedBridgehead), params).then(users => {
        this.suggestions = users;
        this.showSuggestions = true;
      });
    } else {
      this.suggestions = [];
      this.showSuggestions = false;
    }
  }

  updateCurrentUsers() {
    let index = 0;
    this.bridgeheads.forEach(bridgehead => this.projectManagerBackendService
        .fetchData(Module.USER_MODULE, Action.FETCH_PROJECT_USERS_ACTION, this.createContext(bridgehead), new Map())
        .then(currentUsers => {
          if (index == 0) {
            this.currentUsers = [];
          }
          index += 1;
          this.currentUsers.push(...currentUsers)
        }));
  }

  createContext(bridgehead: Bridgehead | undefined) {
    return (bridgehead) ? new ProjectManagerContext(this.context.projectCode, bridgehead) : this.context;
  }

  selectSuggestion(suggestion: User) {
    this.partialEmail = suggestion.email;
    this.suggestions = this.suggestions.filter(item => item != suggestion);
    this.showSuggestions = false;
  }

}
</script>

<template>
  <div v-if="isActive" class="button-group-box">
      <div class="button-group-label">
        Invite user to this stage:
        <span style="display: flex;flex-direction: row-reverse">
          <span v-if="todos?.get(Action.SET_DEVELOPER_USER_ACTION)" class="todo-circle-small">#{{todos?.get(Action.SET_DEVELOPER_USER_ACTION).number}}</span>
        </span>
      </div>

    <div class="user-input-container">
      <select v-model="selectedBridgehead" class="form-select">
        <option v-for="bridgehead in bridgeheads" :key="bridgehead.bridgehead" :value="bridgehead"
                :selected="bridgehead === selectedBridgehead">{{ bridgehead.humanReadable }}
        </option>
      </select>
      <div>
        <input class="user-input" type="text" v-model="partialEmail" @input="handleInput" @keyup.enter="handleSave" placeholder="user email"/>
        <ul class="suggestions" v-if="suggestions.length > 0 && showSuggestions">
          <li v-for="(suggestion, index) in suggestions" :key="index" @click="selectSuggestion(suggestion)">
            {{ suggestion.email }}
          </li>
        </ul>&nbsp;
        <button @click="handleSave" v-if="partialEmail.length > 0 && canInvite">Invite</button>
      </div>
    </div>
  </div>

  <div v-if="currentUsers.length > 0" class="button-group-box">
    <div class="button-group-label">Current users involved in this stage:</div>
    <div style="margin: 10px 20px 10px 0">
      <table class="user-table">
        <thead>
        <tr>
          <th>Email</th>
          <th v-if="bridgeheads.length > 0">Bridgehead</th>
          <th>State</th> <!-- New column for user state -->
        </tr>
        </thead>
        <tbody>
        <tr v-for="(user, index) in currentUsers" :key="index">
          <td>{{ user.email }}</td>
          <td v-if="bridgeheads.length > 0">{{ user.humanReadableBridgehead }}</td>
          <td>{{ user.projectState }}</td> <!-- Display user's state in the second column -->
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>

.user-input-container {
  position: relative;
  display: flex;
  margin: 10px 14px 20px 0;
}
.form-select {
  width: 300px;
  margin-right: 20px;
}
.user-input {
  width: 300px; /* Adjust width as needed */
  height: 38px;
  border: 1px solid #dee2e6;
  border-radius: 5px;
}

.suggestions {
  list-style-type: none; /* Removes bullets */
  position: absolute;
  width: 300px; /* Adjust width to match the input field */
  padding: 5px;
  margin: 0;
  border: 1px solid #ccc; /* Add border for the rectangle appearance */
  background-color: #fff; /* Add background color */
  border-radius: 5px; /* Optional: Add border-radius for rounded corners */
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2); /* Optional: Add box shadow for a raised effect */
}

.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th, .user-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.user-table th {
  background-color: #f2f2f2;
}
.button-group-box {
  border: 1px solid lightgrey;
  border-radius: 5px;
  padding: 0 0 18px 18px;
  width: fit-content;
  display: inline-block;
  margin-right: 2%;
  margin-top: 1%;
}
.button-group-label {
  border: 1px solid lightgrey;
  border-radius: 5px;
  width: fit-content;
  padding: 4px 10px;
  position: relative;
  top: -18px;
  background-color: #95c8dc;
  font-weight: bold;
  margin-right: 15px;
  display: flex;
}
.todo-circle-small {
  min-width: 22px;
  height: 22px;
  background-color:gold;
  color: #000;
  border: 1px solid black;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 10px;
  font-weight: bold;
  font-size: 9pt;
}
</style>
