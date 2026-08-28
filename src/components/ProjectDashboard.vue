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
      <div v-if="projectStates.length > 1 || applicants.length > 1 || bridgeheads.length > 1" class="filter-box">
        <select v-if="projectStates.length > 1" v-model="selectedState" class="form-select" @change="changeState()">
          <option value="">All Phases</option>
          <option v-for="value in projectStates" :key="value" :value="value">{{ projectStateLabel(value) }}</option>
        </select>
        <select v-if="applicants.length > 1" v-model="selectedApplicant" class="form-select" @change="changeApplicant()">
          <option value="">All Applicants</option>
          <option v-for="applicant in applicants" :key="applicant.email" :value="applicant.email">
            {{ applicantLabel(applicant) }}
          </option>
        </select>
        <select v-if="bridgeheads.length > 1" v-model="selectedBridgehead" class="form-select" @change="changeBridgehead()">
          <option value="">All Sites</option>
          <option v-for="bridgehead in bridgeheads" :key="bridgehead.bridgehead" :value="bridgehead.bridgehead">
            {{ bridgehead.humanReadable || bridgehead.bridgehead }}
          </option>
        </select>
      </div>
      <div class="table-box">
        <table class="table table-bordered table-striped table-hover">
          <thead>
          <tr>
            <th scope="col" @click="toggleSort(ProjectSortField.TITLE)">Title <span v-if="sortBy === ProjectSortField.TITLE">{{ sortIcon(ProjectSortField.TITLE) }}</span></th>
            <th scope="col" @click="toggleSort(ProjectSortField.REQUEST_ID)">Request ID <span v-if="sortBy === ProjectSortField.REQUEST_ID">{{ sortIcon(ProjectSortField.REQUEST_ID) }}</span></th>
            <th scope="col" @click="toggleSort(ProjectSortField.PROJECT_CREATOR)">Applicant <span v-if="sortBy === ProjectSortField.PROJECT_CREATOR">{{ sortIcon(ProjectSortField.PROJECT_CREATOR) }}</span></th>
            <th scope="col" @click="toggleSort(ProjectSortField.CREATED)">Created on <span v-if="sortBy === ProjectSortField.CREATED">{{ sortIcon(ProjectSortField.CREATED) }}</span></th>
            <th scope="col" @click="toggleSort(ProjectSortField.STATUS)">Phase <span v-if="sortBy === ProjectSortField.STATUS">{{ sortIcon(ProjectSortField.STATUS) }}</span>
            </th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(project, index) in projects" :key="index">
            <td><router-link :to="{ name: 'ProjectView', query: { 'project-code': project.code } }" class="label-link" :class="{ 'label-placeholder': project?.label?.length === 0 }">{{
                (project?.label?.length ?? 0) > 0 ? project.label : "New Request"
              }}</router-link></td>
            <td>{{ project.code }}</td>
            <td>
              <UserAndEmail
                  :first-name="project?.creatorName"
                  :email="project?.creatorEmail"
              />
            </td>
            <td>{{ project && project.createdAt ? convertDate(project.createdAt) : '' }}</td>
            <td>{{ project.state }}</td>
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
  Bridgehead,
  Module,
  PmRequestParameter,
  Project,
  ProjectManagerBackendService,
  ProjectManagerContext,
  ProjectSortField,
  ProjectState,
  Site,
  User
} from "@/services/projectManagerBackendService";
import NotificationBox from "@/components/Notification.vue";
import {format} from "date-fns";
import UserAndEmail from "@/components/UserAndEmail.vue";

