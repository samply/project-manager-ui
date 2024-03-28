<template>
  <div class="flex-container">
    <div class="left-container">
      <div v-if="projectData.projectId">
        <div class="vertical-stepper">
          <div v-for="(projectState, index) in projectStates" :key="index" class="stepper-step">
            <div style="display: flex; flex-flow: row">
              <div class="step-circle">
                <span>{{ index + 1 }}</span>
              </div>
              <div class="step-title">{{ projectState }}</div>
            </div>
            <div v-if="index < projectStates.length - 1" class="stepper-line"></div>
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
            <router-link to="/" data-toggle="tooltip" data-placement="top" title="Back to Project Dashboard"><i class="bi bi-arrow-left-square-fill"></i></router-link>
<!--            <div v-if="visibleBridgeheads && visibleBridgeheads.length > 1" style="display:flex; flex-flow:row; width:20%; margin-bottom:2%">
              <span class="bold-text">Bridgehead:</span>&nbsp;

              <select  class="form-select" v-model="activeBridgehead">
                <option v-for="bridgehead in visibleBridgeheads" :key="bridgehead.bridgehead" :value="bridgehead"
                        :selected="bridgehead === activeBridgehead">{{ bridgehead.bridgehead }}
                </option>
              </select>
            </div>-->
            <div v-if="visibleBridgeheads && visibleBridgeheads.length == 1">
              <span>{{ context.bridgehead }}</span>
            </div>
            <div>
              <button data-toggle="tooltip" data-placement="top" title="Progress" @click="toggleProgress" class="btn btn-dark"
                      style="background: none; border:none; color:#007bff; width:auto;">
                <i class="bi bi-clipboard-check-fill"></i>
              </button>
              <button data-toggle="tooltip" data-placement="top" title="Notifications" @click="toggleNotification" class="btn btn-dark"
                      style="background: none; border:none; color:#007bff; width:auto;">
                <i class="bi bi-chat-right-text-fill"></i>
              </button>
            </div>
          </div>

          <BridgeheadOverview v-if="visibleBridgeheads.length > 1"
                              :project-manager-backend-service="projectManagerBackendService"
                              :context="context"
                              :bridgeheads="visibleBridgeheads"
                              :activeBridgehead="activeBridgehead" />
          <br/>
          <table class="table table-bordered">
            <thead>
            <tr >
              <th style="background-color: #f2f2f2;" scope="col">Data Request Number (DRN)</th>
              <th style="background-color: #f2f2f2;" scope="col">Project State</th>
              <th style="background-color: #f2f2f2;" scope="col">Bridgehead State</th>
              <th style="background-color: #f2f2f2;" v-if="dataShieldStatus" scope="col">DataSHIELD Status</th>
              <th style="background-color: #f2f2f2;" scope="col">Creator</th>
              <th style="background-color: #f2f2f2;" scope="col">Created at</th>
              <th style="background-color: #f2f2f2;" scope="col">Expires at</th>
              <th style="background-color: #f2f2f2;" scope="col">Last modified</th>
              <th style="background-color: #f2f2f2;" scope="col" v-if="existsVotum">Votum</th>
            </tr>
            </thead>
            <tbody>
            <tr>
              <td>{{ project ? project.code : '' }}</td>
              <td>{{ project ? project.state : '' }}</td>
              <td>{{ activeBridgehead ? activeBridgehead.state : '' }}</td>
              <td v-if="dataShieldStatus">{{ dataShieldStatus.project_status }}</td>
              <td>{{ project ? project.creatorEmail : '' }}</td>
              <td>{{ project && project.createdAt ? convertDate(project.createdAt) : '' }}</td>
              <td>{{ project && project.expiresAt ? convertDate(project.expiresAt) : '' }}</td>
              <td>{{ project && project.modifiedAt ? convertDate(project.modifiedAt) : '' }}</td>
              <td v-if="existsVotum">
                <DownloadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                                :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.DOWNLOAD_VOTUM_ACTION"
                                icon-class="bi bi-download"/>
              </td>
            </tr>
            </tbody>
          </table>
          <div class="text-right mt-4">
            <!-- Project State Module: Creator View -->
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.CREATE_PROJECT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Create"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"
                                  />&nbsp;
            <!-- Project State Module: PM-ADMIN View -->
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.ACCEPT_PROJECT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Accept"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>&nbsp;
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.REJECT_PROJECT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Reject"
                                  button-class="btn btn-danger btn-secondary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>&nbsp;
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.START_DEVELOP_STAGE_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Start develop stage"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>&nbsp;
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.START_PILOT_STAGE_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Start pilot stage"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>&nbsp;
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.START_FINAL_STAGE_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Start final stage"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>&nbsp;
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.FINISH_PROJECT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Finish"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>&nbsp;
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.ARCHIVE_PROJECT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Archive"
                                  button-class="btn btn-secondary"
                                  :project-manager-backend-service="projectManagerBackendService"/>

            <!-- Project State Module: BK-ADMIN View -->
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE"
                                  :action="Action.ACCEPT_BRIDGEHEAD_PROJECT_ACTION"
                                  :context="context" :call-refreh-context="refreshBridgeheadsAndContext" text="Accept"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE"
                                  :action="Action.REJECT_BRIDGEHEAD_PROJECT_ACTION"
                                  :context="context" :call-refreh-context="refreshBridgeheadsAndContext" text="Reject"
                                  button-class="btn btn-danger btn-secondary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <!-- Project State Module: Developer/Pilot View -->
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.ACCEPT_SCRIPT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Accept"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.REJECT_SCRIPT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Reject"
                                  button-class="btn btn-danger btn-secondary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.REQUEST_SCRIPT_CHANGES_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Request changes"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <!-- Project State Module: Final View -->
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.ACCEPT_PROJECT_RESULTS_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Accept"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE" :action="Action.REJECT_PROJECT_RESULTS_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Reject"
                                  button-class="btn btn-danger btn-secondary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.PROJECT_STATE_MODULE"
                                  :action="Action.REQUEST_CHANGES_IN_PROJECT_ACTION"
                                  :context="context" :call-refreh-context="refreshContext" text="Request changes"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <!-- Export Module -->
            <ProjectManagerButton :module="Module.EXPORT_MODULE" :action="Action.SAVE_QUERY_IN_BRIDGEHEAD_ACTION"
                                  :context="context" :call-refreh-context="refreshContext"
                                  text="Save query in bridgehead"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
            <ProjectManagerButton :module="Module.EXPORT_MODULE"
                                  :action="Action.SAVE_AND_EXECUTE_QUERY_IN_BRIDGEHEAD_ACTION"
                                  :context="context" :call-refreh-context="refreshContext"
                                  text="Save and execute query in bridgehead"
                                  button-class="btn btn-primary mr-2"
                                  :project-manager-backend-service="projectManagerBackendService"/>
          </div>

          <hr/>
        </div>

        <div class="container mt-12" style="margin-bottom: 8%;">
          <div v-if="project">
            <br/>
            <div class="table-responsive">
              <h3>Requested Data</h3>
              <br/>
              <div class="container" style="width:100%">
                <div class="row justify-content-center">
                  <div class="col-auto" style="width:100%">
                    <!-- Bootstrap Stepper -->
                    <div class="stepper">
                      <div v-for="(step, index) in steps" :key="index" class="stepper-item" :class="{ 'active': currentStep === index }">
                        <button style="background: none; border:none; color: black;" @click="currentStep=index" :style="{ fontWeight: currentStep === index ? 'bold' : 'normal' }">{{ step }}</button>
                      </div>                    </div>
                    <!-- Navigationstasten -->
                    <div class="button-container mt-3">
                      <button class="btn btn-primary me-2" @click="prevStep" :disabled="currentStep === 0">Zurück</button>
                      <button class="btn btn-primary" @click="nextStep" :disabled="currentStep === steps.length - 1">Weiter</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
              <br/>
              <table class="table table-bordered custom-table  table-hover">
                <tbody>
                <ProjectFieldRow v-if="currentStep==0 || currentStep==4"
                                 field-key="Title"
                                 edit-project-param="label"
                                 :is-editable="true"
                                 :field-value="[project.label]"
                                 :call-refreh-context="refreshContext"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>

                <ProjectFieldRow v-if="currentStep==0 || currentStep==4"
                                 field-key="Description"
                                 edit-project-param="description"
                                 :is-editable="true"
                                 :field-value="[project.description]"
                                 :call-refreh-context="refreshContext"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>

                <ProjectFieldRow v-if="currentStep==0 || currentStep==4"
                                 field-key="Bridgeheads"
                                 edit-project-param="bridgeheads"
                                 :is-editable="true"
                                 :field-value="[bridgeheads]"
                                 :call-refreh-context="refreshContext"
                                 :redirect-url="project.explorerUrl"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>

                <ProjectFieldRow v-if="currentStep==1 || currentStep==4"
                                 field-key="Configuration"
                                 edit-project-param="project-configuration"
                                 :is-editable="true"
                                 :field-value="[currentProjectConfiguration]"
                                 :call-refreh-context="refreshContext"
                                 :possible-values="projectConfigurations"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>

                <ProjectFieldRow v-if="currentStep==1 || currentStep==4"
                                 field-key="Type" edit-project-param="project-type"
                                 :is-editable="isNotIncludedInCurrentProjectConfiguration('type')"
                                 :field-value="[project.type]"
                                 :call-refreh-context="refreshContext"
                                 :possible-values="projectTypes"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>
                <!-- TODO: Edit Query -->
