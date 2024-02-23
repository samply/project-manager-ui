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
                <option v-for="bridgeheadOption in brigeheads" :key="bridgeheadOption" :value="bridgeheadOption.bridgehead"
                        :selected="activeBridgehead">{{ bridgeheadOption["bridgehead"] }}
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
              <th scope="col">State</th>
              <th v-if="dataShieldStatus" scope="col">DataSHIELD Status</th>
              <th scope="col">Creator</th>
              <th scope="col">Created at</th>
              <th scope="col">Expires at</th>
              <th scope="col">Last modified</th>
              <th scope="col">Votum</th>
            </tr>
            </thead>
            <tbody>
            <tr>
              <td>{{ project ? project.code : '' }}</td>
              <td>{{ project ? project.state : '' }}</td>
              <td v-if="dataShieldStatus">{{ dataShieldStatus }}</td>
              <td>{{ project ? project.creatorEmail : '' }}</td>
              <td>{{ project && project.createdAt ? convertDate(project.createdAt) : '' }}</td>
              <td>{{ project && project.expiresAt ? convertDate(project.expiresAt) : '' }}</td>
              <td>{{ project && project.modifiedAt ? convertDate(project.modifiedAt) : '' }}</td>
              <td>Votum</td> <!-- TODO -->
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
                                  :context="context" :call-refreh-context="refreshContext" text="Accept"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE"
                                  :action="Action.REJECT_BRIDGEHEAD_PROJECT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Reject"
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
                <!-- TODO -->
                <tr>
                  <td class="bold-text thinner-column">Script</td>
                  <td class="wider-column">script available</td> <!-- TODO -->
                  <td><i class="bi bi-download"></i></td>
                </tr>
                </tbody>
              </table>
            </div>
            <UserInput :project="project" :context="context" :project-manager-backend-service="projectManagerBackendService" />
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
  Module,
  Notification,
  Project,
  ProjectManagerContext,
  ProjetManagerBackendService,
  Site
} from "@/services/projetManagerBackendService";
import ProjectManagerButton from "@/components/ProjectManagerButton.vue";
import {format} from "date-fns";
import ProjectFieldRow from "@/components/ProjectFieldRow.vue";
import NotificationBox from "@/components/Notification.vue";
import UserInput from "@/components/UserInput.vue";

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
    projectId: {
      type: String,
      required: true
    }
  },
  components: {
    UserInput,
    NotificationBox,
    ProjectFieldRow,
    ProjectManagerButton
  },
  data() {
    return {
      activeBridgehead: undefined as string | undefined,
      brigeheads: [] as string[],
      context: new ProjectManagerContext(this.projectId, undefined),
      projectManagerBackendService: new ProjetManagerBackendService(new ProjectManagerContext(this.projectId, undefined), Site.PROJECT_VIEW_SITE),
      project: undefined as Project | undefined,
      projectTypes: [] as string[],
      outputFormats: [] as string[],
      queryFormats: [] as string[],
      exporterTemplateIds: [] as string[],
      allBridgeheads: [] as string[],
      projectStates: [] as string[],
      dataShieldStatus: undefined as string | undefined,
      site: Site.PROJECT_VIEW_SITE,
      projectData: {
        projectId: '',
        drn: '',
        date: '',
        status: '',
      },
      notifications: [] as Notification[],
      showNotification: false,
      showProgress: false
    };
  },
  watch: {
    activeBridgehead(newValue, oldValue) {
      this.context = new ProjectManagerContext(this.projectId, newValue);
    },
    context(newValue, oldValue) {
      this.projectManagerBackendService = new ProjetManagerBackendService(newValue, Site.PROJECT_VIEW_SITE);
      this.fetchProject();
    },
    project(newValue, oldValue) {
      this.fetchNotifications();
      this.fetchProjectStates();
      //this.fetchDataShieldStatus(); //TODO: Reactivate
      this.initializeEnums();
      if (this.project && this.project.type == 'DATASHIELD') {
        this.fetchDataShieldStatus();
      }
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

    refreshContext(){
      this.context = new ProjectManagerContext(this.context.projectCode, this.context.bridgehead);
    },

    async fetchProject() {
      try {
        const params = new Map<string, string>();
        // TODO: Control page size
        params.set('page', '' + 0);
        params.set('page-size', '' + 10);
        this.projectManagerBackendService.fetchData(
            Module.PROJECT_BRIDGEHEAD_MODULE,
            Action.FETCH_PROJECT_ACTION,
            this.context,
            params
        ).then(project => {
          this.project = project;
        })
      } catch (error) {
        console.error('Error loading single project:', error);
        throw error;
      }
    },

    async fetchProjectStates() {
      try {
        return await this.projectManagerBackendService.fetchData(
            Module.PROJECT_BRIDGEHEAD_MODULE,
            Action.FETCH_PROJECT_STATES_ACTION,
            this.context,
            new Map()
        ).then(projectStates => {
          this.projectStates = projectStates;
        });
      } catch (error) {
        console.error('Error loading BridgeheadList:', error);
      }
    },

    async fetchDataShieldStatus() {
      try {
        this.projectManagerBackendService.isModuleActionActive(Module.TOKEN_MANAGER_MODULE, Action.FETCH_DATASHIELD_STATUS_ACTION)
            .then(condition => {
              if (condition) {
                this.projectManagerBackendService.fetchData(
                    Module.TOKEN_MANAGER_MODULE,
                    Action.FETCH_DATASHIELD_STATUS_ACTION,
                    this.context,
                    new Map()
                ).then(dataShieldStatus => {
                  this.dataShieldStatus = dataShieldStatus.project_status;
                });
              }
            });
      } catch (error) {
        console.error('Error loading BridgeheadList:', error);
      }
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
          this.activeBridgehead = bridgeheads[0].bridgehead;
        });
      } catch (error) {
        console.error('Error loading BridgeheadList:', error);
      }
    },

    async fetchNotifications() {
      try {
        const response = await this.projectManagerBackendService.fetchData(
            Module.NOTIFICATIONS_MODULE,
            Action.FETCH_NOTIFICATIONS_ACTION,
            this.context,
            new Map()
        ).then(notifications => this.notifications = notifications);
      } catch (error) {
        console.error('Error loading notifications:', error);
        throw error;
      }
    },

    convertDate(date: Date) {
      return format(date, 'yyyy-MM-dd HH:mm:ss')
    },

    initializeEnums() {
      if (this.project) {
        this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_EDITION_MODULE, Action.FETCH_PROJECT_TYPES_ACTION).then(condition => {
          if (condition) {
            this.projectManagerBackendService.fetchData(Module.PROJECT_EDITION_MODULE, Action.FETCH_PROJECT_TYPES_ACTION, this.context, new Map()).then(projectTypes => this.projectTypes = projectTypes);
          }
        })
        this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_EDITION_MODULE, Action.FETCH_QUERY_FORMATS_ACTION).then(condition => {
          if (condition) {
            this.projectManagerBackendService.fetchData(Module.PROJECT_EDITION_MODULE, Action.FETCH_QUERY_FORMATS_ACTION, this.context, new Map()).then(queryFormats => this.queryFormats = queryFormats);
          }
        })
        this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_EDITION_MODULE, Action.FETCH_OUTPUT_FORMATS_ACTION).then(condition => {
          if (condition) {
            this.projectManagerBackendService.fetchData(Module.PROJECT_EDITION_MODULE, Action.FETCH_OUTPUT_FORMATS_ACTION, this.context, new Map()).then(outputFormats => this.outputFormats = outputFormats);
          }
        })
        if (this.project.type) {
          const params = new Map<string, string>;
          params.set('project-type', this.project.type)
          this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_EDITION_MODULE, Action.FETCH_EXPORTER_TEMPLATES_ACTION).then(condition => {
            if (condition) {
              this.projectManagerBackendService.fetchData(Module.PROJECT_EDITION_MODULE, Action.FETCH_EXPORTER_TEMPLATES_ACTION, this.context, params).then(exporterTemplateIds => this.exporterTemplateIds = exporterTemplateIds);
            }
          })
        }
        this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_BRIDGEHEAD_MODULE, Action.FETCH_ALL_REGISTERED_BRIDGEHEADS_ACTION).then(condition => {
          if (condition) {
            this.projectManagerBackendService.fetchData(Module.PROJECT_BRIDGEHEAD_MODULE, Action.FETCH_ALL_REGISTERED_BRIDGEHEADS_ACTION, this.context, new Map()).then(allBridgeheads => this.allBridgeheads = allBridgeheads);
          }
        })
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
