<script lang="ts">
import {Options, Vue} from "vue-class-component";
import '@/assets/styles/table.css'
import {PmRequestParameter, Project, ProjectBridgeheadState, UserProjectState} from "@/services/projectManagerBackendService";
import {
  Action,
  ActionButton,
  Bridgehead,
  Module,
  ProjectManagerBackendService,
  ProjectManagerContext,
  ProjectRole,
  Results,
  User
} from "@/services/projectManagerBackendService";
import CredentialsSharingTool from "@/components/CredentialsSharingTool.vue";
import UserAndEmail from "@/components/UserAndEmail.vue";
import ProjectManagerButton from "@/components/ProjectManagerButton.vue";
import StatusDot from "@/components/StatusDot.vue";
import {EmailRole} from "@/services/emailRole";
import {PropType, watch} from "vue";
import {DEFAULT_APP_NAME, getAppName} from "@/services/appName";
import {getConfig} from "@/services/configLoader";


@Options({
  name: "ResultsBox",
  components: {ProjectManagerButton, UserAndEmail, CredentialsSharingTool, StatusDot},
  props: {
    callRefreshContext: {type: Function as unknown as () => () => void, required: true},
    // The project as a whole (no bridgehead); the bridgeheads' results are asked with each bridgehead
    // (docs/bridgehead-context.md)
    context: {type: Object as PropType<ProjectManagerContext>, required: true},
    bridgeheads: {type: Array as PropType<Bridgehead[]>, required: true},
    projectManagerBackendService: {type: Object as PropType<ProjectManagerBackendService>, required: true},
    project: {type: Object as PropType<Project>, required: true},
    currentUsers: {type: Array as PropType<User[]>, required: true},
    projectRoles: {type: Array as PropType<ProjectRole[]>, required: true},
  },
  emits: ['pending-review']
})
export default class ResultsBox extends Vue {

  // For templates:
  // noinspection JSUnusedGlobalSymbols
  readonly callRefreshContext!: () => void;
  readonly context!: ProjectManagerContext;
  readonly bridgeheads!: Bridgehead[];
  readonly projectManagerBackendService!: ProjectManagerBackendService;
  readonly project!: Project;
  readonly currentUsers!: User[];
  readonly projectRoles!: ProjectRole[];

  readonly RESULTS_ALREADY_SENT = 'Results already sent';
  readonly UserProjectState = UserProjectState;
  readonly ProjectBridgeheadState = ProjectBridgeheadState;

  resultsUrl = "";
  projectResults: Results | undefined = undefined;
  projectBridgeheadResults: Results[] | undefined = undefined;
  canSendProjectResults = false;
  canSendProjectBridgeheadResults = false;
  // The bridgeheads whose results URL this user may send (a bridgehead admin, for each bridgehead they administrate),
  // and the one chosen in the sender
  sendBridgeheads: Bridgehead[] = [];
  sendBridgehead: Bridgehead | undefined = undefined;
  canAcceptProjectResults = false;
  canAcceptProjectBridgeheadResults = false;
  // The bridgeheads whose results this user may accept, by id: accepting acts on one bridgehead, so it is allowed per
  // bridgehead (docs/bridgehead-context.md)
  acceptBridgeheads: string[] = [];
  resultsToShow: Results[] = [];
  isPopupVisible = false;
  actionButtons: ActionButton[] = [];
  emailRecipients: EmailRole[] = [];
  isExpanded = false;
  // Configured application name for the "Read more" texts.
  appName = DEFAULT_APP_NAME;
  // The Credentials Sharing Tool is a proposal, not an approved feature:
  // shown only where the frontend variable CREDENTIALS_SHARING_TOOL_ENABLED is "true".
  credentialsSharingEnabled = false;