<!--                <ProjectFieldRow field-key="Query"
                                 :field-value="project.query"
                                 edit-project-param="query"
                                 :call-refreh-context="refreshContext"
                                 :redirect-url="project.explorerUrl"
                                 :is-editable="true"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>-->
                <ProjectFieldRow v-if="currentStep==2 || currentStep==4" field-key="Query"
                                 :field-value="[project.humanReadable, project.query]"
                                 edit-project-param="human-readable"
                                 :call-refreh-context="refreshContext"
                                 :redirect-url="project.explorerUrl"
                                 :is-editable="true"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>
                <ProjectFieldRow v-if="currentStep==2 || currentStep==4" field-key="Query Format"
                                 edit-project-param="query-format"
                                 :is-editable="true"
                                 :field-value="[project.queryFormat]"
                                 :call-refreh-context="refreshContext"
                                 :possible-values="queryFormats"
                                 :redirect-url="project.explorerUrl"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>
                <!-- TODO: Separate queries in pairs Key-Values + encrpyt and decrypt in base64-->
                <ProjectFieldRow v-if="currentStep==3 || currentStep==4"
                                 field-key="Environment Variables"
                                 edit-project-param="query-context"
                                 :is-editable="isNotIncludedInCurrentProjectConfiguration('queryContext')"
                                 :field-value="[project?.queryContext]"
                                 :call-refreh-context="refreshContext"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>
                <ProjectFieldRow v-if="currentStep==3 || currentStep==4"
                                 field-key="Output Format"
                                 edit-project-param="output-format"
                                 :is-editable="isNotIncludedInCurrentProjectConfiguration('outputFormat')"
                                 :field-value="[project.outputFormat]"
                                 :call-refreh-context="refreshContext"
                                 :possible-values="outputFormats"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>
                <ProjectFieldRow v-if="currentStep==3 || currentStep==4"
                                 field-key="Template ID"
                                 edit-project-param="template-id"
                                 :is-editable="isNotIncludedInCurrentProjectConfiguration('templateId')"
                                 :field-value="[project.templateId]"
                                 :call-refreh-context="refreshContext"
                                 :possible-values="exporterTemplateIds"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>

                <ProjectFieldRow v-if=" dataShieldStatus && dataShieldStatus.project_status === 'WITH_DATA' && currentStep==2 || currentStep==4"
                                 field-key="Authentication Script"
                                 edit-project-param="template-id"
                                 :is-editable="isNotIncludedInCurrentProjectConfiguration('templateId')"
                                 :field-value="[project.templateId]"
                                 :call-refreh-context="refreshContext"
                                 :possible-values="exporterTemplateIds"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>


