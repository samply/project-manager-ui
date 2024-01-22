<template>
  <div style="display: flex; min-height: 100vh;">
    <div class="container custom-width-projects">
<!--      <h1>Project-Manager </h1>-->
      <br/>
      <div class="row">
        <div class="col-md-8">
          <h2>Requests</h2>
        </div>
        <div class="col-md-4 text-end">
          <button @click="toggleSidebar" class="btn btn-dark" style="padding-right:2%; background:none; border:none; color:#007bff"><i class="bi bi-chat-right-text-fill"></i></button>
          <button style="padding-right:2%; background:none; border:none; color:#007bff" class="btn btn-primary mb-3">Filter by Status</button>
        </div>
      </div>

      <table class="table table-bordered table-striped table-hover">
        <thead>
        <tr>
          <th scope="col">Title</th>
          <th scope="col">Project ID</th>
          <th scope="col">Data Request Number (DRN)</th>
          <th scope="col">Date</th>
          <th scope="col">Status</th>
          <th scope="col">Action</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(item, index) in tableData" :key="index">
          <td>{{ item.title }}</td>
          <td>{{ item.projectId }}</td>
          <td>{{ item.drn }}</td>
          <td>{{ item.date }}</td>
          <td>{{ item.status }}</td>

          <td>
            <router-link :to="{ name: 'projectView', params: { projectId: item.projectId }}">
              <i class="bi bi-folder-fill"></i>            </router-link>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <div :class="{ 'custom-width-notifications': true, 'sidebar-closed': isSidebarClosed }" ref="sidebar">
      <h2>Notifications</h2>
      <div v-for="(item, index) in secondTableData" :key="index" class="card mb-3">


      <div class="card-body">
          <div style="display:flex; flex-flow: row; justify-content: space-between"><h5 class="card-title">{{ item.notification }}</h5>
          <div class="notification-header">
          <button type="button" class="btn-close" @click="removeNotification(index)" aria-label="Close"></button>
        </div>
          </div>

          <p class="card-text">
            <strong>Project ID:</strong> {{ item.projectId }}<br>
            <strong>DRN:</strong> {{ item.drn }}<br>
            <strong>User:</strong> {{ item.user }}<br>
            <strong>Date:</strong> {{ item.date }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Action, Module, ProjectManagerContext, ProjetManagerBackendService, Site } from "@/services/projetManagerBackendService";

export default defineComponent({
  data() {
    return {
      site: Site.PROJECT_DASHBOARD_SITE,
      projects: [] as any[],
      context: new ProjectManagerContext(),
      projectManagerBackendService: new ProjetManagerBackendService(new ProjectManagerContext(), Site.PROJECT_VIEW_SITE),
      tableData: [] as { title: string; projectId: string; drn: string; date: string; status: string }[],
      secondTableData: [
        { projectId: 'PR001', drn: '12345', user: 'User1', date: '2023-04-15', notification: 'Notification 1' },
        { projectId: 'PR002', drn: '67890', user: 'User2', date: '2023-05-20', notification: 'Notification 2' },
      ],
      isSidebarClosed: false, // Zustand der Sidebar
    };
  },
  mounted() {
    this.loadProjectData();
    this.context = new ProjectManagerContext();
    this.projectManagerBackendService = new ProjetManagerBackendService(this.context, this.site);
  },

  methods: {
    toggleSidebar() {
      this.isSidebarClosed = !this.isSidebarClosed;
      this.setSidebarState();
    },
    removeNotification(index: number): void {
      this.secondTableData.splice(index, 1);
    },
    setSidebarState() {
      const sidebar = this.$refs.sidebar as HTMLElement;
      if (sidebar) {
        sidebar.style.transform = this.isSidebarClosed ? 'translateX(100%)' : 'translateX(0)';
      }
    },
    /* async loadProjectData(): Promise<void> {
      try {
        console.log('Hello World!')
        const params = new Map<string, string>();
        params.set('page', '0');
        params.set('page-size', '2');
        params.set('site', Site.PROJECT_DASHBOARD_SITE)

        const module = Module.PROJECT_STATE_MODULE;
        const action = Action.FETCH_PROJECTS_ACTION;

        const projects = await this.projectManagerBackendService.fetchData(
            module,
            action,
            this.context,
            params
        );

        this.projects = projects;
        console.log("test"+this.projects)
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    },*/
    async loadProjectData(): Promise<void> {
      try {
        const response = await fetch('/projects.json');
        const { projects } = await response.json();

        this.tableData = projects;
        console.log("table" + this.tableData);
      } catch (error) {
        console.error('Error loading project data:', error);
      }
    },
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

</style>
