<template>
  <div class="flex-container">
    <div class="left-container">
      <div v-if="projectData.projectId">
        <div class="vertical-stepper">
          <div v-for="(step, index) in stepperSteps" :key="index" class="stepper-step">
            <div style="display: flex; flex-flow: row">
              <div class="step-circle">
                <span>{{ index + 1 }}</span>
              </div>
              <div class="step-title">{{ step.title }}</div>
            </div>
            <div v-if="index < stepperSteps.length - 1" class="stepper-line"></div>
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
              <td>{{ project ? project.creatorEmail : '' }}</td>
              <td>{{ project && project.createdAt ? convertDate(project.createdAt) : '' }}</td>
              <td>{{ project && project.expiresAt ? convertDate(project.expiresAt) : '' }}</td>
              <td>{{ project && project.modifiedAt ? convertDate(project.modifiedAt) : '' }}</td>
              <td>Votum</td> <!-- TODO -->
            </tr>
            </tbody>
          </table>
          <div class="text-right mt-4">

            <!-- Project State Module: Creator View -->
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.CREATE_PROJECT_ACTION"
                                  :context="context" text="Create"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>&nbsp;
            <!-- Project State Module: PM-ADMIN View -->
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.ACCEPT_PROJECT_ACTION"
                                  :context="context" text="Accept"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>&nbsp;
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.REJECT_PROJECT_ACTION"
                                  :context="context" text="Reject"
                                  button-class="btn btn-danger btn-secondary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>&nbsp;
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.START_DEVELOP_STAGE_ACTION"
                                  :context="context" text="Start develop stage"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>&nbsp;
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.START_PILOT_STAGE_ACTION"
                                  :context="context" text="Start final stage"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>&nbsp;
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.START_FINAL_STAGE_ACTION"
                                  :context="context" text="Start final stage"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>&nbsp;
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.FINISH_PROJECT_ACTION"
                                  :context="context" text="Finish"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>&nbsp;
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.ARCHIVE_PROJECT_ACTION"
                                  :context="context" text="Archive"
                                  button-class="btn btn-secondary"
                                  :project-manager-backend-service="projectManagerBackendService"/>

            <!-- Project State Module: BK-ADMIN View -->
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE"
                                  :action="Action.ACCEPT_BRIDGEHEAD_PROJECT_ACTION"
                                  :context="context" text="Accept"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE"
                                  :action="Action.REJECT_BRIDGEHEAD_PROJECT_ACTION"
                                  :context="context" text="Reject"
                                  button-class="btn btn-danger btn-secondary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <!-- Project State Module: Developer/Pilot View -->
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.ACCEPT_SCRIPT_ACTION"
                                  :context="context" text="Accept"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.REJECT_SCRIPT_ACTION"
                                  :context="context" text="Reject"
                                  button-class="btn btn-danger btn-secondary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.REQUEST_SCRIPT_CHANGES_ACTION"
                                  :context="context" text="Request changes"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <!-- Project State Module: Final View -->
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.ACCEPT_PROJECT_RESULTS_ACTION"
                                  :context="context" text="Accept"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.REJECT_PROJECT_RESULTS_ACTION"
                                  :context="context" text="Reject"
                                  button-class="btn btn-danger btn-secondary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE"
                                  :action="Action.REQUEST_CHANGES_IN_PROJECT_ACTION"
                                  :context="context" text="Request changes"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>

            <!-- Export Module -->
            <ProjectManagerButton :module="Module.EXPORT_MODULE" :action="Action.SAVE_QUERY_IN_BRIDGEHEAD_ACTION"
                                  :context="context" text="Reject"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.EXPORT_MODULE"
                                  :action="Action.SAVE_AND_EXECUTE_QUERY_IN_BRIDGEHEAD_ACTION"
                                  :context="context" text="Request changes"
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
                <ProjectFieldRow field-key="Title" edit-project-param="label"
                                 :field-value="project.label"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>
                <ProjectFieldRow field-key="Description" edit-project-param="description"
                                 :field-value="project && project.description && project.description.length > 10 ? project.description.substring(0, 9) : project.description"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>
                <tr>
                  <td class="bold-text thinner-column">State</td>
                  <td class="wider-column">{{ project.state }}</td>
                  <td><i class="bi bi-pencil me-2"></i></td>
                </tr>
                <ProjectFieldRow field-key="Type" edit-project-param="project-type"
                                 :field-value="project.type"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>
                <tr>
                  <td class="bold-text thinner-column">Query</td>
                  <td class="wider-column">
                    {{ project.humanReadable ? project.humanReadable : project.query }}
                  </td>
                  <td><i class="bi bi-pencil me-2"></i></td>
                </tr>
                <tr>
                  <td class="bold-text thinner-column">Query Format</td>
                  <td class="wider-column">{{ project.queryFormat }}</td>
                  <td><i class="bi bi-pencil me-2"></i></td>
                </tr>
                <tr>
                  <td class="bold-text thinner-column">Query context</td>
                  <td class="wider-column">{{ project.queryContext }}</td>
                  <td><i class="bi bi-pencil me-2"></i></td>
                </tr>
                <tr>
                  <td class="bold-text thinner-column">Output Format</td>
                  <td class="wider-column">{{ project.outputFormat }}</td>
                  <td><i class="bi bi-pencil me-2"></i></td>
                </tr>
                <tr>
                  <td class="bold-text thinner-column">Template ID</td>
                  <td class="wider-column">{{ project.templateId }}</td>
                  <td><i class="bi bi-pencil me-2"></i></td>
                </tr>
                <tr>
                  <td class="bold-text thinner-column">Script</td>
                  <td class="wider-column">script available</td> <!-- TODO -->
                  <td><i class="bi bi-download"></i></td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showNotification" class="custom-width-notifications">
        <div style="display:flex; flex-flow:row; justify-content:space-between ">
          <h2>Notifications</h2>
          <button style="padding:5px" @click="toggleNotification" class="btn btn-dark" v-if="showNotification">
            <i style="font-size: 30px" class="bi bi-x"></i> <!-- Schließsymbol für Notification -->
          </button>
        </div>
        <div v-for="(notification,index) in notifications" :key="index" class="card mb-3">
          <!--<div class="card-body" :class="{ 'expanded': true }">-->
          <div class="card-body" v-if="!notification.read">
            <div style="display:flex; flex-flow: row; justify-content: space-between">
              <h5 class="card-title">{{ notification.details }}</h5>
              <div class="notification-header">
                <button type="button" class="btn-close"
                        @click="removeNotification(notification && notification.id ? notification.id : 0)"
                        aria-label="Close"></button>
              </div>
            </div>
            <!-- TODO: Add rest of notification information -->
            <div class="card-text">
              <div style="font-size: small">{{
                  notification && notification.timestamp ? convertDate(notification.timestamp) : ''
                }}
              </div>
              <div style="display:flex; float: right; align-items: end; gap:10px">
                <strong>User:</strong> {{ notification.email }}
              </div>
            </div>
            <br>

            <!--            <div class="expand-icon" @click="toggleExpand(notification)">
                          <i :class="['bi', 'bi-chevron-compact-down', { 'rotate': notification.isExpanded }]"></i>
                        </div>-->
          </div>
        </div>
      </div>
      <div v-if="showProgress" class="custom-width-notifications">
        <div style="display:flex; flex-flow:row; justify-content:space-between ">
          <h2>Progress</h2>
          <button style="padding:5px" @click="toggleProgress" class="btn btn-dark" v-if="showProgress">
            <i style="font-size: 30px" class="bi bi-x"></i> <!-- Schließsymbol für Progress -->
          </button>
        </div>
        <div style="padding-left:10%" v-if="projectData.projectId">
          <div class="vertical-stepper">
            <div v-for="(step, index) in stepperSteps" :key="index" class="stepper-step">
              <div style="display: flex; flex-flow: row">
                <div class="step-circle">
                  <span>{{ index + 1 }}</span>
                </div>
                <div class="step-title">{{ step.title }}</div>
              </div>
              <div v-if="index < stepperSteps.length - 1" class="stepper-line"></div>
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
    ProjectFieldRow,
    ProjectManagerButton
    // RequestForm,
  },
  data() {
    return {
      activeBridgehead: undefined as string | undefined,
      brigeheads: [] as string[],
      context: new ProjectManagerContext(this.projectId, undefined),
      projectManagerBackendService: new ProjetManagerBackendService(new ProjectManagerContext(this.projectId, undefined), Site.PROJECT_VIEW_SITE),
      //tableData: [] as { title: string; projectId: string; drn: string; date: string; status: string }[],
      project: undefined as Project | undefined,
      stepperSteps: [
        {title: 'CREATED'},
        {title: 'RESPOND PENDING'},
        {title: 'DEVELOP'},
        {title: 'PILOT'},
        {title: 'APPROVED'},
        {title: 'FINISHED'},
        // Add more steps as needed
      ],
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

    removeNotification(notificationId: number): void {
      const params = new Map<string, string>;
      params.set('notification-id', '' + notificationId)
      this.projectManagerBackendService.fetchData(Module.NOTIFICATIONS_MODULE, Action.SET_NOTIFICATION_AS_READ_ACTION, this.context, params)
      // TODO: refresh after removing notification
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


.custom-width-projects {
  flex: 1;
  padding-top: 2%;
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


.card {
  border: none;
  border-radius: 10px;
}

.notification-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.custom-width-notifications h2 {
  margin-bottom: 15px;
}

.custom-width-notifications .card {
  margin-bottom: 15px;
}

.card-body.expanded {
  height: 300px;
}

.expand-icon {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  cursor: pointer;
}

.expand-icon i.rotate {
  transform: rotate(180deg);
}
</style>