<!--                <tr  v-if="dataShieldStatus && dataShieldStatus.project_status === 'WITH_DATA' && currentStep==2 || currentStep==4">
                  <td class="bold-text thinner-column">Authentication Script</td>
                  <td class="wider-column"></td>
                  <td>
                    <DownloadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                                    :module="Module.TOKEN_MANAGER_MODULE"
                                    :action="Action.DOWNLOAD_AUTHENTICATION_SCRIPT_ACTION" icon-class="bi bi-download"
                                    v-if="existsAuthenticationScript"/>
                  </td>
                </tr>-->
<!--                <tr v-if="existsScript">
                  <td class="bold-text thinner-column">Script</td>
                  <td class="wider-column"></td>
                  <td>
                    <DownloadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                                    :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.DOWNLOAD_SCRIPT_ACTION"
                                    icon-class="bi bi-download"/>
                  </td>
                </tr>-->
                <ProjectFieldRow v-if="currentStep==0 || currentStep==4"
                                 field-key="Application form"
                                 edit-project-param="label"
                                 :is-editable="true"
                                 :field-value="[project.label]"
                                 :call-refreh-context="refreshContext"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>

<!--                <ProjectFieldRow v-if="currentStep==0 || currentStep==4" field-key="Samples" edit-project-param="label" :is-editable="true"
                                 :field-value="project.label" :call-refreh-context="refreshContext"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>-->

                <ProjectFieldRow v-if="currentStep==4"
                                 field-key="Votum"
                                 edit-project-param="label"
                                 :is-editable="true"
                                 :field-value="[project.label]"
                                 :call-refreh-context="refreshContext"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>

                <ProjectFieldRow v-if="currentStep==4"
                                 field-key="Script"
                                 edit-project-param="label"
                                 :is-editable="true"
                                 :field-value="[project.label]"
                                 :call-refreh-context="refreshContext"
                                 :context="context" :project-manager-backend-service="projectManagerBackendService"/>