export default defineComponent({
  computed: {
    projectStates(): ProjectState[] {
      return this.availableProjectStates
    },

  },
  components: {UserAndEmail, NotificationBox},

  data() {
    return {
      ProjectSortField,
      site: Site.PROJECT_DASHBOARD_SITE,
      context: new ProjectManagerContext(undefined, undefined),
      projectManagerBackendService: new ProjectManagerBackendService(new ProjectManagerContext(undefined, undefined), Site.PROJECT_DASHBOARD_SITE),
      projects: [] as Project[],
      notifications: [],
      showNotification: false,
      currentPage: 1,
      totalPages: 1,
      selectedState: "" as "" | ProjectState,
      availableProjectStates: [] as ProjectState[],
      isProjectManagerAdmin: false,
      applicants: [] as User[],
      bridgeheads: [] as Bridgehead[],
      selectedApplicant: "",
      selectedBridgehead: "",
      sortBy: ProjectSortField.CREATED,
      sortDesc: true
    };
  },
  watch: {
    context(newValue, _oldValue) {
      this.projectManagerBackendService = new ProjectManagerBackendService(newValue, Site.PROJECT_DASHBOARD_SITE);
      this.fetchFilterOptions();
      this.fetchProjects();
      this.fetchIfIsProjectManagerAdmin();
    },
    projects() {
      if (this.isProjectManagerAdmin) {
        this.fetchNotifications();
      }
    }
  },
  async mounted() {
    await this.initializeCurrentData();
  },
  methods: {
    toggleNotification() {
      this.showNotification = !this.showNotification;
    },
    changeState() {
      this.currentPage = 1;
      this.fetchProjects()
    },
    changeApplicant() {
      this.currentPage = 1;
      this.fetchProjects()
    },
    changeBridgehead() {
      this.currentPage = 1;
      this.fetchProjects()
    },
    toggleSort(sortBy: ProjectSortField) {
      if (this.sortBy === sortBy) this.sortDesc = !this.sortDesc;
      else {
        this.sortBy = sortBy;
        this.sortDesc = false;
      }
      this.currentPage = 1;
      this.fetchProjects();
    },
    sortIcon(sortBy: ProjectSortField) {
      return this.sortBy === sortBy ? (this.sortDesc ? '▼' : '▲') : '';
    },

    projectStateLabel(state: ProjectState) {
      return state.charAt(0) + state.slice(1).toLowerCase();
    },

    applicantLabel(applicant: User) {
      const name = [applicant.firstName, applicant.lastName].filter(Boolean).join(' ');
      return name ? `${name} (${applicant.email})` : applicant.email;
    },

    convertDate(date: Date) {
      return format(date, 'yyyy-MM-dd HH:mm')
    },


    // TODO: Fetch several pages of projects
    async fetchProjects() {
      try {
        const params = new Map<string, string>();
        if (this.selectedState) {
          params.set(PmRequestParameter.PROJECT_STATE, this.selectedState)
        }
        if (this.selectedApplicant) {
          params.set(PmRequestParameter.PROJECT_CREATOR, this.selectedApplicant)
        }
        if (this.selectedBridgehead) {
          params.set(PmRequestParameter.BRIDGEHEAD, this.selectedBridgehead)
        }
        params.set(PmRequestParameter.PAGE, (this.currentPage - 1).toString());
        params.set(PmRequestParameter.PAGE_SIZE, '10');
        params.set(PmRequestParameter.SORT_BY, this.sortBy);
        params.set(PmRequestParameter.SORT_DESC, this.sortDesc.toString());
        params.set(PmRequestParameter.SITE, Site.PROJECT_DASHBOARD_SITE);
        this.projectManagerBackendService.fetchData(
            Module.PROJECTS_MODULE,
            Action.FETCH_PROJECTS_ACTION,
            this.context,
            params
        ).then(projects => {
          this.projects = projects.content;
          this.totalPages = projects.totalPages === 0 ? 1 : projects.totalPages;
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
        const states = await this.projectManagerBackendService.fetchData(
            Module.PROJECTS_MODULE,
            Action.FETCH_VISIBLE_PROJECT_STATES_ACTION,
            this.context,
            new Map()
        );
        this.availableProjectStates = Array.isArray(states) ? states : [];
        if (this.selectedState && !this.availableProjectStates.includes(this.selectedState)) {
          this.selectedState = "";
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
        throw error;
      }
    },
    async initializeCurrentData() {
      await Promise.all([this.fetchProjectStates(), this.fetchFilterOptions()]);
      await this.fetchProjects();
    },
    async fetchFilterOptions() {
      const [applicants, bridgeheads] = await Promise.all([
        this.projectManagerBackendService.fetchData(
            Module.PROJECTS_MODULE,
            Action.FETCH_PROJECT_CREATORS_ACTION,
            this.context,
            new Map()
        ).catch(error => {
          console.error('Error loading project creators:', error);
          return [];
        }),
        this.projectManagerBackendService.fetchData(
            Module.PROJECTS_MODULE,
              Action.FETCH_VISIBLE_BRIDGEHEADS_ACTION,
            this.context,
            new Map()
        ).catch(error => {
          console.error('Error loading project sites:', error);
          return [];
        })
      ]);
      this.applicants = Array.isArray(applicants) ? applicants : [];
      this.bridgeheads = Array.isArray(bridgeheads) ? bridgeheads : [];
      if (this.applicants.length <= 1) this.selectedApplicant = "";
      if (this.bridgeheads.length <= 1) this.selectedBridgehead = "";
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
  /*background-color: transparent;
  border: none;*/
  width:20%;
  cursor: pointer;
  /*color: white;*/
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

.filter-box {
  background-color: #f1f1f1;
  margin: 2%;
  padding:2%;
  display: flex;
  flex-direction: row;
}
.filter-box select {
  margin-right:2%
}
.label-placeholder {
  font-style: italic;
}
</style>
