<template>
  <div class="flex-container">
    <div class="left-container">

      <!--<div v-if="projectData.projectId">-->
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
      <div style="display:flex; flex-flow: column; width:100%; padding-right:3%">
        <div class="container">
          <br/>
          <h2>Project Information</h2>
          <br/>

          <div style="display:flex; flex-flow:row; justify-content: space-between">
            <router-link to="/" data-toggle="tooltip" data-placement="top" title="Back to Project Dashboard"><i
                class="bi bi-arrow-left-square-fill"></i></router-link>

            <div class="card" v-if="visibleBridgeheads && visibleBridgeheads.length === 1" style="padding: 3px 20px;">
              <div class="card-body" style="padding: 0px 0px;">
                <span style="padding: 0px 0px;">{{ context.bridgehead }}</span>
              </div>
            </div>

            <div>
              <button data-toggle="tooltip" data-placement="top" title="Progress" @click="toggleProgress"
                      class="btn btn-dark"
                      style="background: none; border:none; color:#007bff; width:auto;">
                <i class="bi bi-clipboard-check-fill"></i>
              </button>
              <button data-toggle="tooltip" data-placement="top" title="Notifications" @click="toggleNotification"
                      class="btn btn-dark"
                      style="background: none; border:none; color:#007bff; width:auto;">
                <i class="bi bi-chat-right-text-fill"></i>
              </button>
            </div>
          </div>

          <BridgeheadOverview v-if="visibleBridgeheads.length > 1"
                              :project-manager-backend-service="projectManagerBackendService"
                              :call-update-active-bridgehead="updateActiveBridgehead"
                              :context="context"
                              :project="project"
                              :bridgeheads="visibleBridgeheads"
                              :activeBridgehead="activeBridgehead"/>
          <br/>
          <table class="table table-bordered">
            <thead>
            <tr>
              <th style="background-color: #f2f2f2;" scope="col">Data Request Number (DRN)</th>
              <th style="background-color: #f2f2f2;" scope="col">Project State</th>
              <th style="background-color: #f2f2f2;" scope="col">Bridgehead State</th>
              <th style="background-color: #f2f2f2;" scope="col">Query State</th>
              <th style="background-color: #f2f2f2;" v-if="dataShieldStatus" scope="col">DataSHIELD Status</th>
              <th style="background-color: #f2f2f2;" scope="col">Creator</th>
              <th style="background-color: #f2f2f2;" scope="col">Created at</th>
              <th style="background-color: #f2f2f2;" scope="col">Expires at</th>
              <th style="background-color: #f2f2f2;" scope="col">Last modified</th>
            </tr>
            </thead>
            <tbody>
            <tr>
              <td>{{ project ? project.code : '' }}</td>
              <td>{{ project ? project.state : '' }}</td>
              <td>{{ activeBridgehead ? activeBridgehead.state : '' }}</td>
              <td>{{ activeBridgehead ? activeBridgehead.queryState : '' }}</td>
              <td v-if="dataShieldStatus">{{ dataShieldStatus.project_status }}</td>
              <td>{{ project ? project.creatorEmail : '' }}</td>
              <td>{{ project && project.createdAt ? convertDate(project.createdAt) : '' }}</td>
              <td>{{ project && project.expiresAt ? convertDate(project.expiresAt) : '' }}</td>
              <td>{{ project && project.modifiedAt ? convertDate(project.modifiedAt) : '' }}</td>
            </tr>
            </tbody>
          </table>
          <div class="text-right mt-4">
            <!-- Project State Module: Creator View -->
            <!-- v-if="existsApplicationForm" entfernt - statt ganz ausblenden -> design ändern -->
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.CREATE_PROJECT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Create"
                                  button-class="btn btn-primary mr-2"
                                  :with-message="false"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <!-- Project State Module: PM-ADMIN View -->
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.ACCEPT_PROJECT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Accept"
                                  button-class="btn btn-primary mr-2"
                                  :with-message="false"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.REJECT_PROJECT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Reject"
                                  button-class="btn btn-danger btn-secondary mr-2"
                                  :with-message="true"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.START_DEVELOP_STAGE_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Start develop stage"
                                  button-class="btn btn-primary mr-2"
                                  :with-message="false"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.START_PILOT_STAGE_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Start pilot stage"
                                  :with-message="false"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.START_FINAL_STAGE_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Start final stage"
                                  :with-message="false"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.FINISH_PROJECT_ACTION"
                                  :with-message="false"
                                  :context="context" :call-refreh-context="refreshContext" text="Finish"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.ARCHIVE_PROJECT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Archive"
                                  :with-message="false"
                                  button-class="btn btn-secondary"
                                  :project-manager-backend-service="projectManagerBackendService"/>

            <!-- Project State Module: BK-ADMIN View -->
            <ProjectManagerButton v-if="activeBridgehead && activeBridgehead.state !== 'ACCEPTED' && canShowBridgeheadAdminButtons()"
                                  :module="Module.PROJECT_STATE_MODULE"
                                  :action="Action.ACCEPT_BRIDGEHEAD_PROJECT_ACTION"
                                  :with-message="false"
                                  :context="context" :call-refreh-context="refreshBridgeheadsAndContext" text="Accept"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton v-if="activeBridgehead && activeBridgehead.state !== 'REJECTED' && canShowBridgeheadAdminButtons()"
                                  :module="Module.PROJECT_STATE_MODULE"
                                  :action="Action.REJECT_BRIDGEHEAD_PROJECT_ACTION"
                                  :context="context" :call-refreh-context="refreshBridgeheadsAndContext" text="Reject"
                                  :with-message="true"
                                  button-class="btn btn-danger btn-secondary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <!-- Project State Module: Developer/Pilot View -->
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.ACCEPT_SCRIPT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Accept"
                                  button-class="btn btn-primary mr-2"
                                  :with-message="false"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.REJECT_SCRIPT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Reject"
                                  :with-message="true"
                                  button-class="btn btn-danger btn-secondary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.REQUEST_SCRIPT_CHANGES_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Request changes"
                                  :with-message="true"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <!-- Project State Module: Final View -->
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.ACCEPT_PROJECT_RESULTS_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Accept"
                                  button-class="btn btn-primary mr-2"
                                  :with-message="false"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.REJECT_PROJECT_RESULTS_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Reject"
                                  :with-message="true"
                                  button-class="btn btn-danger btn-secondary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE"
                                  :action="Action.REQUEST_CHANGES_IN_PROJECT_ACTION"
                                  :with-message="true"
                                  :context="context" :call-refreh-context="refreshContext" text="Request changes"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <!-- Export Module -->
            <ProjectManagerButton v-if="canShowBridgeheadAdminButtons()" :module="Module.EXPORT_MODULE" :action="Action.SAVE_QUERY_IN_BRIDGEHEAD_ACTION"
                                  :context="context" :call-refreh-context="refreshBridgeheadsAndContext"
                                  text="Save query in bridgehead"
                                  :with-message="false"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton v-if="canShowBridgeheadAdminButtons()" :module="Module.EXPORT_MODULE"
                                  :action="Action.SAVE_AND_EXECUTE_QUERY_IN_BRIDGEHEAD_ACTION"
                                  :context="context" :call-refreh-context="refreshBridgeheadsAndContext"
                                  text="Save and execute query in bridgehead"
                                  :with-message="false"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
          </div>
          <div v-if="!existsDraftDialog || draftDialogCurrentStep==4">
            <UserInput  :project="project" :context="context"
                       :bridgeheads="visibleBridgeheads"
                       :project-manager-backend-service="projectManagerBackendService"/>
            <DocumentsTable :context="context"
                            :project-manager-backend-service="projectManagerBackendService"
                            :download-action="Action.DOWNLOAD_PUBLICATION_ACTION"
                            :fetch-list-action="Action.FETCH_PUBLICATIONS_ACTION"
                            :bridgeheads="visibleBridgeheads" icon-class="bi bi-download" text="Publications: "/>
          </div>
          <hr/>
        </div>

        <div class="container mt-12" style="margin-bottom: 8%;">
          <div v-if="project">
            <br/>
            <div class="table-responsive">
              <h3>Requested Data</h3>
              <br/>
              <div v-if="existsDraftDialog" class="container" style="width:100%">
                <div class="row justify-content-center">
                  <div class="col-auto" style="width:100%">
                    <!-- Bootstrap Stepper -->
                    <div class="stepper">
                      <div v-for="(step, index) in steps" :key="index" class="stepper-item"
                           :class="{ 'active': draftDialogCurrentStep === index }">
                        <button style="background: none; border:none; color: black;"
                                @click="draftDialogCurrentStep=index"
                                :style="{ fontWeight: draftDialogCurrentStep === index ? 'bold' : 'normal' }">{{ step }}
                        </button>
                      </div>
                    </div>
                    <!-- Navigationstasten -->
                    <div class="button-container mt-3">
                      <button class="btn btn-primary me-2" @click="prevStep" :disabled="draftDialogCurrentStep === 0">
                        Zurück
                      </button>
                      <button class="btn btn-primary" @click="nextStep"
                              :disabled="draftDialogCurrentStep === steps.length - 1">
                        Weiter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <br/>
            <table class="table table-bordered custom-table  table-hover">
              <tbody>
              <ProjectFieldRow v-if="!existsDraftDialog || draftDialogCurrentStep==0 || draftDialogCurrentStep==4"
                               field-key="Title"
                               :field-value="[project.label]"
                               :edit-project-param="[EditProjectParam.LABEL]"
                               :is-editable="true"
                               :call-refreh-context="refreshContext"
                               :context="context" :project-manager-backend-service="projectManagerBackendService"/>
              <ProjectFieldRow v-if="!existsDraftDialog || draftDialogCurrentStep==0 || draftDialogCurrentStep==4"
                               field-key="Description"
                               :field-value="[project.description]"
                               :edit-project-param="[EditProjectParam.DESCRIPTION]"
                               :is-editable="true"
                               :call-refreh-context="refreshContext"
                               :context="context" :project-manager-backend-service="projectManagerBackendService"/>
              <ProjectFieldRow v-if="!existsDraftDialog || draftDialogCurrentStep==0 || draftDialogCurrentStep==4"
                               field-key="Bridgeheads"
                               :field-value="[bridgeheads, allBridgeheads]"
                               :edit-project-param="[EditProjectParam.BRIDGEHEADS]"
                               :is-editable="true"
                               :call-refreh-context="refreshContext"
                               :redirect-url="project.explorerUrl"
                               :context="context" :project-manager-backend-service="projectManagerBackendService"/>
              <ProjectFieldRow v-if="!existsDraftDialog || draftDialogCurrentStep==1 || draftDialogCurrentStep==4"
                               field-key="Configuration"
                               :field-value="[currentProjectConfiguration]"
                               :edit-project-param="[EditProjectParam.PROJECT_CONFIGURATION]"
                               :is-editable="true"
                               :call-refreh-context="refreshContext"
                               :possible-values="projectConfigurations"
                               :context="context" :project-manager-backend-service="projectManagerBackendService"/>
              <ProjectFieldRow v-if="!existsDraftDialog || draftDialogCurrentStep==1 || draftDialogCurrentStep==4"
                               field-key="Type"
                               :field-value="[project.type]"
                               :edit-project-param="[EditProjectParam.PROJECT_TYPE]"
                               :is-editable="isNotIncludedInCurrentProjectConfiguration('type')"
                               :call-refreh-context="refreshContext"
                               :possible-values="projectTypes"
                               :context="context" :project-manager-backend-service="projectManagerBackendService"/>
              <ProjectFieldRow v-if="!existsDraftDialog || draftDialogCurrentStep==2 || draftDialogCurrentStep==4"
                               field-key="Query"
                               :field-value="[project.humanReadable, project.query]"
                               :edit-project-param="[EditProjectParam.HUMAN_READABLE]"
                               :call-refreh-context="refreshContext"
                               :redirect-url="project.explorerUrl"
                               :is-editable="true"
                               :context="context" :project-manager-backend-service="projectManagerBackendService"/>
              <ProjectFieldRow v-if="!existsDraftDialog || draftDialogCurrentStep==2 || draftDialogCurrentStep==4"
                               field-key="Query Format"
                               :field-value="[project.queryFormat]"
                               :edit-project-param="[EditProjectParam.QUERY_FORMAT]"
                               :is-editable="true"
                               :call-refreh-context="refreshContext"
                               :possible-values="queryFormats"
                               :redirect-url="project.explorerUrl"
                               :context="context" :project-manager-backend-service="projectManagerBackendService"/>
              <ProjectFieldRow v-if="!existsDraftDialog || draftDialogCurrentStep==3 || draftDialogCurrentStep==4"
                               field-key="Output Format"
                               :field-value="[project.outputFormat]"
                               :edit-project-param="[EditProjectParam.OUTPUT_FORMAT]"
                               :is-editable="isNotIncludedInCurrentProjectConfiguration('outputFormat')"
                               :call-refreh-context="refreshContext"
                               :possible-values="outputFormats"
                               :context="context" :project-manager-backend-service="projectManagerBackendService"/>
              <ProjectFieldRow v-if="!existsDraftDialog || draftDialogCurrentStep==3 || draftDialogCurrentStep==4"
                               field-key="Template ID"
                               :field-value="[project.templateId]"
                               :edit-project-param="[EditProjectParam.TEMPLATE_ID]"
                               :is-editable="isNotIncludedInCurrentProjectConfiguration('templateId')"
                               :call-refreh-context="refreshContext"
                               :possible-values="exporterTemplateIds"
                               :context="context" :project-manager-backend-service="projectManagerBackendService"/>
              <!-- TODO: Separate queries in pairs Key-Values + encrpyt and decrypt in base64-->
              <ProjectFieldRow v-if="!existsDraftDialog || draftDialogCurrentStep==3 || draftDialogCurrentStep==4"
                               field-key="Environment Variables"
                               :field-value="[project?.queryContext]"
                               :edit-project-param="[EditProjectParam.QUERY_CONTEXT]"
                               :is-editable="isNotIncludedInCurrentProjectConfiguration('queryContext')"
                               :call-refreh-context="refreshContext"
                               :context="context" :project-manager-backend-service="projectManagerBackendService"/>
              <ProjectFieldRow v-if="!existsDraftDialog || draftDialogCurrentStep==0 || draftDialogCurrentStep==4"
                               field-key="Application form"
                               :exists-file="existsApplicationForm"
                               :is-editable="true"
                               :field-value="[applicationFormLabel]"
                               :upload-action="Action.UPLOAD_APPLICATION_FORM_ACTION"
                               :download-action="Action.DOWNLOAD_APPLICATION_FORM_ACTION"
                               :download-module="Module.PROJECT_DOCUMENTS_MODULE"
                               :call-refreh-context="refreshContext"
                               :context="context" :project-manager-backend-service="projectManagerBackendService"/>
              <ProjectFieldRow v-if="!existsDraftDialog || draftDialogCurrentStep==4"
                               field-key="Votum"
                               :is-editable="true"
                               :exists-file="existsVotum"
                               :field-value="[votumLabel]"
                               :upload-action="Action.UPLOAD_VOTUM_ACTION"
                               :download-action="Action.DOWNLOAD_VOTUM_ACTION"
                               :download-module="Module.PROJECT_DOCUMENTS_MODULE"
                               :call-refreh-context="refreshContext"
                               :context="context" :project-manager-backend-service="projectManagerBackendService"/>
              <ProjectFieldRow v-if="dataShieldStatus && (!existsDraftDialog || draftDialogCurrentStep==4)"
                               field-key="Script"
                               :field-value="[scriptLabel]"
                               :is-editable="true"
                               :exists-file="existsScript"
                               :upload-action="Action.UPLOAD_SCRIPT_ACTION"
                               :download-action="Action.DOWNLOAD_SCRIPT_ACTION"
                               :download-module="Module.PROJECT_DOCUMENTS_MODULE"
                               :call-refreh-context="refreshContext"
                               :context="context" :project-manager-backend-service="projectManagerBackendService"/>
              <ProjectFieldRow
                  v-if=" dataShieldStatus && dataShieldStatus.project_status === 'WITH_DATA' && existsAuthenticationScript"
                  field-key="Authentication Script"
                  :is-editable="false"
                  :field-value="[]"
                  :download-action="Action.DOWNLOAD_AUTHENTICATION_SCRIPT_ACTION"
                  :download-module="Module.TOKEN_MANAGER_MODULE"
                  :exists-file="existsAuthenticationScript"
                  :call-refreh-context="refreshContext"
                  :context="context" :project-manager-backend-service="projectManagerBackendService"/>
              </tbody>
            </table>
          </div>
          <UploadButton v-if="!existsDraftDialog || draftDialogCurrentStep==4" :context="context"
                        :project-manager-backend-service="projectManagerBackendService"
                        :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.UPLOAD_PUBLICATION_ACTION"
                        text="Upload publication" :call-refreh-context="refreshContext" :is-file="true"/>
          <br/>
          <UploadButton v-if="!existsDraftDialog || draftDialogCurrentStep==4" :context="context"
                        :project-manager-backend-service="projectManagerBackendService"
                        :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.ADD_PUBLICATION_URL_ACTION"
                        text="Upload publication URL" :call-refreh-context="refreshContext" :is-file="false"/>
          <br/>

          <div style="display:flex; flex-flow:row;  width:100% " v-if="!existsDraftDialog || draftDialogCurrentStep==4">
            <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.UPLOAD_OTHER_DOCUMENT_ACTION"
                          text="Upload other document" :call-refreh-context="refreshContext" :is-file="true"/>

            <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.ADD_OTHER_DOCUMENT_URL_ACTION"
                          text="Upload other document URL" :call-refreh-context="refreshContext" :is-file="false"/>
          </div>
          <br/>
          <DocumentsTable v-if="!existsDraftDialog || draftDialogCurrentStep==4"
                          :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :download-action="Action.DOWNLOAD_OTHER_DOCUMENT_ACTION"
                          :fetch-list-action="Action.FETCH_OTHER_DOCUMENTS_ACTION"
                          :bridgeheads="visibleBridgeheads" icon-class="bi bi-download" text="Other documents: "/>
        </div>
      </div>
    </div>

    <NotificationBox :context="context" :project-manager-backend-service="projectManagerBackendService"
                     :show-notification="showNotification" :call-toggle-notification="toggleNotification"
                     :notifications="notifications" :call-update-notifications="fetchNotifications"/>

    <div v-if="showProgress" class="custom-width-notifications">
      <div style="display:flex; flex-flow:row; justify-content:space-between ">
        <h2>Progress</h2>
        <button style="padding:5px" @click="toggleProgress" class="btn btn-dark" v-if="showProgress">
          <i style="font-size: 30px" class="bi bi-x"></i> <!-- Schließsymbol für Progress -->
        </button>
      </div>
      <div style="padding-left:10%" v-if="projectData.projectId">
        <div class="vertical-stepper">
          <div v-for="(projectState, index) in projectStates" :key="index" class="stepper-step">
            <div style="display: flex; flex-flow: row">
              <div class="step-circle">
                <span>{{ index + 1 }}</span>
              </div>
              <div class="step-title">{{ projectState }}</div>
            </div>
            <div v-if="index < projectStates.length - 1" class="stepper-line"></div>
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
  Bridgehead,
  DataShieldProjectStatus,
  EditProjectParam,
  Module,
  Notification,
  Project,
  ProjectManagerContext,
  ProjectRole,
  ProjetManagerBackendService,
  Site
} from "@/services/projetManagerBackendService";
import ProjectManagerButton from "@/components/ProjectManagerButton.vue";
import {format} from "date-fns";
import ProjectFieldRow from "@/components/ProjectFieldRow.vue";
import NotificationBox from "@/components/Notification.vue";
import UserInput from "@/components/UserInput.vue";
import UploadButton from "@/components/UploadButton.vue";
import DocumentsTable from "@/components/DocumentsTable.vue";
import BridgeheadOverview from "@/components/BridgeheadOverview.vue";
import keycloak from "@/services/keycloak";

