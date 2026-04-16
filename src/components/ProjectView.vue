<template>
  <div class="main-menu">
    <div v-for="step in getMenuSteps()" class="menu-item" @click="currentMenuStep=step" :class="{ 'active': currentMenuStep===step }">
      {{step}}
    </div>
  </div>
  <div class="main-container">
    <div class="left-container" v-if="projectRoles && projectRoles.includes(ProjectRole.PROJECT_MANAGER_ADMIN)">
      <div class="box-header" style="padding-left:7%">Phase</div>
      <div class="vertical-stepper">
        <div v-for="(projectState, index) in getProjectStates()" :key="index" class="stepper-step">
          <div style="display: flex; flex-flow: row" :class="{ 'active-step': project?.state === projectState }">
            <div class="step-circle">
              <span>{{ index + 1 }}</span>
            </div>
            <div class="step-title">{{ projectState }}</div>
          </div>
          <div v-if="index < getProjectStates().length - 1" class="stepper-line"></div>
        </div>
      </div>
      <!--</div>-->
    </div>

    <div class="right-container">
      <div class="main-content">
        <div v-if="project?.state !== ProjectState.DRAFT && currentMenuStep==='Status'" class="info-container">
          <div class="box-header"><span>Status</span><img src="../assets/newsletter.png" width="40" height="40"> </div>

          <div style="padding: 2%">
            <div style="display:flex; flex-flow:row; justify-content: center; margin-bottom:10px;">
              <div class="card"
                   v-if="visibleBridgeheads && visibleBridgeheads.length === 1"
                   style="padding: 3px 20px;height: fit-content">
                <div class="card-body" style="padding: 0 0;">
                  <span style="padding: 0 0;">{{ context.bridgehead?.humanReadable }}</span>
                </div>
              </div>
            </div>
            <BridgeheadOverview v-if="visibleBridgeheads.length > 1"
                                :project-manager-backend-service="projectManagerBackendService"
                                :call-update-active-bridgehead="updateActiveBridgehead"
                                :context="context"
                                :project="project"
                                :exists-votum-for-all-bridgeheads="existsVotumForAllBridgeheads"
                                :bridgeheads="visibleBridgeheads"
                                :activeBridgehead="activeBridgehead"/>
            <br/>
            <table class="table table-bordered table-overview">
              <thead>
              <tr>
                <th class="status-table-header" scope="col">Data Request Number (DRN)</th>
                <th v-if="visibleBridgeheads?.length == 1" class="status-table-header" scope="col">Votum</th>
                <th
                    v-if="visibleBridgeheads?.length === 1"
                    v-for="type in getAllProjectTypes(project)"
                    :key="type"
                    class="status-table-header"
                    scope="col"
                >
                  Teiler ({{ type }})
                </th>
                <th v-if="visibleBridgeheads?.length == 1" class="status-table-header" scope="col">User Access</th>
                <th class="status-table-header" v-if="visibleBridgeheads?.length == 1 && dataShieldStatus" scope="col">
                  DataSHIELD Status
                </th>
                <th class="status-table-header"
                    v-if="visibleBridgeheads?.length == 1 && hasProjectType(project, ProjectType.RESEARCH_ENVIRONMENT)"
                    scope="col">
                  Files in Research Environment
                </th>
                <th v-if="visibleBridgeheads?.length == 1 && currentUser" class="status-table-header" scope="col">
                  {{
                    (hasProjectType(project, ProjectType.DATASHIELD) && project?.state != ProjectState.FINAL) ? 'Script' : 'Results'
                  }}
                  Acceptance
                </th>
                <th v-if="visibleBridgeheads?.length == 1" class="status-table-header" scope="col">Applicant Results
                  Acceptance
                </th>
                <th class="status-table-header" scope="col">Applicant</th>
                <th class="status-table-header" scope="col">Created at</th>
                <th class="status-table-header" scope="col">Expires at</th>
                <th class="status-table-header" scope="col">Last modified</th>
              </tr>
              </thead>
              <tbody>
              <tr>
                <td>{{ project ? project.code : '' }}</td>
                <td v-if="visibleBridgeheads?.length == 1">
                  <div>
                    <div v-if="existsVotum" class="states-circle-container">
                      <div class="state_circle green"></div>
                      <DownloadButton
                          :context="context"
                          :project-manager-backend-service="projectManagerBackendService"
                          icon-class="bi bi-download"
                          button-class="download-button"
                          :module="Module.PROJECT_DOCUMENTS_MODULE"
                          :action="Action.DOWNLOAD_VOTUM_ACTION"
                      />
                    </div>
                    <div v-else-if="existsVotumForAllBridgeheads" class="states-circle-container">
                      <div class="state_circle green"></div>
                      <DownloadButton
                          :context="context"
                          :project-manager-backend-service="projectManagerBackendService"
                          icon-class="bi bi-download"
                          button-class="download-button"
                          :module="Module.PROJECT_DOCUMENTS_MODULE"
                          :action="Action.DOWNLOAD_VOTUM_FOR_ALL_BRIDGEHEADS_ACTION"
                      />
                    </div>
                    <div v-else class="states-circle-container">
                      <div class="state_circle red"/>
                    </div>
                  </div>
                </td>
                <td
                    v-if="visibleBridgeheads?.length === 1 && activeBridgehead"
                    v-for="type in getAllProjectTypes(project)"
                    :key="type"
                >
                  <div
                      class="state_circle"
                      :class="getQueryState(activeBridgehead, type)?.toLowerCase()"
                      data-toggle="tooltip"
                      data-placement="top"
                      :title="getQueryState(activeBridgehead, type)"
                  ></div>
                </td>
                <td v-if="visibleBridgeheads?.length == 1 && activeBridgehead">
                  <div class="state_circle" :class="activeBridgehead?.state?.toLowerCase()" data-toggle="tooltip"
                       data-placement="top" :title="activeBridgehead?.state ?? undefined"></div>
                </td>
                <td v-if="visibleBridgeheads?.length == 1 && dataShieldStatus">
                  <div class="state_circle" :class="dataShieldStatus?.project_status.toLowerCase()"
                       data-toggle="tooltip" data-placement="top" :title="dataShieldStatus?.project_status"></div>
                </td>
                <td v-if="visibleBridgeheads?.length == 1 && hasProjectType(project, ProjectType.RESEARCH_ENVIRONMENT)">
                  {{ areExportFilesTransferredToResearchEnvironment }}
                </td>
                <td v-if="visibleBridgeheads?.length == 1 && activeBridgehead && currentUser">
                  <div class="state_circle" :class="currentUser?.projectState.toLowerCase()" data-toggle="tooltip"
                       data-placement="top" :title="currentUser.projectState"></div>
                </td>
                <td v-if="visibleBridgeheads?.length == 1 && activeBridgehead">
                  <div class="state_circle" :class="creatorAcceptance.toLowerCase()" data-toggle="tooltip"
                       data-placement="top" :title="creatorAcceptance ?? undefined"></div>
                </td>
                <td style="display:flex;">
                  <UserAndEmail
                      :first-name="project?.creatorName"
                      :email="project?.creatorEmail"
                  />
                </td>
                <td>{{ project && project.createdAt ? convertDate(project.createdAt) : '' }}</td>
                <td>{{ project && project.expiresAt ? convertDate(project.expiresAt) : '' }}</td>
                <td>{{ project && project.modifiedAt ? convertDate(project.modifiedAt) : '' }}</td>
              </tr>
              </tbody>
            </table>

          </div>
        </div>
        <div
            v-if="!(project?.state === ProjectState.DRAFT && projectRoles.includes(ProjectRole.CREATOR)) && isAnyButtonVisible && currentMenuStep==='Status'"
            class="project-actions">
          <div class="box-header"><span>Actions</span><img src="../assets/newsletter.png" width="40" height="40"> </div>
          <div style="padding:2%">
            <!-- Project State Module: Creator View -->
            <!-- Project State Module: PM-ADMIN View -->
            <template v-for="(buttonGroup, index) in actionButtons" :key="index">
              <div v-if="buttonGroups[index]" class="button-group-box">
                <div class="button-group-label">
                  {{ buttonGroup.label }}
                  <span style="display: flex">
                    <span v-for="(explanationNumber, index3) in getExplanationsForButtonGroup(buttonGroup)"
                          :key="index3" class="todo-circle-small">#{{ explanationNumber }}</span>
                  </span>
                </div>
                <div style="display: flex">
                  <ProjectManagerButton v-for="(button, index2) in buttonGroup.button" :key="index2"
                                        :module="button.module" :action="button.action"
                                        :context="context" :call-refresh-context="button.refreshContextCallFunction"
                                        :text="button.text"
                                        :button-class="button.cssClass" :with-message="button.withMessage"
                                        :visibility="button.visibilityCondition"
                                        :do-action-on-click="button.doActionOnClick"
                                        :params="button.params"
                                        :project-manager-backend-service="projectManagerBackendService"/>
                </div>
              </div>
            </template>
          </div>
          <div v-if="!existsDraftDialog || draftDialogStepper.currentStep?.id === DialogStep.SUMMARY"
               class="inviteUser">
            <UserInput :project="project" :context="context"
                       :bridgeheads="visibleBridgeheads"
                       :todos="extendedExplanations"
                       :current-users="currentUsers"
                       :project-manager-backend-service="projectManagerBackendService"
                       :call-refresh-context="refreshContext"
            />
          </div>
        </div>
        <div class="documents"
             v-if="project?.state === ProjectState.FINAL && (projectRoles.includes(ProjectRole.CREATOR) || projectRoles.includes(ProjectRole.FINAL) || projectRoles.includes(ProjectRole.BRIDGEHEAD_ADMIN))">
          <div class="box-header"><span>Results</span><img src="../assets/newsletter.png" width="40" height="40"> </div>
          <div style="padding: 2%">
            <ResultsBox :call-refresh-context="refreshContext"
                        :project-manager-backend-service="projectManagerBackendService"
                        :current-users="currentUsers"
                        :context="context"
                        :project="project"
                        :project-roles="projectRoles"
            />
          </div>
        </div>
        <div v-if="currentMenuStep==='Request'" class="data-container mt-12" :class="{ 'non-draft': !existsDraftDialog }">
          <div v-if="project">
            <div v-if="!existsDraftDialog" class="box-header"><span>Request</span><img src="../assets/newsletter.png" width="40" height="40"> </div>
            <div class="table-responsive" style="display: flex; flex-flow: row;height: 78vh">

              <div v-if="existsDraftDialog" class="container vertical-stepper-box">
                <div class="row justify-content-center">
                  <div class="col-auto" style="width:100%">
                    <!-- Bootstrap Stepper -->
                    <div class="vertical-stepper2">
                      <div v-for="(step, index) in draftDialogStepper.currentSteps" :key="index" class="stepper-step2"
                           :class="{ 'active': draftDialogStepper.currentStep === step, 'missing-fields': hasMissingFieldsInStep(step.displayName) }"
                      >
                        <div>
                          <div class="step-circle" style="background-color: #fa7b26"
                            @click="draftDialogStepper.setCurrentStep(step.id)">
                            <span>{{ index + 1 }}</span>
                          </div>
                          <div v-if="index < draftDialogStepper.currentSteps.length - 1" class="stepper-line2"></div>
                        </div>
                        <div class="stepper-step-textbox"
                             @click="draftDialogStepper.setCurrentStep(step.id)"
                             :style="{ fontWeight: draftDialogStepper.currentStep === step ? 'bold' : 'normal' }">
                          <div class="stepper-step-header">{{
                              step.displayName
                            }}
                          </div>
                          <div style="font-size: smaller">{{ step.description }}</div>
                        </div>


                      </div>
                    </div>

                  </div>
                </div>
              </div>

              <br/>
              <div class="table table-bordered custom-table  table-hover" style="overflow-y: auto">
                <div v-if="existsDraftDialog" class="project-field-header">
                  <div class="project-field-title">{{ draftDialogStepper.currentStep?.displayName }}</div>
                  <div class="project-field-notification">{{ extendedExplanations.get("2")?.message }}</div>
                </div>
                <div class="first-seperator"></div>
                <template v-for="(projectField, index) in projectFields" :key="index">
                  <ProjectFieldRow
                      v-if="projectField.visibilityCondition &&
                      (!existsDraftDialog ||
                      projectField.isEditable && draftDialogStepper.currentStep?.id !== DialogStep.SUMMARY ||
                      draftDialogStepper.currentStep?.id === DialogStep.SUMMARY)"
                      :field-key="projectField.fieldKey"
                      :field-value="projectField.fieldValue"
                      :field-description="projectField.fieldDescription"
                      :bridgeheads="projectField.bridgeheads"
                      :action="projectField.action"
                      :module="projectField.module"
                      :edit-project-param="projectField.editProjectParam"
                      :is-editable="projectField.isEditable"
                      :redirect-url="projectField.redirectUrl"
                      :transform-for-sending="projectField.transformForSending"
                      :possible-values="projectField.possibleValues"
                      :display-possible-value="projectField.displayPossibleValue"
                      :configurations="projectField.configurations"
                      :exists-file="projectField.existFile"
                      :upload-action="projectField.uploadAction"
                      :download-action="projectField.downloadAction"
                      :download-module="projectField.downloadModule"
                      :todos="extendedExplanations"
                      :visible-bridgeheads="visibleBridgeheads"
                      :mandatory="projectField.mandatory"
                      :type="projectField.type"
                      :section="projectField.section"
                      :call-refresh-context="refreshContext"
                      :extra-params="projectField.extraParams"
                      :delete-action="projectField.deleteAction"
                      :delete-module="projectField.deleteModule"
                      :draft-dialog-current-step="existsDraftDialog ? draftDialogStepper.currentStep : undefined"
                      :context="context" :project-manager-backend-service="projectManagerBackendService"/>
                </template>

              </div>
            </div>
            <div v-if="project?.state === ProjectState.DRAFT" class="button-container mt-3">
              <button class="btn btn-primary me-2" @click="draftDialogStepper.previousStep()"
                      :disabled="!draftDialogStepper.hasPreviousStep">
                <!--<i class="bi bi-arrow-left"></i>-->
                Back
              </button>
              <div style="display: flex">
                <button class="btn btn-primary me-2" @click="draftDialogStepper.nextStep()"
                        v-if="draftDialogStepper.hasNextStep">
                  Continue
                  <!--<i class="bi bi-arrow-right"></i>-->
                </button>
                <ProjectManagerButton v-if="draftDialogStepper.currentStep?.id === DialogStep.SUMMARY"
                                      :module="Module.PROJECT_STATE_MODULE"
                                      :action="Action.CREATE_PROJECT_ACTION"
                                      :context="context" :call-refresh-context="refreshContext" text="Create"
                                      button-class="btn btn-success mr-2"
                                      :with-message="false"
                                      :is-disabled="!hasProjectAllMandatoryFields"
                                      :tooltip-text="tooltipTextForCreateButton"
                                      :project-manager-backend-service="projectManagerBackendService"/>
                <ProjectManagerButton v-if="project?.state === ProjectState.DRAFT"
                                      :module="Module.PROJECT_STATE_MODULE"
                                      :action="Action.REJECT_PROJECT_ACTION"
                                      :context="context" :call-refresh-context="refreshContext" text="Discard"
                                      button-class="btn btn-danger"
                                      :with-message="true"
                                      :project-manager-backend-service="projectManagerBackendService"/>
              </div>
            </div>
          </div>
        </div>
        <div class="documents" v-if="project?.state === ProjectState.FINISHED && currentMenuStep==='Documents'">
          <div class="box-header">Publications</div>
          <div style="padding: 2%">
            <DocumentsTable :context="context"
                            :project-manager-backend-service="projectManagerBackendService"
                            :download-action="Action.DOWNLOAD_PUBLICATION_ACTION"
                            :fetch-list-action="Action.FETCH_PUBLICATIONS_ACTION"
                            :bridgeheads="visibleBridgeheads" icon-class="bi bi-download" text="Publications: "/>
            <br/>
            <UploadButton :context="context"
                          :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.UPLOAD_PUBLICATION_ACTION"
                          text="Upload publication" :call-refresh-context="refreshContext" :is-file="true"/>
            <br/>
            <UploadButton :context="context"
                          :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.ADD_PUBLICATION_URL_ACTION"
                          text="Upload publication URL" :call-refresh-context="refreshContext" :is-file="false"/>
          </div>
        </div>
        <div class="documents" v-if="currentMenuStep==='Documents'">
          <div class="box-header"><span>Documents</span><img src="../assets/newsletter.png" width="40" height="40"> </div>
          <div style="padding: 2%">
            <DownloadFormTemplatePdfButtons :form-templates="formTemplates" :context="context"
                                            :project-manager-backend-service="projectManagerBackendService"/>
          </div>
          <div style="padding: 2%">
            <div style="display:flex; flex-flow:row;  width:100% ">
              <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                            :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.UPLOAD_OTHER_DOCUMENT_ACTION"
                            text="Upload document" :call-refresh-context="refreshContext" :is-file="true"/>

              <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                            :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.ADD_OTHER_DOCUMENT_URL_ACTION"
                            text="Upload document URL" :call-refresh-context="refreshContext" :is-file="false"/>
            </div>
            <br/>
            <DocumentsTable :context="context" :project-manager-backend-service="projectManagerBackendService"
                            :download-action="Action.DOWNLOAD_OTHER_DOCUMENT_ACTION"
                            :fetch-list-action="Action.FETCH_OTHER_DOCUMENTS_ACTION"
                            :bridgeheads="visibleBridgeheads" icon-class="bi bi-download" text="Other documents: "/>
          </div>
        </div>
      </div>
    </div>


    <div :class="showRightPanel ? 'custom-width-notifications' : 'open-right-panel'">
      <button style="" @click="showRightPanel=true" class="btn" v-if="!showRightPanel" data-toggle="tooltip"
              data-placement="top" title="Show ToDos & Notifications">
        <i style="font-size: 20px" class="bi bi-chevron-double-left"></i> <!-- Close symbol for Progress -->
      </button>
      <div v-if="showRightPanel">
        <div class="box-header"
             style="display:flex; flex-flow:row; justify-content:space-between;padding-bottom:0;color:black ">
          <div style="display:flex; flex-flow:row;">
            <div class="notification-tab" :class="{ 'active': !showNotification }" @click="toggleNotification">TODO
            </div>
            <div v-if="projectRoles && projectRoles.includes(ProjectRole.PROJECT_MANAGER_ADMIN)"
                 class="notification-tab" :class="{ 'active': showNotification }" @click="toggleNotification">
              Notifications
            </div>
          </div>
          <button style="padding: 0 15px 0 0; margin-bottom: 5px" @click="showRightPanel=false" class="btn"
                  v-if="showRightPanel" data-toggle="tooltip" data-placement="top" title="Hide Panel">
            <i style="font-size: 20px;color:white" class="bi bi-chevron-double-right"></i>
            <!-- Close symbol for Progress -->
          </button>
        </div>

        <NotificationBox :context="context" :project-manager-backend-service="projectManagerBackendService"
                         :show-notification="showNotification"
                         :call-toggle-notification="toggleNotification"
                         :notifications="notifications" :call-update-notifications="fetchNotifications"
                         :show-in-panel="false"
        />

        <div v-if="!showNotification">
          <div v-if="extendedExplanations.size > 0" class="notification-box">
            <div v-for="(explanation, index) in Array.from(extendedExplanations.values())" :key="index"
                 class="card mb-3">
              <div class="card-body">
                <div style="display:flex; flex-flow: row;">
                  <div class="todo-circle"><span>#{{ explanation.number }}</span></div>
                  <h5 class="card-title" v-html="explanation.message"></h5>
                </div>
              </div>
            </div>
          </div>
          <div
              v-else-if="project?.state !== ProjectState.FINISHED && project?.state !== ProjectState.REJECTED && project?.state !== ProjectState.ARCHIVED"
              class="notification-box">
            <div class="card mb-3">
              <div class="card-body">
                <h5 class="card-title">No action is required at the moment. Please wait for the next notification, which
                  will
                  also be sent to you via email.</h5>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {
  Action,
  ActionButton,
  ActionButtonGroup,
  Bridgehead,
  CUSTOM_PROJECT_CONFIGURATION,
  DataShieldProjectStatus,
  EditProjectParam,
  Explanations,
  FormDataType,
  FormField,
  FormTemplate,
  FormTitle,
  getAllProjectTypes,
  getQueryState,
  hasProjectType,
  hasValidOutputs,
  Module,
  Notification,
  Project,
  ProjectAndForms,
  ProjectDocument,
  ProjectManagerBackendService,
  ProjectManagerContext,
  ProjectOutput,
  ProjectRole,
  ProjectState,
  ProjectType,
  QueryState,
  Site,
  User,
  UserProjectState
} from "@/services/projectManagerBackendService";
import ProjectManagerButton from "@/components/ProjectManagerButton.vue";
import {format} from "date-fns";
import ProjectFieldRow from "@/components/ProjectFieldRow.vue";
import NotificationBox from "@/components/Notification.vue";
import UserInput from "@/components/UserInput.vue";
import UploadButton from "@/components/UploadButton.vue";
import DocumentsTable from "@/components/DocumentsTable.vue";
import BridgeheadOverview from "@/components/BridgeheadOverview.vue";
import {DialogStepper, FixedDialogStep} from "@/services/fixedDialogStep";
import ResultsBox from "@/components/ResultsBox.vue";
import '@/assets/styles/state-circle.css'
import UserAndEmail from "@/components/UserAndEmail.vue";
import DownloadButton from "@/components/DownloadButton.vue";
import {AuthService} from "@/services/auth";
import {ActionFunction, ProjectField, Section} from "@/services/utils";
import DownloadFormTemplatePdfButtons from "@/components/DownloadFormTemplatePdfButtons.vue";