<!--                <tr>
                  <td>{{project && project.createdAt ? 'Script': ''}}</td>
                  <td>{{project && project.createdAt ? project.templateId:''}}</td>
                  <td>
                    <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                                  :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.UPLOAD_SCRIPT_ACTION"
                                  text="Upload script" :call-refreh-context="refreshContext" :is-file="true"/>
                  </td>
                </tr>-->

                <!--<tr>
                  <td> {{project && project.createdAt ? 'Other documents': ''}}</td>
                  <td v-if="project" >
                    <DocumentsTable :context="context" :project-manager-backend-service="projectManagerBackendService"
                                                                           :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.DOWNLOAD_PUBLICATION_ACTION"
                                                                           :project-documents="publications" icon-class="bi bi-download" text="Publications: " />
                    <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                                  :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.UPLOAD_PUBLICATION_ACTION"
                                  text="Upload publication" :call-refreh-context="refreshContext" :is-file="true"/>
                  </td>
                  <td v-if="!project"></td>
                  <td>
                    <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                                  :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.ADD_PUBLICATION_URL_ACTION"
                                  text="Upload publication URL" :call-refreh-context="refreshContext" :is-file="false" />
                  </td>
                </tr>
                <tr>
                  <td>{{project && project.createdAt ? 'Other URL': ''}}</td>
                  <td>{{project && project.createdAt ? project.templateId:''}}</td>
                  <td>
                    <DocumentsTable :context="context" :project-manager-backend-service="projectManagerBackendService"
                                    :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.DOWNLOAD_OTHER_DOCUMENT_ACTION"
                                    :project-documents="otherDocuments" icon-class="bi bi-download" text="Other documents: "/>
                    <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                                  :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.UPLOAD_OTHER_DOCUMENT_ACTION"
                                  text="Upload other document" :call-refreh-context="refreshContext" :is-file="true" /><br/>
                    <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                                  :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.ADD_OTHER_DOCUMENT_URL_ACTION"
                                  text="Upload other document URL" :call-refreh-context="refreshContext" :is-file="false" />
                  </td>
                </tr> -->
                </tbody>
              </table>
            </div>
            <UserInput v-if="currentStep==4" :project="project" :context="context"
                       :bridgeheads="visibleBridgeheads"
                       :project-manager-backend-service="projectManagerBackendService"/>
            <br/>
            <DocumentsTable v-if="currentStep==4" :context="context" :project-manager-backend-service="projectManagerBackendService"
                            :download-action="Action.DOWNLOAD_PUBLICATION_ACTION"
                            :fetch-list-action="Action.FETCH_PUBLICATIONS_ACTION"
                            :bridgeheads="visibleBridgeheads" icon-class="bi bi-download" text="Publications: "/>
            <br/>
            <UploadButton v-if="currentStep==4" :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.UPLOAD_PUBLICATION_ACTION"
                          text="Upload publication" :call-refreh-context="refreshContext" :is-file="true"/>
            <br/>
            <UploadButton v-if="currentStep==4" :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.ADD_PUBLICATION_URL_ACTION"
                          text="Upload publication URL" :call-refreh-context="refreshContext" :is-file="false"/>
            <br/>

          <div style="display:flex; flex-flow:row;  width:100% " v-if="currentStep==4">
            <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.UPLOAD_OTHER_DOCUMENT_ACTION"
                          text="Upload other document" :call-refreh-context="refreshContext" :is-file="true"/>

            <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE" :action="Action.ADD_OTHER_DOCUMENT_URL_ACTION"
                          text="Upload other document URL" :call-refreh-context="refreshContext" :is-file="false"/></div>