  mounted() {
    getAppName().then(name => this.appName = name);
    getConfig()
        .then(config => this.credentialsSharingEnabled = config.CREDENTIALS_SHARING_TOOL_ENABLED === 'true')
        .catch(() => this.credentialsSharingEnabled = false);
    watch(
        () => this.projectManagerBackendService,
        () => {
          this.resetEmailRecipients();
          this.resetCanAccept();
          this.resetCanSend();
          this.resetResults();
        },
        {immediate: true}
    );
    watch(() => this.bridgeheads, () => {
      this.resetCanAccept();
      this.resetCanSend();
      this.resetResults();
    });
    // Tells the page which sites wait for this user's decision, so the TODO
    // panel can say so instead of "No action is required".
    watch(() => this.pendingReviewSites,
        (sites) => this.$emit('pending-review', sites),
        {immediate: true, deep: true});
  }

  // Rows whose Accept button is shown: results that wait for this user to
  // review and accept them (or request changes).
  get pendingReviewSites(): string[] {
    return this.resultsToShow
        .filter(results => this.actionButtons.some(button =>
            button.action.includes('ACCEPT') && this.isButtonVisible(button, results)))
        .map(results => results.humanReadableBridgehead ?? results.bridgehead ?? '')
        .filter(site => site.length > 0);
  }

  // Whether the rows are the final user's results (else the sites' results):
  // the same rule as updateResultsToShow, so the header columns (Site /
  // Bridgehead Admin vs Final User) always match the rows below them.
  get showsProjectResults(): boolean {
    return this.isFinalUser() ? !!this.projectResults : !!this.projectResults?.url;
  }

  // The Actions column only when some row has a button to show.
  get hasVisibleActions(): boolean {
    return this.resultsToShow.some(results =>
        this.actionButtons.some(button => this.isButtonVisible(button, results)));
  }

  // Method to toggle the visibility
  toggleReadMore() {
    this.isExpanded = !this.isExpanded;
  }

  projectResultsButtons = [
    {
      module: Module.PROJECT_RESULTS_MODULE, action: Action.ACCEPT_PROJECT_RESULTS_URL_ACTION,
      text: "Accept", withMessage: false, cssClass: "btn btn-primary",
    },
    {
      module: Module.PROJECT_RESULTS_MODULE, action: Action.REJECT_PROJECT_RESULTS_URL_ACTION,
      text: "Reject", withMessage: true, messageRequired: true, cssClass: "btn btn-outline-danger",
    },
    {
      module: Module.PROJECT_RESULTS_MODULE, action: Action.REQUEST_CHANGES_IN_PROJECT_RESULTS_URL_ACTION,
      text: "Request Changes", withMessage: true, messageRequired: true, cssClass: "btn btn-outline-primary"
    }
  ] as ActionButton[];

  projectBridgeheadResultsButtons = [
    {
      module: Module.PROJECT_RESULTS_MODULE, action: Action.ACCEPT_PROJECT_BRIDGEHEAD_RESULTS_URL_ACTION,
      text: "Accept", withMessage: false, cssClass: "btn btn-primary",
    },
    {
      module: Module.PROJECT_RESULTS_MODULE, action: Action.REJECT_PROJECT_BRIDGEHEAD_RESULTS_URL_ACTION,
      text: "Reject", withMessage: true, messageRequired: true, cssClass: "btn btn-outline-danger",
    },
    {
      module: Module.PROJECT_RESULTS_MODULE, action: Action.REQUEST_CHANGES_IN_PROJECT_BRIDGEHEAD_RESULTS_URL_ACTION,
      text: "Request Changes", withMessage: true, messageRequired: true, cssClass: "btn btn-outline-primary"
    }
  ] as ActionButton[];


  openCredentialsSharingTool(): void {
    this.isPopupVisible = true;
  }

  resetEmailRecipients(): void {
    this.emailRecipients = (this.project?.creatorEmail) ? [new EmailRole(this.project?.creatorEmail, ProjectRole.CREATOR)] : [];
    this.currentUsers.forEach(currentUser => {
      this.emailRecipients.push(new EmailRole(currentUser.email, currentUser.projectRole));
    });
  }

