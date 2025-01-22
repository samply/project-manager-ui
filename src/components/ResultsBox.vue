<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {Prop, Watch} from "vue-property-decorator";
import {
  Action,
  ActionButton,
  Bridgehead,
  Module,
  Project,
  ProjectManagerBackendService,
  ProjectManagerContext,
  ProjectRole,
  Results,
  User
} from "@/services/projectManagerBackendService";
import CredentialsSharingTool from "@/components/CredentialsSharingTool.vue";
import "@/assets/styles/state-circle.css"
import UserAndEmail from "@/components/UserAndEmail.vue";
import ProjectManagerButton from "@/components/ProjectManagerButton.vue";
import {EmailRole} from "@/services/emailRole";


@Options({
  name: "ResultsBox",
  components: {ProjectManagerButton, UserAndEmail, CredentialsSharingTool}
})
export default class ResultsBox extends Vue {
  @Prop({type: Function, required: true}) readonly callRefrehContext!: () => void;
  @Prop() readonly context!: ProjectManagerContext;
  @Prop() readonly projectManagerBackendService!: ProjectManagerBackendService;
  @Prop() readonly project!: Project;
  @Prop() readonly currentUsers!: User[];
  @Prop() readonly projectRoles!: ProjectRole[];

  readonly RESULTS_ALREADY_SENT = 'Results already sent';

  resultsUrl = "";
  projectResults: Results | undefined = undefined;
  projectBridgeheadResults: Results[] | undefined = undefined;
  canSendProjectResults = false;
  canSendProjectBridgheadResults = false;
  canAcceptProjectResults = false;
  canAcceptProjectBridgheadResults = false;
  resultsToShow: Results[] = [];
  isPopupVisible = false;
  actionButtons: ActionButton[] = [];
  emailRecipients: EmailRole[] = [];
  // Reactive property to control the visibility of the long message
  isExpanded = false;


  // Method to toggle the visibility
  toggleReadMore() {
    this.isExpanded = !this.isExpanded;
  }

  projectResultsButtons = [
    {
      module: Module.PROJECT_RESULTS_MODULE, action: Action.ACCEPT_PROJECT_RESULTS_URL_ACTION,
      text: "Accept", withMessage: false, cssClass: "btn btn-primary mr-2",
    },
    {
      module: Module.PROJECT_RESULTS_MODULE, action: Action.REJECT_PROJECT_RESULTS_URL_ACTION,
      text: "Block", withMessage: true, cssClass: "btn btn-danger btn-secondary mr-2",
    },
    {
      module: Module.PROJECT_RESULTS_MODULE, action: Action.REQUEST_CHANGES_IN_PROJECT_RESULTS_URL_ACTION,
      text: "Request Changes", withMessage: true, cssClass: "btn btn-primary mr-2"
    }
  ] as ActionButton[];

  projectBridgeheadResultsButtons = [
    {
      module: Module.PROJECT_RESULTS_MODULE, action: Action.ACCEPT_PROJECT_BRIDGEHEAD_RESULTS_URL_ACTION,
      text: "Accept", withMessage: false, cssClass: "btn btn-primary mr-2",
    },
    {
      module: Module.PROJECT_RESULTS_MODULE, action: Action.REJECT_PROJECT_BRIDGEHEAD_RESULTS_URL_ACTION,
      text: "Block", withMessage: true, cssClass: "btn btn-danger btn-secondary mr-2",
    },
    {
      module: Module.PROJECT_RESULTS_MODULE, action: Action.REQUEST_CHANGES_IN_PROJECT_BRIDGEHEAD_RESULTS_URL_ACTION,
      text: "Request Changes", withMessage: true, cssClass: "btn btn-primary mr-2"
    }
  ] as ActionButton[];


  openCredentialsSharingTool(): void {
    this.isPopupVisible = true;
  }

  resetEmailRecipients(): void {
    this.emailRecipients = (this.project?.creatorEmail) ? [new EmailRole(this.project?.creatorEmail, 'CREATOR')] : [];
    this.currentUsers.forEach(currentUser => {
      this.emailRecipients.push(new EmailRole(currentUser.email, currentUser.projectRole));
    });
  }

  closePopup(): void {
    this.isPopupVisible = false;
  }

  @Watch('projectManagerBackendService', {immediate: true})
  onProjectManagerBackendServiceChange(newValue: ProjectManagerBackendService, oldValue: ProjectManagerBackendService) {
    this.resetEmailRecipients();
    this.resetCanAccept();
    this.resetCanSend();
    this.resetResults();
  }