<br/>
            <DocumentsTable :context="context" :project-manager-backend-service="projectManagerBackendService"
                            :download-action="Action.DOWNLOAD_OTHER_DOCUMENT_ACTION"
                            :fetch-list-action="Action.FETCH_OTHER_DOCUMENTS_ACTION"
                            :bridgeheads="visibleBridgeheads" icon-class="bi bi-download" text="Other documents: "/></div>
        </div>
      </div>

      <NotificationBox :context="context" :project-manager-backend-service="projectManagerBackendService"
                       :show-notification="showNotification" :call-toggle-notification="toggleNotification"
                       :notifications="notifications" :call-update-notifications="fetchNotifications"/>

      <div v-if="showProgress" class="custom-width-notifications">
        <div style="display:flex; flex-flow:row; justify-content:space-between ">
          <h2>Progress</h2>
          <button style="padding:5px" @click="toggleProgress" class="btn btn-dark" v-if="showProgress">
            <i style="font-size: 30px" class="bi bi-x"></i> <!-- Schließsymbol für Progress -->
          </button>
        </div>
        <div style="padding-left:10%" v-if="projectData.projectId">
          <div class="vertical-stepper">
            <div v-for="(projectState, index) in projectStates" :key="index" class="stepper-step">
              <div style="display: flex; flex-flow: row">
                <div class="step-circle">
                  <span>{{ index + 1 }}</span>
                </div>
                <div class="step-title">{{ projectState }}</div>
              </div>
              <div v-if="index < projectStates.length - 1" class="stepper-line"></div>
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
  Bridgehead,
  DataShieldProjectStatus,
  Module,
  Notification,
  Project,
  ProjectDocument,
  ProjectManagerContext, ProjectRole,
  ProjetManagerBackendService,
  Site
} from "@/services/projetManagerBackendService";
import ProjectManagerButton from "@/components/ProjectManagerButton.vue";
import {format} from "date-fns";
import ProjectFieldRow from "@/components/ProjectFieldRow.vue";
import NotificationBox from "@/components/Notification.vue";
import UserInput from "@/components/UserInput.vue";
import UploadButton from "@/components/UploadButton.vue";
import DownloadButton from "@/components/DownloadButton.vue";
import DocumentsTable from "@/components/DocumentsTable.vue";
import BridgeheadOverview from "@/components/BridgeheadOverview.vue";