export default defineComponent({
  computed: {
    EditProjectParam() {
      return EditProjectParam
    },
    Action() {
      return Action
    },
    Module() {
      return Module
    }
  },
  props: {
    projectCode: {
      type: String,
      required: true
    }
  },
  components: {
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
      bridgeheads: [] as string[],
      visibleBridgeheads: [] as Bridgehead[],
      context: new ProjectManagerContext(this.projectCode, undefined),
      projectManagerBackendService: new ProjetManagerBackendService(new ProjectManagerContext(this.projectCode, undefined), Site.PROJECT_VIEW_SITE),
      project: undefined as Project | undefined,
      projectTypes: [] as string[],
      outputFormats: [] as string[],
      queryFormats: [] as string[],
      exporterTemplateIds: [] as string[],
      allBridgeheads: [] as string[],
      projectStates: [] as string[],
      dataShieldStatus: undefined as DataShieldProjectStatus | undefined,
      site: Site.PROJECT_VIEW_SITE,
      projectData: {
        projectId: '',
        drn: '',
        date: '',
        status: '',
      },
      notifications: [] as Notification[],
      showNotification: false,
      showProgress: false,
      existsVotum: false,
      existsAuthenticationScript: false,
      existsApplicationForm: false,
      existsScript: false,
      projectConfigurations: [] as string[],
      currentProjectConfiguration: '',
      currentProjectConfigurationFields: [] as string[],
      projectRoles: [] as ProjectRole[],
      steps: ['Project', 'Type', 'Query', 'Output', 'Summary'], // Die einzelnen Schritte des Steppers
      draftDialogCurrentStep: 0, // Der aktuelle Schritt, beginnend bei 0
      existsDraftDialog: false,
      applicationFormLabel: "",
      scriptLabel: "",
      votumLabel: "",
      existInvitedUsers: false
    };
  },
  watch: {
    activeBridgehead(newValue, oldValue) {
      this.activeBridgeheadIndex = this.visibleBridgeheads.findIndex(bridgehead => bridgehead === newValue);
      this.context = new ProjectManagerContext(this.projectCode, newValue.bridgehead);
    },
    context(newValue, oldValue) {
      this.projectManagerBackendService = new ProjetManagerBackendService(newValue, Site.PROJECT_VIEW_SITE);
      this.fetchProject();
    },
    project(newValue, oldValue) {
      this.initializeProjectRelatedData();
    }
  },
  mounted() {
    this.fetchVisibleBridgeheads();
  },


  methods: {
    /*toggleExpand(item: { isExpanded: boolean }) {
      item.isExpanded = !item.isExpanded;
    },*/

    nextStep() {
      if (this.draftDialogCurrentStep < this.steps.length - 1) {
        this.draftDialogCurrentStep++;
      }
    },
    prevStep() {
      if (this.draftDialogCurrentStep > 0) {
        this.draftDialogCurrentStep--;
      }
    },

    toggleNotification() {
      this.showNotification = !this.showNotification;
      if (this.showProgress) {
        this.showProgress = false;
      }
    },

    toggleProgress() {
      this.showProgress = !this.showProgress;
      if (this.showNotification) {
        this.showNotification = false;
      }
    },

    refreshBridgeheadsAndContext() {
      const activeBridgehead = this.activeBridgehead;
      this.fetchVisibleBridgeheads().then(result => {
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
      this.initializeData(Module.PROJECT_BRIDGEHEAD_MODULE, Action.FETCH_PROJECT_ACTION, params, 'project');
    },

    convertDate(date: Date) {
      return format(date, 'yyyy-MM-dd HH:mm:ss')
    },

    initializeProjectRelatedData() {
      if (this.project) {
        this.initializeDataInCallback(Module.PROJECT_BRIDGEHEAD_MODULE, Action.FETCH_PROJECT_BRIDGEHEADS_ACTION, new Map(), (result: Bridgehead[]) => {
          this.bridgeheads = [];
          result.forEach(bridgehead => this.bridgeheads.push(bridgehead.bridgehead));
        });
        this.initializeData(Module.PROJECT_BRIDGEHEAD_MODULE, Action.FETCH_PROJECT_STATES_ACTION, new Map(), 'projectStates');
        this.fetchNotifications();
        this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_PROJECT_TYPES_ACTION, new Map(), 'projectTypes');
        this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_QUERY_FORMATS_ACTION, new Map(), 'queryFormats');
        this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_OUTPUT_FORMATS_ACTION, new Map(), 'outputFormats');
        this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_PROJECT_CONFIGURATIONS_ACTION, new Map(), 'projectConfigurations');
        this.initializeCurrentProjectConfiguration();
        if (this.project.type) {
          const params = new Map<string, string>;
          params.set('project-type', this.project.type)
          this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_EXPORTER_TEMPLATES_ACTION, params, 'exporterTemplateIds');
          if (this.project.type == 'DATASHIELD') {
            this.initializeData(Module.TOKEN_MANAGER_MODULE, Action.FETCH_DATASHIELD_STATUS_ACTION, new Map(), 'dataShieldStatus');
          }
        }
        this.initializeData(Module.PROJECT_BRIDGEHEAD_MODULE, Action.FETCH_ALL_REGISTERED_BRIDGEHEADS_ACTION, new Map(), 'allBridgeheads');
        this.initializeDataInCallback(Module.PROJECT_DOCUMENTS_MODULE, Action.EXISTS_VOTUM_ACTION, new Map(), (result: boolean) => {
          this.existsVotum = result;
          if (this.existsVotum) {
            this.initializeData(Module.PROJECT_DOCUMENTS_MODULE, Action.FETCH_VOTUM_LABEL_ACTION, new Map(), 'votumLabel');
          }
        });
        this.initializeDataInCallback(Module.PROJECT_DOCUMENTS_MODULE, Action.EXISTS_APPLICATION_FORM_ACTION, new Map(), (result: boolean) => {
          this.existsApplicationForm = result;
          if (this.existsApplicationForm) {
            this.initializeData(Module.PROJECT_DOCUMENTS_MODULE, Action.FETCH_APPLICATION_FORM_LABEL_ACTION, new Map(), 'applicationFormLabel');
          }
        })
        this.initializeDataInCallback(Module.PROJECT_DOCUMENTS_MODULE, Action.EXISTS_SCRIPT_ACTION, new Map(), (result: boolean) => {
          this.existsScript = result;
          if (this.existsScript) {
            this.initializeData(Module.PROJECT_DOCUMENTS_MODULE, Action.FETCH_SCRIPT_LABEL_ACTION, new Map(), 'scriptLabel');
          }
        });
        this.initializeData(Module.TOKEN_MANAGER_MODULE, Action.EXISTS_AUTHENTICATION_SCRIPT_ACTION, new Map(), 'existsAuthenticationScript');
        this.initializeData(Module.USER_MODULE, Action.FETCH_PROJECT_ROLES_ACTION, new Map(), 'projectRoles');
        this.initializeData(Module.USER_MODULE, Action.EXIST_INVITED_USERS_ACTION, new Map(), 'existInvitedUsers');
        this.existsDraftDialog = (this.project.state === 'DRAFT' && keycloak.getEmail() === this.project.creatorEmail);
      }
    },

    initializeCurrentProjectConfiguration() {
      this.initializeDataInCallback(Module.PROJECT_EDITION_MODULE, Action.FETCH_CURRENT_PROJECT_CONFIGURATION_ACTION, new Map(), (result: Record<string, Project>) => {
        if (result) {
          const currentProjectConfigKeys = Object.keys(result);
          if (currentProjectConfigKeys && currentProjectConfigKeys.length > 0) {
            this.currentProjectConfiguration = currentProjectConfigKeys[0];
            const currentProjectConfig = result[this.currentProjectConfiguration];
            if (currentProjectConfig) {
              this.currentProjectConfigurationFields = Object.keys(currentProjectConfig).filter(key => (currentProjectConfig as any)[key] !== null)
            }
          }
        } else {
          this.currentProjectConfiguration = '';
          this.currentProjectConfigurationFields = [];
        }
      });
    },

    isNotIncludedInCurrentProjectConfiguration(field: string) {
      return this.currentProjectConfiguration === 'CUSTOM' || !this.currentProjectConfigurationFields.includes(field);
    },

    fetchNotifications() {
      this.initializeData(Module.NOTIFICATIONS_MODULE, Action.FETCH_NOTIFICATIONS_ACTION, new Map(), 'notifications');
    },

    async initializeData(module: Module, action: Action, params: Map<string, unknown>, dataVariable: string) {
      this.initializeDataInCallback(module, action, params, (result) => (this.$data as any)[dataVariable] = result)
    },

    async initializeDataInCallback(module: Module, action: Action, params: Map<string, unknown>, callback: (result: any) => void) {
      try {
        this.projectManagerBackendService.isModuleActionActive(module, action).then(condition => {
          if (condition) {
            this.projectManagerBackendService.fetchData(module, action, this.context, params)
                .then(result => callback(result));
          }
        })
      } catch (error) {
        console.error('Error calling action ' + action + ' of module ' + module + ':', error);
        throw error;
      }
    },

    updateActiveBridgehead(bridgehead: Bridgehead){
      this.activeBridgehead = bridgehead;
    },

    canShowBridgeheadAdminButtons(): boolean {
      return (this.project && (this.project.state == 'DEVELOP' || this.project.state == 'PILOT')) ? this.existInvitedUsers : true;
    },

    getProjectStates(): string[] {
      let visibleProjectStates: string[] = this.projectStates.slice();
      if (this.projectStates.length > 0) {
        if (this.project?.state === 'REJECTED') {
          visibleProjectStates = visibleProjectStates.filter(item => !['FINISHED', 'ARCHIVED'].includes(item));
        } else {
          if (this.project?.state === 'ARCHIVED') {
            visibleProjectStates = visibleProjectStates.filter(item => !['FINISHED', 'REJECTED'].includes(item));
          } else {
            visibleProjectStates = visibleProjectStates.filter(item => !['ARCHIVED', 'REJECTED'].includes(item));
          }
        }
      }
      return visibleProjectStates
    }

  }

});


