<template>
  <div class="main-menu">
    <div v-for="step in getMenuSteps()" class="menu-item" @click="currentMenuStep=step"
         :class="{ 'active': currentMenuStep===step }">
      {{ step }}
    </div>
  </div>
  <div class="main-container">


    <div class="right-container"
         :class="{ 'less-margin': projectRoles && projectRoles.includes(ProjectRole.PROJECT_MANAGER_ADMIN) }">
      <div class="main-content">
        <div class="admin-view">
          <div class="left-container"
               v-if="projectRoles && projectRoles.includes(ProjectRole.PROJECT_MANAGER_ADMIN) && currentMenuStep==='Status'">
            <!--<div class="box-header" style="padding-left:7%"><span>Phase</span></div>-->
            <div class="vertical-stepper">
              <div v-for="(projectState, index) in getProjectStates()" :key="index"
                   class="stepper-step">
                <div style="display: flex; flex-flow: row"
                     :class="{ 'active-step': project?.state === projectState }">
                  <div class="step-circle">
                    <span>{{ index + 1 }}</span>
                  </div>
                  <div class="step-title">{{ projectState }}</div>
                </div>
                <div v-if="index < getProjectStates().length - 1" class="stepper-line"></div>
              </div>
            </div>
          </div>
          <div class="data-container mt-12" style="width:100%;height:auto"
               :style="projectRoles && projectRoles.includes(ProjectRole.PROJECT_MANAGER_ADMIN) ? 'padding:3% 4% 0 5%' : ''">
            <div v-if="project?.state !== ProjectState.DRAFT && currentMenuStep==='Status'"
                 class="info-container">
              <div class="box-header"><span>Status</span></div>

              <div style="padding: 2%">
                <div
                    style="display:flex; flex-flow:row; justify-content: center; margin-bottom:10px;">
                  <div class="card"
                       v-if="visibleBridgeheads && visibleBridgeheads.length === 1"
                       style="padding: 3px 20px;height: fit-content">
                    <div class="card-body" style="padding: 0 0;">
                      <span style="padding: 0 0;">{{ context.bridgehead?.humanReadable }}</span>
                    </div>
                  </div>
                </div>
                <table class="table table-bordered table-overview">
                  <thead>
                  <tr>
                    <th class="status-table-header" scope="col">Title</th>
                    <th class="status-table-header" scope="col">Request ID</th>
                    <th v-if="visibleBridgeheads?.length == 1" class="status-table-header"
                        scope="col">
                      {{ BridgeheadOverviewHeader.VOTUM }}
                    </th>
                    <th
                        v-if="visibleBridgeheads?.length === 1"
                        class="status-table-header"
                        scope="col"
                    >
                      {{ BridgeheadOverviewHeader.TEILER }}
                    </th>
                    <th v-if="visibleBridgeheads?.length == 1" class="status-table-header"
                        scope="col">
                      {{ BridgeheadOverviewHeader.USER_ACCESS }}
                    </th>
                    <th class="status-table-header"
                        v-if="visibleBridgeheads?.length == 1 && dataShieldStatus" scope="col">
                      DataSHIELD Status
                    </th>
                    <th class="status-table-header"
                        v-if="visibleBridgeheads?.length == 1 && hasProjectType(project, ProjectType.RESEARCH_ENVIRONMENT)"
                        scope="col">
                      Files in Research Environment
                    </th>
                    <th v-if="visibleBridgeheads?.length == 1 && currentUser"
                        class="status-table-header" scope="col">
                      {{
                        (hasProjectType(project, ProjectType.DATASHIELD) && project?.state != ProjectState.FINAL) ? 'Script' : 'Results'
                      }}
                      Acceptance
                    </th>
                    <th v-if="visibleBridgeheads?.length == 1" class="status-table-header"
                        scope="col">
                      {{ BridgeheadOverviewHeader.APPLICANT_RESULTS_ACCEPTANCE }}
                    </th>
                    <th v-if="visibleBridgeheads?.length == 1" class="status-table-header"
                        scope="col">
                      {{ BridgeheadOverviewHeader.REPORT_OR_PUBLICATION }}
                    </th>
                    <th class="status-table-header" scope="col">Applicant</th>
                    <th class="status-table-header" scope="col">Created at</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr>
                    <td class="clickable" @click="currentMenuStep='Request'">
                      {{ project ? project.label : '' }}
                    </td>
                    <td>
                      {{ project ? project.code : '' }}
                    </td>
                    <td v-if="visibleBridgeheads?.length == 1">
                      <div>
                        <div v-if="existsVotum" class="states-circle-container">
                          <div class="state_circle green"></div>
                          <DownloadButton
                              :context="context"
                              :project-manager-backend-service="projectManagerBackendService"
                              icon-class="bi bi-download"
                              button-class="download-button"
                              :module="Module.PROJECT_DOCUMENTS_MODULE"
                              :action="Action.DOWNLOAD_VOTUM_ACTION"
                          />
                        </div>
                        <div v-else-if="existsVotumForAllBridgeheads"
                             class="states-circle-container">
                          <div class="state_circle green"></div>
                          <DownloadButton
                              :context="context"
                              :project-manager-backend-service="projectManagerBackendService"
                              icon-class="bi bi-download"
                              button-class="download-button"
                              :module="Module.PROJECT_DOCUMENTS_MODULE"
                              :action="Action.DOWNLOAD_VOTUM_FOR_ALL_BRIDGEHEADS_ACTION"
                          />
                        </div>
                        <div v-else class="states-circle-container">
                          <div class="state_circle red"/>
                        </div>
                      </div>
                    </td>
                    <td v-if="visibleBridgeheads?.length === 1 && activeBridgehead">
                      <div
                          v-for="{ state, types } in mergedQueryStates "
                          :key="state"
                          class="state_circle"
                          :class="state.toLowerCase()"
                          data-toggle="tooltip"
                          data-placement="top"
                          :title="types.join(', ')"
                      ></div>
                    </td>
                    <td v-if="visibleBridgeheads?.length == 1 && activeBridgehead">
                      <div class="state_circle" :class="activeBridgehead?.state?.toLowerCase()"
                           data-toggle="tooltip"
                           data-placement="top" :title="activeBridgehead?.state ?? undefined"></div>
                    </td>
                    <td v-if="visibleBridgeheads?.length == 1 && dataShieldStatus">
                      <div class="state_circle"
                           :class="dataShieldStatus?.project_status.toLowerCase()"
                           data-toggle="tooltip" data-placement="top"
                           :title="dataShieldStatus?.project_status"></div>
                    </td>
                    <td v-if="visibleBridgeheads?.length == 1 && hasProjectType(project, ProjectType.RESEARCH_ENVIRONMENT)">
                      {{ areExportFilesTransferredToResearchEnvironment }}
                    </td>
                    <td v-if="visibleBridgeheads?.length == 1 && activeBridgehead && currentUser">
                      <div class="state_circle" :class="currentUser?.projectState.toLowerCase()"
                           data-toggle="tooltip"
                           data-placement="top" :title="currentUser.projectState"></div>
                    </td>
                    <td v-if="visibleBridgeheads?.length == 1 && activeBridgehead">
                      <div class="state_circle" :class="creatorAcceptance.toLowerCase()"
                           data-toggle="tooltip"
                           data-placement="top" :title="creatorAcceptance ?? undefined"></div>
                    </td>
                    <td v-if="visibleBridgeheads?.length == 1">
                      <div>
                        <div v-if="existsFinalReport || existsPublication" class="states-circle-container">
                          <div class="state_circle green"></div>
                          <DownloadButton
                              :context="context"
                              :project-manager-backend-service="projectManagerBackendService"
                              icon-class="bi bi-download"
                              button-class="download-button"
                              :module="Module.PROJECT_DOCUMENTS_MODULE"
                              :action="(existsPublication) ? Action.DOWNLOAD_PUBLICATION_ACTION : Action.DOWNLOAD_FINAL_REPORT_ACTION"
                          />
                        </div>
                        <div v-else class="states-circle-container">
                          <div class="state_circle created"/>
                        </div>
                      </div>
                    </td>
                    <td style="display:flex;">
                      <UserAndEmail
                          :first-name="project?.creatorName"
                          :email="project?.creatorEmail"
                      />
                    </td>
                    <td>{{
                        project && project.createdAt ? convertDate(project.createdAt) : ''
                      }}
                    </td>
                  </tr>
                  </tbody>
                </table>
                <br/>
                <BridgeheadOverview v-if="visibleBridgeheads.length > 1"
                                    :project-manager-backend-service="projectManagerBackendService"
                                    :call-update-active-bridgehead="updateActiveBridgehead"
                                    :context="context"
                                    :project="project"
                                    :exists-votum-for-all-bridgeheads="existsVotumForAllBridgeheads"
                                    :exists-publication="existsPublication"
                                    :existsFinalReport="existsFinalReport"
                                    :bridgeheads="visibleBridgeheads"
                                    :activeBridgehead="activeBridgehead"/>
              </div>
            </div>
            <div
                v-if="!(project?.state === ProjectState.DRAFT && projectRoles.includes(ProjectRole.CREATOR)) && isAnyButtonVisible && currentMenuStep==='Status'"
                class="project-actions">
              <div class="box-header"><span>Actions</span></div>
              <div style="padding:2%">
                <!-- Project State Module: Creator View -->
                <!-- Project State Module: PM-ADMIN View -->
                <template v-for="(buttonGroup, index) in actionButtons" :key="index">
                  <div v-if="buttonGroups[index]" class="button-group-box">
                    <div class="button-group-label">
                      {{ buttonGroup.label }}
                      <span style="display: flex">
                    <span
                        v-for="(explanationNumber, index3) in getExplanationsForButtonGroup(buttonGroup)"
                        :key="index3" class="todo-circle-small">#{{ explanationNumber }}</span>
                  </span>
                    </div>
                    <div style="display: flex">
                      <ProjectManagerButton v-for="(button, index2) in buttonGroup.button"
                                            :key="index2"
                                            :module="button.module" :action="button.action"
                                            :context="context"
                                            :call-refresh-context="button.refreshContextCallFunction"
                                            :text="button.text"
                                            :button-class="button.cssClass"
                                            :with-message="button.withMessage"
                                            :visibility="button.visibilityCondition"
                                            :do-action-on-click="button.doActionOnClick"
                                            :params="button.params"
                                            :project-manager-backend-service="projectManagerBackendService"/>
                    </div>
                  </div>
                </template>
              </div>
              <div
                  v-if="!existsDraftDialog || draftDialogStepper.currentStep?.id === DialogStep.SUMMARY"
                  class="inviteUser">
                <UserInput :project="project" :context="context"
                           :bridgeheads="visibleBridgeheads"
                           :todos="extendedExplanations"
                           :current-users="currentUsers"
                           :project-manager-backend-service="projectManagerBackendService"
                           :call-refresh-context="refreshContext"
                />
              </div>
            </div>
            <div class="documents"
                 v-if="project?.state === ProjectState.FINAL && (projectRoles.includes(ProjectRole.CREATOR) || projectRoles.includes(ProjectRole.FINAL) || projectRoles.includes(ProjectRole.BRIDGEHEAD_ADMIN)) && currentMenuStep === 'Status'">
              <div class="box-header"><span>Results</span></div>
              <div style="padding: 2%">
                <ResultsBox :call-refresh-context="refreshContext"
                            :project-manager-backend-service="projectManagerBackendService"
                            :current-users="currentUsers"
                            :context="context"
                            :project="project"
                            :project-roles="projectRoles"
                />
              </div>
            </div>
          </div>
        </div>
        <div v-if="currentMenuStep==='Request'" class="data-container mt-12"
             :class="{ 'non-draft': !existsDraftDialog }">
          <div v-if="project">
            <div v-if="!existsDraftDialog" class="box-header"><span>Request</span></div>
            <div class="draft-layout-row">

              <aside v-if="existsDraftDialog" class="vertical-stepper-box">
                <div class="vertical-stepper2">
                  <div v-for="(step, index) in draftDialogStepper.currentSteps" :key="index"
                       class="stepper-step2"
                       :class="{ 'active': draftDialogStepper.currentStep === step, 'missing-fields': hasMissingFieldsInStep(step.displayName) && (draftDialogStepper.currentStep !== step || draftDialogStepper.visitedSteps.size > 1) }"
                  >
                    <div style="display: flex; flex-direction: column; align-items: center; flex-shrink: 0;">
                      <div :class="[
                             'step-circle',
                             index < draftDialogStepper.currentSteps.indexOf(<DialogStep>draftDialogStepper.currentStep) ? 'step-circle--done' :
                             draftDialogStepper.currentStep === step ? 'step-circle--active' : 'step-circle--future'
                           ]"
                           @click="draftDialogStepper.setCurrentStep(step.id)">
                        <span>{{ index < draftDialogStepper.currentSteps.indexOf(draftDialogStepper.currentStep) ? '✓' : index + 1 }}</span>
                      </div>
                      <div v-if="index < draftDialogStepper.currentSteps.length - 1"
                           :class="['stepper-line2', index < draftDialogStepper.currentSteps.indexOf(<DialogStep>draftDialogStepper.currentStep) ? 'stepper-line2--done' : '']">
                      </div>
                    </div>
                    <div class="stepper-step-textbox"
                         @click="draftDialogStepper.setCurrentStep(step.id)"
                         style="padding-top: 4px;">
                      <div class="stepper-step-header">{{ step.displayName }}</div>
                      <div class="stepper-step-desc">{{ step.description }}</div>
                    </div>
                  </div>
                </div>
              </aside>

              <div class="draft-form-card">
                  <div v-if="existsDraftDialog" class="project-field-header">
                    <div class="project-field-title">{{
                        draftDialogStepper.currentStep?.displayName
                      }}
                    </div>
                    <div class="project-field-notification">{{
                        extendedExplanations.get("2")?.message
                      }}
                    </div>
                  </div>
                <div id="draft-dialog-box" class="draft-dialog-content">
                  <div v-if="!existsDraftDialog" class="form-switch-box">
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" role="switch"
                             id="flexSwitchCheckDefault"
                             v-model="editMode" :class="{ 'inactive': !editMode }">
                      <label class="form-check-label" for="flexSwitchCheckDefault">Edit Fields</label>
                    </div>
                  </div>

                  <template v-for="(projectField, index) in projectFields" :key="index">
                    <div
                        v-if="!existsDraftDialog && (index === 0 || projectFields[index - 1]?.category !== projectField.category) && projectField.visibilityCondition && projectField.fieldKey !== 'DescriptionUpload'"
                        class="project-field-header project-field-category-header"
                    >
                      <div class="project-field-title">
                        {{ getDialogStep(projectField.category)?.displayName }}
                      </div>
                      <div class="project-field-notification">
                        {{ getDialogStep(projectField.category)?.description }}
                      </div>
                    </div>
                    <ProjectFieldRow
                        v-if="projectField.visibilityCondition &&
                        (!existsDraftDialog ||
                        projectField.isEditable && draftDialogStepper.currentStep?.id !== DialogStep.SUMMARY ||
                        draftDialogStepper.currentStep?.id === DialogStep.SUMMARY)"
                        :field-key="projectField.fieldKey"
                        :field-value="projectField.fieldValue"
                        :field-description="projectField.fieldDescription"
                        :bridgeheads="projectField.bridgeheads"
                        :action="projectField.action"
                        :module="projectField.module"
                        :edit-project-param="projectField.editProjectParam"
                        :is-editable="projectField.isEditable"
                        :edit-mode="editMode"
                        :redirect-url="projectField.redirectUrl"
                        :transform-for-sending="projectField.transformForSending"
                        :possible-values="projectField.possibleValues"
                        :display-possible-value="projectField.displayPossibleValue"
                        :configurations="projectField.configurations"
                        :exists-file="projectField.existFile"
                        :upload-action="projectField.uploadAction"
                        :download-action="projectField.downloadAction"
                        :download-module="projectField.downloadModule"
                        :todos="extendedExplanations"
                        :visible-bridgeheads="visibleBridgeheads"
                        :mandatory="projectField.mandatory"
                        :type="projectField.type"
                        :section="projectField.section"
                        :call-refresh-context="refreshContext"
                        :extra-params="projectField.extraParams"
                        :delete-action="projectField.deleteAction"
                        :delete-module="projectField.deleteModule"
                        :draft-dialog-current-step="existsDraftDialog ? draftDialogStepper.currentStep : undefined"
                        :context="context"
                        :project-manager-backend-service="projectManagerBackendService"/>
                  </template>
                </div>

                <div v-if="project?.state === ProjectState.DRAFT" class="button-container">
                  <!-- Left: Delete Draft -->
                  <ProjectManagerButton
                      :module="Module.PROJECT_STATE_MODULE"
                      :action="Action.REJECT_PROJECT_ACTION"
                      :context="context" :call-refresh-context="refreshContext"
                      text="Delete Draft"
                      button-class="btn btn-delete-draft"
                      icon-class="bi bi-trash"
                      :with-message="true"
                      :project-manager-backend-service="projectManagerBackendService"/>

                  <!-- Right: step counter + navigation -->
                  <div class="button-nav-right">
                    <span class="step-counter">
                      Step {{ draftDialogStepper.currentSteps.indexOf(draftDialogStepper.currentStep) + 1 }} of {{ draftDialogStepper.currentSteps.length }}
                    </span>
                    <button class="btn btn-nav-back" @click="draftDialogStepper.previousStep()"
                            :disabled="!draftDialogStepper.hasPreviousStep">
                      <i class="bi bi-chevron-left"></i> Back
                    </button>
                    <button v-if="draftDialogStepper.hasNextStep"
                            class="btn btn-nav-continue" @click="draftDialogStepper.nextStep()">
                      Next <i class="bi bi-chevron-right"></i>
                    </button>
                    <ProjectManagerButton v-if="!draftDialogStepper.hasNextStep"
                                          :module="Module.PROJECT_STATE_MODULE"
                                          :action="Action.CREATE_PROJECT_ACTION"
                                          :context="context" :call-refresh-context="refreshContext"
                                          text="Create Request"
                                          button-class="btn btn-create-request"
                                          :with-message="false"
                                          :is-disabled="!hasProjectAllMandatoryFields"
                                          :tooltip-text="tooltipTextForCreateButton"
                                          :project-manager-backend-service="projectManagerBackendService"/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="documents"
             v-if="project?.state === ProjectState.FINISHED && currentMenuStep==='Documents'">
          <div class="box-header">Publications</div>
          <div style="padding: 2%">
            <DocumentsTable :context="context"
                            :project-manager-backend-service="projectManagerBackendService"
                            :download-action="Action.DOWNLOAD_PUBLICATION_ACTION"
                            :fetch-list-action="Action.FETCH_PUBLICATIONS_ACTION"
                            :bridgeheads="visibleBridgeheads" icon-class="bi bi-download"
                            text="Publications: "/>
            <br/>
            <UploadButton :context="context"
                          :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE"
                          :upload-action="Action.UPLOAD_PUBLICATION_ACTION"
                          text="Upload publication" :call-refresh-context="refreshContext"
                          :is-file="true"/>
            <br/>
            <UploadButton :context="context"
                          :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE"
                          :upload-action="Action.ADD_PUBLICATION_URL_ACTION"
                          text="Upload publication URL" :call-refresh-context="refreshContext"
                          :is-file="false"/>
          </div>
          <div class="box-header">Final Reports</div>
          <div style="padding: 2%">
            <DocumentsTable :context="context"
                            :project-manager-backend-service="projectManagerBackendService"
                            :download-action="Action.DOWNLOAD_FINAL_REPORT_ACTION"
                            :fetch-list-action="Action.FETCH_FINAL_REPORTS_ACTION"
                            :bridgeheads="visibleBridgeheads" icon-class="bi bi-download"
                            text="Final Reports: "/>
            <br/>
            <UploadButton :context="context"
                          :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE"
                          :upload-action="Action.UPLOAD_FINAL_REPORT_ACTION"
                          text="Upload final report" :call-refresh-context="refreshContext"
                          :is-file="true"/>
            <br/>
            <UploadButton :context="context"
                          :project-manager-backend-service="projectManagerBackendService"
                          :module="Module.PROJECT_DOCUMENTS_MODULE"
                          :upload-action="Action.ADD_FINAL_REPORT_URL_ACTION"
                          text="Upload final report URL" :call-refresh-context="refreshContext"
                          :is-file="false"/>
          </div>
        </div>
        <div class="documents data-container mt-12" v-if="currentMenuStep==='Documents'" style="padding: 0 4% 0 5%">
          <div class="box-header"><span>Documents</span></div>
          <div style="padding: 2%">
            <DownloadFormTemplatePdfButtons :form-templates="formTemplates" :context="context"
                                            :project-manager-backend-service="projectManagerBackendService"/>
          </div>
          <div style="padding: 2%">
            <div style="display:flex; flex-flow:row;  width:100% ">
              <UploadButton :context="context"
                            :project-manager-backend-service="projectManagerBackendService"
                            :module="Module.PROJECT_DOCUMENTS_MODULE"
                            :upload-action="Action.UPLOAD_OTHER_DOCUMENT_ACTION"
                            text="Upload document" :call-refresh-context="refreshContext"
                            :is-file="true"/>

              <UploadButton :context="context"
                            :project-manager-backend-service="projectManagerBackendService"
                            :module="Module.PROJECT_DOCUMENTS_MODULE"
                            :upload-action="Action.ADD_OTHER_DOCUMENT_URL_ACTION"
                            text="Upload document URL" :call-refresh-context="refreshContext"
                            :is-file="false"/>
            </div>
            <br/>
            <DocumentsTable :context="context"
                            :project-manager-backend-service="projectManagerBackendService"
                            :download-action="Action.DOWNLOAD_OTHER_DOCUMENT_ACTION"
                            :fetch-list-action="Action.FETCH_OTHER_DOCUMENTS_ACTION"
                            :bridgeheads="visibleBridgeheads" icon-class="bi bi-download"
                            text="Other documents: "/>
          </div>
        </div>
      </div>
    </div>


    <div :class="showRightPanel ? 'custom-width-notifications' : 'open-right-panel'">
      <button style="" @click="showRightPanel=true" class="btn" v-if="!showRightPanel"
              data-toggle="tooltip"
              data-placement="top" title="Show ToDos & Notifications">
        <i style="font-size: 20px" class="bi bi-chevron-double-left"></i>
        <!-- Close symbol for Progress -->
      </button>
      <div v-if="showRightPanel">
        <div class="box-header"
             style="display:flex; flex-flow:row; justify-content:space-between;padding-bottom:0;color:black ">
          <div style="display:flex; flex-flow:row;">
            <div class="notification-tab" :class="{ 'active': !showNotification }"
                 @click="toggleNotification">TODO
            </div>
            <div v-if="projectRoles && projectRoles.includes(ProjectRole.PROJECT_MANAGER_ADMIN)"
                 class="notification-tab" :class="{ 'active': showNotification }"
                 @click="toggleNotification">
              Notifications
            </div>
          </div>
          <button style="padding: 0 15px 0 0; margin-bottom: 5px" @click="showRightPanel=false"
                  class="btn"
                  v-if="showRightPanel" data-toggle="tooltip" data-placement="top"
                  title="Hide Panel">
            <i style="font-size: 20px;color:white" class="bi bi-chevron-double-right"></i>
            <!-- Close symbol for Progress -->
          </button>
        </div>

        <NotificationBox :context="context"
                         :project-manager-backend-service="projectManagerBackendService"
                         :show-notification="showNotification"
                         :call-toggle-notification="toggleNotification"
                         :notifications="notifications"
                         :call-update-notifications="fetchNotifications"
                         :show-in-panel="false"
        />

        <div v-if="!showNotification">
          <div v-if="extendedExplanations.size > 0" class="notification-box">
            <div v-for="(explanation, index) in Array.from(extendedExplanations.values())"
                 :key="index"
                 class="card mb-3">
              <div class="card-body">
                <div style="display:flex; flex-flow: row;">
                  <div class="todo-circle"><span>#{{ explanation.number }}</span></div>
                  <h5 class="card-title" v-html="explanation.message"></h5>
                </div>
              </div>
            </div>
          </div>
          <div
              v-else-if="project?.state !== ProjectState.FINISHED && project?.state !== ProjectState.REJECTED && project?.state !== ProjectState.ARCHIVED"
              class="notification-box">
            <div class="card mb-3">
              <div class="card-body">
                <h5 class="card-title">No action is required at the moment. Please wait for the next
                  notification, which
                  will
                  also be sent to you via email.</h5>
              </div>
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
  ActionButton,
  ActionButtonGroup,
  Bridgehead,
  CUSTOM_PROJECT_CONFIGURATION,
  DataShieldProjectStatus,
  EditProjectParam,
  Explanations,
  FormDataType,
  FormField,
  FormTemplate,
  FormTitle,
  getAllProjectTypes,
  getMergedQueryStates,
  hasProjectType,
  hasValidOutputs,
  isQueryOnTheWay,
  Module,
  Notification,
  Project,
  ProjectAndForms,
  ProjectDocument,
  ProjectManagerBackendService,
  ProjectManagerContext,
  ProjectOutput,
  ProjectRole,
  ProjectState,
  ProjectType,
  QueryState,
  Site,
  User,
  UserProjectState
} from "@/services/projectManagerBackendService";
import ProjectManagerButton from "@/components/ProjectManagerButton.vue";
import {format} from "date-fns";
import ProjectFieldRow from "@/components/ProjectFieldRow.vue";
import NotificationBox from "@/components/Notification.vue";
import UserInput from "@/components/UserInput.vue";
import UploadButton from "@/components/UploadButton.vue";
import DocumentsTable from "@/components/DocumentsTable.vue";
import BridgeheadOverview from "@/components/BridgeheadOverview.vue";
import {DialogStep, DialogStepper, FixedDialogStep, FixedDialogSteps} from "@/services/fixedDialogStep";
import ResultsBox from "@/components/ResultsBox.vue";
import '@/assets/styles/state-circle.css'
import UserAndEmail from "@/components/UserAndEmail.vue";
import DownloadButton from "@/components/DownloadButton.vue";
import {AuthService} from "@/services/auth";
import {ActionFunction, ProjectField, Section} from "@/services/utils";
import DownloadFormTemplatePdfButtons from "@/components/DownloadFormTemplatePdfButtons.vue";
import {PollingService} from "@/services/PollingService";
import {BridgeheadOverviewHeader} from "@/services/BridgeheadOverviewHeaders";


