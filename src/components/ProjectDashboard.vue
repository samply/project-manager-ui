<template>
  <div class="main-menu"></div>
  <div style="display: flex; min-height: 100vh;">
    <div class="container custom-width-projects">
      <div class="row">
        <div class="box-header"><span>Requests</span></div>
        <!--<div class="col-md-4 text-end" v-if="isProjectManagerAdmin">
          <button @click="toggleNotification" class="btn btn-dark notification-button"
                  style="padding-right:2%; background:none; border:none; color:#007bff"><i style="font-size: x-large" class="bi bi-chat-right-text-fill"></i>
          </button>
        </div>-->

      </div>

      <div class="table-box">
        <table class="table table-bordered table-striped table-hover">
          <thead>
          <tr>
            <th scope="col">Request ID</th>
            <th scope="col">Title</th>
            <th scope="col">Applicant</th>
            <th scope="col">Created on</th>
            <th scope="col" style="display: flex;justify-content: space-between;align-items: baseline">
              <span>Status</span><span class="filter">
                <select v-model="selectedState" class="form-select" @change="changeState()">
                  <option v-for="value in projectStates" :key="value" :value="value">{{ value }}</option>
                </select>
              </span>
            </th>
            <th scope="col">Action</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(project, index) in projects" :key="index">
            <td>{{ project.code }}</td>
            <td><router-link :to="{ name: 'ProjectView', query: { 'project-code': project.code } }" class="label-link">{{ project.label }}</router-link></td>
            <td>
              <UserAndEmail
                  :first-name="project?.creatorName"
                  :email="project?.creatorEmail"
              />
            </td>
            <td>{{ project && project.createdAt ? convertDate(project.createdAt) : '' }}</td>
            <td>{{ project.state }}</td>
            <td>
              <router-link :to="{ name: 'ProjectView', query: { 'project-code': project.code } }">
                <i class="bi bi-folder-fill action-icon"></i>
              </router-link>
            </td>
          </tr>
          </tbody>
        </table>
        <div class="pager">
          <button @click="firstPage" class="btn btn-primary">
            <i class="bi bi-skip-start-fill" style="font-size: medium"></i>
          </button>
          <button @click="previousPage" class="btn btn-primary" style="rotate: 180deg">
            <i class="bi bi-play-fill" style="font-size: medium"></i>
          </button>
          <span>{{ currentPage }} / {{ totalPages }}</span>
          <button @click="nextPage" class="btn btn-primary">
            <i class="bi bi-play-fill" style="font-size: medium"></i>
          </button>
          <button @click="lastPage" class="btn btn-primary">
            <i class="bi bi-skip-end-fill" style="font-size: medium"></i>
          </button>
        </div>
      </div>
    </div>
    <NotificationBox :context="context" :project-manager-backend-service="projectManagerBackendService"
                     :show-notification="showNotification" :call-toggle-notification="toggleNotification"
                     :notifications="notifications" :call-update-notifications="fetchNotifications"
                     :show-in-panel="true"
    />
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {
  Action,
  Module,
  Project,
  ProjectManagerBackendService,
  ProjectManagerContext,
  Site
} from "@/services/projectManagerBackendService";
import NotificationBox from "@/components/Notification.vue";
import {format} from "date-fns";
import UserAndEmail from "@/components/UserAndEmail.vue";

