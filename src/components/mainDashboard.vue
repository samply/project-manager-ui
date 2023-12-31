<template>
  <div>
    <div class="container mt-4">
      <h1>Main Dashboard</h1>
      <br/>
      <div class="row">
        <div class="col-md-8">
          <h2>Requests</h2>
        </div>
        <div class="col-md-4 text-end">
          <button class="btn btn-primary mb-3">Filter by Status</button>
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
              ➡️
            </router-link>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <br/><br/><br/>

    <div class="container mt-4">
      <h2>Notifications</h2>

      <table class="table table-bordered table-striped table-hover">
        <thead>
        <tr>
          <th scope="col">Project ID</th>
          <th scope="col">DRN</th>
          <th scope="col">User</th>
          <th scope="col">Date</th>
          <th scope="col">Notification</th>
        </tr>
        </thead>
        <!-- Table Body -->
        <tbody>
        <!-- Add rows with dummy data -->
        <tr v-for="(item, index) in secondTableData" :key="index">
          <td>{{ item.projectId }}</td>
          <td>{{ item.drn }}</td>
          <td>{{ item.user }}</td>
          <td>{{ item.date }}</td>
          <td>{{ item.notification }}</td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {ProjectManagerContext, ProjetManagerBackendService, Site} from "@/services/projetManagerBackendService";

export default defineComponent({
  data() {
    return {
      site: Site.PROJECT_DASHBOARD_SITE,
      context: undefined as ProjectManagerContext | undefined,
      projectManagerBackendService: undefined as ProjetManagerBackendService | undefined,
      tableData: [] as { title: string; projectId: string; drn: string; date: string; status: string }[],
      secondTableData: [
        {projectId: 'PR001', drn: '12345', user: 'User1', date: '2023-04-15', notification: 'Notification 1'},
        {projectId: 'PR002', drn: '67890', user: 'User2', date: '2023-05-20', notification: 'Notification 2'},
      ],
    };
  },
  mounted() {
    this.loadProjectData();
    this.context = new ProjectManagerContext()
    this.projectManagerBackendService = new ProjetManagerBackendService(this.context, this.site)
  },

  methods: {
    async loadProjectData(): Promise<void> {
      try {
        const response = await fetch('/projects.json');
        const {projects} = await response.json();

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
</style>