export default defineComponent({
  computed: {
    BridgeheadOverviewHeader() {
      return BridgeheadOverviewHeader
    },
    ProjectState() {
      return ProjectState
    },
    DialogStep() {
      return FixedDialogStep
    },
    ProjectRole() {
      return ProjectRole
    },
    EditProjectParam() {
      return EditProjectParam
    },
    Action() {
      return Action
    },
    Module() {
      return Module
    },
    ProjectType() {
      return ProjectType
    }
  },
  props: {
    projectCode: {
      type: String,
      required: true
    }
  },
  components: {
    DownloadFormTemplatePdfButtons,
    DownloadButton,
    UserAndEmail,
    ResultsBox,
    BridgeheadOverview,
    DocumentsTable,
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
      bridgeheads: [] as Bridgehead[],
      visibleBridgeheads: [] as Bridgehead[],
      pollingService: null as PollingService | null,
      context: new ProjectManagerContext(this.projectCode, undefined),
      projectManagerBackendService: new ProjectManagerBackendService(new ProjectManagerContext(this.projectCode, undefined), Site.PROJECT_VIEW_SITE),
      project: undefined as Project | undefined,
      projectTypes: [] as string[],
      outputFormats: {} as Record<ProjectType, string[]>,
      queryFormats: [] as string[],
      exporterTemplateIds: {} as Record<ProjectType, string[]>,
      allBridgeheads: [] as Bridgehead[],
      projectStates: [] as ProjectState[],
      dataShieldStatus: undefined as DataShieldProjectStatus | undefined,
      site: Site.PROJECT_VIEW_SITE,
      notifications: [] as Notification[],
      showNotification: false,
      existsPublication: false,
      existsFinalReport: false,
      showExplanations: true,
      showRightPanel: false,
      existsVotum: false,
      mergedQueryStates: [] as { state: string; types: ProjectType[] }[],
      existsProjectDescription: false,
      existsVotumForAllBridgeheads: false,
      existsAuthenticationScript: false,
      existsScript: false,
      projectConfigurations: new Map<string, ProjectAndForms>(),
      projectConfigurationLabels: [] as string[],
      currentProjectConfiguration: '',
      currentProjectConfigurationFields: [] as string[],
      projectRoles: [] as ProjectRole[],
      draftDialogStepper: new DialogStepper(() => this.updateProjectFields()) as DialogStepper,
      existsDraftDialog: false,
      scriptDescription: {} as ProjectDocument,
      votumDescription: {} as ProjectDocument,
      projectDescription: {} as ProjectDocument,
      votumForAllBridgeheadsDescription: {} as ProjectDocument,
      existInvitedUsers: false,
      areExportFilesTransferredToResearchEnvironment: false,
      explanations: new Map() as Explanations,
      extendedExplanations: new Map() as Explanations,
      buttonGroups: [] as boolean[],
      isAnyButtonVisible: false,
      actionButtons: [] as ActionButtonGroup[],
      currentUser: undefined as User | undefined,
      hasProjectAllMandatoryFields: false,
      tooltipTextForCreateButton: '',
      canShowBridgeheadAdminButtons: false,
      currentUsers: [] as User[],
      creatorAcceptance: UserProjectState.CREATED,
      existsResearchEnvironmentWorkspace: false,
      researchEnvironmentUrl: undefined as string | undefined,
      formTemplates: [] as FormTemplate[],
      formTitles: [] as FormTitle[],
      formFields: [] as FormField[],
      selectedForms: [] as FormTitle[],
      projectFields: [] as ProjectField[],
      groupedMissingFields: {} as Record<string, string[]>,
      currentMenuStep: "Status",
      editMode: false,
      categoryRank: {project: 0, query: 1, services: 2} as Record<string, number>  // order the categories how they should appear in the Request tab (except in DRAFT). not listed categories will be shown after these
    };
  },
  watch: {
    activeBridgehead(newValue, _oldValue) {
      this.activeBridgeheadIndex = this.visibleBridgeheads.findIndex(bridgehead => bridgehead === newValue);
      this.context = new ProjectManagerContext(this.projectCode, newValue);
      this.creatorAcceptance = (this.project?.creatorState) ? this.project.creatorState : UserProjectState.CREATED;
    },
    context(newValue, _oldValue) {
      this.projectManagerBackendService = new ProjectManagerBackendService(newValue, Site.PROJECT_VIEW_SITE);
      this.fetchProject().then(() => {
        if (this.activeBridgehead) {
          this.mergedQueryStates = this.getMergedQueryStates(this.activeBridgehead, getAllProjectTypes(this.project));
        }
      })
    },
    async project() {
      await this.initializeProjectRelatedData();
    },
    'draftDialogStepper.currentStep': function () {
      this.extendedExplanations = this.fetchExtendedExplanations();

      const scrollBox = document.getElementById("draft-dialog-box")

      if (!scrollBox) return
      scrollBox.scrollTop = 0
    },
    existsScript() {
      this.extendedExplanations = this.fetchExtendedExplanations();
    },
    existsAuthenticationScript() {
      this.extendedExplanations = this.fetchExtendedExplanations();
    },
    existsVotum() {
      this.extendedExplanations = this.fetchExtendedExplanations();
    },
    existInvitedUsers() {
      this.extendedExplanations = this.fetchExtendedExplanations();
    },
    currentUser() {
      this.extendedExplanations = this.fetchExtendedExplanations();
    },
    currentProjectConfiguration(newValue, _oldValue) {
      if (newValue !== CUSTOM_PROJECT_CONFIGURATION) {
        this.draftDialogStepper.filterStep(FixedDialogStep.CUSTOM);
      } else {
        this.draftDialogStepper.removeFilteredStep(FixedDialogStep.CUSTOM);
      }
    }
  },

  mounted() {
    this.initializePollingService();
    this.pollingService?.execute();
  },

  beforeUnmount() {
    this.pollingService?.stop();
  },

  methods: {
    hasProjectType,
    getMergedQueryStates,

    toggleNotification() {
      this.showNotification = !this.showNotification;
      this.showExplanations = !this.showNotification;
    },

    initializePollingService() {
      this.pollingService = new PollingService(
          () => this.fetchVisibleBridgeheads(),
          () => this.visibleBridgeheads.some(b =>
              b.executions?.some(e => isQueryOnTheWay(e.queryState))
          ),
          5000
      );
    },

    refreshBridgeheadsAndContext() {
      const activeBridgehead = this.activeBridgehead;
      this.fetchVisibleBridgeheads().then(() => {
        if (this.activeBridgehead === activeBridgehead) {
          this.refreshContext();
        }
        this.pollingService?.execute();
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
      return await this.initializeData(Module.PROJECT_BRIDGEHEAD_MODULE, Action.FETCH_PROJECT_ACTION, params, 'project');
    },

    fetchIfProjectHasAllMandatoryFields(): boolean {
      const baseFieldsValid = Boolean(
          this.project &&
          this.project.label &&
          this.project.query &&
          this.bridgeheads &&
          this.project.queryFormat &&
          hasValidOutputs(this.project)
      );

      // We assume that a boolean mandatory field not set is equal to false — so we ignore it.
      const mandatoryFormFieldsValid = this.formFields
          ?.filter(field => field.type != FormDataType.BOOLEAN && field.mandatory && this.selectedForms.some(ft => ft.title === field.title))
          .every(field => field.value != null && field.value !== '');

      return baseFieldsValid && mandatoryFormFieldsValid;
    },

    fetchTooltipTextForCreateButton() {
      let result = '';

      if (this.project) {
        // ✅ project-level fields stay inline
        result = this.addMissingField(result, 'title', this.project.label);
        result = this.addMissingField(result, 'query', this.project.query);
        result = this.addMissingField(result, 'bridgeheads', this.bridgeheads);
        result = this.addMissingField(result, 'query format', this.project.queryFormat);

        this.project?.outputs?.forEach(o => {
          result = this.addMissingField(
              result,
              `output format (${o.projectType})`,
              o.outputFormat
          );

          result = this.addMissingField(
              result,
              `template id (${o.projectType})`,
              o.templateId
          );
        });

        // 👇 group missing mandatory form fields
        // We assume that a boolean mandatory field not set is equal to false — so we ignore it.
        this.groupedMissingFields = this.formFields
            ?.filter(field => field.type != FormDataType.BOOLEAN && field.mandatory && !field.value && this.selectedForms.some(ft => ft.title === field.title))
            .reduce((acc, field) => {
              const title = field.titleDisplayName ?? field.title;
              const label = field.labelDisplayName ?? field.label;

              if (!acc[title]) acc[title] = [];
              acc[title].push(label);
              return acc;
            }, {} as Record<string, string[]>);

        // Create blocks for each title
        const blocks = Object.entries(this.groupedMissingFields ?? {}).map(
            ([title, fields]) => `<strong>${title}</strong>: ${fields.join(', ')}`
        );

        // If there are blocks, append them with two line-breaks between
        if (blocks.length > 0) {
          result += (result.length > 0 ? '<br><br>' : '') + blocks.join('<br><br>');
        }
      }

      return result.length > 0 ? 'missing fields:<br><br>' + result : result;
    },

    hasMissingFieldsInStep(step: string): boolean {
      if (this.draftDialogStepper.visitedSteps.has(step)) {
        return this.groupedMissingFields[step]?.length > 0;
      }
      return false
    },

    addMissingField(result: string, field: string, value: any): string {
      return (!value) ? result + ((result.length > 0) ? ', ' : '') + field : result;
    },

    convertDate(date: Date) {
      return format(date, 'yyyy-MM-dd HH:mm')
    },

    async initializeProjectRelatedData() {
      if (this.project) {
        this.existsDraftDialog = (this.project.state === ProjectState.DRAFT && AuthService.getEmail() === this.project.creatorEmail);
        await Promise.all([
          this.initializeDataInCallback(Module.PROJECT_BRIDGEHEAD_MODULE, Action.FETCH_PROJECT_BRIDGEHEADS_ACTION, new Map(), async (result: Bridgehead[]) => {
            this.bridgeheads = result;
          }),
          this.initializeData(Module.PROJECT_BRIDGEHEAD_MODULE, Action.FETCH_PROJECT_STATES_ACTION, new Map(), 'projectStates'),
          this.fetchNotifications(),
          this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_PROJECT_TYPES_ACTION, new Map(), 'projectTypes'),
          this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_QUERY_FORMATS_ACTION, new Map(), 'queryFormats'),
          this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_OUTPUT_FORMATS_ACTION, new Map(), 'outputFormats'),
          this.initializeCurrentProjectConfiguration(),
          this.initializeData(Module.PROJECT_BRIDGEHEAD_MODULE, Action.FETCH_ALL_REGISTERED_BRIDGEHEADS_ACTION, new Map(), 'allBridgeheads'),
          this.initializeData(Module.USER_MODULE, Action.EXISTS_RESEARCH_ENVIRONMENT_WORKSPACE_ACTION, new Map(), 'existsResearchEnvironmentWorkspace'),
          this.initializeData(Module.PROJECT_DOCUMENTS_MODULE, Action.EXISTS_PUBLICATION_ACTION, new Map(), 'existsPublication'),
          this.initializeData(Module.PROJECT_DOCUMENTS_MODULE, Action.EXISTS_FINAL_REPORT_ACTION, new Map(), 'existsFinalReport'),
          this.initializeData(Module.USER_MODULE, Action.FETCH_RESEARCH_ENVIRONMENT_URL_ACTION, new Map(), 'researchEnvironmentUrl'),
          this.initializeData(Module.USER_MODULE, Action.FETCH_PROJECT_USERS_ACTION, new Map(), 'currentUsers'),
          this.initializeDataInCallback(Module.PROJECT_DOCUMENTS_MODULE, Action.EXISTS_DESCRIPTION_ACTION, new Map(), async (result: boolean) => {
            this.existsProjectDescription = result;
            if (this.existsProjectDescription) {
              await this.initializeData(Module.PROJECT_DOCUMENTS_MODULE, Action.FETCH_DESCRIPTION_ACTION, new Map(), 'projectDescription');
            } else {
              this.projectDescription = {} as ProjectDocument
            }
          }),
          this.initializeDataInCallback(Module.PROJECT_DOCUMENTS_MODULE, Action.EXISTS_VOTUM_ACTION, new Map(), async (result: boolean) => {
            this.existsVotum = result;
            if (this.existsVotum) {
              await this.initializeData(Module.PROJECT_DOCUMENTS_MODULE, Action.FETCH_VOTUM_DESCRIPTION_ACTION, new Map(), 'votumDescription');
            } else {
              this.votumDescription = {} as ProjectDocument
            }
          }),
          this.initializeDataInCallback(Module.PROJECT_DOCUMENTS_MODULE, Action.EXISTS_VOTUM_FOR_ALL_BRIDGEHEADS_ACTION, new Map(), async (result: boolean) => {
            this.existsVotumForAllBridgeheads = result;
            if (this.existsVotumForAllBridgeheads) {
              await this.initializeData(Module.PROJECT_DOCUMENTS_MODULE, Action.FETCH_VOTUM_FOR_ALL_BRIDGEHEADS_DESCRIPTION_ACTION, new Map(), 'votumForAllBridgeheadsDescription');
            }
          }),
          this.initializeDataInCallback(Module.PROJECT_DOCUMENTS_MODULE, Action.EXISTS_SCRIPT_ACTION, new Map(), async (result: boolean) => {
            this.existsScript = result;
            if (this.existsScript) {
              await this.initializeData(Module.PROJECT_DOCUMENTS_MODULE, Action.FETCH_SCRIPT_DESCRIPTION_ACTION, new Map(), 'scriptDescription');
            }
          }),
          this.initializeData(Module.TOKEN_MANAGER_MODULE, Action.EXISTS_AUTHENTICATION_SCRIPT_ACTION, new Map(), 'existsAuthenticationScript'),
          this.initializeData(Module.USER_MODULE, Action.FETCH_PROJECT_ROLES_ACTION, new Map(), 'projectRoles'),
          this.initializeDataInCallback(Module.USER_MODULE, Action.EXIST_INVITED_USERS_ACTION, new Map(), async result => {
            this.existInvitedUsers = result;
            this.canShowBridgeheadAdminButtons = this.fetchIfCanShowBridgeheadAdminButtons();
          }),
          this.initializeData(Module.USER_MODULE, Action.FETCH_CURRENT_USER_ACTION, new Map(), 'currentUser'),
          this.initializeData(Module.EXPORT_MODULE, Action.ARE_EXPORT_FILES_TRANSFERRED_TO_RESEARCH_ENVIRONMENT_ACTION, new Map(), 'areExportFilesTransferredToResearchEnvironment'),
          this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_BEST_PROJECT_FORM_TEMPLATES_ACTION, new Map(), 'formTemplates'),
          this.initializeDataInCallback(Module.PROJECT_EDITION_MODULE, Action.FETCH_SELECTED_PROJECT_FORMS_ACTION, new Map(), async result => {
            this.selectedForms = result;
            await this.initializeDataInCallback(Module.PROJECT_EDITION_MODULE, Action.FETCH_PROJECT_FORM_FIELDS_ACTION, new Map(), async result => {
              this.addFormFields(result);
            })
          }),
          this.initializeData(Module.PROJECT_EDITION_MODULE, Action.FETCH_EXPORTER_TEMPLATES_ACTION, new Map(), 'exporterTemplateIds')
        ]);
        await this.initializeDataInCallback(Module.PROJECT_EDITION_MODULE, Action.FETCH_PROJECT_CONFIGURATIONS_ACTION, new Map(), async (result: Record<string, ProjectAndForms>) => {

              const shouldHideCustom = this.shouldHideCustomService();
              if (result) {
                this.projectConfigurations = new Map<string, ProjectAndForms>(
                    Object.entries(result).filter(
                        ([key]) => !(shouldHideCustom && key === CUSTOM_PROJECT_CONFIGURATION)
                    )
                );

                this.projectConfigurationLabels = Array.from(
                    this.projectConfigurations.keys()
                );

              } else {
                this.projectConfigurations = new Map();
                this.projectConfigurationLabels = [];
              }
            }
        )
        if (hasProjectType(this.project, ProjectType.DATASHIELD)) {
          await this.initializeData(Module.TOKEN_MANAGER_MODULE, Action.FETCH_DATASHIELD_STATUS_ACTION, new Map(), 'dataShieldStatus');
        }
        this.updateProjectFields()
        this.fetchButtons()
        await this.checkButtonVisibility()
        this.explanations = this.projectManagerBackendService.fetchExplanations();
        this.extendedExplanations = this.fetchExtendedExplanations();
        this.project?.state === ProjectState.DRAFT && this.currentMenuStep === "Status" ? this.currentMenuStep = "Request" : {}
      }
    },

    /**
     * Determines whether the "custom service" option should be hidden.
     *
     * Business rules:
     *
     * - Admin users can always see and select the custom service.
     *
     * - For non-admin users:
     *   - If `isCustomConfigSelected` is `undefined`, the custom option must be hidden.
     *     → This means no explicit decision has been made yet, so custom is not allowed.
     *
     *   - If `isCustomConfigSelected === true`, the custom option is visible.
     *     → An admin has explicitly enabled or selected a custom configuration before.
     *
     *   - If `isCustomConfigSelected === false`, the custom option is only visible
     *     if the current configuration no longer matches any predefined service
     *     (i.e., it has effectively become "custom" due to user modifications).
     *
     * In short:
     * - `undefined` → never show (for non-admins)
     * - `false` → show only if config became custom
     * - `true` → always show
     */
    shouldHideCustomService() {
      const isAdmin = this.projectRoles.includes(ProjectRole.PROJECT_MANAGER_ADMIN);
      const customFlag = this.project?.isCustomConfigSelected;

      return !isAdmin &&
          (customFlag === undefined || (!customFlag && this.currentProjectConfiguration !== CUSTOM_PROJECT_CONFIGURATION));
    },

    updateProjectFields() {
      if (this.project) {
        this.projectFields = this.fetchProjectFields();
      }
    },

    addFormFields(formFieldArray: FormField[]): void {
      this.formFields = formFieldArray;
      this.formTitles = [];

      const seenTitles = new Set<string>(); // <-- move outside the loop

      for (const field of formFieldArray) {
        const key = field.title;

        // ---- Titles list ----
        if (!seenTitles.has(key)) {
          seenTitles.add(key);

          this.formTitles.push({
            title: field.title,
            titleDisplayName: field.titleDisplayName,
            titleDescription: field.titleDescription,
          });
        }

        this.hasProjectAllMandatoryFields = this.fetchIfProjectHasAllMandatoryFields();
        this.tooltipTextForCreateButton = this.fetchTooltipTextForCreateButton();
      }
      if (!this.draftDialogStepper.hasSameFormTitles(this.selectedForms)) {
        this.draftDialogStepper.resetFormTitles();
        this.draftDialogStepper.addFormTitles(this.selectedForms);
      }
    },

    async fetchNotifications() {
      return this.initializeData(Module.NOTIFICATIONS_MODULE, Action.FETCH_NOTIFICATIONS_ACTION, new Map(), 'notifications');
    },

    async initializeCurrentProjectConfiguration(): Promise<void> {
      return new Promise((resolve, reject) => {
        this.initializeDataInCallback(
            Module.PROJECT_EDITION_MODULE,
            Action.FETCH_CURRENT_PROJECT_CONFIGURATION_ACTION,
            new Map(),
            async (result: Record<string, ProjectAndForms>) => {

              if (result) {
                const keys = Object.keys(result);
                if (keys.length > 0) {
                  this.currentProjectConfiguration = keys[0];
                  const currentProjectConfig = result[this.currentProjectConfiguration];
                  const project = currentProjectConfig?.project;

                  this.currentProjectConfigurationFields = project
                      ? [
                        ...Object.keys(project).filter(
                            key => key !== 'outputs' && (project as any)[key] !== null
                        ),
                        ...(project.outputs ?? []).flatMap(output => {
                          const prefix = output.projectType;
                          return [
                            `${prefix}.projectType`,
                            ...(output.outputFormat ? [`${prefix}.outputFormat`] : []),
                            ...(output.templateId ? [`${prefix}.templateId`] : [])
                          ];
                        })
                      ]
                      : [];

                  this.formFields = currentProjectConfig?.formFields ?? [];
                } else {
                  this.resetCurrentProjectConfiguration();
                }
              } else {
                this.resetCurrentProjectConfiguration();
              }

              resolve();
            }
        )
            .then(() => {
              // IMPORTANT: this runs even if condition === false
              resolve();
            })
            .catch(reject);
      });
    },

    resetCurrentProjectConfiguration() {
      this.currentProjectConfiguration = '';
      this.currentProjectConfigurationFields = [];
      this.formFields = [];
    },

    isNotIncludedInCurrentProjectConfiguration(field: string) {
      return this.currentProjectConfiguration === CUSTOM_PROJECT_CONFIGURATION || this.currentProjectConfigurationFields.includes(field);
    },

    async initializeData(module: Module, action: Action, params: Map<string, unknown>, dataVariable: string): Promise<any> {
      return this.initializeDataInCallback(module, action, params, async (result) => {
        (this.$data as any)[dataVariable] = result;
      });
    },

    async initializeDataInCallback(module: Module, action: Action, params: Map<string, unknown>, callback: (result: any) => Promise<any>) {
      try {
        const condition = await this.projectManagerBackendService.isModuleActionActive(module, action);
        if (condition) {
          const result = await this.projectManagerBackendService.fetchData(module, action, this.context, params);
          await callback(result); // Await the callback to handle any async operations inside it
        }
      } catch (error: any) {
        if (error.response && error.response.status === 404) {
          console.warn(`Error 404: Resource not found for action '${action}' of module '${module}'`);
        } else {
          console.error(`Error calling action '${action}' of module '${module}':`, error);
          throw error; // Re-throw the error if it's not a 404
        }
      }
    },

    updateActiveBridgehead(bridgehead: Bridgehead) {
      this.activeBridgehead = bridgehead;
    },

    fetchIfCanShowBridgeheadAdminButtons(): boolean {
      return (this.project && (this.project.state == ProjectState.DEVELOP || this.project.state == ProjectState.PILOT)) ? this.existInvitedUsers : true;
    },
    buildDynamicProjectFieldsFromFormFields(formFields: FormField[]): ProjectField[] {
      return formFields.map((formField, index) => ({
        fieldKey: formField.labelDisplayName ?? formField.label,
        fieldValue: formField.value != null ? [formField.value] : [],
        editProjectParam: [EditProjectParam.FORM_FIELDS],
        mandatory: formField.mandatory,
        fieldDescription: formField.labelDescription,
        type: formField.type,
        isEditable: true,
        editMode: this.editMode,
        possibleValues: formField.allowedValues?.map(value => value.label),
        displayPossibleValue: formField.allowedValues?.length
            ? (label: string) => {
              const field = formField.allowedValues!.find(v => v.label === label)
              return {name: field?.displayName ?? label, description: field?.description ?? ""}
            }
            : undefined,
        action: Action.EDIT_PROJECT_FORM_FIELDS_ACTION,
        transformForSending: this.buildTransformForSendingFormField(formField),
        category: formField.title,
        visibilityCondition:
            this.selectedForms.some(f => f.title === formField.title) && // only if the field is already selected
            (!this.existsDraftDialog ||
                this.draftDialogStepper.currentStep?.id === formField.title ||
                this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY),

        section: new Section(formFields, index)
      }));
    },

    buildDynamicProjectFieldsFromFormTitles(formTitles: FormTitle[]): ProjectField[] {
      return formTitles.map((formTitle) => ({
        fieldKey: formTitle.titleDisplayName ?? formTitle.title,
        fieldValue: [this.selectedForms.some(f => f.title === formTitle.title) ? "true" : "false"],
        editProjectParam: [EditProjectParam.FORM_TITLE],
        mandatory: false,
        fieldDescription: formTitle.titleDescription,
        type: FormDataType.BOOLEAN,
        isEditable: true,
        editMode: this.editMode,
        action: new ActionFunction((input: string[]) => {
          if (input && input.length > 0 && input[0] === "false") {
            return Action.REMOVE_SELECTED_PROJECT_FORM_ACTION;
          } else {
            return Action.ADD_SELECTED_PROJECT_FORM_ACTION;
          }
        }),
        transformForSending: () => formTitle.title,
        category: FixedDialogStep.CUSTOM,
        visibilityCondition:
            !this.existsDraftDialog ||
            this.draftDialogStepper.currentStep?.id === FixedDialogStep.CUSTOM ||
            this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY
      }));
    },

    buildTransformForSendingFormField(formField: FormField): (input: string) => any {
      return (input: string) => {
        return [{
          title: formField.title,
          label: formField.label,
          value: input
        }];
      };
    },

    getProjectStates(): ProjectState[] {
      let visibleProjectStates: ProjectState[] = this.projectStates.slice();
      if (this.projectStates.length > 0) {
        if (this.project?.state === 'REJECTED') {
          visibleProjectStates = visibleProjectStates.filter(item => ![ProjectState.FINISHED, ProjectState.ARCHIVED].includes(item));
        } else {
          if (this.project?.state === 'ARCHIVED') {
            visibleProjectStates = visibleProjectStates.filter(item => ![ProjectState.FINISHED, ProjectState.REJECTED].includes(item));
          } else {
            visibleProjectStates = visibleProjectStates.filter(item => ![ProjectState.ARCHIVED, ProjectState.REJECTED].includes(item));
          }
        }
      }
      return visibleProjectStates
    },

    fetchExtendedExplanations(): Explanations {
      const extendedExplanations = new Map(this.explanations)
      if (this.existsVotum) {
        this.removeActionExplanation(Action.UPLOAD_VOTUM_ACTION, extendedExplanations);
      } else {
        this.removeActionExplanation(Action.DOWNLOAD_VOTUM_ACTION, extendedExplanations);
      }
      if (this.existsScript) {
        this.removeActionExplanation(Action.UPLOAD_SCRIPT_ACTION, extendedExplanations);
      } else {
        this.removeActionExplanation(Action.DOWNLOAD_SCRIPT_ACTION, extendedExplanations);
        this.removeActionExplanation(Action.ACCEPT_SCRIPT_ACTION, extendedExplanations);
        this.removeActionExplanation(Action.REJECT_SCRIPT_ACTION, extendedExplanations);
        this.removeActionExplanation(Action.REQUEST_SCRIPT_CHANGES_ACTION, extendedExplanations);
      }
      if (!this.currentUser) {
        this.removeActionExplanation(Action.DOWNLOAD_SCRIPT_ACTION, extendedExplanations);
      }
      if (!this.existsAuthenticationScript) {
        this.removeActionExplanation(Action.DOWNLOAD_AUTHENTICATION_SCRIPT_ACTION, extendedExplanations);
      }
      if (this.projectRoles?.includes(ProjectRole.BRIDGEHEAD_ADMIN)) {
        if (!this.canShowBridgeheadAdminButtons) {
          this.removeActionExplanation(Action.ACCEPT_BRIDGEHEAD_PROJECT_ACTION, extendedExplanations);
          this.removeActionExplanation(Action.REJECT_BRIDGEHEAD_PROJECT_ACTION, extendedExplanations);
          this.removeActionExplanation(Action.REQUEST_CHANGES_IN_PROJECT_ACTION, extendedExplanations);
          this.removeActionExplanation(Action.SAVE_QUERY_IN_BRIDGEHEAD_ACTION, extendedExplanations);
          this.removeActionExplanation(Action.SAVE_AND_EXECUTE_QUERY_IN_BRIDGEHEAD_ACTION, extendedExplanations);
          this.removeActionExplanation(Action.SEND_EXPORT_FILES_TO_RESEARCH_ENVIRONMENT_ACTION, extendedExplanations);
          this.removeActionExplanation(Action.SET_DEVELOPER_USER_ACTION, extendedExplanations);
          this.removeActionExplanation(Action.SET_PILOT_USER_ACTION, extendedExplanations);
          this.removeActionExplanation(Action.SET_FINAL_USER_ACTION, extendedExplanations);
        }
      }
      if (!this.existInvitedUsers && !this.projectRoles?.includes(ProjectRole.PROJECT_MANAGER_ADMIN)) {
        this.removeActionExplanation(Action.SET_DEVELOPER_USER_ACTION, extendedExplanations);
        this.removeActionExplanation(Action.SET_PILOT_USER_ACTION, extendedExplanations);
        this.removeActionExplanation(Action.SET_FINAL_USER_ACTION, extendedExplanations);
      }
      let count = extendedExplanations.size + 1;
      if (this.existsDraftDialog) {
        if (this.draftDialogStepper.currentStep?.id === FixedDialogStep.PROJECT) { // Project
          extendedExplanations.set(count.toString(), {
            number: count,
            message: "Please provide information about your project"
          });
          count++;
        } else if (this.draftDialogStepper.currentStep?.id === FixedDialogStep.SERVICES) { // Services
          extendedExplanations.set(count.toString(), {
            number: count,
            message: "Please provide information on the resources you are requesting."
          });
          count++;
        } else if (this.draftDialogStepper.currentStep?.id === FixedDialogStep.QUERY && !this.project?.query) { // Query
          extendedExplanations.set(count.toString(), {
            number: count,
            message: "Please set the query and specify the query format if they have not been previously configured in the Federated Explorer."
          });
          count++;
        } else if (this.draftDialogStepper.currentStep?.id === FixedDialogStep.CUSTOM && !hasValidOutputs(this.project)) { // Output
          extendedExplanations.set(count.toString(), {
            number: count,
            message: "Please select the output format and the template ID for the Teiler Exporter. For advanced configuration of the template, please add the necessary environment variables."
          });
          count++;
        } else if (this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY) { // Summary
          extendedExplanations.set(count.toString(), {
            number: count,
            message: "Please check all of the fields in the summary and click 'Create' if everything seems OK."
          });
          count++;
          if (this.tooltipTextForCreateButton?.length > 0) {
            extendedExplanations.set(count.toString(), {
              number: count,
              message: 'To proceed with creating the project, kindly fill in the following ' + this.tooltipTextForCreateButton
            });
            count++;
          }
        }
      }
      if (this.projectRoles?.includes(ProjectRole.BRIDGEHEAD_ADMIN) && this.activeBridgehead?.executions) {
        const pendingTypes = this.activeBridgehead.executions
            .filter(exec => ![QueryState.CREATED, QueryState.FINISHED, QueryState.ERROR].includes(exec.queryState))
            .map(exec => exec.projectType);

        if (pendingTypes.length) {
          extendedExplanations.set(count.toString(), {
            number: count,
            message: `Please access the Teiler for project types "${pendingTypes.join(", ")}", review the queries, and execute them. Note that the queries may take some time to arrive at the Teiler. Once execution is complete, return here for further instructions.`
          });
          count++;
        }
      }
      return extendedExplanations
    },

    removeActionExplanation(action: Action, explanations: Explanations) {
      const explanation = explanations.get(action);
      if (explanation) {
        const explanationNumber = explanation.number;
        explanations.delete(action);
        explanations.forEach((value, _key) => {
          if (value.number > explanationNumber) {
            value.number--;
          }
        })
      }
    },

    getExplanationsForButtonGroup(buttonGroup: ActionButtonGroup): number[] {
      return buttonGroup.button?.map((button) => this.explanations?.get(button.action)?.number).filter((number): number is number => number !== undefined) || []
    },

    goToResearchEnvironment() {
      if (this.researchEnvironmentUrl) {
        window.open(this.researchEnvironmentUrl, '_blank');
      }
    },

    fetchExtraParamsForProjectOutput(currentEditProjectParam: EditProjectParam, output: ProjectOutput) {
      let result = new Map<string, string>();
      if (currentEditProjectParam === EditProjectParam.PROJECT_TYPE) {
        if (output.outputFormat) {
          result.set(EditProjectParam.OUTPUT_FORMAT, output.outputFormat);
        }
        if (output.templateId) {
          result.set(EditProjectParam.TEMPLATE_ID, output.templateId);
        }
      } else if (currentEditProjectParam === EditProjectParam.OUTPUT_FORMAT) {
        if (output.projectType) {
          result.set(EditProjectParam.PROJECT_TYPE, output.projectType);
        }
        if (output.templateId) {
          result.set(EditProjectParam.TEMPLATE_ID, output.templateId);
        }
      } else if (currentEditProjectParam === EditProjectParam.TEMPLATE_ID) {
        if (output.projectType) {
          result.set(EditProjectParam.PROJECT_TYPE, output.projectType);
        }
        if (output.outputFormat) {
          result.set(EditProjectParam.OUTPUT_FORMAT, output.outputFormat);
        }
      }
      return result;
    },

    fetchProjectOutputFields(): ProjectField[] {
      const outputs: ProjectOutput[] =
          this.project?.outputs?.length
              ? this.project.outputs
              : [{projectType: ProjectType.EXPORT} as ProjectOutput];

      return outputs.flatMap(exec => [
        {
          fieldKey: "Type",
          fieldValue: exec.projectType ? [exec.projectType] : [],
          editProjectParam: [EditProjectParam.PROJECT_TYPE],
          isEditable: this.isNotIncludedInCurrentProjectConfiguration(exec.projectType + '.projectType'),
          editMode: this.editMode,
          possibleValues: this.projectTypes,
          displayPossibleValue: (label: string) => {
            return {name: label, description: ""}
          },
          mandatory: true,
          category: FixedDialogStep.CUSTOM,
          visibilityCondition:
              !this.existsDraftDialog ||
              this.draftDialogStepper.currentStep?.id === FixedDialogStep.CUSTOM ||
              this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY,
          extraParams: this.fetchExtraParamsForProjectOutput(EditProjectParam.PROJECT_TYPE, exec),
          deleteAction: Action.REMOVE_PROJECT_OUTPUT_ACTION,
          deleteModule: Module.PROJECT_EDITION_MODULE
        },
        {
          fieldKey: `Output Format (${exec.projectType})`,
          fieldValue: exec.outputFormat ? [exec.outputFormat] : [],
          editProjectParam: [EditProjectParam.OUTPUT_FORMAT],
          isEditable: this.isNotIncludedInCurrentProjectConfiguration(exec.projectType + '.outputFormat'),
          editMode: this.editMode,
          possibleValues: this.outputFormats[exec.projectType] ?? [],
          displayPossibleValue: (label: string) => {
            return {name: label, description: ""}
          },
          mandatory: true,
          category: FixedDialogStep.CUSTOM,
          visibilityCondition:
              !this.existsDraftDialog ||
              this.draftDialogStepper.currentStep?.id === FixedDialogStep.CUSTOM ||
              this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY,
          extraParams: this.fetchExtraParamsForProjectOutput(EditProjectParam.OUTPUT_FORMAT, exec)
        },
        {
          fieldKey: `Template ID (${exec.projectType})`,
          fieldValue: exec.templateId ? [exec.templateId] : [],
          editProjectParam: [EditProjectParam.TEMPLATE_ID],
          isEditable: this.isNotIncludedInCurrentProjectConfiguration(exec.projectType + '.templateId'),
          editMode: this.editMode,
          possibleValues: this.exporterTemplateIds[exec.projectType] ?? [],
          displayPossibleValue: (label: string) => {
            return {name: label, description: ""}
          },
          mandatory: true,
          category: FixedDialogStep.CUSTOM,
          visibilityCondition:
              !this.existsDraftDialog ||
              this.draftDialogStepper.currentStep?.id === FixedDialogStep.CUSTOM ||
              this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY,
          extraParams: this.fetchExtraParamsForProjectOutput(EditProjectParam.TEMPLATE_ID, exec)
        }
      ]);
    },

    fetchProjectFields(): ProjectField[] {
      const fixedFields: ProjectField[] = [
        {
          fieldKey: "Title",
          fieldValue: this.project?.label ? [this.project.label] : [],
          editProjectParam: [EditProjectParam.LABEL],
          fieldDescription: "Please provide a title for your project.",
          isEditable: true,
          editMode: this.editMode,
          mandatory: true,
          category: FixedDialogStep.PROJECT,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogStepper.currentStep?.id === FixedDialogStep.PROJECT || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY
        },
        {
          fieldKey: "Description",
          fieldValue: this.project?.description ? [this.project.description] : [],
          editProjectParam: [EditProjectParam.DESCRIPTION],
          fieldDescription: "Briefly describe your project in a few words. What is the objective or aim of your project?",
          isEditable: true,
          editMode: this.editMode,
          mandatory: true,
          category: FixedDialogStep.PROJECT,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogStepper.currentStep?.id === FixedDialogStep.PROJECT || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY
        },
        {
          fieldKey: "DescriptionUpload",
          fieldValue: [this.projectDescription?.label, this.projectDescription?.originalFilename],
          isEditable: true,
          editMode: this.editMode,
          existFile: this.existsProjectDescription,
          uploadAction: this.Action.UPLOAD_DESCRIPTION_ACTION,
          downloadAction: this.Action.DOWNLOAD_DESCRIPTION_ACTION,
          downloadModule: this.Module.PROJECT_DOCUMENTS_MODULE,
          category: FixedDialogStep.PROJECT,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogStepper.currentStep?.id === FixedDialogStep.PROJECT || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY
        },
        {
          fieldKey: "Sites",
          fieldValue: [],
          bridgeheads: {
            selected: this.bridgeheads,
            available: this.allBridgeheads,
          },
          editProjectParam: [EditProjectParam.BRIDGEHEADS],
          isEditable: true,
          editMode: this.editMode,
          mandatory: true,
          redirectUrl: this.project?.explorerUrl ?? undefined,
          category: FixedDialogStep.PROJECT,
          transformForSending: (humanReadable: string) => this.allBridgeheads.find(bridgehead => bridgehead.humanReadable === humanReadable)?.bridgehead || humanReadable,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogStepper.currentStep?.id === FixedDialogStep.PROJECT || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY
        },
        {
          fieldKey: "Configuration",
          fieldValue: [this.currentProjectConfiguration],
          editProjectParam: [EditProjectParam.PROJECT_CONFIGURATION],
          isEditable: true,
          editMode: this.editMode,
          possibleValues: this.projectConfigurationLabels,
          configurations: this.projectConfigurations,
          category: FixedDialogStep.SERVICES,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SERVICES || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY,
          action: Action.SET_PROJECT_CONFIGURATION_ACTION
        },
        {
          fieldKey: "Query",
          fieldValue: [this.project?.humanReadable ? this.project?.humanReadable : "", this.project?.query ? this.project?.query : "", this.project?.queryDetails ? this.project?.queryDetails : ""],
          editProjectParam: [EditProjectParam.HUMAN_READABLE],
          isEditable: true,
          editMode: this.editMode,
          mandatory: true,
          redirectUrl: this.project?.explorerUrl ?? undefined,
          category: FixedDialogStep.QUERY,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogStepper.currentStep?.id === FixedDialogStep.QUERY || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY
        },
        {
          fieldKey: "Query Format",
          fieldValue: this.project?.queryFormat ? [this.project.queryFormat] : [],
          editProjectParam: [EditProjectParam.QUERY_FORMAT],
          isEditable: true,
          editMode: this.editMode,
          redirectUrl: this.project?.explorerUrl ?? undefined,
          possibleValues: this.queryFormats,
          displayPossibleValue: (label: string) => {
            return {name: label, description: ""}
          },
          mandatory: true,
          category: FixedDialogStep.QUERY,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY
        },
        {
          fieldKey: "Cohort Definition",
          fieldDescription: "Please briefly list the parameters that determine your requested cohort",
          fieldValue: this.project?.cohortDefinition ? [this.project.cohortDefinition] : [],
          editProjectParam: [EditProjectParam.COHORT_DEFINITION],
          isEditable: true,
          editMode: this.editMode,
          category: FixedDialogStep.QUERY,
          visibilityCondition: !this.existsDraftDialog || this.draftDialogStepper.currentStep?.id === FixedDialogStep.QUERY || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY
        },
        ...this.fetchProjectOutputFields(),
        {
          fieldKey: "Environment Variables",
          fieldValue: this.project?.queryContext ? [this.project.queryContext] : [],
          editProjectParam: [EditProjectParam.QUERY_CONTEXT],
          isEditable: this.isNotIncludedInCurrentProjectConfiguration('queryContext'),
          editMode: this.editMode,
          category: FixedDialogStep.CUSTOM,
          visibilityCondition: !this.existsDraftDialog || this.currentProjectConfiguration === CUSTOM_PROJECT_CONFIGURATION && this.draftDialogStepper.currentStep?.id === FixedDialogStep.CUSTOM || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY
        },
        {
          fieldKey: "Votum",
          fieldValue: [this.votumDescription.label, this.votumDescription.originalFilename],
          isEditable: true,
          editMode: this.editMode,
          existFile: this.existsVotum,
          uploadAction: this.Action.UPLOAD_VOTUM_ACTION,
          downloadAction: this.Action.DOWNLOAD_VOTUM_ACTION,
          downloadModule: this.Module.PROJECT_DOCUMENTS_MODULE,
          category: "Votum",
          visibilityCondition: this.project?.state !== ProjectState.DRAFT && (!this.existsDraftDialog || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY)
        },
        {
          fieldKey: "Votum for all bridgeheads",
          fieldValue: [this.votumForAllBridgeheadsDescription.label, this.votumForAllBridgeheadsDescription.originalFilename],
          isEditable: true,
          editMode: this.editMode,
          existFile: this.existsVotumForAllBridgeheads,
          uploadAction: this.Action.UPLOAD_VOTUM_FOR_ALL_BRIDGEHEADS_ACTION,
          downloadAction: this.Action.DOWNLOAD_VOTUM_FOR_ALL_BRIDGEHEADS_ACTION,
          downloadModule: this.Module.PROJECT_DOCUMENTS_MODULE,
          category: "Votum",
          visibilityCondition: this.project?.state !== ProjectState.DRAFT && (!this.existsDraftDialog || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY)
        },
        {
          fieldKey: "Script",
          fieldValue: [this.scriptDescription.label, this.scriptDescription.originalFilename],
          isEditable: true,
          editMode: this.editMode,
          existFile: this.existsScript,
          uploadAction: this.Action.UPLOAD_SCRIPT_ACTION,
          downloadAction: this.Action.DOWNLOAD_SCRIPT_ACTION,
          downloadModule: this.Module.PROJECT_DOCUMENTS_MODULE,
          category: "Script",
          visibilityCondition: !!this.dataShieldStatus && (!this.existsDraftDialog || this.draftDialogStepper.currentStep?.id === FixedDialogStep.SUMMARY)
        },
        {
          fieldKey: "Authentication Script",
          fieldValue: [],
          isEditable: false,
          editMode: this.editMode,
          existFile: this.existsAuthenticationScript,
          downloadAction: this.Action.DOWNLOAD_AUTHENTICATION_SCRIPT_ACTION,
          downloadModule: this.Module.TOKEN_MANAGER_MODULE,
          category: "Script",
          visibilityCondition: !!this.dataShieldStatus && this.dataShieldStatus.project_status === 'WITH_DATA' && this.existsAuthenticationScript
        }
      ];
      const dynamicFields = this.buildDynamicProjectFieldsFromFormFields(this.formFields);
      const dynamicSelectedForms = this.buildDynamicProjectFieldsFromFormTitles(
          this.formTitles.filter(formTitle => {
            this.draftDialogStepper.hasCurrentStep(formTitle.title)
          }));
      return [...fixedFields, ...dynamicSelectedForms, ...dynamicFields].sort((a, b) =>
          (this.categoryRank[a.category.toLowerCase()] ?? 999) - (this.categoryRank[b.category.toLowerCase()] ?? 999));
    },

    fetchButtons(): void {

      const executions = this.activeBridgehead?.executions ?? [];

      // Collect unique project types
      const projectTypes = [...new Set(executions.map(exec => exec.projectType))];
      const projectTypesParam = projectTypes.join(",");

      // Determine button text
      const hasFinishedExecution = executions.some(exec => exec.queryState === "FINISHED");

      // Check if RESEARCH_ENVIRONMENT exists
      const hasResearchEnvironment = projectTypes.includes(ProjectType.RESEARCH_ENVIRONMENT);

      const teilerButtonGroups = [
        // --- TEILER GROUP (always if executions exist) ---
        ...(executions.length > 0
            ? [{
              label: "Teiler",
              button: [
                {
                  module: Module.EXPORT_MODULE,
                  action: Action.SAVE_QUERY_IN_BRIDGEHEAD_ACTION,
                  refreshContextCallFunction: this.refreshBridgeheadsAndContext as () => void,
                  text: hasFinishedExecution ? "Resend Query" : "Send Query",
                  withMessage: false,
                  cssClass: "btn btn-primary mr-2",
                  params: new Map<string, string>([
                    [EditProjectParam.PROJECT_TYPE, projectTypesParam]
                  ]),
                  visibilityCondition: this.canShowBridgeheadAdminButtons
                }
              ] as ActionButton[]
            }]
            : []),

        // --- RESEARCH ENVIRONMENT GROUP (only if present) ---
        ...(hasResearchEnvironment
            ? [{
              label: "Research Environment",
              button: [
                {
                  module: Module.EXPORT_MODULE,
                  action: Action.SEND_EXPORT_FILES_TO_RESEARCH_ENVIRONMENT_ACTION,
                  refreshContextCallFunction: this.refreshContext as () => void,
                  text: "Resend Export Files to Research Environment",
                  withMessage: false,
                  params: new Map<string, string>([
                    [EditProjectParam.PROJECT_TYPE, ProjectType.RESEARCH_ENVIRONMENT]
                  ]),
                  cssClass: "btn btn-primary mr-2"
                }
              ] as ActionButton[]
            }]
            : [])
      ];

      this.actionButtons = [
        {
          label: "Project",
          button: [
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.ACCEPT_PROJECT_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Accept", withMessage: false, cssClass: "btn btn-primary mr-2"
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.REJECT_PROJECT_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Reject", withMessage: true, cssClass: "btn btn-danger btn-secondary mr-2",
              visibilityCondition: this.project?.state !== ProjectState.DRAFT
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.FINISH_PROJECT_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Finish", withMessage: false, cssClass: "btn btn-primary mr-2"
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.ARCHIVE_PROJECT_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Archive", withMessage: true, cssClass: "btn btn-secondary"
            }
          ] as ActionButton[]
        },
        {
          label: "Phase",
          button: [
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.START_DEVELOP_STAGE_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Start Develop Phase", withMessage: false, cssClass: "btn btn-primary mr-2"
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.START_PILOT_STAGE_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Start Pilot Phase", withMessage: false, cssClass: "btn btn-primary mr-2"
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.START_FINAL_STAGE_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Start Final Phase", withMessage: false, cssClass: "btn btn-primary mr-2"
            }
          ] as ActionButton[]
        },
        {
          label: "User Access",
          button: [
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.ACCEPT_BRIDGEHEAD_PROJECT_ACTION,
              refreshContextCallFunction: this.refreshBridgeheadsAndContext as () => void,
              text: "Authorize", withMessage: false, cssClass: "btn btn-primary mr-2",
              visibilityCondition: this.activeBridgehead?.state !== 'ACCEPTED' && this.canShowBridgeheadAdminButtons
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.REJECT_BRIDGEHEAD_PROJECT_ACTION,
              refreshContextCallFunction: this.refreshBridgeheadsAndContext as () => void,
              text: "Revoke", withMessage: true, cssClass: "btn btn-danger btn-secondary mr-2",
              visibilityCondition: this.activeBridgehead?.state !== 'REJECTED' && this.canShowBridgeheadAdminButtons
            }
          ] as ActionButton[]
        },
        {
          label: "Script",
          button: [
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.ACCEPT_SCRIPT_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Accept", withMessage: false, cssClass: "btn btn-primary mr-2",
              visibilityCondition: this.currentUser?.projectState !== 'ACCEPTED'
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.REJECT_SCRIPT_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Block", withMessage: true, cssClass: "btn btn-danger btn-secondary mr-2",
              visibilityCondition: this.currentUser?.projectState !== 'REJECTED'
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.REQUEST_SCRIPT_CHANGES_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Request Changes", withMessage: true, cssClass: "btn btn-primary mr-2"
            }
          ] as ActionButton[]
        },
        {
          label: "Result",
          button: [
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.ACCEPT_PROJECT_RESULTS_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Accept", withMessage: false, cssClass: "btn btn-primary mr-2",
              visibilityCondition: this.currentUser?.projectState !== 'ACCEPTED'
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.REJECT_PROJECT_RESULTS_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Block", withMessage: true, cssClass: "btn btn-danger btn-secondary mr-2",
              visibilityCondition: this.currentUser?.projectState !== 'REJECTED'
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.REQUEST_CHANGES_IN_PROJECT_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Request Changes", withMessage: true, cssClass: "btn btn-primary mr-2"
            }
          ] as ActionButton[]
        },
        {
          label: "Analysis",
          button: [
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.ACCEPT_PROJECT_ANALYSIS_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Accept", withMessage: false, cssClass: "btn btn-primary mr-2",
              visibilityCondition: this.currentUser?.projectState !== 'ACCEPTED'
            },
            {
              module: Module.PROJECT_STATE_MODULE, action: Action.REJECT_PROJECT_ANALYSIS_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Block", withMessage: true, cssClass: "btn btn-danger btn-secondary mr-2",
              visibilityCondition: this.currentUser?.projectState !== 'REJECTED'
            },
            {
              module: Module.PROJECT_STATE_MODULE,
              action: Action.REQUEST_CHANGES_IN_PROJECT_ANALYSIS_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Request Changes",
              withMessage: true,
              cssClass: "btn btn-primary mr-2"
            }
          ] as ActionButton[]
        },
        {
          label: "Research Environment",
          button: [
            {
              module: Module.USER_MODULE,
              action: Action.EXISTS_RESEARCH_ENVIRONMENT_WORKSPACE_ACTION,
              refreshContextCallFunction: this.refreshContext as () => void,
              text: "Go",
              withMessage: false,
              cssClass: "btn btn-primary mr-2",
              visibilityCondition: this.researchEnvironmentUrl !== undefined && this.existsResearchEnvironmentWorkspace,
              doActionOnClick: this.goToResearchEnvironment as () => void
            }
          ] as ActionButton[]
        },
        ...teilerButtonGroups,
      ] as ActionButtonGroup[]
    },

    async checkButtonVisibility() {
      let flagChanged = false;  // Track if the flag changes
      await Promise.all(
          this.actionButtons.map(async (buttonGroup, index) => {
            const statusArray = await Promise.all(
                buttonGroup.button.map(async (button) => {
                  const visibility1 = button.visibilityCondition !== undefined ? button.visibilityCondition : true;
                  const visibility2 = await this.projectManagerBackendService.isModuleActionActive(button.module, button.action);
                  // Check if a button is visible and the flag hasn't been set to true yet
                  if (visibility1 && visibility2 && !this.isAnyButtonVisible) {
                    this.isAnyButtonVisible = true; // Set the flag to true immediately if a visible button is found
                    flagChanged = true;  // Mark the flag as changed
                  }
                  return visibility1 && visibility2;
                })
            );
            // Update the visibility for the button group
            this.buttonGroups[index] = statusArray.includes(true);
          })
      );

      // If the flag changed, trigger the watcher by updating the property
      if (flagChanged) {
        // You can put any additional logic to notify the watcher if necessary here
      }
    },

    getMenuSteps(): string[] {
      if (this.project?.state !== ProjectState.DRAFT) {
        return ["Status", "Request", "Documents"]
      } else {
        return ["Request", "Documents"]
      }
    },

    getDialogStep(stepId: string): DialogStep | undefined {
      const step = FixedDialogSteps.find(step => step.id === stepId)
      return step ? step : {
        id: "",
        displayName: stepId.charAt(0).toUpperCase() + stepId.slice(1),
        description: ""
      }
    }
  }

});