</script>

<style scoped>
.stepper {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
}

.stepper-item {
  flex: 1;
  text-align: center;
  padding: 10px;
  border-bottom: 2px solid #ddd;
}

.stepper-item.active {
  font-weight: bold;
  color: #333;
}

.container {
  display: flex;
  flex-direction: column;
}

.flex-container {
  display: flex;
}

.left-container {
  flex: 0.5;
  padding-left: 5%;
}

.right-container {
  flex: 3;
  display: flex;
  flex-flow: row;
}

.button-container-right button {
  margin-bottom: 8px;
}

.table-responsive {
  overflow-x: auto;
}

.custom-table td.bold-text {
  font-weight: bold;
}

.thinner-column {
  width: 30%; /* Adjust the width as needed */
}

.wider-column {
  width: 70%; /* Adjust the width as needed */
}

.vertical-stepper {
  margin-top: 30%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stepper-line {
  width: 2px;
  height: 30px;
  background-color: #9e9e9e;
  margin-left: 14px;
  margin-top: 10px;
  align-items: flex-start;
}

.stepper-step {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  flex-flow: column;
  align-content: flex-start;
  align-items: flex-start;
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

.custom-width-notifications {
  width: 28%;
  background-color: #212529;
  color: white;
  padding: 15px;
  order: 2;
  position: relative;
  z-index: 1;
  font-family: "Calibri Light";
  overflow-y: auto;
  transition: transform 0.3s ease-in-out;
  height: 100vh;
}


.custom-width-notifications h2 {
  margin-bottom: 15px;
}

.custom-width-notifications .card {
  margin-bottom: 15px;
}

.button-container {
  display: flex;
  justify-content: flex-end;
  text-align: center;

}
.inviteUser {
  margin: 2em 0;
}
</style>
