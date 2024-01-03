<template>
  <div class="flex-container">
    <!-- Project Information Table -->
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
        <button class="btn btn-primary mr-2" @click="send">Send</button>
        <button class="btn btn-danger btn-secondary mr-2" @click="reject" style="margin-left: 0.5%; margin-right: 0.5%">Reject</button>
        <button class="btn btn-secondary" @click="archive">Archive</button>
      </div>
      <hr/>
    </div>

    <div class="container mt-12" style="display: flex; flex-flow:row; ">
      <div v-if="projectData.projectId" class="mt-lg-9">
        <div style="padding-left: 0.5%">
          <h3>Request Data</h3>
          <request-form
              :cooperationPartner="dummyData.cooperationPartner"
              :projectTitle="dummyData.projectTitle"
              :projectDescription="dummyData.projectDescription"
              :selectedChips="dummyData.selectedChips"
              :file="dummyData.file"
              :showTitle="false"
              :showSubmitButtons="false"
              :showTemplate="false"
              @sendCollaborationRequest="sendCollaborationRequest"
          ></request-form>

        </div>
      </div>
      <div class="button-container-right row">
        <button class="btn btn-secondary btn-block" @click="editTitle"><i class="bi bi-pencil me-2"></i> Title</button><br/>
        <button class="btn btn-secondary btn-block" @click="editDescription"> <i class="bi bi-pencil me-2"></i> Description</button><br/>
        <button class="btn btn-secondary btn-block" @click="editBridgeheads"> <i class="bi bi-pencil me-2"></i> Bridgeheads</button><br/>
        <button class="btn btn-secondary btn-block" @click="editExportOutputFormat"> <i class="bi bi-pencil me-2"></i> Export-Output Format</button><br/>

        <button class="btn btn-secondary btn-block me-2" @click="uploadDownloadScript" style="display: flex; gap:0.5%"> <i class="bi bi-upload"></i>Upload Script</button> <br/>
        <button class="btn btn-secondary btn-block me-2" @click="downloadUploadForm" style="display: flex; gap:0.5%"> <i class="bi bi-upload"></i>Upload Form</button><br/>

        <button class="btn btn-secondary btn-block me-2" @click="uploadDownloadScript" style="display: flex; gap:0.5%"><i class="bi bi-download"></i>Download Script</button> <br/>
        <button class="btn btn-secondary btn-block me-2" @click="downloadUploadForm" > <i class="bi bi-download" style="margin-right:2%"></i>Download Form</button><br/>
        <button class="btn btn-secondary btn-block me-2" @click="downloadAuthenticationScript" style="display: flex; gap:0.5%"> <i class="bi bi-download"></i>Download <br> Authentication Script <br>(DataSHIELD)</button><br/>

        </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import RequestForm from './requestForm.vue';
import {ProjectManagerContext, ProjetManagerBackendService, Site} from "@/services/projetManagerBackendService";


export default defineComponent({
  components: {
    RequestForm,
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
        cooperationPartner: null,
        projectTitle: 'Dummy Project Title',
        projectDescription: 'Dummy Project Description',
        selectedChips: ['Dummy Chip 1', 'Dummy Chip 2'],
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
    this.context = new ProjectManagerContext()
    this.projectManagerBackendService = new ProjetManagerBackendService(this.context, this.site)
  },
  methods: {
    async loadProjectData(): Promise<void> {
      try {
        const projectId = this.$route.params.projectId;
        const response = await fetch('/projects.json');
        const { projects } = await response.json();

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
    send() {
      console.log('Send clicked');
    },
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
</style>