</script>

<style scoped>

.box-header {
  padding: 10px 30px 10px 2%;
  /*background-color: #00489c;*/
  color: rgb(0, 56, 124);;
  font-size: large;
  font-weight: bold;
  /*border-top: 1px solid #95c8dc;
  border-left: 1px solid #95c8dc;
  border-right: 1px solid #95c8dc;*/
  background-image: linear-gradient(to right, #e1edf5, #bed7e9);
  /*border-radius: 10px 10px 0 0;*/
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.box-header span {
  font-size: 16pt;
}

.info-container {
  display: flex;
  flex-direction: column;
  background-color: white;
  /*border-radius: 10px;
  box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
  0 1px 1px 0 rgba(0, 0, 0, 0.14),
  0 1px 3px 0 rgba(0, 0, 0, 0.12);
*/
  margin-bottom: 1.5%;
}

.data-container {
  display: flex;
  flex-direction: column;
  background-color: transparent;
  height: 100%;
  padding: 20px 0 0;
}

.data-container.non-draft {
  padding: 28px 0 0;
}

.vertical-stepper-box {
  width: 208px;
  flex-shrink: 0;
  padding-top: 2px;
}

.project-actions {
  background-color: white;
  /*border-radius: 10px;
  box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
  0 1px 1px 0 rgba(0, 0, 0, 0.14),
  0 1px 3px 0 rgba(0, 0, 0, 0.12);*/

  margin-bottom: 1.5%;
}

.documents {
  background-color: white;
  /*border-radius: 10px;
  box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
  0 1px 1px 0 rgba(0, 0, 0, 0.14),
  0 1px 3px 0 rgba(0, 0, 0, 0.12);*/
  margin-bottom: 1.5%;
}

.main-menu {
  width: 100%;
  background-color: rgba(0, 72, 156, .95);
  display: flex;
  padding-left: 60%;
}

.menu-item {
  padding: 1.2rem 2rem;
  color: white;
  cursor: pointer;
  font-weight: bold;
}

.menu-item.active {
  background-color: rgb(0, 56, 124);
}

.main-container {
  display: flex;
  flex-flow: row;
  width: 100%;
}

.left-container {
  display: flex;
  flex-flow: column;
  width: 14%;
  margin-top: 1.5%;
  margin-left: 1.5%;
  margin-bottom: 1.5%;
  background-color: white;
}

.right-container {
  flex: 3;
  display: flex;
  flex-flow: row;
  margin: 28px auto 0;
  width: 100%;
  max-width: 65%;
  align-self: flex-start;
}

.right-container.less-margin {
  margin-left: 28px;
}

.main-content {
  display: flex;
  flex-flow: column;
  width: 100%;
}

/* Draft form layout */
.draft-layout-row {
  display: flex;
  flex-flow: row;
  gap: 22px;
  padding: 0 0 28px;
  align-items: flex-start;
}

.draft-form-card {
  flex: 1;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  min-height: 580px;
  overflow: hidden;
}

.draft-dialog-content {
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 260px);
}

.button-container-right button {
  margin-bottom: 8px;
}

.table-responsive {
  overflow-x: visible;
  padding: 0;
}

.admin-view {
  display: flex;
  flex-flow: row;
  background-color: transparent;
}

.vertical-stepper {
  margin: 20% 0 0 28%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.vertical-stepper2 {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-top: 8px;
}

.stepper-line {
  width: 2px;
  height: 50px;
  background-color: #9e9e9e;
  margin-left: 14px;
  margin-top: 10px;
  align-items: flex-start;
}

.stepper-line2 {
  width: 2px;
  height: 28px;
  background-color: #e2e8f0;
  margin: 3px 0;
}

.stepper-line2--done {
  background-color: #2655a2;
}

.stepper-step {
  display: flex;
  margin-bottom: 10px;
  flex-flow: column;
  align-content: flex-start;
  align-items: flex-start;
}

.stepper-step2 {
  display: flex;
  flex-flow: row;
  gap: 11px;
  cursor: pointer;
  padding: 8px 6px;
  border-radius: 6px;
  margin-bottom: 0;
}

.stepper-step2:hover {
  background: rgba(0, 0, 0, 0.04);
}

.stepper-step-textbox {
  min-width: 0;
}

.stepper-step-header {
  font-size: 13.5px;
  font-weight: 400;
  color: #94a3b8;
  line-height: 1.3;
}

.stepper-step2.active .stepper-step-header {
  font-weight: 600;
  color: #e05c2a;
}

.stepper-step2:not(.active) .stepper-step-header.done {
  color: #1e293b;
  font-weight: 500;
}

.stepper-step-desc {
  font-size: 11.5px;
  color: #cbd5e1;
  line-height: 1.4;
  margin-top: 2px;
}

.stepper-step2.active .stepper-step-desc {
  color: #c04a1a;
}

/* Step circles */
.step-circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background-color: #d1d5db;
}

.step-circle--done {
  background-color: #2655a2;
}

.step-circle--active {
  background-color: #e05c2a;
}

.step-circle--future {
  background-color: #d1d5db;
}

.step-circle span {
  font-size: 13px;
}

.step-title {
  font-size: 16px;
  padding-top: 2px;
  color: #00489c;
}

.active-step {
  font-weight: bold;
}

.active-step .step-circle {
  background-color: #e05c2a;
}

.notification-box {
  padding: 2%;
  font-family: "Calibri Light", Arial, sans-serif;
}

.todo-circle {
  min-width: 32px;
  height: 32px;
  background-color: gold;
  color: #000;
  border: 1px solid black;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  font-size: 12pt;
  font-weight: bold;
}

.todo-circle-small {
  min-width: 22px;
  height: 22px;
  background-color: gold;
  color: #000;
  border: 1px solid black;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 10px;
  font-weight: bold;
  font-size: 9pt;
}

.custom-width-notifications {
  width: 22%;
  background-color: white;
  color: black;
  order: 2;
  position: relative;
  z-index: 1;
  overflow-y: auto;
  transition: transform 0.3s ease-in-out;
  border-radius: 10px;
  box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
  0 1px 1px 0 rgba(0, 0, 0, 0.14),
  0 1px 3px 0 rgba(0, 0, 0, 0.12);

  margin-top: 1.5%;
  margin-bottom: 5%;
  margin-right: 0.5%;
}

.open-right-panel {
  margin-top: 1.5%;
}

.custom-width-notifications h2 {
  margin-bottom: 15px;
}

.card {
  border-radius: 10px;
  background-color: rgba(149, 200, 220, 0.1);
}

.button-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f8fafc;
  flex-shrink: 0;
}

