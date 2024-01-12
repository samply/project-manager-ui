<template>
  <div class="flex-container">
    <div class="container mt-4">
      <h2>Project Information</h2>
      <br/>
      <router-link to="/"> Zurück</router-link>
      <br/>
      <table class="table table-bordered">
        <thead>
        <tr>
          <th scope="col">Project ID</th>
          <th scope="col">Data Request Number (DRN)</th>
          <th scope="col">Date</th>
          <th scope="col">Status</th>
          <th scope="col">Votum</th>

        </tr>
        </thead>
        <tbody>
        <tr>
          <td>{{ projectData.projectId }}</td>
          <td>{{ projectData.drn }}</td>
          <td>{{ projectData.date }}</td>
          <td>{{ projectData.status }}</td>
        </tr>
        </tbody>
      </table>

      <div class="text-right mt-4">
        <button class="btn btn-primary mr-2" @click="acceptProject">Accept</button>
        <button class="btn btn-danger btn-secondary mr-2" @click="reject" style="margin-left: 0.5%; margin-right: 0.5%">
          Reject
        </button>
        <button class="btn btn-secondary" @click="archive">Archive</button>
      </div>
      <hr/>
    </div>

    <div class="container mt-12" style="margin-bottom: 10%">
      <div v-if="projectData.projectId">
        <br/>
        <div class="table-responsive">
          <h3>Requested Data</h3>
          <br/>
          <table class="table table-bordered custom-table">
            <tbody>
            <tr>
              <td class="bold-text thinner-column">Cooperation Partner</td>
              <td class="wider-column">{{ dummyData.cooperationPartner }}</td>
              <td></td>

            </tr>
            <tr>
              <td class="bold-text thinner-column">Project Title</td>
              <td class="wider-column">{{ dummyData.projectTitle }}</td>
              <td><i class="bi bi-pencil me-2"></i></td>
            </tr>
            <tr>
              <td class="bold-text thinner-column">Project Description</td>
              <td class="wider-column">{{ dummyData.projectDescription }}</td>
              <td><i class="bi bi-pencil me-2"></i></td>

            </tr>
            <tr>
              <td class="bold-text thinner-column">Selected Bridgeheads</td>
              <td class="wider-column">
                <ul>
                  <li v-for="chip in dummyData.selectedChips" :key="chip">{{ chip }}</li>
                </ul>
              </td>
              <td><i class="bi bi-pencil me-2"></i></td>
            </tr>
            <tr>
              <td class="bold-text thinner-column">Script</td>
              <td class="wider-column">script available</td>
              <td><i class="bi bi-download"></i></td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
// import RequestForm from './requestForm.vue';
import {
  Action,
  Module,
  ProjectManagerContext,
  ProjetManagerBackendService,
  Site
} from "@/services/projetManagerBackendService";

export default defineComponent({
  components: {
    // RequestForm,
  },
  data() {
    return {
      site: Site.PROJECT_VIEW_SITE,
      context: undefined as ProjectManagerContext | undefined,
      projectManagerBackendService: undefined as ProjetManagerBackendService | undefined,
      projectData: {
        projectId: '',
        drn: '',
        date: '',
        status: '',
      },
      dummyData: {
        cooperationPartner: ' Partner',
        projectTitle: ' Project Title',
        projectDescription: 'XYZ Project Description',
        selectedChips: ['Bridgehead X', 'Bridgehead Y'],
        file: null,
        showTitle: false,
        showSubmitButtons: false,
      },
    };
  },
  mounted() {
    this.loadProjectData();
    this.dummyData.showTitle = false;
    this.dummyData.showSubmitButtons = false;
    this.context = new ProjectManagerContext();
    this.projectManagerBackendService = new ProjetManagerBackendService(this.context, this.site);
  },
  methods: {
    async loadProjectData(): Promise<void> {
      try {
        const projectId = this.$route.params.projectId;
        const response = await fetch('/projects.json');
        const {projects} = await response.json();

        const projectData = projects.find((project: { projectId: string }) => project.projectId === projectId);

        if (projectData) {
          this.projectData = projectData;
        } else {
          console.error(`Project with ID ${projectId} not found`);
        }
      } catch (error) {
        console.error('Error loading project data:', error);
      }
    },
/*    async acceptProject(): Promise<void> {
      try {
        // Beispielhaftes Modell, pass die Methode und Parameter entsprechend an
        const response = await this.projectManagerBackendService.fetchData(
            Module.PROJECT_STATE,
            Action.ACCEPT_PROJECT,
            this.context,
            new Map()
        );

      } catch (error) {
        console.error('Error accepting project:', error);
      }
    },*/
    reject() {
      console.log('Reject clicked');
    },
    archive() {
      console.log('Archive clicked');
    },
    editTitle() {
      console.log('Edit Title clicked');
    },
    editDescription() {
      console.log('Edit Description clicked');
    },
    uploadDownloadScript() {
      console.log('Upload/Download Script clicked');
    },
    viewCriteria() {
      console.log('View Criteria clicked');
    },
    editBridgeheads() {
      console.log('Edit Bridgeheads clicked');
    },
    downloadUploadForm() {
      console.log('Download/Upload Form clicked');
    },
    editExportOutputFormat() {
      console.log('Edit Export-Output Format clicked');
    },
    downloadAuthenticationScript() {
      console.log('Download Authentication Script (DataSHIELD) clicked');
    },
  },
});
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
}

.button-container-right {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 16px;
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

.table-and-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.buttons-container {
  margin-top: 16px;
}
</style>
