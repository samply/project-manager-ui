<template>
  <div class="main-menu"></div>
  <div style="display: flex; min-height: 100vh;">
    <div class="container custom-width-projects">
      <!-- TODO: restore a notification-toggle entry point in the header when isProjectManagerAdmin is true. -->
      <div class="box-header"><span>Requests</span></div>
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
        <table class="requests-table">
          <thead>
          <tr>
            <th scope="col" @click="toggleSort(ProjectSortField.TITLE)" :class="{ active: sortBy === ProjectSortField.TITLE }">
              <span class="th-label">Title<svg v-if="sortBy === ProjectSortField.TITLE" class="sort-caret" :class="{ desc: sortDesc }" viewBox="0 0 10 10" fill="currentColor"><path d="M5 1l4 5H1z"/></svg></span>
            </th>
            <th scope="col" @click="toggleSort(ProjectSortField.REQUEST_ID)" :class="{ active: sortBy === ProjectSortField.REQUEST_ID }">
              <span class="th-label">Request ID<svg v-if="sortBy === ProjectSortField.REQUEST_ID" class="sort-caret" :class="{ desc: sortDesc }" viewBox="0 0 10 10" fill="currentColor"><path d="M5 1l4 5H1z"/></svg></span>
            </th>
            <th scope="col" @click="toggleSort(ProjectSortField.PROJECT_CREATOR)" :class="{ active: sortBy === ProjectSortField.PROJECT_CREATOR }">
              <span class="th-label">Applicant<svg v-if="sortBy === ProjectSortField.PROJECT_CREATOR" class="sort-caret" :class="{ desc: sortDesc }" viewBox="0 0 10 10" fill="currentColor"><path d="M5 1l4 5H1z"/></svg></span>
            </th>
            <th scope="col" @click="toggleSort(ProjectSortField.CREATED)" :class="{ active: sortBy === ProjectSortField.CREATED }">
              <span class="th-label">Created on<svg v-if="sortBy === ProjectSortField.CREATED" class="sort-caret" :class="{ desc: sortDesc }" viewBox="0 0 10 10" fill="currentColor"><path d="M5 1l4 5H1z"/></svg></span>
            </th>
            <th scope="col" @click="toggleSort(ProjectSortField.STATUS)" :class="{ active: sortBy === ProjectSortField.STATUS }">
              <span class="th-label">Phase<svg v-if="sortBy === ProjectSortField.STATUS" class="sort-caret" :class="{ desc: sortDesc }" viewBox="0 0 10 10" fill="currentColor"><path d="M5 1l4 5H1z"/></svg></span>
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
            <td class="created-cell">{{ project && project.createdAt ? convertDate(project.createdAt) : '' }}</td>
            <td><PhasePill :state="project.state" /></td>
          </tr>
          </tbody>
        </table>
        <div class="pager">
          <button @click="firstPage" class="pager-btn" aria-label="First page">
            <i class="bi bi-skip-start-fill"></i>
          </button>
          <button @click="previousPage" class="pager-btn" style="rotate: 180deg" aria-label="Previous page">
            <i class="bi bi-play-fill"></i>
          </button>
          <span>{{ currentPage }} / {{ totalPages }}</span>
          <button @click="nextPage" class="pager-btn" aria-label="Next page">
            <i class="bi bi-play-fill"></i>
          </button>
          <button @click="lastPage" class="pager-btn" aria-label="Last page">
            <i class="bi bi-skip-end-fill"></i>
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
  projectStateLabel,
  Site,
  User
} from "@/services/projectManagerBackendService";
import NotificationBox from "@/components/Notification.vue";
import PhasePill from "@/components/PhasePill.vue";
import {DisplayFormatKey, formatDisplayDate, resolveDisplayFormatKey} from "@/services/displayFormatService";
import {getConfig} from "@/services/configLoader";
import UserAndEmail from "@/components/UserAndEmail.vue";