.button-nav-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.step-counter {
  font-size: 12px;
  color: #94a3b8;
  letter-spacing: 0.4px;
  user-select: none;
  margin-right: 4px;
}

/* Delete Draft button */
:deep(.btn-delete-draft) {
  background: transparent;
  border: 1.5px solid #dc2626;
  color: #dc2626;
  padding: 9px 18px;
  border-radius: 5px;
  font-size: 13.5px;
  font-weight: 500;
}

:deep(.btn-delete-draft:hover) {
  background: #fef2f2;
  border-color: #b91c1c;
  color: #b91c1c;
}

/* Back button */
.btn-nav-back {
  background: #fff;
  border: 1.5px solid #2655a2;
  color: #2655a2;
  padding: 9px 20px;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-nav-back:hover:not(:disabled) {
  background: #eff4ff;
}

.btn-nav-back:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Continue button */
.btn-nav-continue {
  background: #2655a2;
  border: none;
  color: #fff;
  padding: 10px 22px;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 1px 3px rgba(38, 85, 162, 0.28);
}

.btn-nav-continue:hover {
  background: #1e4491;
  box-shadow: 0 2px 6px rgba(38, 85, 162, 0.38);
}

/* Create Request button */
:deep(.btn-create-request) {
  background: #16a34a;
  border: none;
  color: #fff;
  padding: 10px 22px;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(22, 163, 74, 0.3);
}

:deep(.btn-create-request:hover:not(:disabled)) {
  background: #15803d;
  box-shadow: 0 2px 6px rgba(22, 163, 74, 0.4);
}

:deep(.btn-create-request:disabled) {
  opacity: 0.6;
  cursor: not-allowed;
}

.inviteUser {
  padding: 2%;
  display: flex;
}

.status-table-header {
  background-color: #f2f2f2;
  vertical-align: middle;
}

.button-group-box {
  border: 1px solid lightgrey;
  border-radius: 5px;
  padding: 0 0 18px 18px;
  width: fit-content;
  display: inline-block;
  margin-right: 2%;
  margin-top: 1%;
}

.button-group-label {
  border: 1px solid lightgrey;
  border-radius: 5px;
  width: fit-content;
  padding: 4px 10px;
  position: relative;
  top: -18px;
  background-color: #95c8dc;
  font-weight: bold;
  margin-right: 15px;
  display: flex;
}

.explanation-button i {
  position: relative;
  top: -9px;
}

.table-overview td {
  vertical-align: middle;
}

.state_circle {
  margin: 10px auto;
}

.notification-tab {
  padding: 5px 8% 5px 8%;
  background-color: #e8f8fd;
  margin: 0 2%;
  border-radius: 5px 5px 0 0;
  font-weight: normal;
  cursor: pointer;
}

.notification-tab.active {
  font-weight: bold;
  background-color: white;
}

.states-circle-container {
  display: flex;
  justify-content: center;
}

.project-field-header {
  background-color: #2655a2;
  padding: 17px 28px;
  flex-shrink: 0;
}

.project-field-title {
  font-size: 19px;
  font-weight: 600;
  color: #fff;
}

.project-field-notification {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.82);
  margin-top: 4px;
}

.missing-fields, .missing-fields .stepper-step-header {
  color: red;
}

.missing-fields .step-circle {
  background-color: red !important;
}

.form-switch input {
  cursor: pointer;
}

.form-switch label {
  padding: 0 0.3rem;
  cursor: pointer;
  color: #00489c;
}

.form-switch-box {
  display: flex;
  justify-content: end;
  margin: 1rem 2rem 0 1rem;
  position: sticky;
  top: 1rem;
}

.form-switch .form-check-input.inactive {
  background-color: #EEEEEE;
}


.clickable {
  cursor: pointer;
  color: rgb(51, 142, 195);
}

.clickable:hover {
  text-decoration: underline;
}
</style>
