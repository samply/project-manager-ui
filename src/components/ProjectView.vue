<template>
  <div class="flex-container">
    <div class="left-container">
      <div v-if="projectData.projectId">
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

    <div class="right-container">
      <div style="display:flex; flex-flow: column; width:100%; padding-right:3%">
        <div class="container">
          <br/>
          <h2>Project Information</h2>
          <br/>
          <div style="display:flex; flex-flow:row; justify-content: space-between">
            <router-link to="/"><i class="bi bi-arrow-left-square-fill"></i></router-link>
            <div v-if="brigeheads && brigeheads.length > 1">
              <span class="bold-text">Bridgehead:</span>&nbsp;
              <select v-model="activeBridgehead">
                <option v-for="bridgehead in brigeheads" :key="bridgehead.bridgehead" :value="bridgehead"
                        :selected="bridgehead === activeBridgehead">{{ bridgehead.bridgehead }}
                </option>
              </select>
            </div>
            <div>
              <button @click="toggleProgress" class="btn btn-dark"
                      style="background: none; border:none; color:#007bff; width:auto;">
                <i class="bi bi-clipboard-check-fill"></i>
              </button>
              <button @click="toggleNotification" class="btn btn-dark"
                      style="background: none; border:none; color:#007bff; width:auto;">
                <i class="bi bi-chat-right-text-fill"></i>
              </button>
            </div>
          </div>
          <table class="table table-bordered">
            <thead>
            <tr>
              <th scope="col">Data Request Number (DRN)</th>
              <th scope="col">Project State</th>
              <th scope="col">Bridgehead State</th>
              <th v-if="dataShieldStatus" scope="col">DataSHIELD Status</th>
              <th scope="col">Creator</th>
              <th scope="col">Created at</th>
              <th scope="col">Expires at</th>
              <th scope="col">Last modified</th>
              <th scope="col" v-if="existsVotum">Votum</th>
            </tr>
            </thead>
            <tbody>
            <tr>
              <td>{{ project ? project.code : '' }}</td>
              <td>{{ project ? project.state : '' }}</td>
              <td>{{ activeBridgehead ? activeBridgehead.state : '' }}</td>
              <td v-if="dataShieldStatus">{{ dataShieldStatus.project_status }}</td>
              <td>{{ project ? project.creatorEmail : '' }}</td>
              <td>{{ project && project.createdAt ? convertDate(project.createdAt) : '' }}</td>
              <td>{{ project && project.expiresAt ? convertDate(project.expiresAt) : '' }}</td>
              <td>{{ project && project.modifiedAt ? convertDate(project.modifiedAt) : '' }}</td>
              <td v-if="existsVotum">
                <DownloadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                                :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.DOWNLOAD_VOTUM_ACTION" icon-class="bi bi-download"/>
              </td>
            </tr>
            </tbody>
          </table>
          <div class="text-right mt-4">

            <!-- TODO: Edit only if authorized -->
            <!-- Project State Module: Creator View -->
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.CREATE_PROJECT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Create"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>&nbsp;
            <!-- Project State Module: PM-ADMIN View -->
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.ACCEPT_PROJECT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Accept"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>&nbsp;
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.REJECT_PROJECT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Reject"
                                  button-class="btn btn-danger btn-secondary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>&nbsp;
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.START_DEVELOP_STAGE_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Start develop stage"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>&nbsp;
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.START_PILOT_STAGE_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Start final stage"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>&nbsp;
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.START_FINAL_STAGE_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Start final stage"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>&nbsp;
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.FINISH_PROJECT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Finish"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>&nbsp;
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.ARCHIVE_PROJECT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Archive"
                                  button-class="btn btn-secondary"
                                  :project-manager-backend-service="projectManagerBackendService"/>

            <!-- Project State Module: BK-ADMIN View -->
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE"
                                  :action="Action.ACCEPT_BRIDGEHEAD_PROJECT_ACTION"
                                  :context="context" :call-refreh-context="refreshBridgeheadsAndContext" text="Accept"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE"
                                  :action="Action.REJECT_BRIDGEHEAD_PROJECT_ACTION"
                                  :context="context" :call-refreh-context="refreshBridgeheadsAndContext" text="Reject"
                                  button-class="btn btn-danger btn-secondary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <!-- Project State Module: Developer/Pilot View -->
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.ACCEPT_SCRIPT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Accept"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.REJECT_SCRIPT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Reject"
                                  button-class="btn btn-danger btn-secondary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.REQUEST_SCRIPT_CHANGES_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Request changes"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <!-- Project State Module: Final View -->
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.ACCEPT_PROJECT_RESULTS_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Accept"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.REJECT_PROJECT_RESULTS_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Reject"
                                  button-class="btn btn-danger btn-secondary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE"
                                  :action="Action.REQUEST_CHANGES_IN_PROJECT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Request changes"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>

            <!-- Export Module -->
            <ProjectManagerButton :module="Module.EXPORT_MODULE" :action="Action.SAVE_QUERY_IN_BRIDGEHEAD_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Reject"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.EXPORT_MODULE"
                                  :action="Action.SAVE_AND_EXECUTE_QUERY_IN_BRIDGEHEAD_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Request changes"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
          </div>

          <hr/>
        </div>

        <div class="container mt-12" style="margin-bottom: 10%;">
          <div v-if="project">
            <br/>
            <div class="table-responsive">
              <h3>Requested Data</h3>
              <br/>
              <table class="table table-bordered custom-table">
                <tbody>
                <ProjectFieldRow field-key="Title" edit-project-param="label" :is-editable="true"
                                 :field-value="project.label" :call-refreh-context="refreshContext"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>
                <ProjectFieldRow field-key="Description" edit-project-param="description" :is-editable="true"
                                 :field-value="project.description" :call-refreh-context="refreshContext"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>
                <ProjectFieldRow field-key="Type" edit-project-param="project-type" :is-editable="true"
                                 :field-value="project.type" :call-refreh-context="refreshContext"
                                 :possible-values="projectTypes"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>
                <!-- TODO: Edit Query -->
                <ProjectFieldRow field-key="Query" :is-editable="false"
                                 :field-value="project.humanReadable ? project.humanReadable : project.query"
                                 :call-refreh-context="refreshContext"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>
                <ProjectFieldRow field-key="Query Format" edit-project-param="query-format" :is-editable="true"
                                 :field-value="project.queryFormat" :call-refreh-context="refreshContext"
                                 :possible-values="queryFormats"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>
                <!-- TODO: Separate queries in pairs Key-Values + encrpyt and decrypt in base64-->
                <ProjectFieldRow field-key="Query Context" edit-project-param="query-context" :is-editable="true"
                                 :field-value="project?.queryContext" :call-refreh-context="refreshContext"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>
                <ProjectFieldRow field-key="Output Format" edit-project-param="output-format" :is-editable="true"
                                 :field-value="project.outputFormat" :call-refreh-context="refreshContext"
                                 :possible-values="outputFormats"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>
                <ProjectFieldRow field-key="Template ID" edit-project-param="template-id" :is-editable="true"
                                 :field-value="project.templateId" :call-refreh-context="refreshContext"
                                 :possible-values="exporterTemplateIds"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>
                <tr v-if="dataShieldStatus && dataShieldStatus.project_status === 'WITH_DATA'">
                  <td class="bold-text thinner-column">Authentication Script</td>
                  <td class="wider-column"></td>
                  <td>
                    <DownloadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                                    :module="Module.PROJECT_DOCUMENTS_MODULE"
                                    :action="Action.DOWNLOAD_AUTHENTICATION_SCRIPT_ACTION" icon-class="bi bi-download"/>
                  </td>
                </tr>
                <tr v-if="existsScript">
                  <td class="bold-text thinner-column">Script</td>
                  <td class="wider-column"></td>
                  <td>
                    <DownloadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                                    :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.DOWNLOAD_SCRIPT_ACTION" icon-class="bi bi-download"/>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
            <UserInput :project="project" :context="context"
                       :project-manager-backend-service="projectManagerBackendService"/>
            <br/><br/>
            <!-- Application Form -->
            <DownloadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                            :module="Module.PROJECT_DOCUMENTS_MODULE"
                            :action="Action.DOWNLOAD_APPLICATION_FORM_TEMPLATE_ACTION" text="Download application form template"/>
            <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.UPLOAD_APPLICATION_FORM_ACTION"
                          text="Upload application form" :call-refreh-context="refreshContext" :is-file="true" />
            <DownloadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                            :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.DOWNLOAD_APPLICATION_FORM_ACTION" text="Download application form"
                            v-if="existsApplicationForm"/>

            <!-- Other documents -->
            <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.UPLOAD_VOTUM_ACTION"
                          text="Upload votum" :call-refreh-context="refreshContext" :is-file="true"/>
            <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.UPLOAD_SCRIPT_ACTION"
                          text="Upload script" :call-refreh-context="refreshContext" :is-file="true"/>
            <br/><br/>
            <DocumentsTable :context="context" :project-manager-backend-service="projectManagerBackendService"
                            :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.DOWNLOAD_PUBLICATION_ACTION"
                            :project-documents="publications" icon-class="bi bi-download" text="Publications: " />
            <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.UPLOAD_PUBLICATION_ACTION"
                          text="Upload publication" :call-refreh-context="refreshContext" :is-file="true"/>
            <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.ADD_PUBLICATION_URL_ACTION"
                          text="Upload publication URL" :call-refreh-context="refreshContext" :is-file="false" />
            <br/> <br/>
            <DocumentsTable :context="context" :project-manager-backend-service="projectManagerBackendService"
                            :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.DOWNLOAD_OTHER_DOCUMENT_ACTION"
                            :project-documents="otherDocuments" icon-class="bi bi-download" text="Other documents: "/>
            <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.UPLOAD_OTHER_DOCUMENT_ACTION"
                          text="Upload other document" :call-refreh-context="refreshContext" :is-file="true" />
            <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.ADD_OTHER_DOCUMENT_URL_ACTION"
                          text="Upload other document URL" :call-refreh-context="refreshContext" :is-file="false" />

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
  </div>