export default defineComponent({
  computed: {
    ProjectState() {
      return ProjectState
    },
    DialogStep() {
      return FixedDialogStep
    },
    ProjectRole() {
      return ProjectRole
    },
    EditProjectParam() {
      return EditProjectParam
    },
    Action() {
      return Action
    },
    Module() {
      return Module
    },
    ProjectType() {
      return ProjectType
    }
  },
  props: {
    projectCode: {
      type: String,
      required: true
    }
  },
  components: {
    DownloadFormTemplatePdfButtons,
    DownloadButton,
    UserAndEmail,
    ResultsBox,
    BridgeheadOverview,
    DocumentsTable,
    UploadButton,
    UserInput,
    NotificationBox,
    ProjectFieldRow,
    ProjectManagerButton
  },

  data() {
    return {
      activeBridgehead: undefined as Bridgehead | undefined,
      activeBridgeheadIndex: 0,
      bridgeheads: [] as Bridgehead[],
      visibleBridgeheads: [] as Bridgehead[],
      context: new ProjectManagerContext(this.projectCode, undefined),
      projectManagerBackendService: new ProjectManagerBackendService(new ProjectManagerContext(this.projectCode, undefined), Site.PROJECT_VIEW_SITE),
      project: undefined as Project | undefined,
      projectTypes: [] as string[],
      outputFormats: {} as Record<ProjectType, string[]>,
      queryFormats: [] as string[],
      exporterTemplateIds: {} as Record<ProjectType, string[]>,
      allBridgeheads: [] as Bridgehead[],
      projectStates: [] as ProjectState[],
      dataShieldStatus: undefined as DataShieldProjectStatus | undefined,
      site: Site.PROJECT_VIEW_SITE,
      notifications: [] as Notification[],
      showNotification: false,
      showExplanations: true,
      showRightPanel: false,
      existsVotum: false,
      existsVotumForAllBridgeheads: false,
      existsAuthenticationScript: false,
      existsScript: false,
      projectConfigurations: new Map<string, ProjectAndForms>(),
      projectConfigurationLabels: [] as string[],
      currentProjectConfiguration: '',
      currentProjectConfigurationFields: [] as string[],
      projectRoles: [] as ProjectRole[],
      draftDialogStepper: new DialogStepper(() => this.updateProjectFields()) as DialogStepper,
      existsDraftDialog: false,
      scriptDescription: {} as ProjectDocument,
      votumDescription: {} as ProjectDocument,
      votumForAllBridgeheadsDescription: {} as ProjectDocument,
      existInvitedUsers: false,
      areExportFilesTransferredToResearchEnvironment: false,
      explanations: new Map() as Explanations,
      extendedExplanations: new Map() as Explanations,
      buttonGroups: [] as boolean[],
      isAnyButtonVisible: false,
      actionButtons: [] as ActionButtonGroup[],
      currentUser: undefined as User | undefined,
      hasProjectAllMandatoryFields: false,
      tooltipTextForCreateButton: '',
      canShowBridgeheadAdminButtons: false,
      currentUsers: [] as User[],
      creatorAcceptance: UserProjectState.CREATED,
      existsResearchEnvironmentWorkspace: false,
      researchEnvironmentUrl: undefined as string | undefined,
      formTemplates: [] as FormTemplate[],
      formTitles: [] as FormTitle[],
      formFields: [] as FormField[],
      selectedForms: [] as FormTitle[],
      projectFields: [] as ProjectField[],
      groupedMissingFields: {} as Record<string, string[]>,
      currentMenuStep: "Status"
    };
  },
  watch: {
    activeBridgehead(newValue, _oldValue) {
      this.activeBridgeheadIndex = this.visibleBridgeheads.findIndex(bridgehead => bridgehead === newValue);
      this.context = new ProjectManagerContext(this.projectCode, newValue);
      this.creatorAcceptance = (this.project?.creatorState) ? this.project.creatorState : UserProjectState.CREATED;
    },
    context(newValue, _oldValue) {
      this.projectManagerBackendService = new ProjectManagerBackendService(newValue, Site.PROJECT_VIEW_SITE);
      this.fetchProject();
    },
    async project() {
      await this.initializeProjectRelatedData();
    },
    'draftDialogStepper.currentStep': function () {
      this.extendedExplanations = this.fetchExtendedExplanations();
    },
    existsScript() {
      this.extendedExplanations = this.fetchExtendedExplanations();
    },
    existsAuthenticationScript() {
      this.extendedExplanations = this.fetchExtendedExplanations();
    },
    existsVotum() {
      this.extendedExplanations = this.fetchExtendedExplanations();
    },
    existInvitedUsers() {
      this.extendedExplanations = this.fetchExtendedExplanations();
    },
    currentUser() {
      this.extendedExplanations = this.fetchExtendedExplanations();
    },
    currentProjectConfiguration(newValue, _oldValue) {
      if (newValue !== CUSTOM_PROJECT_CONFIGURATION) {
        this.draftDialogStepper.filterStep(FixedDialogStep.CUSTOM);
      } else {
        this.draftDialogStepper.removeFilteredStep(FixedDialogStep.CUSTOM);
      }
    }
  },
  mounted() {
    this.fetchVisibleBridgeheads();
  },


  methods: {
    hasProjectType,
    getQueryState,
    getAllProjectTypes,

    toggleNotification() {
      this.showNotification = !this.showNotification;
      this.showExplanations = !this.showNotification;
    },

    refreshBridgeheadsAndContext() {
      const activeBridgehead = this.activeBridgehead;
      this.fetchVisibleBridgeheads().then(() => {
        if (this.activeBridgehead === activeBridgehead) {
          this.refreshContext();
        }
      })
    },

    refreshContext() {
      this.context = new ProjectManagerContext(this.context.projectCode, this.context.bridgehead);
    },

    async fetchVisibleBridgeheads() {
      try {
        return await this.projectManagerBackendService.fetchData(
            Module.PROJECT_BRIDGEHEAD_MODULE,
            Action.FETCH_VISIBLE_PROJECT_BRIDGEHEADS_ACTION,
            this.context,
            new Map()
        ).then(bridgeheads => {
          this.visibleBridgeheads = bridgeheads;
          this.activeBridgehead = bridgeheads[this.activeBridgeheadIndex];
        });
      } catch (error) {
        console.error('Error loading BridgeheadList:', error);
      }
    },

    async fetchProject() {
      const params = new Map<string, string>();
      // TODO: Control page size
      params.set('page', '' + 0);
      params.set('page-size', '' + 10);
      await this.initializeData(Module.PROJECT_BRIDGEHEAD_MODULE, Action.FETCH_PROJECT_ACTION, params, 'project');
    },

    fetchIfProjectHasAllMandatoryFields(): boolean {
      const baseFieldsValid = Boolean(
          this.project &&
          this.project.label &&
          this.project.query &&
          this.bridgeheads &&
          this.project.queryFormat &&
          hasValidOutputs(this.project)
      );

      // We assume that a boolean mandatory field not set is equal to false — so we ignore it.
      const mandatoryFormFieldsValid = this.formFields
          ?.filter(field => field.type != FormDataType.BOOLEAN && field.mandatory && this.selectedForms.some(ft => ft.title === field.title))
          .every(field => field.value != null && field.value !== '');

      return baseFieldsValid && mandatoryFormFieldsValid;
    },

    fetchTooltipTextForCreateButton() {
      let result = '';

      if (this.project) {
        // ✅ project-level fields stay inline
        result = this.addMissingField(result, 'title', this.project.label);
        result = this.addMissingField(result, 'query', this.project.query);
        result = this.addMissingField(result, 'bridgeheads', this.bridgeheads);
        result = this.addMissingField(result, 'query format', this.project.queryFormat);

        this.project?.outputs?.forEach(o => {
          result = this.addMissingField(
              result,
              `output format (${o.projectType})`,
              o.outputFormat
          );

          result = this.addMissingField(
              result,
              `template id (${o.projectType})`,
              o.templateId
          );
        });

        // 👇 group missing mandatory form fields
        // We assume that a boolean mandatory field not set is equal to false — so we ignore it.
        this.groupedMissingFields = this.formFields
            ?.filter(field => field.type != FormDataType.BOOLEAN && field.mandatory && !field.value && this.selectedForms.some(ft => ft.title === field.title))
            .reduce((acc, field) => {
              const title = field.titleDisplayName ?? field.title;
              const label = field.labelDisplayName ?? field.label;

              if (!acc[title]) acc[title] = [];
              acc[title].push(label);
              return acc;
            }, {} as Record<string, string[]>);

        // Create blocks for each title
        const blocks = Object.entries(this.groupedMissingFields ?? {}).map(
            ([title, fields]) => `<strong>${title}</strong>: ${fields.join(', ')}`
        );

        // If there are blocks, append them with two line-breaks between
        if (blocks.length > 0) {
          result += (result.length > 0 ? '<br><br>' : '') + blocks.join('<br><br>');
        }
      }

      return result.length > 0 ? 'missing fields:<br><br>' + result : result;
    },

    hasMissingFieldsInStep(step: string): boolean {
      if(this.draftDialogStepper.visitedSteps.has(step)) {
        return this.groupedMissingFields[step]?.length > 0;
      }
      return false
    },

    addMissingField(result: string, field: string, value: any): string {
      return (!value) ? result + ((result.length > 0) ? ', ' : '') + field : result;
    },

    convertDate(date: Date) {
      return format(date, 'yyyy-MM-dd HH:mm')
    },

    async initializeProjectRelatedData() {
      if (this.project) {
        this.existsDraftDialog = (this.project.state === ProjectState.DRAFT && AuthService.getEmail() === this.project.creatorEmail);
        await Promise.all([
          this.initializeDataInCallback(Module.PROJECT_BRIDGEHEAD_MODULE, Action.FETCH_PROJECT_BRIDGEHEADS_ACTION, new Map(), async (result: Bridgehead[]) => {
            this.bridgeheads = result;
          }),
          this.initializeData(Module.PROJECT_BRIDGEHEAD_MODULE, Action.FETCH_PROJECT_STATES_ACTION, new Map(), 'projectStates'),
          this.fetchNotifications(),
          this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_PROJECT_TYPES_ACTION, new Map(), 'projectTypes'),
          this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_QUERY_FORMATS_ACTION, new Map(), 'queryFormats'),
          this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_OUTPUT_FORMATS_ACTION, new Map(), 'outputFormats'),
          this.initializeCurrentProjectConfiguration(),
          this.initializeData(Module.PROJECT_BRIDGEHEAD_MODULE, Action.FETCH_ALL_REGISTERED_BRIDGEHEADS_ACTION, new Map(), 'allBridgeheads'),
          this.initializeData(Module.USER_MODULE, Action.EXISTS_RESEARCH_ENVIRONMENT_WORKSPACE_ACTION, new Map(), 'existsResearchEnvironmentWorkspace'),
          this.initializeData(Module.USER_MODULE, Action.FETCH_RESEARCH_ENVIRONMENT_URL_ACTION, new Map(), 'researchEnvironmentUrl'),
          this.initializeData(Module.USER_MODULE, Action.FETCH_PROJECT_USERS_ACTION, new Map(), 'currentUsers'),
          this.initializeDataInCallback(Module.PROJECT_DOCUMENTS_MODULE, Action.EXISTS_VOTUM_ACTION, new Map(), async (result: boolean) => {
            this.existsVotum = result;
            if (this.existsVotum) {
              await this.initializeData(Module.PROJECT_DOCUMENTS_MODULE, Action.FETCH_VOTUM_DESCRIPTION_ACTION, new Map(), 'votumDescription');
            } else {
              this.votumDescription = {} as ProjectDocument
            }
          }),
          this.initializeDataInCallback(Module.PROJECT_DOCUMENTS_MODULE, Action.EXISTS_VOTUM_FOR_ALL_BRIDGEHEADS_ACTION, new Map(), async (result: boolean) => {
            this.existsVotumForAllBridgeheads = result;
            if (this.existsVotumForAllBridgeheads) {
              await this.initializeData(Module.PROJECT_DOCUMENTS_MODULE, Action.FETCH_VOTUM_FOR_ALL_BRIDGEHEADS_DESCRIPTION_ACTION, new Map(), 'votumForAllBridgeheadsDescription');
            }
          }),
          this.initializeDataInCallback(Module.PROJECT_DOCUMENTS_MODULE, Action.EXISTS_SCRIPT_ACTION, new Map(), async (result: boolean) => {
            this.existsScript = result;
            if (this.existsScript) {
              await this.initializeData(Module.PROJECT_DOCUMENTS_MODULE, Action.FETCH_SCRIPT_DESCRIPTION_ACTION, new Map(), 'scriptDescription');
            }
          }),
          this.initializeData(Module.TOKEN_MANAGER_MODULE, Action.EXISTS_AUTHENTICATION_SCRIPT_ACTION, new Map(), 'existsAuthenticationScript'),
          this.initializeData(Module.USER_MODULE, Action.FETCH_PROJECT_ROLES_ACTION, new Map(), 'projectRoles'),
          this.initializeDataInCallback(Module.USER_MODULE, Action.EXIST_INVITED_USERS_ACTION, new Map(), async result => {
            this.existInvitedUsers = result;
            this.canShowBridgeheadAdminButtons = this.fetchIfCanShowBridgeheadAdminButtons();
          }),
          this.initializeData(Module.USER_MODULE, Action.FETCH_CURRENT_USER_ACTION, new Map(), 'currentUser'),
          this.initializeData(Module.EXPORT_MODULE, Action.ARE_EXPORT_FILES_TRANSFERRED_TO_RESEARCH_ENVIRONMENT_ACTION, new Map(), 'areExportFilesTransferredToResearchEnvironment'),
          this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_BEST_PROJECT_FORM_TEMPLATES_ACTION, new Map(), 'formTemplates'),
          this.initializeDataInCallback(Module.PROJECT_EDITION_MODULE, Action.FETCH_SELECTED_PROJECT_FORMS_ACTION, new Map(), async result => {
            this.selectedForms = result;
            await this.initializeDataInCallback(Module.PROJECT_EDITION_MODULE, Action.FETCH_PROJECT_FORM_FIELDS_ACTION, new Map(), async result => {
              this.addFormFields(result);
            })
          }),
          this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_EXPORTER_TEMPLATES_ACTION, new Map(), 'exporterTemplateIds')
        ]);
        await this.initializeDataInCallback(Module.PROJECT_EDITION_MODULE, Action.FETCH_PROJECT_CONFIGURATIONS_ACTION, new Map(), async (result: Record<string, ProjectAndForms>) => {

              const shouldHideCustom = this.shouldHideCustomService();
              if (result) {
                this.projectConfigurations = new Map<string, ProjectAndForms>(
                    Object.entries(result).filter(
                        ([key]) => !(shouldHideCustom && key === CUSTOM_PROJECT_CONFIGURATION)
                    )
                );

                this.projectConfigurationLabels = Array.from(
                    this.projectConfigurations.keys()
                );

              } else {
                this.projectConfigurations = new Map();
                this.projectConfigurationLabels = [];
              }
            }
        )
        if (hasProjectType(this.project, ProjectType.DATASHIELD)) {
          await this.initializeData(Module.TOKEN_MANAGER_MODULE, Action.FETCH_DATASHIELD_STATUS_ACTION, new Map(), 'dataShieldStatus');
        }
        this.updateProjectFields()
        this.fetchButtons()
        await this.checkButtonVisibility()
        this.explanations = this.projectManagerBackendService.fetchExplanations();
        this.extendedExplanations = this.fetchExtendedExplanations();
        this.project?.state !== ProjectState.DRAFT ? this.currentMenuStep="Status" : this.currentMenuStep="Request"
      }
    },

    /**
     * Determines whether the "custom service" option should be hidden.
     *
     * Business rules:
     *
     * - Admin users can always see and select the custom service.
     *
     * - For non-admin users:
     *   - If `isCustomConfigSelected` is `undefined`, the custom option must be hidden.
     *     → This means no explicit decision has been made yet, so custom is not allowed.
     *
     *   - If `isCustomConfigSelected === true`, the custom option is visible.
     *     → An admin has explicitly enabled or selected a custom configuration before.
     *
     *   - If `isCustomConfigSelected === false`, the custom option is only visible
     *     if the current configuration no longer matches any predefined service
     *     (i.e., it has effectively become "custom" due to user modifications).
     *
     * In short:
     * - `undefined` → never show (for non-admins)
     * - `false` → show only if config became custom
     * - `true` → always show
     */
    shouldHideCustomService() {
      const isAdmin = this.projectRoles.includes(ProjectRole.PROJECT_MANAGER_ADMIN);
      const customFlag = this.project?.isCustomConfigSelected;

      return !isAdmin &&
          (customFlag === undefined || (!customFlag && this.currentProjectConfiguration !== CUSTOM_PROJECT_CONFIGURATION));
    },

    updateProjectFields() {
      if (this.project) {
        this.projectFields = this.fetchProjectFields();
      }
    },

    addFormFields(formFieldArray: FormField[]): void {
      this.formFields = formFieldArray;
      this.formTitles = [];

      const seenTitles = new Set<string>(); // <-- move outside the loop

      for (const field of formFieldArray) {
        const key = field.title;

        // ---- Titles list ----
        if (!seenTitles.has(key)) {
          seenTitles.add(key);

          this.formTitles.push({
            title: field.title,
            titleDisplayName: field.titleDisplayName,
            titleDescription: field.titleDescription,
          });
        }

        this.hasProjectAllMandatoryFields = this.fetchIfProjectHasAllMandatoryFields();
        this.tooltipTextForCreateButton = this.fetchTooltipTextForCreateButton();
      }
      if (!this.draftDialogStepper.hasSameFormTitles(this.selectedForms)) {
        this.draftDialogStepper.resetFormTitles();
        this.draftDialogStepper.addFormTitles(this.selectedForms);
      }
    },

    async fetchNotifications() {
      return this.initializeData(Module.NOTIFICATIONS_MODULE, Action.FETCH_NOTIFICATIONS_ACTION, new Map(), 'notifications');
    },

    async initializeCurrentProjectConfiguration(): Promise<void> {
      return new Promise((resolve, reject) => {
        this.initializeDataInCallback(
            Module.PROJECT_EDITION_MODULE,
            Action.FETCH_CURRENT_PROJECT_CONFIGURATION_ACTION,
            new Map(),
            async (result: Record<string, ProjectAndForms>) => {

              if (result) {
                const keys = Object.keys(result);
                if (keys.length > 0) {
                  this.currentProjectConfiguration = keys[0];
                  const currentProjectConfig = result[this.currentProjectConfiguration];
                  const project = currentProjectConfig?.project;

                  this.currentProjectConfigurationFields = project
                      ? [
                        ...Object.keys(project).filter(
                            key => key !== 'outputs' && (project as any)[key] !== null
                        ),
                        ...(project.outputs ?? []).flatMap(output => {
                          const prefix = output.projectType;
                          return [
                            `${prefix}.projectType`,
                            ...(output.outputFormat ? [`${prefix}.outputFormat`] : []),
                            ...(output.templateId ? [`${prefix}.templateId`] : [])
                          ];
                        })
                      ]
                      : [];

                  this.formFields = currentProjectConfig?.formFields ?? [];
                } else {
                  this.resetCurrentProjectConfiguration();
                }
              } else {
                this.resetCurrentProjectConfiguration();
              }

              resolve();
            }
        )
            .then(() => {
              // IMPORTANT: this runs even if condition === false
              resolve();
            })
            .catch(reject);
      });
    },

    resetCurrentProjectConfiguration() {
      this.currentProjectConfiguration = '';
      this.currentProjectConfigurationFields = [];
      this.formFields = [];
    },

    isNotIncludedInCurrentProjectConfiguration(field: string) {
      return this.currentProjectConfiguration === CUSTOM_PROJECT_CONFIGURATION || this.currentProjectConfigurationFields.includes(field);
    },

    async initializeData(module: Module, action: Action, params: Map<string, unknown>, dataVariable: string): Promise<any> {
      return this.initializeDataInCallback(module, action, params, async (result) => {
        (this.$data as any)[dataVariable] = result;
      });
    },


    async initializeDataInCallback(module: Module, action: Action, params: Map<string, unknown>, callback: (result: any) => Promise<any>) {
      try {
        const condition = await this.projectManagerBackendService.isModuleActionActive(module, action);
        if (condition) {
          const result = await this.projectManagerBackendService.fetchData(module, action, this.context, params);
          await callback(result); // Await the callback to handle any async operations inside it
        }
      } catch (error: any) {
        if (error.response && error.response.status === 404) {
          console.warn(`Error 404: Resource not found for action '${action}' of module '${module}'`);
        } else {
          console.error(`Error calling action '${action}' of module '${module}':`, error);
          throw error; // Re-throw the error if it's not a 404
        }
      }
    },

    updateActiveBridgehead(bridgehead: Bridgehead) {
      this.activeBridgehead = bridgehead;
    },

    fetchIfCanShowBridgeheadAdminButtons(): boolean {
      return (this.project && (this.project.state == ProjectState.DEVELOP || this.project.state == ProjectState.PILOT)) ? this.existInvitedUsers : true;
    },
    buildDynamicProjectFieldsFromFormFields(formFields: FormField[]): ProjectField[] {
      return formFields.map((formField, index) => ({
        fieldKey: formField.labelDisplayName ?? formField.label,
        fieldValue: formField.value != null ? [formField.value] : [],
        editProjectParam: [EditProjectParam.FORM_FIELDS],
        mandatory: formField.mandatory,
        fieldDescription: formField.labelDescription,
        type: formField.type,
        isEditable: true,
        possibleValues: formField.allowedValues?.map(value => value.label),
        displayPossibleValue: formField.allowedValues?.length
            ? (label: string) => {
              const field = formField.allowedValues!.find(v => v.label === label)
              return {name: field?.displayName ?? label, description: field?.description ?? ""}
            }
            : undefined,
        action: Action.EDIT_PROJECT_FORM_FIELDS_ACTION,
        transformForSending: this.buildTransformForSendingFormField(formField),
        visibilityCondition:
            this.selectedForms.some(f => f.title === formField.title) && // only if the field is already selected
            (!this.existsDraftDialog ||
                this.draftDialogStepper.currentStep?.id === formField.title ||
                this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY),

        section: new Section(formFields, index)
      }));
    },

    buildDynamicProjectFieldsFromFormTitles(formTitles: FormTitle[]): ProjectField[] {
      return formTitles.map((formTitle) => ({
        fieldKey: formTitle.titleDisplayName ?? formTitle.title,
        fieldValue: [this.selectedForms.some(f => f.title === formTitle.title) ? "true" : "false"],
        editProjectParam: [EditProjectParam.FORM_TITLE],
        mandatory: false,
        fieldDescription: formTitle.titleDescription,
        type: FormDataType.BOOLEAN,
        isEditable: true,
        action: new ActionFunction((input: string[]) => {
          if (input && input.length > 0 && input[0] === "false") {
            return Action.REMOVE_SELECTED_PROJECT_FORM_ACTION;
          } else {
            return Action.ADD_SELECTED_PROJECT_FORM_ACTION;
          }
        }),
        transformForSending: () => formTitle.title,
        visibilityCondition:
            !this.existsDraftDialog ||
            this.draftDialogStepper.currentStep?.id === FixedDialogStep.CUSTOM ||
            this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY
      }));
    },

    buildTransformForSendingFormField(formField: FormField): (input: string) => any {
      return (input: string) => {
        return [{
          title: formField.title,
          label: formField.label,
          value: input
        }];
      };
    },

    getProjectStates(): ProjectState[] {
      let visibleProjectStates: ProjectState[] = this.projectStates.slice();
      if (this.projectStates.length > 0) {
        if (this.project?.state === 'REJECTED') {
          visibleProjectStates = visibleProjectStates.filter(item => ![ProjectState.FINISHED, ProjectState.ARCHIVED].includes(item));
        } else {
          if (this.project?.state === 'ARCHIVED') {
            visibleProjectStates = visibleProjectStates.filter(item => ![ProjectState.FINISHED, ProjectState.REJECTED].includes(item));
          } else {
            visibleProjectStates = visibleProjectStates.filter(item => ![ProjectState.ARCHIVED, ProjectState.REJECTED].includes(item));
          }
        }
      }
      return visibleProjectStates
    },

    fetchExtendedExplanations(): Explanations {
      const extendedExplanations = new Map(this.explanations)
      if (this.existsVotum) {
        this.removeActionExplanation(Action.UPLOAD_VOTUM_ACTION, extendedExplanations);
      } else {
        this.removeActionExplanation(Action.DOWNLOAD_VOTUM_ACTION, extendedExplanations);
      }
      if (this.existsScript) {
        this.removeActionExplanation(Action.UPLOAD_SCRIPT_ACTION, extendedExplanations);
      } else {
        this.removeActionExplanation(Action.DOWNLOAD_SCRIPT_ACTION, extendedExplanations);
        this.removeActionExplanation(Action.ACCEPT_SCRIPT_ACTION, extendedExplanations);
        this.removeActionExplanation(Action.REJECT_SCRIPT_ACTION, extendedExplanations);
        this.removeActionExplanation(Action.REQUEST_SCRIPT_CHANGES_ACTION, extendedExplanations);
      }
      if (!this.currentUser) {
        this.removeActionExplanation(Action.DOWNLOAD_SCRIPT_ACTION, extendedExplanations);
      }
      if (!this.existsAuthenticationScript) {
        this.removeActionExplanation(Action.DOWNLOAD_AUTHENTICATION_SCRIPT_ACTION, extendedExplanations);
      }
      if (this.projectRoles?.includes(ProjectRole.BRIDGEHEAD_ADMIN)) {
        if (!this.canShowBridgeheadAdminButtons) {
          this.removeActionExplanation(Action.ACCEPT_BRIDGEHEAD_PROJECT_ACTION, extendedExplanations);
          this.removeActionExplanation(Action.REJECT_BRIDGEHEAD_PROJECT_ACTION, extendedExplanations);
          this.removeActionExplanation(Action.REQUEST_CHANGES_IN_PROJECT_ACTION, extendedExplanations);
          this.removeActionExplanation(Action.SAVE_QUERY_IN_BRIDGEHEAD_ACTION, extendedExplanations);
          this.removeActionExplanation(Action.SAVE_AND_EXECUTE_QUERY_IN_BRIDGEHEAD_ACTION, extendedExplanations);
          this.removeActionExplanation(Action.SEND_EXPORT_FILES_TO_RESEARCH_ENVIRONMENT_ACTION, extendedExplanations);
          this.removeActionExplanation(Action.SET_DEVELOPER_USER_ACTION, extendedExplanations);
          this.removeActionExplanation(Action.SET_PILOT_USER_ACTION, extendedExplanations);
          this.removeActionExplanation(Action.SET_FINAL_USER_ACTION, extendedExplanations);
        }
      }
      if (!this.existInvitedUsers && !this.projectRoles?.includes(ProjectRole.PROJECT_MANAGER_ADMIN)) {
        this.removeActionExplanation(Action.SET_DEVELOPER_USER_ACTION, extendedExplanations);
        this.removeActionExplanation(Action.SET_PILOT_USER_ACTION, extendedExplanations);
        this.removeActionExplanation(Action.SET_FINAL_USER_ACTION, extendedExplanations);
      }
      let count = extendedExplanations.size + 1;
      if (this.existsDraftDialog) {
        if (this.draftDialogStepper.currentStep?.id === FixedDialogStep.PROJECT) { // Project
          extendedExplanations.set(count.toString(), {
            number: count,
            message: "Please provide the general project information to proceed."
          });
          count++;
        } else if (this.draftDialogStepper.currentStep?.id === FixedDialogStep.SERVICES) { // Services
          extendedExplanations.set(count.toString(), {
            number: count,
            message: "Please select one of the predefined configurations for the project. If none of the options meet your requirements, choose 'CUSTOM' to create a custom configuration."
          });
          count++;
        } else if (this.draftDialogStepper.currentStep?.id === FixedDialogStep.QUERY && !this.project?.query) { // Query
          extendedExplanations.set(count.toString(), {
            number: count,
            message: "Please set the query and specify the query format if they have not been previously configured in the Federated Explorer."
          });
          count++;
        } else if (this.draftDialogStepper.currentStep?.id === FixedDialogStep.CUSTOM && !hasValidOutputs(this.project)) { // Output
          extendedExplanations.set(count.toString(), {
            number: count,
            message: "Please select the output format and the template ID for the Teiler Exporter. For advanced configuration of the template, please add the necessary environment variables."
          });
          count++;
        } else if (this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY) { // Summary
          extendedExplanations.set(count.toString(), {
            number: count,
            message: "Please check all of the fields in the summary and click 'Create' if everything seems OK."
          });
          count++;
          if (this.tooltipTextForCreateButton?.length > 0) {
            extendedExplanations.set(count.toString(), {
              number: count,
              message: 'To proceed with creating the project, kindly fill in the following ' + this.tooltipTextForCreateButton
            });
            count++;
          }
        }
      }
      if (this.projectRoles?.includes(ProjectRole.BRIDGEHEAD_ADMIN) && this.activeBridgehead?.executions) {
        const pendingTypes = this.activeBridgehead.executions
            .filter(exec => ![QueryState.CREATED, QueryState.FINISHED, QueryState.ERROR].includes(exec.queryState))
            .map(exec => exec.projectType);

        if (pendingTypes.length) {
          extendedExplanations.set(count.toString(), {
            number: count,
            message: `Please access the Teiler for project types "${pendingTypes.join(", ")}", review the queries, and execute them. Note that the queries may take some time to arrive at the Teiler. Once execution is complete, return here for further instructions.`
          });
          count++;
        }
      }
      return extendedExplanations
    },

    removeActionExplanation(action: Action, explanations: Explanations) {
      const explanation = explanations.get(action);
      if (explanation) {
        const explanationNumber = explanation.number;
        explanations.delete(action);
        explanations.forEach((value, _key) => {
          if (value.number > explanationNumber) {
            value.number--;
          }
        })
      }
    },

    getExplanationsForButtonGroup(buttonGroup: ActionButtonGroup): number[] {
      return buttonGroup.button?.map((button) => this.explanations?.get(button.action)?.number).filter((number): number is number => number !== undefined) || []
    },

    goToResearchEnvironment() {
      if (this.researchEnvironmentUrl) {
        window.open(this.researchEnvironmentUrl, '_blank');
      }
    },

    fetchExtraParamsForProjectOutput(currentEditProjectParam: EditProjectParam, output: ProjectOutput) {
      let result = new Map<string, string>();
      if (currentEditProjectParam === EditProjectParam.PROJECT_TYPE) {
        if (output.outputFormat) {
          result.set(EditProjectParam.OUTPUT_FORMAT, output.outputFormat);
        }
        if (output.templateId) {
          result.set(EditProjectParam.TEMPLATE_ID, output.templateId);
        }
      } else if (currentEditProjectParam === EditProjectParam.OUTPUT_FORMAT) {
        if (output.projectType) {
          result.set(EditProjectParam.PROJECT_TYPE, output.projectType);
        }
        if (output.templateId) {
          result.set(EditProjectParam.TEMPLATE_ID, output.templateId);
        }
      } else if (currentEditProjectParam === EditProjectParam.TEMPLATE_ID) {
        if (output.projectType) {
          result.set(EditProjectParam.PROJECT_TYPE, output.projectType);
        }
        if (output.outputFormat) {
          result.set(EditProjectParam.OUTPUT_FORMAT, output.outputFormat);
        }
      }
      return result;
    },

    fetchProjectOutputFields(): ProjectField[] {
      const outputs: ProjectOutput[] =
          this.project?.outputs?.length
              ? this.project.outputs
              : [{projectType: ProjectType.EXPORT} as ProjectOutput];

      return outputs.flatMap(exec => [
        {
          fieldKey: "Type",
          fieldValue: exec.projectType ? [exec.projectType] : [],
          editProjectParam: [EditProjectParam.PROJECT_TYPE],
          isEditable: this.isNotIncludedInCurrentProjectConfiguration(exec.projectType + '.projectType'),
          possibleValues: this.projectTypes,
          mandatory: true,
          visibilityCondition:
              !this.existsDraftDialog ||
              this.draftDialogStepper.currentStep?.id === FixedDialogStep.CUSTOM ||
              this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY,
          extraParams: this.fetchExtraParamsForProjectOutput(EditProjectParam.PROJECT_TYPE, exec),
          deleteAction: Action.REMOVE_PROJECT_OUTPUT_ACTION,
          deleteModule: Module.PROJECT_EDITION_MODULE
        },
        {
          fieldKey: `Output Format (${exec.projectType})`,
          fieldValue: exec.outputFormat ? [exec.outputFormat] : [],
          editProjectParam: [EditProjectParam.OUTPUT_FORMAT],
          isEditable: this.isNotIncludedInCurrentProjectConfiguration(exec.projectType + '.outputFormat'),
          possibleValues: this.outputFormats[exec.projectType] ?? [],
          mandatory: true,
          visibilityCondition:
              !this.existsDraftDialog ||
              this.draftDialogStepper.currentStep?.id === FixedDialogStep.CUSTOM ||
              this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY,
          extraParams: this.fetchExtraParamsForProjectOutput(EditProjectParam.OUTPUT_FORMAT, exec)
        },
        {
          fieldKey: `Template ID (${exec.projectType})`,
          fieldValue: exec.templateId ? [exec.templateId] : [],
          editProjectParam: [EditProjectParam.TEMPLATE_ID],
          isEditable: this.isNotIncludedInCurrentProjectConfiguration(exec.projectType + '.templateId'),
          possibleValues: this.exporterTemplateIds[exec.projectType] ?? [],
          mandatory: true,
          visibilityCondition:
              !this.existsDraftDialog ||
              this.draftDialogStepper.currentStep?.id === FixedDialogStep.CUSTOM ||
              this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY,
          extraParams: this.fetchExtraParamsForProjectOutput(EditProjectParam.TEMPLATE_ID, exec)
        }
      ]);
    },

    fetchProjectFields(): ProjectField[] {
      const fixedFields: ProjectField[] = [
        {
          fieldKey: "Title",
          fieldValue: this.project?.label ? [this.project.label] : [],
          editProjectParam: [EditProjectParam.LABEL],
          isEditable: true,
          mandatory: true,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogStepper.currentStep?.id === FixedDialogStep.PROJECT || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY
        },
        {
          fieldKey: "Description",
          fieldValue: this.project?.description ? [this.project.description] : [],
          editProjectParam: [EditProjectParam.DESCRIPTION],
          isEditable: true,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogStepper.currentStep?.id === FixedDialogStep.PROJECT || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY
        },
        {
          fieldKey: "Sites",
          fieldValue: [],
          bridgeheads: {
            selected: this.bridgeheads,
            available: this.allBridgeheads,
          },
          editProjectParam: [EditProjectParam.BRIDGEHEADS],
          isEditable: true,
          mandatory: true,
          redirectUrl: this.project?.explorerUrl ?? undefined,
          transformForSending: (humanReadable: string) => this.allBridgeheads.find(bridgehead => bridgehead.humanReadable === humanReadable)?.bridgehead || humanReadable,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogStepper.currentStep?.id === FixedDialogStep.PROJECT || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY
        },
        {
          fieldKey: "Configuration",
          fieldValue: [this.currentProjectConfiguration],
          editProjectParam: [EditProjectParam.PROJECT_CONFIGURATION],
          isEditable: true,
          possibleValues: this.projectConfigurationLabels,
          configurations: this.projectConfigurations,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SERVICES || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY,
          action: Action.SET_PROJECT_CONFIGURATION_ACTION
        },
        {
          fieldKey: "Query",
          fieldValue: (this.project?.humanReadable && this.project?.query) ? [this.project.humanReadable, this.project.query] : [],
          editProjectParam: [EditProjectParam.HUMAN_READABLE],
          isEditable: true,
          mandatory: true,
          redirectUrl: this.project?.explorerUrl ?? undefined,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogStepper.currentStep?.id === FixedDialogStep.QUERY || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY
        },
        {
          fieldKey: "Query Format",
          fieldValue: this.project?.queryFormat ? [this.project.queryFormat] : [],
          editProjectParam: [EditProjectParam.QUERY_FORMAT],
          isEditable: true,
          redirectUrl: this.project?.explorerUrl ?? undefined,
          possibleValues: this.queryFormats,
          mandatory: true,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY
        },
        ...this.fetchProjectOutputFields(),
        {
          fieldKey: "Environment Variables",
          fieldValue: this.project?.queryContext ? [this.project.queryContext] : [],
          editProjectParam: [EditProjectParam.QUERY_CONTEXT],
          isEditable: this.isNotIncludedInCurrentProjectConfiguration('queryContext'),
          visibilityCondition: !this.existsDraftDialog || this.currentProjectConfiguration === CUSTOM_PROJECT_CONFIGURATION && this.draftDialogStepper.currentStep?.id === FixedDialogStep.CUSTOM || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY
        },
        {
          fieldKey: "Votum",
          fieldValue: [this.votumDescription.label, this.votumDescription.originalFilename],
          isEditable: true,
          existFile: this.existsVotum,
          uploadAction: this.Action.UPLOAD_VOTUM_ACTION,
          downloadAction: this.Action.DOWNLOAD_VOTUM_ACTION,
          downloadModule: this.Module.PROJECT_DOCUMENTS_MODULE,
          visibilityCondition: this.project?.state !== ProjectState.DRAFT && (!this.existsDraftDialog || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY)
        },
        {
          fieldKey: "Votum for all bridgeheads",
          fieldValue: [this.votumForAllBridgeheadsDescription.label, this.votumForAllBridgeheadsDescription.originalFilename],
          isEditable: true,
          existFile: this.existsVotumForAllBridgeheads,
          uploadAction: this.Action.UPLOAD_VOTUM_FOR_ALL_BRIDGEHEADS_ACTION,
          downloadAction: this.Action.DOWNLOAD_VOTUM_FOR_ALL_BRIDGEHEADS_ACTION,
          downloadModule: this.Module.PROJECT_DOCUMENTS_MODULE,
          visibilityCondition: this.project?.state !== ProjectState.DRAFT && (!this.existsDraftDialog || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY)
        },
        {
          fieldKey: "Script",
          fieldValue: [this.scriptDescription.label, this.scriptDescription.originalFilename],
          isEditable: true,
          existFile: this.existsScript,
          uploadAction: this.Action.UPLOAD_SCRIPT_ACTION,
          downloadAction: this.Action.DOWNLOAD_SCRIPT_ACTION,
          downloadModule: this.Module.PROJECT_DOCUMENTS_MODULE,
          visibilityCondition: !!this.dataShieldStatus && (!this.existsDraftDialog || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY)
        },
        {
          fieldKey: "Authentication Script",
          fieldValue: [],
          isEditable: false,
          existFile: this.existsAuthenticationScript,
          downloadAction: this.Action.DOWNLOAD_AUTHENTICATION_SCRIPT_ACTION,
          downloadModule: this.Module.TOKEN_MANAGER_MODULE,
          visibilityCondition: !!this.dataShieldStatus && this.dataShieldStatus.project_status === 'WITH_DATA' && this.existsAuthenticationScript
        }
      ];
      const dynamicFields = this.buildDynamicProjectFieldsFromFormFields(this.formFields);
      const dynamicSelectedForms = this.buildDynamicProjectFieldsFromFormTitles(
          this.formTitles.filter(formTitle => {
            this.draftDialogStepper.hasCurrentStep(formTitle.title)
          }));
      return [...fixedFields, ...dynamicSelectedForms, ...dynamicFields];
    },

    fetchButtons(): void {

      const executions = this.activeBridgehead?.executions ?? [];

      // Collect unique project types
      const projectTypes = [...new Set(executions.map(exec => exec.projectType))];
      const projectTypesParam = projectTypes.join(",");

      // Determine button text
      const hasFinishedExecution = executions.some(exec => exec.queryState === "FINISHED");

      // Check if RESEARCH_ENVIRONMENT exists
      const hasResearchEnvironment = projectTypes.includes(ProjectType.RESEARCH_ENVIRONMENT);

      const teilerButtonGroups = [
        // --- TEILER GROUP (always if executions exist) ---
        ...(executions.length > 0
            ? [{
              label: "Teiler",
              button: [
                {
                  module: Module.EXPORT_MODULE,
                  action: Action.SAVE_QUERY_IN_BRIDGEHEAD_ACTION,
                  refreshContextCallFunction: this.refreshBridgeheadsAndContext as () => void,
                  text: hasFinishedExecution ? "Resend Query" : "Send Query",
                  withMessage: false,
                  cssClass: "btn btn-primary mr-2",
                  params: new Map<string, string>([
                    [EditProjectParam.PROJECT_TYPE, projectTypesParam]
                  ]),
                  visibilityCondition: this.canShowBridgeheadAdminButtons
                }
              ] as ActionButton[]
            }]
            : []),

        // --- RESEARCH ENVIRONMENT GROUP (only if present) ---
        ...(hasResearchEnvironment
            ? [{
              label: "Research Environment",
              button: [
                {
                  module: Module.EXPORT_MODULE,
                  action: Action.SEND_EXPORT_FILES_TO_RESEARCH_ENVIRONMENT_ACTION,
                  refreshContextCallFunction: this.refreshContext as () => void,
                  text: "Resend Export Files to Research Environment",
                  withMessage: false,
                  params: new Map<string, string>([
                    [EditProjectParam.PROJECT_TYPE, ProjectType.RESEARCH_ENVIRONMENT]
                  ]),
                  cssClass: "btn btn-primary mr-2"
                }
              ] as ActionButton[]
            }]
            : [])
      ];

      this.actionButtons = [
        {
          label: "Project",
          button: [
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.ACCEPT_PROJECT_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Accept", withMessage: false, cssClass: "btn btn-primary mr-2"
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.REJECT_PROJECT_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Reject", withMessage: true, cssClass: "btn btn-danger btn-secondary mr-2",
              visibilityCondition: this.project?.state !== ProjectState.DRAFT
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.FINISH_PROJECT_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Finish", withMessage: false, cssClass: "btn btn-primary mr-2"
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.ARCHIVE_PROJECT_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Archive", withMessage: true, cssClass: "btn btn-secondary"
            }
          ] as ActionButton[]
        },
        {
          label: "Phase",
          button: [
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.START_DEVELOP_STAGE_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Start Develop Phase", withMessage: false, cssClass: "btn btn-primary mr-2"
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.START_PILOT_STAGE_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Start Pilot Phase", withMessage: false, cssClass: "btn btn-primary mr-2"
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.START_FINAL_STAGE_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Start Final Phase", withMessage: false, cssClass: "btn btn-primary mr-2"
            }
          ] as ActionButton[]
        },
        {
          label: "User Access",
          button: [
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.ACCEPT_BRIDGEHEAD_PROJECT_ACTION,
              refreshContextCallFunction: this.refreshBridgeheadsAndContext as () => void,
              text: "Authorize", withMessage: false, cssClass: "btn btn-primary mr-2",
              visibilityCondition: this.activeBridgehead?.state !== 'ACCEPTED' && this.canShowBridgeheadAdminButtons
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.REJECT_BRIDGEHEAD_PROJECT_ACTION,
              refreshContextCallFunction: this.refreshBridgeheadsAndContext as () => void,
              text: "Revoke", withMessage: true, cssClass: "btn btn-danger btn-secondary mr-2",
              visibilityCondition: this.activeBridgehead?.state !== 'REJECTED' && this.canShowBridgeheadAdminButtons
            }
          ] as ActionButton[]
        },
        {
          label: "Script",
          button: [
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.ACCEPT_SCRIPT_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Accept", withMessage: false, cssClass: "btn btn-primary mr-2",
              visibilityCondition: this.currentUser?.projectState !== 'ACCEPTED'
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.REJECT_SCRIPT_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Block", withMessage: true, cssClass: "btn btn-danger btn-secondary mr-2",
              visibilityCondition: this.currentUser?.projectState !== 'REJECTED'
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.REQUEST_SCRIPT_CHANGES_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Request Changes", withMessage: true, cssClass: "btn btn-primary mr-2"
            }
          ] as ActionButton[]
        },
        {
          label: "Result",
          button: [
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.ACCEPT_PROJECT_RESULTS_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Accept", withMessage: false, cssClass: "btn btn-primary mr-2",
              visibilityCondition: this.currentUser?.projectState !== 'ACCEPTED'
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.REJECT_PROJECT_RESULTS_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Block", withMessage: true, cssClass: "btn btn-danger btn-secondary mr-2",
              visibilityCondition: this.currentUser?.projectState !== 'REJECTED'
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.REQUEST_CHANGES_IN_PROJECT_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Request Changes", withMessage: true, cssClass: "btn btn-primary mr-2"
            }
          ] as ActionButton[]
        },
        {
          label: "Analysis",
          button: [
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.ACCEPT_PROJECT_ANALYSIS_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Accept", withMessage: false, cssClass: "btn btn-primary mr-2",
              visibilityCondition: this.currentUser?.projectState !== 'ACCEPTED'
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.REJECT_PROJECT_ANALYSIS_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Block", withMessage: true, cssClass: "btn btn-danger btn-secondary mr-2",
              visibilityCondition: this.currentUser?.projectState !== 'REJECTED'
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.REQUEST_CHANGES_IN_PROJECT_ANALYSIS_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Request Changes", withMessage: true, cssClass: "btn btn-primary mr-2"
            }
          ] as ActionButton[]
        },
        {
          label: "Research Environment",
          button: [
            {
              module: Module.USER_MODULE, action: Action.EXISTS_RESEARCH_ENVIRONMENT_WORKSPACE_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Go", withMessage: false, cssClass: "btn btn-primary mr-2",
              visibilityCondition: this.researchEnvironmentUrl !== undefined && this.existsResearchEnvironmentWorkspace,
              doActionOnClick: this.goToResearchEnvironment as () => void
            }
          ] as ActionButton[]
        },
        ...teilerButtonGroups,
      ] as ActionButtonGroup[]
    },

    async checkButtonVisibility() {
      let flagChanged = false;  // Track if the flag changes
      await Promise.all(
          this.actionButtons.map(async (buttonGroup, index) => {
            const statusArray = await Promise.all(
                buttonGroup.button.map(async (button) => {
                  const visibility1 = button.visibilityCondition !== undefined ? button.visibilityCondition : true;
                  const visibility2 = await this.projectManagerBackendService.isModuleActionActive(button.module, button.action);
                  // Check if a button is visible and the flag hasn't been set to true yet
                  if (visibility1 && visibility2 && !this.isAnyButtonVisible) {
                    this.isAnyButtonVisible = true; // Set the flag to true immediately if a visible button is found
                    flagChanged = true;  // Mark the flag as changed
                  }
                  return visibility1 && visibility2;
                })
            );
            // Update the visibility for the button group
            this.buttonGroups[index] = statusArray.includes(true);
          })
      );

      // If the flag changed, trigger the watcher by updating the property
      if (flagChanged) {
        // You can put any additional logic to notify the watcher if necessary here
      }
    },

    getMenuSteps(): string[] {
      if(this.project?.state !== ProjectState.DRAFT) {
        return ["Status", "Request", "Documents"]
      } else {
        return ["Request", "Documents"]
      }
    }


  }

});