export default defineComponent({
  computed: {
    projectStates(): ProjectState[] {
      return this.availableProjectStates
    },

  },
  components: {UserAndEmail, NotificationBox, PhasePill},

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
      sortDesc: true,
      createdAtDisplayFormat: DisplayFormatKey.DATE_TIME_FORMAT as DisplayFormatKey
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
    await this.fetchCreatedAtDisplayFormat();
    await this.initializeCurrentData();
  },
  methods: {
    async fetchCreatedAtDisplayFormat() {
      const config = await getConfig();
      this.createdAtDisplayFormat = resolveDisplayFormatKey(
          config.PROJECT_DASHBOARD_CREATED_AT_DISPLAY_FORMAT, DisplayFormatKey.DATE_TIME_FORMAT);
    },
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
    projectStateLabel,

    applicantLabel(applicant: User) {
      const name = [applicant.firstName, applicant.lastName].filter(Boolean).join(' ');
      return name ? `${name} (${applicant.email})` : applicant.email;
    },

    convertDate(date: string | Date) {
      return formatDisplayDate(date, this.createdAtDisplayFormat)
    },


    // TODO: Fetch several pages of projects
    async fetchProjects() {
      try {
        const params = new Map<string, string>();
        if (this.selectedState) {
          params.set(PmRequestParameter.PROJECT_STATE, this.selectedState)
        }
        if (this.selectedApplicant) {
          params.set(PmRequestParameter.PROJECT_CREATOR_EMAIL, this.selectedApplicant)
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
/*
 * Table design unification (2026-09-22): see
 * project-manager-ui/plans/2026-09-21-plan-unify-table-design.md.
 * Panel header now reuses ProjectView.vue's .box-header blue (#2655a2)
 * instead of this component's own light gradient. Column header tint and
 * the "brand" accent used throughout are derived from that same blue,
 * rather than introducing a second, slightly different one.
 */
.custom-width-projects {
  flex: 1;
  margin-top: 2%;
  border-radius: 10px !important;
  box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
  0 1px 1px 0 rgba(0, 0, 0, 0.14),
  0 1px 3px 0 rgba(0, 0, 0, 0.12);
  overflow: hidden;

  background-color: white;
  height: 100%;
}
/* .custom-width-projects is still a Bootstrap .container, which adds its
   own 0.75rem side padding/gutter. Cancel just that gutter here so the
   header/filters/table reach the card's rounded edges flush, without
   touching the container's own width-capping/centering behavior. */
.box-header {
  margin: 0 -0.75rem;
  padding: 17px 28px;
  color: #fff;
  font-size: 19px;
  font-weight: 600;
  background-color: #2655a2;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.box-header span {
  font-size: inherit;
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

.table-box {
  margin: 0 -0.75rem;
  overflow-x: auto;
}

.requests-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.requests-table thead th {
  background: #e9eef8;
  color: #2655a2;
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: uppercase;
  padding: 12px 22px;
  border-bottom: 1px solid #d7e2ed;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
}
.requests-table thead th .th-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.requests-table thead th .sort-caret {
  width: 9px;
  height: 9px;
  opacity: .7;
  transition: transform .15s ease-in-out;
}
.requests-table thead th .sort-caret.desc {
  transform: rotate(180deg);
}
.requests-table thead th.active {
  color: #2655a2;
}
.requests-table tbody td {
  padding: 14px 22px;
  border-bottom: 1px solid #d7e2ed;
  vertical-align: middle;
}
.requests-table tbody tr:last-child td {
  border-bottom: none;
}
.requests-table tbody tr:hover td {
  background: #e9eef8;
}
.created-cell {
  font-variant-numeric: tabular-nums;
  color: #5b6b7c;
  font-size: 13px;
  white-space: nowrap;
}

.pager {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 14px 22px;
  border-top: 1px solid #d7e2ed;
}
.pager span {
  font-size: 13px;
  color: #5b6b7c;
  font-variant-numeric: tabular-nums;
  padding: 0 6px;
}
.pager-btn {
  border: 1px solid #d7e2ed;
  background: #fff;
  color: #5b6b7c;
  width: 30px;
  height: 30px;
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.pager-btn:hover {
  border-color: #2655a2;
  color: #2655a2;
}

.form-select {
  width:20%;
  cursor: pointer;
}

.form-select option:hover {
  color: #2655a2;
}
.label-link {
  text-decoration: none;
  color: #2655a2;
  font-weight: 600;
}
.label-link:hover {
  text-decoration: underline;
}

.filter-box {
  background-color: #e9eef8;
  margin: 0 -0.75rem;
  padding: 14px 22px;
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid #d7e2ed;
}
.filter-box select {
  margin-right:2%
}
.label-placeholder {
  font-style: italic;
}
</style>
