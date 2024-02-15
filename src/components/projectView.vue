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
              <td></td>
            </tr>
            </tbody>
          </table>

          <div class="text-right mt-4">
            <button class="btn btn-primary mr-2">Accept</button>
            <button class="btn btn-danger btn-secondary mr-2" @click="reject"
                    style="margin-left: 0.5%; margin-right: 0.5%">
              Reject
            </button>
            <button class="btn btn-secondary" @click="archive">Archive</button>
          </div>
          <hr/>
        </div>

        <div class="container mt-12" style="margin-bottom: 10%;">
          <div v-if="tableData">
            <br/>
            <div class="table-responsive">
              <h3>Requested Data</h3>
              <br/>
              <table class="table table-bordered custom-table">
                <tbody>
                <tr>
                  <td class="bold-text thinner-column">Cooperation Partner</td>
                  <td class="wider-column">{{ tableData }}</td>
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
                <tr>
                  <td class="bold-text thinner-column">Query</td>
                  <td class="wider-column"></td>
                  <td><i class="bi bi-copy"></i></td>
                </tr>
                <tr>
                  <td class="bold-text thinner-column">Publications</td>
                  <td class="wider-column">no publication</td>
                  <td><i class="bi bi-link-45deg"></i></td>
                </tr>
                <tr>
                  <td class="bold-text thinner-column">output-format</td>
                  <td class="wider-column"></td>
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
        <div v-for="(item, index) in secondTableData" :key="index" class="card mb-3">
          <div class="card-body" :class="{ 'expanded': item.isExpanded }">
            <div style="display:flex; flex-flow: row; justify-content: space-between">
              <h5 class="card-title">{{ item.notification }}</h5>
              <div class="notification-header">
                <button type="button" class="btn-close" @click="removeNotification(index)"
                        aria-label="Close"></button>
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
  ProjectManagerContext,
  ProjetManagerBackendService,
  Site
} from "@/services/projetManagerBackendService";

export default defineComponent({
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  components: {
    // RequestForm,
  },
  data() {
    return {
      brigeheadList: [],
      context: new ProjectManagerContext(this.projectId, undefined),
      //context: new ProjectManagerContext(this.projectId, undefined),
      projectManagerBackendService: new ProjetManagerBackendService(new ProjectManagerContext(this.projectId, undefined), Site.PROJECT_VIEW_SITE),
      //tableData: [] as { title: string; projectId: string; drn: string; date: string; status: string }[],
      tableData: [],
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
      dummyData: {
        cooperationPartner: ' Partner',
        projectTitle: ' Project Title',
        projectDescription: 'XYZ Project Description',
        selectedChips: ['Bridgehead X', 'Bridgehead Y'],
        file: null,
        showTitle: false,
        showSubmitButtons: false,
      },
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
      showProgress: false,

    };
  },
  watch: {
    context(newValue, oldValue) {
      this.projectManagerBackendService = new ProjetManagerBackendService(newValue, Site.PROJECT_VIEW_SITE);
    }
  },
  mounted() {
    // this.loadProjectData();
    this.dummyData.showTitle = false;
    this.dummyData.showSubmitButtons = false;

    this.fetchBridgeheads().then((result) => {
      console.log('Fetch Bridgehead List:', result);
      this.brigeheadList = result;
      this.context = new ProjectManagerContext(this.projectId, result[0].bridgehead);
      this.fetchProject().then((project) => {
        console.log('Fetch ProjectView Result:', project);
        this.tableData = project;
        console.log("ProjectViewTableData:", JSON.stringify(this.tableData, null, 2));
        for (const key in project) {
          if (Object.hasOwnProperty.call(project, key)) {
            const value = project[key];
            console.log(`${key}:`, value);
          }
        }
      });

    })
  },


  methods: {
    toggleExpand(item: { isExpanded: boolean }) {
      item.isExpanded = !item.isExpanded;
    },
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
    removeNotification(index: number): void {
      this.secondTableData.splice(index, 1);
    },

    /*    async loadProjectData(): Promise<void> {
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
        },*/

    async fetchProject() {
      try {
        const module = Module.PROJECT_BRIDGEHEAD_MODULE;
        const action = Action.FETCH_PROJECT_ACTION;


        console.log(module);
        console.log(action);
        console.log(this.context);
        console.log('Fetching single project...');

        return await this.projectManagerBackendService.fetchData(
            module,
            action,
            this.context,
            new Map()
        );

      } catch (error) {
        console.error('Error loading single project:', error);
      }
    },

    async fetchBridgeheads() {
      try {
        const module = Module.PROJECT_BRIDGEHEAD_MODULE;
        const action = Action.FETCH_PROJECT_BRIDGEHEADS_ACTION;

        console.log(module);
        console.log(action);
        console.log(this.context);
        console.log('Fetching single project...');

        return await this.projectManagerBackendService.fetchData(
            module,
            action,
            this.context,
            new Map()
        );

      } catch (error) {
        console.error('Error loading BridgeheadList:', error);
      }
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
