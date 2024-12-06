<template>
  <div class="main-container">
    <div class="left-container">
      <div class="box-header" style="padding-left:7%">Project Phase</div>
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
    </div>

    <div class="right-container">
      <div class="main-content">
        <div class="info-container">
          <div v-if="project?.state !== 'DRAFT'" class="box-header">Project Status</div>

          <div style="padding: 2%">
            <div style="display:flex; flex-flow:row; justify-content: space-between; margin-bottom:10px;">
              <router-link to="/" data-placement="top" v-b-tooltip.hover title="Back to Project Dashboard"><i
                  class="bi bi-arrow-left-square-fill" style="font-size: x-large"></i></router-link>

              <div class="card"
                   v-if="project?.state !== 'DRAFT' && visibleBridgeheads && visibleBridgeheads.length === 1"
                   style="padding: 3px 20px;height: fit-content">
                <div class="card-body" style="padding: 0px 0px;">
                  <span style="padding: 0px 0px;">{{ context.bridgehead?.humanReadable }}</span>
                </div>
              </div>

              <div>
                <button data-toggle="tooltip" data-placement="top" title="ToDo's" @click="toggleExplanations"
                        class="btn explanation-button">
                  <i class="bi bi-card-checklist"></i>
                </button>
                <button data-toggle="tooltip" data-placement="top" title="Notifications" @click="toggleNotification"
                        class="btn notification-button">
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
            <table class="table table-bordered" v-if="project?.state !== 'DRAFT' ">
              <thead>
              <tr>
                <th style="background-color: #f2f2f2;" scope="col">Data Request Number (DRN)</th>
                <th style="background-color: #f2f2f2;" scope="col">Project Phase</th>
                <th v-if="visibleBridgeheads?.length == 1" style="background-color: #f2f2f2;" scope="col">User Access Control</th>
                <th v-if="visibleBridgeheads?.length == 1" style="background-color: #f2f2f2;" scope="col">Query Status</th>
                <th style="background-color: #f2f2f2;" v-if="visibleBridgeheads?.length == 1 && dataShieldStatus" scope="col">DataSHIELD Status</th>
                <th style="background-color: #f2f2f2;"
                    v-if="visibleBridgeheads?.length == 1 && (project?.type == 'RESEARCH_ENVIRONMENT')" scope="col">Files in Coder
                </th>
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
                <td v-if="visibleBridgeheads?.length == 1 && activeBridgehead"><div class="state_circle" :class="activeBridgehead?.state.toLowerCase()" v-b-tooltip.hover :title="activeBridgehead?.state"></div></td>
                <td v-if="visibleBridgeheads?.length == 1 && activeBridgehead"><div  class="state_circle" :class="activeBridgehead?.queryState.toLowerCase()" v-b-tooltip.hover :title="activeBridgehead?.queryState"></div></td>
                <td v-if="visibleBridgeheads?.length == 1 && dataShieldStatus"><div  class="state_circle" :class="dataShieldStatus?.project_status.toLowerCase()" v-b-tooltip.hover :title="dataShieldStatus?.project_status"></div></td>
                <td v-if="visibleBridgeheads?.length == 1 && (project?.type == 'RESEARCH_ENVIRONMENT')">
                  {{ areExportFilesTransferredToResearchEnvironment }}
                </td>
                <td>
                  {{ project?.creatorName }}
                  <button
                      class="btn btn-link p-0 ms-2"
                      @click="copyToClipboard(project?.creatorEmail)"
                      title="Copy email">
                    <i class="bi bi-clipboard"></i>
                  </button>
                </td>
                <td>{{ project && project.createdAt ? convertDate(project.createdAt) : '' }}</td>
                <td>{{ project && project.expiresAt ? convertDate(project.expiresAt) : '' }}</td>
                <td>{{ project && project.modifiedAt ? convertDate(project.modifiedAt) : '' }}</td>
              </tr>
              </tbody>
            </table>

          </div>
        </div>
        <div v-if="!(project?.state === 'DRAFT' && projectRoles.includes(ProjectRole.CREATOR)) && isButtonGroupVisible" class="project-actions">
          <div class="box-header">Project Actions</div>
          <div style="padding:2%">
            <!-- Project State Module: Creator View -->
            <!-- v-if="existsApplicationForm" entfernt - statt ganz ausblenden -> design ändern -->
            <!-- Project State Module: PM-ADMIN View -->
            <template v-for="(buttonGroup, index) in actionButtons" :key="index">
              <div v-if="buttonGroups[index]" class="button-group-box">
                <div class="button-group-label">
                  {{buttonGroup.label}}
                  <span style="display: flex;flex-direction: row-reverse">
                    <span v-for="(explanationNumber, index3) in getExplanationsForButtonGroup(buttonGroup)" :key="index3" class="todo-circle-small">#{{explanationNumber}}</span>
                  </span>
                </div>
                <ProjectManagerButton v-for="(button, index2) in buttonGroup.button" :key="index2"
                                      :module="button.module" :action="button.action"
                                      :context="context" :call-refreh-context="button.refreshContextCallFunction" :text="button.text"
                                      :button-class="button.cssClass" :with-message="button.withMessage"
                                      :visibility="button.visibilityCondition"
                                      :project-manager-backend-service="projectManagerBackendService"/>
              </div>
            </template>
          </div>
          <div v-if="!existsDraftDialog || draftDialogCurrentStep==4" class="inviteUser">
            <UserInput :project="project" :context="context"
                       :bridgeheads="visibleBridgeheads"
                       :todos="getExtendedExplanations()"
                       :project-manager-backend-service="projectManagerBackendService"/>
          </div>
        </div>
        <div class="data-container mt-12">
          <div v-if="project">
            <div v-if="project?.state !== 'DRAFT'" class="box-header">Requested Data</div>
            <div v-if="project?.state === 'DRAFT'" class="box-header">Request Data</div>
            <div class="table-responsive">

              <div v-if="existsDraftDialog" class="container" style="width:100%">
                <div class="row justify-content-center">
                  <div class="col-auto" style="width:100%">
                    <!-- Bootstrap Stepper -->
                    <div class="stepper">
                      <div v-for="(step, index) in steps" :key="index" class="stepper-item"
                           :class="{ 'active': draftDialogCurrentStep === index }">
                        <button style="background: none; border:none; color: black;"
                                @click="draftDialogCurrentStep=index"
                                :style="{ fontWeight: draftDialogCurrentStep === index ? 'bold' : 'normal' }">{{
                            step
                          }}
                        </button>
                      </div>
                    </div>
                    <!-- Navigationstasten -->
                    <div class="button-container mt-3">
                      <button class="btn btn-primary me-2" @click="prevStep" :disabled="draftDialogCurrentStep === 0">
                        Back
                      </button>
                      <button class="btn btn-primary me-2" @click="nextStep"
                              v-if="draftDialogCurrentStep < steps.length - 1">
                        Continue
                      </button>
                      <ProjectManagerButton v-if="draftDialogCurrentStep === steps.length - 1"
                                            :module="Module.PROJECT_STATE_MODULE"
                                            :action="Action.CREATE_PROJECT_ACTION"
                                            :context="context" :call-refreh-context="refreshContext" text="Create"
                                            button-class="btn btn-success mr-2"
                                            :with-message="false"
                                            :project-manager-backend-service="projectManagerBackendService"/>
                      <ProjectManagerButton v-if="project?.state === 'DRAFT' "
                                            :module="Module.PROJECT_STATE_MODULE"
                                            :action="Action.REJECT_PROJECT_ACTION"
                                            :context="context" :call-refreh-context="refreshContext" text="Discard"
                                            button-class="btn btn-danger btn-secondary mr-2"
                                            :with-message="true"
                                            :project-manager-backend-service="projectManagerBackendService"/>
                    </div>
                  </div>
                </div>
              </div>

            <br/>
            <table class="table table-bordered custom-table  table-hover">
              <tbody>
              <template v-for="(projectField, index) in getProjectFields()" :key="index">
                <ProjectFieldRow v-if="projectField.visibilityCondition && (!existsDraftDialog || projectField.isEditable && draftDialogCurrentStep < 4 || draftDialogCurrentStep === 4)"
                                 :field-key="projectField.fieldKey"
                                 :field-value="projectField.fieldValue"
                                 :edit-project-param="projectField.editProjectParam"
                                 :is-editable="projectField.isEditable"
                                 :redirect-url="projectField.redirectUrl"
                                 :transform-for-sending="projectField.transformForSending"
                                 :possible-values="projectField.possibleValues"
                                 :exists-file="projectField.existFile"
                                 :upload-action="projectField.uploadAction"
                                 :download-action="projectField.downloadAction"
                                 :download-module="projectField.downloadModule"
                                 :todos="getExtendedExplanations()"
                                 :call-refreh-context="refreshContext"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>

              </template>
              </tbody>
            </table>
          </div>
            <div style="padding: 2%">
          <DocumentsTable v-if="!existsDraftDialog || draftDialogCurrentStep==4" :context="context"
                          :project-manager-backend-service="projectManagerBackendService"
                          :download-action="Action.DOWNLOAD_PUBLICATION_ACTION"
                          :fetch-list-action="Action.FETCH_PUBLICATIONS_ACTION"
                          :bridgeheads="visibleBridgeheads" icon-class="bi bi-download" text="Publications: "/>
          <br/>
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

              <div style="display:flex; flex-flow:row;  width:100% "
                   v-if="!existsDraftDialog || draftDialogCurrentStep==4">
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
      </div>
    </div>

    <NotificationBox :context="context" :project-manager-backend-service="projectManagerBackendService"
                     :show-notification="showNotification" :call-toggle-notification="toggleNotification"
                     :notifications="notifications" :call-update-notifications="fetchNotifications"/>

    <div v-if="showExplanations" class="custom-width-notifications">
      <div class="box-header" style="display:flex; flex-flow:row; justify-content:space-between ">
        <div>ToDo List</div>
        <button style="padding: 0 15px 0 0; margin-bottom: -4px" @click="toggleExplanations" class="btn" v-if="showExplanations">
          <i style="font-size: 20px" class="bi bi-x"></i> <!-- Schließsymbol für Progress -->
        </button>
      </div>


      <div v-if="getExtendedExplanations().size" class="notification-box">
        <div v-for="(explanation, index) in Array.from(getExtendedExplanations().values())" :key="index" class="card mb-3">
          <div class="card-body">
            <div style="display:flex; flex-flow: row;">
              <div class="todo-circle"><span>#{{ explanation.number }}</span></div>
              <h5 class="card-title">{{ explanation.message }}</h5>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="project?.state !== 'FINISH' && project?.state !== 'REJECTED' && project?.state !== 'ARCHIVED'" class="notification-box">
      <div class="card mb-3">
        <div class="card-body">
          <h5 class="card-title">No action is required at the moment. Please wait for the next notification, which will
            also be sent to you via email.</h5>
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
  DataShieldProjectStatus,
  EditProjectParam,
  Explanation,
  Module,
  Notification,
  Project,
  ProjectField,
  ProjectManagerBackendService,
  ProjectManagerContext,
  ProjectRole,
  Site
} from "@/services/projectManagerBackendService";
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
      bridgeheads: [] as Bridgehead[],
      visibleBridgeheads: [] as Bridgehead[],
      context: new ProjectManagerContext(this.projectCode, undefined),
      projectManagerBackendService: new ProjectManagerBackendService(new ProjectManagerContext(this.projectCode, undefined), Site.PROJECT_VIEW_SITE),
      project: undefined as Project | undefined,
      projectTypes: [] as string[],
      outputFormats: [] as string[],
      queryFormats: [] as string[],
      exporterTemplateIds: [] as string[],
      allBridgeheads: [] as Bridgehead[],
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
      showExplanations: true,
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
      existInvitedUsers: false,
      areExportFilesTransferredToResearchEnvironment: false,
      explanations: new Map() as Explanation,
      buttonGroups: [] as boolean[],
      isButtonGroupVisible: false,
      actionButtons: [] as ActionButtonGroup[]
    };
  },
  watch: {
    activeBridgehead(newValue, oldValue) {
      this.activeBridgeheadIndex = this.visibleBridgeheads.findIndex(bridgehead => bridgehead === newValue);
      this.context = new ProjectManagerContext(this.projectCode, newValue);
    },
    context(newValue, oldValue) {
      this.projectManagerBackendService = new ProjectManagerBackendService(newValue, Site.PROJECT_VIEW_SITE);
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
      this.showExplanations = !this.showNotification;
    },

    toggleExplanations() {
      this.showExplanations = !this.showExplanations;
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

    copyToClipboard(email: string | null | undefined) {
      if (email) {
        navigator.clipboard.writeText(email).then(() => {
          alert("Email copied to clipboard!");
        });
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
      return format(date, 'yyyy-MM-dd HH:mm')
    },

    initializeProjectRelatedData() {
      if (this.project) {
        this.explanations = this.projectManagerBackendService.getExplanations();
        this.initializeDataInCallback(Module.PROJECT_BRIDGEHEAD_MODULE, Action.FETCH_PROJECT_BRIDGEHEADS_ACTION, new Map(), (result: Bridgehead[]) => {
          this.bridgeheads = result;
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
        this.initializeData(Module.EXPORT_MODULE, Action.ARE_EXPORT_FILES_TRANSFERRED_TO_RESEARCH_ENVIRONMENT_ACTION, new Map(), 'areExportFilesTransferredToResearchEnvironment');
        this.existsDraftDialog = (this.project.state === 'DRAFT' && keycloak.getEmail() === this.project.creatorEmail);

        setTimeout(() => {
          this.getButtons()
          this.checkButtonVisibility()
        }, 1000);
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

    updateActiveBridgehead(bridgehead: Bridgehead) {
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
    },

    getExtendedExplanations(): Explanation {
      const extendedExplanations = new Map(this.explanations)
      if (this.existsDraftDialog) {
        const count = this.explanations.size + 1
        if (this.draftDialogCurrentStep === 0) { // Project
          extendedExplanations.set(count.toString(), {
            number: count,
            message: "Please provide the general project information to proceed."
          });
        } else if (this.draftDialogCurrentStep === 1) { // Type
          extendedExplanations.set(count.toString(), {
            number: count,
            message: "Please select one of the predefined configurations for the project. If none of the options meet your requirements, choose 'CUSTOM' to create a custom configuration."
          });
        } else if (this.draftDialogCurrentStep === 2) { // Query
          extendedExplanations.set(count.toString(), {
            number: count,
            message: "Please set the query and specify the query format if they have not been previously configured in the Federated Explorer."
          });
        } else if (this.draftDialogCurrentStep === 3) { // Output
          extendedExplanations.set(count.toString(), {
            number: count,
            message: "Please select the output format and the template ID for the Teiler Exporter. For advanced configuration of the template, please add the necessary environment variables."
          });
        } else if (this.draftDialogCurrentStep === 4) { // Summary
          extendedExplanations.set(count.toString(), {
            number: count,
            message: "Please check all of the fields in the summary and click 'Create' if everything seems OK."
          });
        }
      }
      return extendedExplanations
    },

    getExplanationsForButtonGroup(buttonGroup: ActionButtonGroup): number[] {
      return buttonGroup.button?.map((button) => this.explanations?.get(button.action)?.number).filter((number): number is number => number !== undefined) || []
    },

    getProjectFields(): ProjectField[] {
      return [
        {
          fieldKey: "Title",
          fieldValue: [this.project?.label],
          editProjectParam: [EditProjectParam.LABEL],
          isEditable: true,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogCurrentStep == 0 || this.draftDialogCurrentStep == 4
        },
        {
          fieldKey: "Description",
          fieldValue: [this.project?.description],
          editProjectParam: [EditProjectParam.DESCRIPTION],
          isEditable: true,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogCurrentStep == 0 || this.draftDialogCurrentStep == 4
        },
        {
          fieldKey: "Bridgeheads",
          fieldValue: [this.bridgeheads.map(bridghead => bridghead.humanReadable), this.allBridgeheads.map(bridghead => bridghead.humanReadable)],
          editProjectParam: [EditProjectParam.BRIDGEHEADS],
          isEditable: true,
          redirectUrl: this.project?.explorerUrl,
          transformForSending: (humanReadable: string) => this.allBridgeheads.find(bridgehead => bridgehead.humanReadable === humanReadable)?.bridgehead || humanReadable,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogCurrentStep == 0 || this.draftDialogCurrentStep == 4
        },
        {
          fieldKey: "Configuration",
          fieldValue: [this.currentProjectConfiguration],
          editProjectParam: [EditProjectParam.PROJECT_CONFIGURATION],
          isEditable: true,
          possibleValues: this.projectConfigurations,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogCurrentStep == 1 || this.draftDialogCurrentStep == 4
        },
        {
          fieldKey: "Type",
          fieldValue: [this.project?.type],
          editProjectParam: [EditProjectParam.PROJECT_TYPE],
          isEditable: this.isNotIncludedInCurrentProjectConfiguration('type'),
          possibleValues: this.projectTypes,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogCurrentStep == 1 || this.draftDialogCurrentStep == 4
        },
        {
          fieldKey: "Query",
          fieldValue: [this.project?.humanReadable, this.project?.query],
          editProjectParam: [EditProjectParam.HUMAN_READABLE],
          isEditable: true,
          redirectUrl: this.project?.explorerUrl,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogCurrentStep == 2 || this.draftDialogCurrentStep == 4
        },
        {
          fieldKey: "Query Format",
          fieldValue: [this.project?.queryFormat],
          editProjectParam: [EditProjectParam.QUERY_FORMAT],
          isEditable: true,
          redirectUrl: this.project?.explorerUrl,
          possibleValues: this.queryFormats,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogCurrentStep == 2 || this.draftDialogCurrentStep == 4
        },
        {
          fieldKey: "Output Format",
          fieldValue: [this.project?.outputFormat],
          editProjectParam: [EditProjectParam.OUTPUT_FORMAT],
          isEditable: this.isNotIncludedInCurrentProjectConfiguration('outputFormat'),
          possibleValues: this.outputFormats,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogCurrentStep == 3 || this.draftDialogCurrentStep == 4
        },
        {
          fieldKey: "Template ID",
          fieldValue: [this.project?.templateId],
          editProjectParam: [EditProjectParam.TEMPLATE_ID],
          isEditable: this.isNotIncludedInCurrentProjectConfiguration('templateId'),
          possibleValues: this.exporterTemplateIds,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogCurrentStep == 3 || this.draftDialogCurrentStep == 4
        },
        {
          fieldKey: "Environment Variables",
          fieldValue: [this.project?.queryContext],
          editProjectParam: [EditProjectParam.QUERY_CONTEXT],
          isEditable: this.isNotIncludedInCurrentProjectConfiguration('queryContext'),
          visibilityCondition: !this.existsDraftDialog || this.draftDialogCurrentStep == 3 || this.draftDialogCurrentStep == 4
        },
        {
          fieldKey: "Application form",
          fieldValue: [this.applicationFormLabel],
          isEditable: true,
          existFile: this.existsApplicationForm,
          uploadAction: this.Action.UPLOAD_APPLICATION_FORM_ACTION,
          downloadAction: this.Action.DOWNLOAD_APPLICATION_FORM_ACTION,
          downloadModule: this.Module.PROJECT_DOCUMENTS_MODULE,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogCurrentStep == 0 || this.draftDialogCurrentStep == 4
        },
        {
          fieldKey: "Votum",
          fieldValue: [this.votumLabel],
          isEditable: true,
          existFile: this.existsVotum,
          uploadAction: this.Action.UPLOAD_VOTUM_ACTION,
          downloadAction: this.Action.DOWNLOAD_VOTUM_ACTION,
          downloadModule: this.Module.PROJECT_DOCUMENTS_MODULE,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogCurrentStep == 4
        },
        {
          fieldKey: "Script",
          fieldValue: [this.scriptLabel],
          isEditable: true,
          existFile: this.existsScript,
          uploadAction: this.Action.UPLOAD_SCRIPT_ACTION,
          downloadAction: this.Action.DOWNLOAD_SCRIPT_ACTION,
          downloadModule: this.Module.PROJECT_DOCUMENTS_MODULE,
          visibilityCondition: this.dataShieldStatus && (!this.existsDraftDialog || this.draftDialogCurrentStep == 4)
        },
        {
          fieldKey: "Authentication Script",
          fieldValue: [],
          isEditable: false,
          existFile: this.existsAuthenticationScript,
          downloadAction: this.Action.DOWNLOAD_AUTHENTICATION_SCRIPT_ACTION,
          downloadModule: this.Module.TOKEN_MANAGER_MODULE,
          visibilityCondition: this.dataShieldStatus && this.dataShieldStatus.project_status === 'WITH_DATA' && this.existsAuthenticationScript
        }
      ] as ProjectField[]
    },

    getButtons(): void {
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
              visibilityCondition: this.project?.state !== 'DRAFT'
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.FINISH_PROJECT_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Finish", withMessage: false, cssClass: "btn btn-primary mr-2"
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.ARCHIVE_PROJECT_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Archive", withMessage: false, cssClass: "btn btn-secondary"
            }
          ] as ActionButton[]
        },
        {
          label: "Stage",
          button: [
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.START_DEVELOP_STAGE_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Start Develop Stage", withMessage: false, cssClass: "btn btn-primary mr-2"
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.START_PILOT_STAGE_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Start Pilot Stage", withMessage: false, cssClass: "btn btn-primary mr-2"
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.START_FINAL_STAGE_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Start Final Stage", withMessage: false, cssClass: "btn btn-primary mr-2"
            }
          ] as ActionButton[]
        },
        {
          label: "Bridgehead Project",
          button: [
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.ACCEPT_BRIDGEHEAD_PROJECT_ACTION,
              refreshContextCallFunction: this.refreshBridgeheadsAndContext as () => void,
              text: "Authorize", withMessage: false, cssClass: "btn btn-primary mr-2",
              visibilityCondition: this.activeBridgehead && this.activeBridgehead.state !== 'ACCEPTED' && this.canShowBridgeheadAdminButtons()
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.REJECT_BRIDGEHEAD_PROJECT_ACTION,
              refreshContextCallFunction: this.refreshBridgeheadsAndContext as () => void,
              text: "Revoke", withMessage: true, cssClass: "btn btn-danger btn-secondary mr-2",
              visibilityCondition: this.activeBridgehead && this.activeBridgehead.state !== 'REJECTED' && this.canShowBridgeheadAdminButtons()
            }
          ] as ActionButton[]
        },
        {
          label: "Script",
          button: [
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.ACCEPT_SCRIPT_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Accept", withMessage: false, cssClass: "btn btn-primary mr-2"
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.REJECT_SCRIPT_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Block", withMessage: true, cssClass: "btn btn-danger btn-secondary mr-2"
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.REQUEST_SCRIPT_CHANGES_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Request Changes", withMessage: true, cssClass: "btn btn-primary mr-2"
            }
          ] as ActionButton[]
        },
        {
          label: "Project Result",
          button: [
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.ACCEPT_PROJECT_RESULTS_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Accept", withMessage: false, cssClass: "btn btn-primary mr-2"
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.REJECT_PROJECT_RESULTS_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Block", withMessage: true, cssClass: "btn btn-danger btn-secondary mr-2"
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.REQUEST_CHANGES_IN_PROJECT_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Request Changes", withMessage: true, cssClass: "btn btn-primary mr-2"
            }
          ] as ActionButton[]
        },
        {
          label: "Project Analysis",
          button: [
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.ACCEPT_PROJECT_ANALYSIS_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Accept", withMessage: false, cssClass: "btn btn-primary mr-2"
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.REJECT_PROJECT_ANALYSIS_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Block", withMessage: true, cssClass: "btn btn-danger btn-secondary mr-2"
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.REQUEST_CHANGES_IN_PROJECT_ANALYSIS_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Request Changes", withMessage: true, cssClass: "btn btn-primary mr-2"
            }
          ] as ActionButton[]
        },
        {
          label: "Export",
          button: [
            {
              module: Module.EXPORT_MODULE, action: Action.SAVE_QUERY_IN_BRIDGEHEAD_ACTION,
              refreshContextCallFunction: this.refreshBridgeheadsAndContext as () => void,
              text: "Send Query to Bridgehead", withMessage: false, cssClass: "btn btn-primary mr-2",
              visibilityCondition: this.canShowBridgeheadAdminButtons()
            },
            {
              module: Module.EXPORT_MODULE, action: Action.SEND_EXPORT_FILES_TO_RESEARCH_ENVIRONMENT_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Resend Export Files to Research Environment", withMessage: false, cssClass: "btn btn-primary mr-2"
            }
          ] as ActionButton[]
        },
      ] as ActionButtonGroup[]
    },

    async checkButtonVisibility() {
      this.actionButtons.forEach((buttonGroup, index) => {
        const statusArray = buttonGroup.button.map(async (button) => {
          const visibility1 = button.visibilityCondition !== undefined ? button.visibilityCondition :  true
          const visibility2 = await this.projectManagerBackendService.isModuleActionActive(button.module, button.action)
          return visibility1 && visibility2
        })
        Promise.all(statusArray).then((result) => {
          this.buttonGroups[index] = result.includes(true);
          this.isButtonGroupVisible = this.isButtonGroupVisible || this.buttonGroups[index]
        })
      })

    }

  }

});