export default defineComponent({
  computed: {
    Action() {
      return Action
    },
    Module() {
      return Module
    }
  },
  props: {
    projectCode: {
      type: String,
      required: true
    }
  },
  components: {
    BridgeheadOverview,
    DocumentsTable,
    DownloadButton,
    UploadButton,
    UserInput,
    NotificationBox,
    ProjectFieldRow,
    ProjectManagerButton
  },

  data() {
    return {
      activeBridgehead: undefined as Bridgehead | undefined,
      activeBridgeheadIndex: 0,
      bridgeheads: [] as string[],
      visibleBridgeheads: [] as Bridgehead[],
      context: new ProjectManagerContext(this.projectCode, undefined),
      projectManagerBackendService: new ProjetManagerBackendService(new ProjectManagerContext(this.projectCode, undefined), Site.PROJECT_VIEW_SITE),
      project: undefined as Project | undefined,
      projectTypes: [] as string[],
      outputFormats: [] as string[],
      queryFormats: [] as string[],
      exporterTemplateIds: [] as string[],
      allBridgeheads: [] as string[],
      projectStates: [] as string[],
      dataShieldStatus: undefined as DataShieldProjectStatus | undefined,
      site: Site.PROJECT_VIEW_SITE,
      projectData: {
        projectId: '',
        drn: '',
        date: '',
        status: '',
      },
      notifications: [] as Notification[],
      showNotification: false,
      showProgress: false,
      existsVotum: false,
      existsAuthenticationScript: false,
      existsApplicationForm: false,
      existsScript: false,
      projectConfigurations: [] as string[],
      currentProjectConfiguration: '',
      currentProjectConfigurationFields: [] as string[],
      projectRoles: [] as ProjectRole[],
      steps: ['Project', 'Type', 'Query', 'Output', 'Summary'], // Die einzelnen Schritte des Steppers
      currentStep: 0, // Der aktuelle Schritt, beginnend bei 0
    };
  },
  watch: {
    activeBridgehead(newValue, oldValue) {
      this.activeBridgeheadIndex = this.visibleBridgeheads.findIndex(bridgehead => bridgehead === newValue);
      this.context = new ProjectManagerContext(this.projectCode, newValue.bridgehead);
    },
    context(newValue, oldValue) {
      this.projectManagerBackendService = new ProjetManagerBackendService(newValue, Site.PROJECT_VIEW_SITE);
      this.fetchProject();
    },
    project(newValue, oldValue) {
      this.initializeProjectRelatedData();
    }
  },
  mounted() {
    this.fetchVisibleBridgeheads();
  },


  methods: {
    /*toggleExpand(item: { isExpanded: boolean }) {
      item.isExpanded = !item.isExpanded;
    },*/

    nextStep() {
      if (this.currentStep < this.steps.length - 1) {
        this.currentStep++;
      }
    },
    prevStep() {
      if (this.currentStep > 0) {
        this.currentStep--;
      }
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

    refreshBridgeheadsAndContext() {
      const activeBridgehead = this.activeBridgehead;
      this.fetchVisibleBridgeheads().then(result => {
        if (this.activeBridgehead === activeBridgehead) {
          this.refreshContext();
        }
      })
    },

    refreshContext() {
      this.context = new ProjectManagerContext(this.context.projectCode, this.context.bridgehead);
    },

    async fetchVisibleBridgeheads() {
      try {
        return await this.projectManagerBackendService.fetchData(
            Module.PROJECT_BRIDGEHEAD_MODULE,
            Action.FETCH_VISIBLE_PROJECT_BRIDGEHEADS_ACTION,
            this.context,
            new Map()
        ).then(bridgeheads => {
          this.visibleBridgeheads = bridgeheads;
          this.activeBridgehead = bridgeheads[this.activeBridgeheadIndex];
        });
      } catch (error) {
        console.error('Error loading BridgeheadList:', error);
      }
    },

    async fetchProject() {
      const params = new Map<string, string>();
      // TODO: Control page size
      params.set('page', '' + 0);
      params.set('page-size', '' + 10);
      this.initializeData(Module.PROJECT_BRIDGEHEAD_MODULE, Action.FETCH_PROJECT_ACTION, params, 'project');
    },

    convertDate(date: Date) {
      return format(date, 'yyyy-MM-dd HH:mm:ss')
    },

    initializeProjectRelatedData() {
      if (this.project) {
        this.initializeDataInCallback(Module.PROJECT_BRIDGEHEAD_MODULE, Action.FETCH_PROJECT_BRIDGEHEADS_ACTION, new Map(), (result: Bridgehead[]) => {
          this.bridgeheads = [];
          result.forEach(bridgehead => this.bridgeheads.push(bridgehead.bridgehead));
        });
        this.initializeData(Module.PROJECT_BRIDGEHEAD_MODULE, Action.FETCH_PROJECT_STATES_ACTION, new Map(), 'projectStates');
        this.fetchNotifications();
        this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_PROJECT_TYPES_ACTION, new Map(), 'projectTypes');
        this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_QUERY_FORMATS_ACTION, new Map(), 'queryFormats');
        this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_OUTPUT_FORMATS_ACTION, new Map(), 'outputFormats');
        this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_PROJECT_CONFIGURATIONS_ACTION, new Map(), 'projectConfigurations');
        this.initializeCurrentProjectConfiguration();
        if (this.project.type) {
          const params = new Map<string, string>;
          params.set('project-type', this.project.type)
          this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_EXPORTER_TEMPLATES_ACTION, params, 'exporterTemplateIds');
          if (this.project.type == 'DATASHIELD') {
            this.initializeData(Module.TOKEN_MANAGER_MODULE, Action.FETCH_DATASHIELD_STATUS_ACTION, new Map(), 'dataShieldStatus');
          }
        }
        this.initializeData(Module.PROJECT_BRIDGEHEAD_MODULE, Action.FETCH_ALL_REGISTERED_BRIDGEHEADS_ACTION, new Map(), 'allBridgeheads');
        this.initializeData(Module.PROJECT_DOCUMENTS_MODULE, Action.EXISTS_VOTUM_ACTION, new Map(), 'existsVotum');
        this.initializeData(Module.PROJECT_DOCUMENTS_MODULE, Action.EXISTS_APPLICATION_FORM_ACTION, new Map(), 'existsApplicationForm');
        this.initializeData(Module.PROJECT_DOCUMENTS_MODULE, Action.EXISTS_SCRIPT_ACTION, new Map(), 'existsScript');
        this.initializeData(Module.TOKEN_MANAGER_MODULE, Action.EXISTS_AUTHENTICATION_SCRIPT_ACTION, new Map(), 'existsAuthenticationScript');
        this.initializeData(Module.USER_MODULE, Action.FETCH_PROJECT_ROLES_ACTION, new Map(), 'projectRoles');
      }
    },

    initializeCurrentProjectConfiguration(){
      this.initializeDataInCallback(Module.PROJECT_EDITION_MODULE, Action.FETCH_CURRENT_PROJECT_CONFIGURATION_ACTION, new Map(), (result: Record<string,Project>) => {
        if (result){
          const currentProjectConfigKeys = Object.keys(result);
          if (currentProjectConfigKeys && currentProjectConfigKeys.length > 0){
            this.currentProjectConfiguration = currentProjectConfigKeys[0];
            const currentProjectConfig = result[this.currentProjectConfiguration];
            if (currentProjectConfig){
              this.currentProjectConfigurationFields = Object.keys(currentProjectConfig).filter(key => (currentProjectConfig as any)[key] !== null)
            }
          }
        } else {
          this.currentProjectConfiguration = '';
          this.currentProjectConfigurationFields = [];
        }
      });
    },

    isNotIncludedInCurrentProjectConfiguration(field: string){
      return this.currentProjectConfiguration === 'CUSTOM' || !this.currentProjectConfigurationFields.includes(field);
    },

    fetchNotifications() {
      this.initializeData(Module.NOTIFICATIONS_MODULE, Action.FETCH_NOTIFICATIONS_ACTION, new Map(), 'notifications');
    },

    async initializeData(module: Module, action: Action, params: Map<string, unknown>, dataVariable: string) {
      this.initializeDataInCallback(module, action, params, (result) => (this.$data as any)[dataVariable] = result)
    },

    async initializeDataInCallback(module: Module, action: Action, params: Map<string, unknown>, callback: (result: any) => void) {
      try {
        this.projectManagerBackendService.isModuleActionActive(module, action).then(condition => {
          if (condition) {
            this.projectManagerBackendService.fetchData(module, action, this.context, params)
                .then(result => callback(result));
          }
        })
      } catch (error) {
        console.error('Error calling action ' + action + ' of module ' + module + ':', error);
        throw error;
      }
    }

  },

});


</script>

<style scoped>
.stepper {
  display: flex;
  width:100%;
  justify-content: space-between;
  align-items: center;
}

.stepper-item {
  flex: 1;
  text-align: center;
  padding: 10px;
  border-bottom: 2px solid #ddd;
}

.stepper-item.active {
  font-weight: bold;
  color: #333;
}

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


.custom-width-notifications h2 {
  margin-bottom: 15px;
}

.custom-width-notifications .card {
  margin-bottom: 15px;
}
.button-container {
  display: flex;
  justify-content: flex-end;
  text-align: center;

}

</style>