  closePopup(): void {
    this.isPopupVisible = false;
  }

  resetCanSend() {
    this.canSendProjectResults = false;
    this.canSendProjectBridgeheadResults = false;
    this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_RESULTS_MODULE, Action.ADD_PROJECT_RESULTS_URL_ACTION, this.context).then(condition => {
      this.canSendProjectResults = condition;
    });
    this.fetchBridgeheadsWhereActive(Action.ADD_PROJECT_BRIDGEHEAD_RESULTS_URL_ACTION).then(bridgeheads => {
      this.sendBridgeheads = bridgeheads;
      if (!bridgeheads.some(bridgehead => bridgehead.bridgehead === this.sendBridgehead?.bridgehead)) {
        this.sendBridgehead = bridgeheads[0];
      }
      this.canSendProjectBridgeheadResults = bridgeheads.length > 0;
    });
  }

  // The bridgeheads where the action is allowed, each asked with its own context
  async fetchBridgeheadsWhereActive(action: Action): Promise<Bridgehead[]> {
    const active = await Promise.all(this.bridgeheads.map(bridgehead => this.projectManagerBackendService
        .isModuleActionActive(Module.PROJECT_RESULTS_MODULE, action, this.createContext(bridgehead))));
    return this.bridgeheads.filter((_bridgehead, index) => active[index]);
  }

  createContext(bridgehead: Bridgehead): ProjectManagerContext {
    return new ProjectManagerContext(this.context.projectCode, bridgehead);
  }

  areThereFinalUsers(): boolean {
    return this.currentUsers?.length > 0 || this.isFinalUser();
  }

  resetCanAccept() {
    this.canAcceptProjectResults = false;
    this.canAcceptProjectBridgeheadResults = false;
    if (this.areThereFinalUsers()) { // It makes only sense if there are final users
      this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_RESULTS_MODULE, Action.ACCEPT_PROJECT_RESULTS_URL_ACTION, this.context).then(condition => {
        this.canAcceptProjectResults = condition;
        this.updateActionButtons();
      });
    }
    this.fetchBridgeheadsWhereActive(Action.ACCEPT_PROJECT_BRIDGEHEAD_RESULTS_URL_ACTION).then(bridgeheads => {
      this.acceptBridgeheads = bridgeheads.map(bridgehead => bridgehead.bridgehead);
      this.canAcceptProjectBridgeheadResults = bridgeheads.length > 0;
      this.updateActionButtons();
    });
  }

  resetResults() {
    this.projectResults = undefined;
    this.projectBridgeheadResults = undefined;
    if (this.areThereFinalUsers()) { // It makes only sense if there are final users
      this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_RESULTS_MODULE, Action.FETCH_PROJECT_RESULTS_ACTION, this.context).then(condition => {
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
    this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_RESULTS_MODULE, Action.FETCH_PROJECT_BRIDGEHEAD_RESULTS_ACTION, this.context).then(condition => {
      if (condition) {
        this.projectManagerBackendService.fetchData(Module.PROJECT_RESULTS_MODULE, Action.FETCH_PROJECT_BRIDGEHEAD_RESULTS_ACTION, this.context, new Map()).then(results => {
          if (results) {
            this.projectBridgeheadResults = results;
            this.updateResultsToShow();
          }
        });
      }
    });
    // A bridgehead admin: the results of each bridgehead they administrate
    this.fetchBridgeheadsWhereActive(Action.FETCH_PROJECT_BRIDGEHEAD_RESULTS_FOR_OWN_BRIDGEHEAD_ACTION).then(async bridgeheads => {
      if (bridgeheads.length === 0) return;
      const results = await Promise.all(bridgeheads.map(bridgehead => this.projectManagerBackendService.fetchData(
          Module.PROJECT_RESULTS_MODULE, Action.FETCH_PROJECT_BRIDGEHEAD_RESULTS_FOR_OWN_BRIDGEHEAD_ACTION,
          this.createContext(bridgehead), new Map()) as Promise<Results | undefined>));
      this.projectBridgeheadResults = results.filter((result): result is Results => !!result);
      this.updateResultsToShow();
    });
  }

  updateResultsToShow() {
    // Update resultsToShow based on the priority of projectResults and projectBridgeheadResults
    if (this.isFinalUser()) { // If it is a final user, they can see all results.
      const tempResults = [];
      if (this.projectResults) {
        tempResults.push(this.projectResults);
      }
      if (this.projectBridgeheadResults) {
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
    this.updateActionButtons();
  }

  // The buttons belong to the rows that are shown (showsProjectResults):
  // choosing them by "may accept project results" alone gave a site's row the
  // project-level Accept, which accepted nothing for that site.
  updateActionButtons() {
    const buttons = this.showsProjectResults
        ? (this.canAcceptProjectResults ? this.projectResultsButtons : [])
        : (this.canAcceptProjectBridgeheadResults ? this.projectBridgeheadResultsButtons : []);
    if (this.actionButtons !== buttons) {
      this.actionButtons = buttons;
    }
  }

  sendResults(resultsUrl: string) {
    if (this.canSendProjectResults) {
      this.sendProjectResults(resultsUrl);
    } else if (this.canSendProjectBridgeheadResults) {
      this.sendProjectBridgeheadResults(resultsUrl);
    }
  }

  sendProjectResults(resultsUrl: string) {
    if (resultsUrl && this.canSendProjectResults) {
      this.projectManagerBackendService.fetchData(Module.PROJECT_RESULTS_MODULE, Action.ADD_PROJECT_RESULTS_URL_ACTION, this.context, new Map([[PmRequestParameter.RESULTS_URL, resultsUrl]])).then(() => {
        this.resetResults();
      });
    }
  }

  sendProjectBridgeheadResults(resultsUrl: string) {
    if (resultsUrl && this.canSendProjectBridgeheadResults && this.sendBridgehead) {
      this.projectManagerBackendService.fetchData(Module.PROJECT_RESULTS_MODULE, Action.ADD_PROJECT_BRIDGEHEAD_RESULTS_URL_ACTION, this.createContext(this.sendBridgehead), new Map([[PmRequestParameter.RESULTS_URL, resultsUrl]])).then(() => {
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
    // A bridgehead's results: only where that bridgehead allows this user to accept them
    if (!this.showsProjectResults && !this.acceptBridgeheads.includes(results.bridgehead)) {
      return false;
    }
    if (results.creatorState === UserProjectState.ACCEPTED && actionButton.action.includes('ACCEPT')) {
      return false;
    }
    return !(results.creatorState === UserProjectState.REJECTED && actionButton.action.includes('REJECT'));

  }

  // Project results act on the project; a site's results on that site.
  fetchButtonContext(results: Results) {
    if (this.showsProjectResults) {
      return this.context;
    }
    const bridgehead: Bridgehead = {"bridgehead": results.bridgehead, "projectCode": this.context.projectCode};
    return new ProjectManagerContext(this.context.projectCode, bridgehead);
  }

  fetchUserAccess(results: Results) {
    return results.bridgeheadAdminState ? results.bridgeheadAdminState : results.finalUserState;
  }

  fetchCreatorState(results: Results) {
    // The access to the row's results: the bridgehead admin's (ProjectBridgeheadState) or the final user's (UserProjectState)
    return (this.fetchUserAccess(results) === UserProjectState.ACCEPTED) ? results.creatorState : UserProjectState.CREATED;
  }

  isFinalUser(): boolean {
    return this.projectRoles.includes(ProjectRole.FINAL);
  }

  // Of the results this user sends: the project's, or those of the bridgehead chosen in the sender
  areResultsAlreadyMarkedAsSent(): boolean {
    const results = (!this.canSendProjectResults && this.sendBridgehead)
        ? this.resultsToShow.find(result => result.bridgehead === this.sendBridgehead?.bridgehead)
        : this.resultsToShow[0];
    return results?.url == this.RESULTS_ALREADY_SENT;
  }

  // The context of the results this user sends (the email template names the bridgehead)
  get sendContext(): ProjectManagerContext {
    return (!this.canSendProjectResults && this.sendBridgehead) ? this.createContext(this.sendBridgehead) : this.context;
  }

}
</script>

<template>
  <div v-if="canSendProjectResults || canSendProjectBridgeheadResults" class="results-sender">
    <!-- Text field for user input -->
    <div v-if="projectResults?.finalUserState !== UserProjectState.ACCEPTED && projectResults?.bridgeheadAdminState !== ProjectBridgeheadState.ACCEPTED">
      <p>Please review and accept the results in the 'Actions' section. Once accepted, we recommend securing the results
        URL with a password before sharing it with the request applicant, either through this interface or, if
        necessary,
        via other communication methods such as email or messaging.</p>
    </div>
    <div v-else>
      <p>Thank you for accepting the results. Please secure the results URL with a password before sharing it with the
        request applicant, either through this interface or, if necessary, via other communication methods such as email
        or messaging.</p>
    </div>
    <!-- Button to directly call sendProjectResults -->
    <div v-if="!canSendProjectResults && sendBridgeheads.length > 1" class="results-send-bridgehead">
      <label :for="`results-send-bridgehead-${$.uid}`">For:</label>
      <select :id="`results-send-bridgehead-${$.uid}`" v-model="sendBridgehead" class="form-select form-select-sm">
        <option v-for="bridgehead in sendBridgeheads" :key="bridgehead.bridgehead" :value="bridgehead">{{ bridgehead.humanReadable ?? bridgehead.bridgehead }}</option>
      </select>
    </div>
    <div class="results-url-sender" v-if="canSendProjectResults || canSendProjectBridgeheadResults">
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
    <div v-if="credentialsSharingEnabled">
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
              <li>The URL for accessing cloud files is sent via the {{ appName }} SMTP server and can be
                found in the {{ appName }}.
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
            {{ appName }}, where the file can be securely downloaded.
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
            :context="sendContext"
            :project-roles="projectRoles"
        />
      </div>
    </div>
  </div>
  <div>
    <div v-if="pendingReviewSites.length" class="review-notice" role="status">
      <i class="bi bi-hand-index-thumb review-notice-icon" aria-hidden="true"></i>
      <div>
        <strong>Results ready for your review: {{ pendingReviewSites.join(', ') }}.</strong>
        Open the link in the table, check the data, and click <b>Accept</b> if everything is fine,
        or <b>Request Changes</b> if something is missing.
      </div>
    </div>
    <div v-if="resultsToShow.length" class="table-scroll">
      <table class="pm-table results-table">
        <thead>
        <tr>
          <!-- One person column per row: the final user sees their own results and the bridgeheads' in one table,
               so always the Site column and one column for whoever sent the row's results. -->
          <th v-if="!showsProjectResults || isFinalUser()">Site</th>
          <th v-if="!showsProjectResults && !isFinalUser()">Bridgehead Admin</th>
          <th v-if="showsProjectResults && !isFinalUser()">Final User</th>
          <th v-if="isFinalUser()">Final User / Bridgehead Admin</th>
          <th>URL</th>
          <th class="status-column">User Access</th>
          <th class="status-column">Applicant Acceptance</th>
          <th v-if="hasVisibleActions">Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="result in resultsToShow" :key="result.bridgehead">
          <td v-if="!showsProjectResults || isFinalUser()" class="nowrap-cell">{{ result.humanReadableBridgehead }}</td>
          <td class="nowrap-cell">
            <UserAndEmail
                :first-name="result.firstName"
                :last-name="result.lastName"
                :email="result.email"
            />
          </td>
          <td class="url-cell"><a v-if="isUrl(result?.url)" :href="result.url" target="_blank" class="result-url"
                 :title="result.url">{{ result.url }}</a>
            <!-- Wraps within the (flexible) URL column rather than running into
                 the next one. -->
            <div v-if="!isUrl(result?.url)">{{ result.url }}</div>
          </td>
          <td>
            <div class="states-circle-container">
              <StatusDot :state="fetchUserAccess(result)" :title="fetchUserAccess(result)" />
            </div>
          </td>
          <td>
            <div class="states-circle-container">
              <StatusDot :state="fetchCreatorState(result)" :title="fetchCreatorState(result)" />
            </div>
          </td>
          <td v-if="hasVisibleActions">
            <div class="result-actions">
              <ProjectManagerButton v-for="(button, index) in actionButtons" :key="index"
                                    :module="button.module" :action="button.action"
                                    :context="fetchButtonContext(result)" :call-refresh-context="this.callRefreshContext"
                                    :text="button.text"
                                    :button-class="button.cssClass" :with-message="button.withMessage"
                                    :message-required="button.messageRequired"
                                    :visibility="isButtonVisible(button, result)"
                                    :project-manager-backend-service="projectManagerBackendService"/>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
    <!-- Show message if no results are available -->
    <p v-else>No results available</p>
  </div>
</template>

<style scoped>
.table-scroll {
  overflow-x: auto;
}

/* Body text at the app's size; the gap belongs below each paragraph, so the
 * first one starts at the panel's padding. */
p {
  margin: 0 0 var(--space-3);
  font-size: 14px;
  line-height: 1.45;
  color: #666;
}

.text-field {
  flex: 1 1 200px;
  max-width: 420px;
  min-width: 0;
  padding: 8px;
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
  max-width: 800px;
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

/* Site names and short status texts ("Not authorized yet") read as one unit;
 * the table scrolls sideways (.table-scroll) before they break. */
.nowrap-cell {
  white-space: nowrap;
}

/* A long results URL stays on one line, shortened with an ellipsis; the full
 * address is the link and its tooltip. The URL column takes whatever width
 * the other columns leave (width 100% + max-width 0), so the table always
 * fits its card. */
.results-table .url-cell {
  width: 100%;
  max-width: 0;
  min-width: 6rem;
}
.result-url {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Six columns in a card: a tighter cell inset than the shared 22px, so the
 * table fits a laptop-width card without scrolling. */
.results-table th,
.results-table td {
  padding-left: var(--space-3);
  padding-right: var(--space-3);
}

/* The two status columns only hold a dot: their headers may take two lines
 * rather than widening the table past the card. */
.results-table th.status-column {
  white-space: normal;
  text-align: center;
}

/* Results waiting for the user's decision: stands out from the grey body text
 * so the Accept step is not missed at the bottom of the page. */
.review-notice {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border: 1px solid #f0c36d;
  border-radius: 6px;
  background: #fff7e6;
  color: #5c3d00;
  font-size: 14px;
  line-height: 1.45;
}
.result-actions {
  /* Accept / Block / Request Changes one under the other: side by side they
   * are wider than the card and the table had to scroll to reach them. */
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-1);
}
.result-actions :deep(.btn) {
  width: 100%;
  white-space: nowrap;
  font-size: 14px;
  padding: var(--space-1) var(--space-3);
}
.review-notice-icon {
  margin-top: 0.1rem;
  font-size: 1rem;
}

.results-sender {
  margin-bottom: var(--space-5);
}

/* The bridgehead whose results URL is sent, for an admin of several bridgeheads: like the "For:" field of the
 * uploads. */
.results-send-bridgehead {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.results-send-bridgehead .form-select {
  width: fit-content;
}

.results-url-sender {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

</style>