</script>

<style scoped>

.box-header {
  padding: 12px 0 12px 2%;
  background-color: #95c8dc;
  color: black;
  font-size: large;
  font-weight: bold;
  border: 1px solid #95c8dc;
  border-radius: 10px 10px 0 0;
}
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

.info-container {
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12);
}
.data-container {
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12);
  margin-top: 1.5%;
  height: 100%;
}
.project-actions {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12);
  margin-top: 1.5%;
}
.main-container {
  display: flex;
  flex-flow: row;
  width: 100%;
}

.left-container {
  display: flex;
  flex-flow: column;
  width: 16%;
  min-height: 800px;
  margin-top: 1.5%;
  margin-left: 1.5%;
  margin-bottom: 4%;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12);
}

.right-container {
  flex: 3;
  display: flex;
  flex-flow: row;
  margin: 1.5% 1.5% 4% 1.5%;
}

.main-content {
  display:flex;
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
  margin: 20% 0 0 25%;
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
.notification-box {
  padding: 2%;
  font-family: "Calibri Light";
}
.todo-circle {
  min-width: 32px;
  height: 32px;
  background-color:gold;
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
  box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12);
  margin-top: 1.5%;
  margin-bottom: 4%;
  margin-right: 0.5%;
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
  justify-content: flex-end;
  text-align: center;
}
.inviteUser {
  padding: 2%;
  display: flex;
}