  resetCanSend() {
    this.canSendProjectResults = false;
    this.canSendProjectBridgheadResults = false;
    this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_RESULTS_MODULE, Action.ADD_PROJECT_RESULTS_URL_ACTION).then(condition => {
      this.canSendProjectResults = condition;
    });
    this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_RESULTS_MODULE, Action.ADD_PROJECT_BRIDGHEAD_RESULTS_URL_ACTION).then(condition => {
      this.canSendProjectBridgheadResults = condition;
    });
  }

  areThereFinalUsers(): boolean{
    return this.currentUsers?.length > 0 || this.isFinalUser();
  }

  resetCanAccept() {
    this.canAcceptProjectResults = false;
    this.canAcceptProjectBridgheadResults = false;
    if (this.areThereFinalUsers()) { // It makes only sense if there are final users
      this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_RESULTS_MODULE, Action.ACCEPT_PROJECT_RESULTS_URL_ACTION).then(condition => {
        this.canAcceptProjectResults = condition;
        this.updateActionButtons();
      });
    }
    this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_RESULTS_MODULE, Action.ACCEPT_PROJECT_BRIDGEHEAD_RESULTS_URL_ACTION).then(condition => {
      this.canAcceptProjectBridgheadResults = condition;
      this.updateActionButtons();
    });
  }

  resetResults() {
    this.projectResults = undefined;
    this.projectBridgeheadResults = undefined;
    if (this.areThereFinalUsers()) { // It makes only sense if there are final users
      this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_RESULTS_MODULE, Action.FETCH_PROJECT_RESULTS_ACTION).then(condition => {
        if (condition) {
          this.projectManagerBackendService.fetchData(Module.PROJECT_RESULTS_MODULE, Action.FETCH_PROJECT_RESULTS_ACTION, this.context, new Map()).then(results => {
            if (results) {
              this.projectResults = results;
              this.updateResultsToShow();
            }
          });
        }
      });
    }
    this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_RESULTS_MODULE, Action.FETCH_PROJECT_BRIDGEHEAD_RESULTS_ACTION).then(condition => {
      if (condition) {
        this.projectManagerBackendService.fetchData(Module.PROJECT_RESULTS_MODULE, Action.FETCH_PROJECT_BRIDGEHEAD_RESULTS_ACTION, this.context, new Map()).then(results => {
          if (results) {
            this.projectBridgeheadResults = results;
            this.updateResultsToShow();
          }
        });
      }
    });
    this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_RESULTS_MODULE, Action.FETCH_PROJECT_BRIDGEHEAD_RESULTS_FOR_OWN_BRIDGEHEAD_ACTION).then(condition => {
      if (condition) {
        this.projectManagerBackendService.fetchData(Module.PROJECT_RESULTS_MODULE, Action.FETCH_PROJECT_BRIDGEHEAD_RESULTS_FOR_OWN_BRIDGEHEAD_ACTION, this.context, new Map()).then(results => {
          if (results) {
            this.projectBridgeheadResults = [results];
            this.updateResultsToShow();
          }
        });
      }
    });
  }

  updateResultsToShow() {
    // Update resultsToShow based on the priority of projectResults and projectBridgeheadResults
    if (this.isFinalUser()){ // If it is final user, they can see all results.
      const tempResults = [];
      if (this.projectResults){
        tempResults.push(this.projectResults);
      }
      if (this.projectBridgeheadResults){
        tempResults.push(...this.projectBridgeheadResults);
      }
      this.resultsToShow = tempResults;
    } else {
      if (this.projectResults && this.projectResults.url) {
        this.resultsToShow = [this.projectResults];
      } else {
        this.resultsToShow = this.projectBridgeheadResults || [];
      }
    }
  }

  updateActionButtons() {
    if (this.canAcceptProjectResults) {
      if (this.actionButtons !== this.projectResultsButtons) {
        this.actionButtons = this.projectResultsButtons;
      }
    } else if (this.canAcceptProjectBridgheadResults) {
      if (this.actionButtons !== this.projectBridgeheadResultsButtons) {
        this.actionButtons = this.projectBridgeheadResultsButtons;
      }
    }
  }

  sendResults(resultsUrl: string){
    if (this.canSendProjectResults){
      this.sendProjectResults(resultsUrl);
    } else if (this.canSendProjectBridgheadResults){
      this.sendProjectBridgeheadResults(resultsUrl);
    }
  }

  sendProjectResults(resultsUrl: string) {
    if (resultsUrl && this.canSendProjectResults) {
      this.projectManagerBackendService.fetchData(Module.PROJECT_RESULTS_MODULE, Action.ADD_PROJECT_RESULTS_URL_ACTION, this.context, new Map([['results-url', resultsUrl]])).then(response => {
        this.resetResults();
      });
    }
  }

  sendProjectBridgeheadResults(resultsUrl: string) {
    if (resultsUrl && this.canSendProjectBridgheadResults) {
      this.projectManagerBackendService.fetchData(Module.PROJECT_RESULTS_MODULE, Action.ADD_PROJECT_BRIDGHEAD_RESULTS_URL_ACTION, this.context, new Map([['results-url', resultsUrl]])).then(response => {
        this.resetResults();
      });
    }
  }

  isUrl(url: string): boolean {
    return url !== undefined && url.includes('http');
  }

  isButtonVisible(actionButton: ActionButton, results: Results): boolean {
    if (!this.isUrl(results?.url) && results?.url != this.RESULTS_ALREADY_SENT) {
      return false;
    }
    if (results.creatorState === 'ACCEPTED' && actionButton.action.includes('ACCEPT')) {
      return false;
    }
    if (results.creatorState === 'REJECTED' && actionButton.action.includes('REJECT')) {
      return false;
    }
    return true;
  }

  fetchButtonContext(results: Results){
    if (this.canAcceptProjectResults){
      return this.context;
    }
    if (this.canAcceptProjectBridgheadResults){
      const bridgehead: Bridgehead = {"bridgehead" : results.bridgehead, "projectCode" : this.context.projectCode, "creatorState" : null, "state": null, "queryState": null, "humanReadable": null, "modifiedAt": null};
      return new ProjectManagerContext(this.context.projectCode, bridgehead);
    }
  }

  fetchUserAccess(results: Results){
    return results.bridgeheadAdminState ? results.bridgeheadAdminState : results.finalUserState;
  }

  fetchCreatorState(results: Results){
    return (this.fetchUserAccess(results) === 'ACCEPTED') ? results.creatorState : 'CREATED';
  }

  isFinalUser(): boolean{
    return this.projectRoles.includes(ProjectRole.FINAL);
  }

  areResultsAlreadyMarkedAsSent(): boolean{
    return this.resultsToShow?.length > 0 && this.resultsToShow[0].url == this.RESULTS_ALREADY_SENT;
  }

}
</script>