export default defineComponent({
  components: {UserAndEmail, NotificationBox},

  data() {
    return {
      site: Site.PROJECT_DASHBOARD_SITE,
      context: new ProjectManagerContext(undefined, undefined),
      projectManagerBackendService: new ProjectManagerBackendService(new ProjectManagerContext(undefined, undefined), Site.PROJECT_DASHBOARD_SITE),
      projects: [] as Project[],
      notifications: [],
      showNotification: false,
      currentPage: 1,
      totalPages: 1,
      projectStates: ["ALL"],
      selectedState: "ALL",
      isProjectManagerAdmin: false
    };
  },
  watch: {
    context(newValue, _oldValue) {
      this.projectManagerBackendService = new ProjectManagerBackendService(newValue, Site.PROJECT_VIEW_SITE);
      this.fetchProjects();
      this.fetchIfIsProjectManagerAdmin();
    },
    projects() {
      if (this.isProjectManagerAdmin) {
        this.fetchNotifications();
      }
    }
  },
  mounted() {
    this.fetchProjects();
    this.fetchProjectStates();
  },
  methods: {
    toggleNotification() {
      this.showNotification = !this.showNotification;
    },
    changeState() {
      this.fetchProjects()
    },

    convertDate(date: Date) {
      return format(date, 'yyyy-MM-dd HH:mm')
    },


    // TODO: Fetch several pages of projects
    async fetchProjects() {
      try {
        const params = new Map<string, string>();
        if (this.selectedState !== "ALL") {
          params.set('project-state', this.selectedState)
        }
        params.set('page', (this.currentPage - 1).toString());
        params.set('page-size', '10');
        params.set('site', Site.PROJECT_DASHBOARD_SITE);
        this.projectManagerBackendService.fetchData(
            Module.PROJECTS_MODULE,
            Action.FETCH_PROJECTS_ACTION,
            this.context,
            params
        ).then(projects => {
          this.projects = projects.content;
          this.totalPages = projects.totalPages;
        });
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    },
    async fetchIfIsProjectManagerAdmin() {
      try {
        await this.projectManagerBackendService.fetchData(
            Module.USER_MODULE,
            Action.IS_PROJECT_MANAGER_ADMIN_ACTION,
            this.context,
            new Map()
        ).then(result => {
          this.isProjectManagerAdmin = result;
        });
      } catch (error) {
        console.error('Error loading notifications:', error);
        throw error;
      }
    },

    async fetchNotifications() {
      try {
        await this.projectManagerBackendService.fetchData(
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
    async fetchProjectStates() {
      try {
        await this.projectManagerBackendService.fetchData(
            Module.PROJECT_BRIDGEHEAD_MODULE,
            Action.FETCH_PROJECT_STATES_ACTION,
            this.context,
            new Map()
        ).then(projectStates => this.projectStates.push(...projectStates));
      } catch (error) {
        console.error('Error loading notifications:', error);
        throw error;
      }
    },
    firstPage() {
      this.currentPage = 1;
      this.fetchProjects()
    },
    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--
      }
      this.fetchProjects()
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
      }
      this.fetchProjects()
    },
    lastPage() {
      this.currentPage = this.totalPages;
      this.fetchProjects()
    }
  },
});
</script>

<style scoped>
.custom-width-projects {
  flex: 1;
  margin-top: 2%;
  /*border-radius: 10px !important;
  box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
  0 1px 1px 0 rgba(0, 0, 0, 0.14),
  0 1px 3px 0 rgba(0, 0, 0, 0.12);*/

  background-color: white;
  height: 100%;
}
table {
  border-color: rgba(0,72,156,.95);
}
thead > tr > th {
  background-color: rgba(0,72,156,.95)!important;
  color: white;
}
.box-header {
  padding: 10px 30px 10px 2%;
  color: rgb(0, 56, 124);;
  font-size: large;
  font-weight: bold;
  background-image: linear-gradient(to right, #e1edf5, #bed7e9);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.box-header span {
  font-size: 16pt;
}

.custom-width-notifications h2 {
  margin-bottom: 15px;
}
.main-menu {
  width: 100%;
  height: 62px;
  background-color: rgba(0,72,156,.95);
  display: flex;
  padding-left: 60%;
}
.pager {
  display: flex;
  justify-content: end;
}

.pager span {
  display: flex;
  border: 1px solid #cccccc;
  border-radius: 5px;
  padding: 0 10px 1px 10px;
  background-color: white;
}

.pager button {
  padding-top: 3px;
  padding-bottom: 3px;
}

.pager button, .pager span {
  margin-left: 10px;
  align-items: center;
}

.table-box {
  margin: 3% 2% 5% 2%;
}

th {
  background-color: #95c8dc !important;
  vertical-align: middle;
}

.form-select {
  background-color: transparent;
  border: none;
  height: 35px;
  font-size: smaller;
  text-align: left;
  cursor: pointer;
  color: white;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23ffffff'%3E%3Cpath d='M5.5 7.5L10 12l4.5-4.5' stroke='%23ffffff' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");

}
.form-select option {
  color: black;
}
.form-select option:hover {
  color: rgba(0,72,156,.95);
}
.label-link {
  text-decoration: none;
  color: rgb(51,142,195);
}
.label-link:hover {
  text-decoration: underline;
}
.action-icon {
  color: rgb(51,142,195);
}
</style>