.explanation-box {
  border: 1px solid red;
  padding: 10px;
  border-radius: 5px;
  background-color: #ffe6e6; /* Light red background */
  max-width: 100%; /* Adjust width as needed */
}

.explanation-line {
  color: red;
  font-weight: bold;
  margin: 5px 0;
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
.explanation-button {
  background-color: #007bff;
  color: white;
  width:auto;
  font-size: x-large;
  padding: 0 1px;
  height: 22px;
}
.explanation-button i {
  position: relative;
  top: -9px;
}
.explanation-button:hover {
  background-color: black;
  color:white;
}
.notification-button {
  background: none;
  border:none;
  color:#007bff;
  width:auto;
  font-size: x-large;
  padding: 0 0 0 15px;
}
.state_circle {
  border-radius: 50%;
  width: 25px;
  height: 25px;
  margin: 10px auto;
}
.state_circle.created {
  border: 1px solid #cccccc;
  background-color: #f2f2f2;
}
.state_circle.request_changes, .state_circle.not_found, .state_circle.inactive {
  border: 1px solid #cccccc;
  background-color: #fff200;
}
.state_circle.accepted, .state_circle.with_data {
  border: 1px solid #cccccc;
  background-color: #009a00;
}
.state_circle.rejected, .state_circle.error {
  border: 1px solid #cccccc;
  background-color: red;
}
</style>