</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {
  Action,
  Bridgehead,
  DataShieldProjectStatus,
  Module,
  Notification,
  Project,
  ProjectDocument,
  ProjectManagerContext,
  ProjetManagerBackendService,
  Site
} from "@/services/projetManagerBackendService";
import ProjectManagerButton from "@/components/ProjectManagerButton.vue";
import {format} from "date-fns";
import ProjectFieldRow from "@/components/ProjectFieldRow.vue";
import NotificationBox from "@/components/Notification.vue";
import UserInput from "@/components/UserInput.vue";
import UploadButton from "@/components/UploadButton.vue";
import DownloadButton from "@/components/DownloadButton.vue";
import DocumentsTable from "@/components/DocumentsTable.vue";

export default defineComponent({
  computed: {
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
    DocumentsTable,
    DownloadButton,
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
      brigeheads: [] as Bridgehead[],
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
      existsApplicationForm: false,
      existsScript: false,
      publications: [] as ProjectDocument[],
      otherDocuments: [] as ProjectDocument[]
    };
  },
  watch: {
    activeBridgehead(newValue, oldValue) {
      this.activeBridgeheadIndex = this.brigeheads.findIndex(bridgehead => bridgehead === newValue);
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
    this.fetchBridgeheads();
  },


  methods: {
    /*toggleExpand(item: { isExpanded: boolean }) {
      item.isExpanded = !item.isExpanded;
    },*/

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

    refreshBridgeheadsAndContext(){
      const activeBridgehead = this.activeBridgehead;
      this.fetchBridgeheads().then(result => {
        if (this.activeBridgehead === activeBridgehead){
          this.refreshContext();
        }
      })
    },

    refreshContext() {
      this.context = new ProjectManagerContext(this.context.projectCode, this.context.bridgehead);
    },

    async fetchBridgeheads() {
      try {
        return await this.projectManagerBackendService.fetchData(
            Module.PROJECT_BRIDGEHEAD_MODULE,
            Action.FETCH_PROJECT_BRIDGEHEADS_ACTION,
            this.context,
            new Map()
        ).then(bridgeheads => {
          this.brigeheads = bridgeheads;
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
        this.initializeData(Module.PROJECT_BRIDGEHEAD_MODULE, Action.FETCH_PROJECT_STATES_ACTION, new Map(), 'projectStates');
        this.fetchNotifications();
        this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_PROJECT_TYPES_ACTION, new Map(), 'projectTypes');
        this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_QUERY_FORMATS_ACTION, new Map(), 'queryFormats');
        this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_OUTPUT_FORMATS_ACTION, new Map(), 'outputFormats');
        if (this.project.type) {
          const params = new Map<string, string>;
          params.set('project-type', this.project.type)
          this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_EXPORTER_TEMPLATES_ACTION, params, 'exporterTemplateIds');
          if (this.project.type == 'DATASHIELD') {
            this.initializeData(Module.TOKEN_MANAGER_MODULE, Action.FETCH_DATASHIELD_STATUS_ACTION, new Map(), 'dataShieldStatus');
          }
        }
        this.initializeData(Module.PROJECT_BRIDGEHEAD_MODULE, Action.FETCH_ALL_REGISTERED_BRIDGEHEADS_ACTION, new Map(), 'allBridgeheads');
        this.initializeData(Module.PROJECT_DOCUMENTS_MODULE, Action.EXISTS_VOTUM_ACTION, new Map(), 'existsVotum');
        this.initializeData(Module.PROJECT_DOCUMENTS_MODULE, Action.EXISTS_APPLICATION_FORM_ACTION, new Map(), 'existsApplicationForm');
        this.initializeData(Module.PROJECT_DOCUMENTS_MODULE, Action.EXISTS_SCRIPT_ACTION, new Map(), 'existsScript');
        this.initializeData(Module.PROJECT_DOCUMENTS_MODULE, Action.FETCH_PUBLICATIONS_ACTION, new Map(), 'publications');
        this.initializeData(Module.PROJECT_DOCUMENTS_MODULE, Action.FETCH_OTHER_DOCUMENTS_ACTION, new Map(), 'otherDocuments');
      }
    },

    fetchNotifications() {
      this.initializeData(Module.NOTIFICATIONS_MODULE, Action.FETCH_NOTIFICATIONS_ACTION, new Map(), 'notifications');
    },

    initializeData(module: Module, action: Action, params: Map<string, unknown>, dataVariable: string) {
      try {
        this.projectManagerBackendService.isModuleActionActive(module, action).then(condition => {
          if (condition) {
            this.projectManagerBackendService.fetchData(module, action, this.context, params)
                .then(result => (this.$data as any)[dataVariable] = result);
          }
        })
      } catch (error) {
        console.error('Error loading ' + dataVariable + ':', error);
        throw error;
      }
    }

  },

});


</script>

<style scoped>
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


</style>