</script>

<style scoped>

.box-header {
  padding: 10px 30px 10px 2%;
  /*background-color: #00489c;*/
  color: rgb(0, 56, 124);;
  font-size: large;
  font-weight: bold;
  /*border-top: 1px solid #95c8dc;
  border-left: 1px solid #95c8dc;
  border-right: 1px solid #95c8dc;*/
  background-image: linear-gradient(to right, #e1edf5, #bed7e9);
  /*border-radius: 10px 10px 0 0;*/
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.box-header span {
  font-size: 16pt;
}
.info-container {
  display: flex;
  flex-direction: column;
  background-color: white;
  /*border-radius: 10px;
  box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
  0 1px 1px 0 rgba(0, 0, 0, 0.14),
  0 1px 3px 0 rgba(0, 0, 0, 0.12);
*/
  margin-bottom: 1.5%;
}

.data-container {
  display: flex;
  flex-direction: column;
  background-color: white;
  height: 100%;
  margin: 0 1% 0 1%;
}
.data-container.non-draft {
  border-radius: 10px;
  /*box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12);*/
  margin: 0;
}
.vertical-stepper-box {
  display:flex;
  flex-direction: column;
  width:30%;
  margin-right: 3%;
}

.project-actions {
  background-color: white;
  /*border-radius: 10px;
  box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
  0 1px 1px 0 rgba(0, 0, 0, 0.14),
  0 1px 3px 0 rgba(0, 0, 0, 0.12);*/

  margin-bottom: 1.5%;
}

.documents {
  background-color: white;
  /*border-radius: 10px;
  box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
  0 1px 1px 0 rgba(0, 0, 0, 0.14),
  0 1px 3px 0 rgba(0, 0, 0, 0.12);*/

  margin-bottom: 1.5%;
}

.main-menu {
  width: 100%;
  background-color: rgba(0,72,156,.95);
  display: flex;
  padding-left: 60%;
}
.menu-item {
  padding: 1.2rem 2rem;
  color: white;
  cursor: pointer;
  font-weight: bold;
}
.menu-item.active {
  background-color: rgb(0, 56, 124);
}
.main-container {
  display: flex;
  flex-flow: row;
  width: 100%;
}

.left-container {
  display: flex;
  flex-flow: column;
  width: 14%;
  min-height: 800px;
  margin-top: 1.5%;
  margin-left: 1.5%;
  margin-bottom: 5%;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
  0 1px 1px 0 rgba(0, 0, 0, 0.14),
  0 1px 3px 0 rgba(0, 0, 0, 0.12);

}

.right-container {
  flex: 3;
  display: flex;
  flex-flow: row;
  margin: 1.5% 10% 0 10%;
  width: 56%;
}

.main-content {
  display: flex;
  flex-flow: column;
  width: 100%;
}

.button-container-right button {
  margin-bottom: 8px;
}

.table-responsive {
  overflow-x: auto;
  padding: 2%;
}

.vertical-stepper {
  margin: 20% 0 0 28%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.vertical-stepper2 {
  margin: 3rem 5% 0 10%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;

}

.stepper-line {
  width: 2px;
  height: 50px;
  background-color: #9e9e9e;
  margin-left: 14px;
  margin-top: 10px;
  align-items: flex-start;
}

.stepper-line2 {
  width: 2px;
  height: 60px;
  background-color: #9e9e9e;
  align-items: flex-start;
  margin: 10px 0 10px 14px;
}

.stepper-step {
  display: flex;
  margin-bottom: 10px;
  flex-flow: column;
  align-content: flex-start;
  align-items: flex-start;
}

.stepper-step2 {
  display: flex;
  flex-flow: row;
  cursor: pointer;
}

.stepper-step-textbox {
}

.stepper-step-header {
  color: #00489cf2;
  font-size: large;
}

.step-circle {
  width: 30px;
  height: 30px;
  background-color: #9e9e9e;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
}

.step-circle span {
  font-size: 14px;
}

.step-title {
  font-size: 16px;
  padding-top: 2px;
}

.active-step {
  font-weight: bold;
}

.active-step .step-circle {
  background-color: #007bff;
}

.notification-box {
  padding: 2%;
  font-family: "Calibri Light", Arial, sans-serif;
}

.todo-circle {
  min-width: 32px;
  height: 32px;
  background-color: gold;
  color: #000;
  border: 1px solid black;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  font-size: 12pt;
  font-weight: bold;
}

.todo-circle-small {
  min-width: 22px;
  height: 22px;
  background-color: gold;
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

.custom-width-notifications {
  width: 22%;
  background-color: white;
  color: black;
  order: 2;
  position: relative;
  z-index: 1;
  overflow-y: auto;
  transition: transform 0.3s ease-in-out;
  border-radius: 10px;
  box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
  0 1px 1px 0 rgba(0, 0, 0, 0.14),
  0 1px 3px 0 rgba(0, 0, 0, 0.12);

  margin-top: 1.5%;
  margin-bottom: 5%;
  margin-right: 0.5%;
}

.open-right-panel {
  margin-top: 1.5%;
}

.custom-width-notifications h2 {
  margin-bottom: 15px;
}

.card {
  border-radius: 10px;
  background-color: rgba(149, 200, 220, 0.1);
}

.button-container {
  display: flex;
  justify-content: space-between;
  text-align: center;
  margin-left: 28%;
  margin-bottom: 2rem;
}

.inviteUser {
  padding: 2%;
  display: flex;
}

.status-table-header {
  background-color: #f2f2f2;
  vertical-align: middle;
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

.explanation-button i {
  position: relative;
  top: -9px;
}

.table-overview td {
  vertical-align: middle;
}

.state_circle {
  margin: 10px auto;
}

.notification-tab {
  padding: 5px 8% 5px 8%;
  background-color: #e8f8fd;
  margin: 0 2%;
  border-radius: 5px 5px 0 0;
  font-weight: normal;
  cursor: pointer;
}

.notification-tab.active {
  font-weight: bold;
  background-color: white;
}

.states-circle-container {
  display: flex;
  justify-content: center;
}

.stepper-button {
  color: #00489c;
  border: none;
  background-color: white;
  font-size: large;
  cursor: pointer;
}

.stepper-button:hover {
  text-decoration: underline;
}
.first-seperator {
  width: 100%;
  height: 10px;
  background: white;
  margin-bottom: -20px;
  position: relative;
}
.project-field-header {
  margin: 2rem 1rem 0 1rem;
  padding: 1rem 3rem;
  background-image: linear-gradient(to right, #eeddcb, #aed0e6);
}
.project-field-title {
   font-size: larger;
   font-weight: bold;
   color: rgb(0, 72, 156);
 }
.project-field-notification {
  font-size: small;
  color: dimgrey;
}
.missing-fields, .missing-fields .stepper-step-header {
  color: red;
}
.missing-fields .step-circle {
  background-color: red!important;
}
</style>
