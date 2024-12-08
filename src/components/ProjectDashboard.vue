<template>
  <div style="display: flex; min-height: 100vh;">
    <div class="container custom-width-projects">
      <br/>
      <div class="row">
        <div class="col-md-8">
          <h2>Requests</h2>
        </div>
        <div class="col-md-4 text-end">
          <button @click="toggleNotification" class="btn btn-dark"
                  style="padding-right:2%; background:none; border:none; color:#007bff"><i
              class="bi bi-chat-right-text-fill"></i></button>
          <button style="padding-right:2%; background:none; border:none; color:#007bff" class="btn btn-primary mb-3">
            Filter by Status
          </button>
        </div>
      </div>

      <table class="table table-bordered table-striped table-hover">
        <thead>
        <tr>
          <th scope="col">Data Request Number (DRN)</th>
          <th scope="col">Title</th>
          <th scope="col">Creator</th>
          <th scope="col">Date</th>
          <th scope="col">Status</th>
          <th scope="col">Action</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(project, index) in projects" :key="index">
          <td>{{ project.code }}</td>
          <td>{{ project.label }}</td>
          <td>
            {{ project.creatorName }}
            <button
                class="btn btn-link p-0 ms-2"
                @click="copyToClipboard(project.creatorEmail)"
                title="Copy email">
              <i class="bi bi-clipboard"></i>
            </button>
          </td>
          <td>{{ project && project.createdAt ? convertDate(project.createdAt) : '' }}</td>
          <td>{{ project.state }}</td>
          <td>
            <router-link :to="{ name: 'ProjectView', query: { 'project-code': project.code } }">
              <i class="bi bi-folder-fill"></i>
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
        <span>{{this.currentPage}} / {{this.totalPages}}</span>
        <button @click="nextPage" class="btn btn-primary">
          <i class="bi bi-play-fill" style="font-size: medium"></i>
        </button>
        <button @click="lastPage" class="btn btn-primary">
          <i class="bi bi-skip-end-fill" style="font-size: medium"></i>
        </button>
      </div>
    </div>
    <NotificationBox :context="context" :project-manager-backend-service="projectManagerBackendService"
                     :show-notification="showNotification" :call-toggle-notification="toggleNotification"
                     :notifications="notifications" :call-update-notifications="fetchNotifications"/>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {
  Action,
  Module,
  Project,
  ProjectManagerContext,
  ProjectManagerBackendService,
  Site
} from "@/services/projectManagerBackendService";
import NotificationBox from "@/components/Notification.vue";
import {format} from "date-fns";

export default defineComponent({
  components: {NotificationBox},

  data() {
    return {
      site: Site.PROJECT_DASHBOARD_SITE,
      context: new ProjectManagerContext(undefined, undefined),
      projectManagerBackendService: new ProjectManagerBackendService(new ProjectManagerContext(undefined, undefined), Site.PROJECT_DASHBOARD_SITE),
      projects: [] as Project[],
      notifications: [],
      showNotification: false,
      currentPage: 1,
      totalPages: 1
    };
  },
  watch: {
    context(newValue, oldValue) {
      this.projectManagerBackendService = new ProjectManagerBackendService(newValue, Site.PROJECT_VIEW_SITE);
      this.fetchProjects();
    },
    projects(newValue, oldValue) {
      this.fetchNotifications();
    }
  },
  mounted() {
    this.fetchProjects();
  },
  methods: {
    toggleExpand(item: { isExpanded: boolean }) {
      item.isExpanded = !item.isExpanded;
    },
    toggleNotification() {
      this.showNotification = !this.showNotification;
    },
    removeNotification(index: number): void {
      this.notifications.splice(index, 1);
    },
    copyToClipboard(email: string | null | undefined) {
      if (email) {
        navigator.clipboard.writeText(email).then(() => {
          alert("Email copied to clipboard!");
        });
      }
    },

    convertDate(date: Date) {
      return format(date, 'yyyy-MM-dd HH:mm')
    },


    // TODO: Fetch several pages of projects
    async fetchProjects() {
      try {
        const params = new Map<string, string>();
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

    firstPage() {this.currentPage = 1;this.fetchProjects()},
    previousPage() {if (this.currentPage > 1) {this.currentPage--} this.fetchProjects()},
    nextPage() {if (this.currentPage < this.totalPages) {this.currentPage++} this.fetchProjects()},
    lastPage() {this.currentPage = this.totalPages; this.fetchProjects()}
  },
});
</script>

<style scoped>
.custom-width-projects {
  flex: 1;
  padding-top: 2%;
}

.custom-width-notifications {
  width: 18%;
  background-color: #212529;
  color: white;
  padding: 15px;
  order: 2;
  position: relative;
  z-index: 1;
  font-family: "Calibri Light";
  overflow-y: auto;
  transition: transform 0.3s ease-in-out;
}

.sidebar-closed {
  transform: translateX(100%);
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
</style>
