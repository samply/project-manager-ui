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
          <th scope="col">Date</th>
          <th scope="col">Status</th>
          <th scope="col">Action</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(item, index) in tablaData" :key="index">
          <td>{{ item.code }}</td>
          <td>{{ item.label }}</td>
          <td>{{ item.createdAt }}</td>
          <td>{{ item.state }}</td>

          <td>
            <router-link :to="{ name: 'projectView', params: { projectId: item.code }}">
              <i class="bi bi-folder-fill"></i>
            </router-link>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showNotification" class="custom-width-notifications">
      <h2>Notifications</h2>
      <div v-for="(item, index) in secondTableData" :key="index" class="card mb-3">
        <div class="card-body" :class="{ 'expanded': item.isExpanded }">
          <div style="display:flex; flex-flow: row; justify-content: space-between">
            <h5 class="card-title">{{ item.notification }}</h5>
            <div class="notification-header">
              <button type="button" class="btn-close" @click="removeNotification(index)" aria-label="Close"></button>
            </div>
          </div>

          <div class="card-text">
            <div style="font-size: small">{{ item.date }}</div>
            <div style="display:flex; float: right; align-items: end; gap:10px">
              <strong>Project ID:</strong> {{ item.projectId }}
              <strong>User:</strong> {{ item.user }}
            </div>
          </div>
          <br>

          <div class="expand-icon" @click="toggleExpand(item)">
            <i :class="['bi', 'bi-chevron-compact-down', { 'rotate': item.isExpanded }]"></i>
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
  ProjectManagerContext,
  ProjetManagerBackendService,
  Site
} from "@/services/projetManagerBackendService";

export default defineComponent({

  data() {
    return {
      site: Site.PROJECT_DASHBOARD_SITE,
      context: new ProjectManagerContext(),
      projectManagerBackendService: new ProjetManagerBackendService(new ProjectManagerContext(), Site.PROJECT_DASHBOARD_SITE),
      //tableData: [] as { title: string; projectId: string; drn: string; date: string; status: string }[],
      tablaData: [],
      secondTableData: [
        {
          projectId: 'PR001',
          drn: '12345',
          user: 'User1',
          date: '2023-04-15',
          notification: 'Notification Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. '
        },
        {
          projectId: 'PR002',
          drn: '67890',
          user: 'User2',
          date: '2023-05-20',
          notification: 'Notification Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. '
        },
      ],
      showNotification: false,
    };
  },
  mounted() {
    this.fetchProjects().then((result) => {
      console.log('Fetch Projects Result:', result);
      this.tablaData = result.content;
      console.log("TableData:", JSON.stringify(this.tablaData, null, 2));
      console.log("First Project:", this.tablaData[0]);
      for (let i = 0; i < this.tablaData.length; i++) {
        const currentProject = this.tablaData[i];

        // Iterate through the properties of each project object
        for (const key in currentProject) {
          if (Object.hasOwnProperty.call(currentProject, key)) {
            const value = currentProject[key];
            console.log(`${key}:`, value);
          }
        }
      }
    });
  },
  computed: {},

  methods: {
    toggleExpand(item: { isExpanded: boolean }) {
      item.isExpanded = !item.isExpanded;
    },
    toggleNotification() {
      this.showNotification = !this.showNotification;
    },
    removeNotification(index: number): void {
      this.secondTableData.splice(index, 1);
    },

    async fetchProjects() {
      try {
        const params = new Map<string, string>();
        params.set('page', '0');
        params.set('page-size', '2');
        params.set('site', Site.PROJECT_DASHBOARD_SITE);

        const module = Module.PROJECTS_MODULE;
        const action = Action.FETCH_PROJECTS_ACTION;

        console.log(module);
        console.log(action);
        console.log(this.context);
        console.log(params);
        console.log('Fetching projects...');
        return await this.projectManagerBackendService.fetchData(
            module,
            action,
            this.context,
            params
        );

      } catch (error) {
        console.error('Error loading projects:', error);
      }
    },
    /*async loadProjectData(): Promise<void> {
      try {
        const response = await fetch('/projects.json');
        const { projects } = await response.json();

        this.tableData = projects;
        console.log("table" + this.tableData);
      } catch (error) {
        console.error('Error loading project data:', error);
      }
    },*/
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
</style>