<template>
  <div v-if="canSendProjectResults || canSendProjectBridgheadResults">
    <!-- Text field for user input -->
    <div v-if="projectResults?.finalUserState !== 'ACCEPTED' && projectResults?.bridgeheadAdminState !== 'ACCEPTED'">
      <p>Please review and accept the results in the 'Actions' section. Once accepted, we recommend securing the results
        URL with a password before sharing it with the request applicant, either through this interface or, if necessary,
        via other communication methods such as email or messaging.</p>
    </div>
    <div v-else>
      <p>Thank you for accepting the results. Please secure the results URL with a password before sharing it with the
        request applicant, either through this interface or, if necessary, via other communication methods such as email
        or messaging.</p>
    </div>
    <!-- Button to directly call sendProjectResults -->
    <div class="results-url-sender" v-if="canSendProjectResults || canSendProjectBridgheadResults">
      <input
          type="text"
          v-model="resultsUrl"
          placeholder="Enter the results URL"
          class="text-field"
      />
      <button @click="sendResults(resultsUrl)" class="send-button">Send Results URL</button>
      <button v-if="!areResultsAlreadyMarkedAsSent()" @click="sendResults(RESULTS_ALREADY_SENT)"
              class="send-button">
        Mark Results as Sent
      </button>
    </div>
    <div>
      <!-- Short Message -->
      <p>
        For securely sharing passwords or authentication methods with authorized recipients, an optional
        <strong>Credentials Sharing Tool</strong> is available. It generates email templates that separate
        credentials from file URLs, enhancing security without automatically sending credentials.
        <!-- Read More Link -->
        <span
            class="read-more-link"
            @click="toggleReadMore">
        {{ isExpanded ? 'Read less' : 'Read more' }}
      </span>
      </p>

      <!-- Long Message -->
      <div v-if="isExpanded">
        <p>This tool provides additional benefits and functionality to streamline secure sharing:</p>
        <ul>
          <li>
            <strong>Optional Use:</strong> You can share passwords or authentication methods through other means if
            preferred.
          </li>
          <li><strong>Authorized Recipients:</strong> Ensures only approved individuals receive access information.</li>
          <li>
            <strong>Comprehensive Instructions:</strong> Prepares detailed email templates with clear instructions for
            recipients.
          </li>
          <li>
            <strong>Separation of Credentials and File URLs:</strong>
            <ul>
              <li>The URL for accessing cloud files is sent via the Data Science Orchestrator's SMTP server and can be
                found in the Data Science Orchestrator.
              </li>
              <li>
                The password (or other authentication details) is sent through the results provider's SMTP server,
                ensuring they remain
                separate.
              </li>
            </ul>
          </li>
          <li>
            <strong>Secure File Access:</strong> Instead of sharing the direct cloud file URL, the email template
            includes a link to the
            Data Science Orchestrator, where the file can be securely downloaded.
          </li>
          <li>
            <strong>Flexible Formats:</strong> Offers multiple email formats and solutions to simplify sharing and
            enhance usability.
          </li>
        </ul>
      </div>
    </div>
    <button @click="openCredentialsSharingTool" class="btn btn-info">
      Open Credentials Sharing Tool
    </button>

    <!-- Credentials Sharing Tool Popup -->
    <div v-if="isPopupVisible" class="modal">
      <div class="modal-content">
        <button @click="closePopup" class="close-btn">&times;</button>
        <CredentialsSharingTool
            :project-manager-backend-service="projectManagerBackendService"
            :recipients-emails="emailRecipients"
            :context="context"
            :project-roles="projectRoles"
        />
      </div>
    </div>
    <br>
  </div>
  <div>
    <br>
    <table v-if="resultsToShow.length">
      <thead>
      <tr>
        <th v-if="!projectResults">Site</th>
        <th v-if="!projectResults">Bridgehead Admin</th>
        <th v-if="projectResults && !isFinalUser()">Final User</th>
        <th v-if="isFinalUser()">Final User / Brigehead Admin</th>
        <th>URL</th>
        <th>User Access</th>
        <th>Applicant Acceptance</th>
        <th v-if="actionButtons.length > 0">Actions</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="result in resultsToShow" :key="result.bridgehead">
        <td v-if="!projectResults">{{ result.humanReadableBridgehead }}</td>
        <td>
          <UserAndEmail
              :first-name="result.firstName"
              :last-name="result.lastName"
              :email="result.email"
          />
        </td>
        <td><a v-if="isUrl(result?.url)" :href="result.url" target="_blank">{{ result.url }}</a>
          <div v-if="!isUrl(result?.url)">{{ result.url }}</div>
        </td>
        <td>
          <div class="states-circle-container">
            <div class="state_circle"
                 :class="fetchUserAccess(result)?.toLowerCase()"
                 :title="fetchUserAccess(result)"/>
          </div>
        </td>
        <td>
          <div class="states-circle-container">
            <div class="state_circle" :class="fetchCreatorState(result)?.toLowerCase()" :title="fetchCreatorState(result)"/>
          </div>
        </td>
        <td v-if="actionButtons.length > 0">
          <div style="display: flex">
            <ProjectManagerButton v-for="(button, index) in actionButtons" :key="index"
                                  :module="button.module" :action="button.action"
                                  :context="fetchButtonContext(result)" :call-refreh-context="this.callRefrehContext"
                                  :text="button.text"
                                  :button-class="button.cssClass" :with-message="button.withMessage"
                                  :visibility="isButtonVisible(button, result)"
                                  :project-manager-backend-service="projectManagerBackendService"/>
          </div>
        </td>
      </tr>
      </tbody>
    </table>
    <!-- Show message if no results are available -->
    <p v-else>No results available</p>
  </div>
</template>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f4f4f4;
}

.copy-icon {
  cursor: pointer;
  margin-left: 5px;
}

p {
  margin-top: 16px;
  font-size: 16px;
  color: #666;
}

.text-field {
  padding: 8px;
  margin-right: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.send-button {
  padding: 8px 16px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.send-button:hover {
  background-color: #0056b3;
}

.modal {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  max-width: 500px;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
}

.states-circle-container {
  display: flex;
  justify-content: center;
}

/* Custom style for the Read More link */
.read-more-link {
  font-style: italic;
  color: #007bff;
  cursor: pointer;
  text-decoration: underline;
  margin-left: 8px;
}

.read-more-link:hover {
  color: #0056b3;
}

.results-url-sender{
  display: flex;
  gap: 10px; /* Adds space between buttons */
}

</style>
