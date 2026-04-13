<script lang="ts">
import {Options, Vue} from "vue-class-component";
import type {Explanations} from "@/services/projectManagerBackendService";
import {
  Action,
  Bridgehead,
  configLabel,
  EditProjectParam,
  FormDataType,
  Module,
  ProjectAndForms,
  ProjectManagerBackendService,
  ProjectManagerContext
} from "@/services/projectManagerBackendService";
import DownloadButton from "@/components/DownloadButton.vue";
import UploadButton from "@/components/UploadButton.vue";
import type {DialogStep} from "@/services/fixedDialogStep";
import {FixedDialogStep} from "@/services/fixedDialogStep";
import type {BridgeheadsProjectField} from "@/services/utils";
import {ActionFunction, Section} from "@/services/utils";
import {PropType, watch} from "vue";

@Options({
  name: "ProjectFieldRow",
  computed: {
    configLabel() {
      return configLabel;
    }
  },
  components: {DownloadButton, UploadButton},
  props: {
    fieldKey: {type: String, required: true},
    editProjectParam: {type: Array as PropType<EditProjectParam[]>, required: false, default: []},
    fieldValue: {type: Array as PropType<string[]>, required: true},
    fieldDescription: {type: String, required: false},
    bridgeheads: {type: Object as PropType<BridgeheadsProjectField>, required: false},
    projectManagerBackendService: {type: Object as PropType<ProjectManagerBackendService>, required: true},
    context: {type: Object as PropType<ProjectManagerContext>, required: true},
    redirectUrl: {type: String, required: false},
    module: {type: String as PropType<Module>, default: Module.PROJECT_EDITION_MODULE},
    action: {
      type: [String, Object] as unknown as PropType<Action | ActionFunction>,
      default: Action.EDIT_PROJECT_ACTION
    },
    possibleValues: {type: Array as PropType<string[]>, required: false},
    displayPossibleValue: {
      type: Function as unknown as () => (input: string) => string,
      default: (input: string) => input
    },
    configurations: {type: Object as PropType<Map<string, ProjectAndForms>>, required: false},
    isEditable: {type: Boolean, required: true},
    callRefreshContext: {type: Function as unknown as () => () => void, required: true},
    uploadAction: {type: String as PropType<Action>, required: false},
    downloadAction: {type: String as PropType<Action>, required: false},
    downloadModule: {type: String as PropType<Module>, required: false},
    deleteAction: {type: String as PropType<Action>, required: false},
    deleteModule: {type: String as PropType<Module>, required: false},
    todos: {type: Object as PropType<Explanations>, required: false},
    existsFile: {type: Boolean, required: false},
    mandatory: {type: Boolean, required: true, default: false},
    type: {type: String as PropType<FormDataType>, required: false},
    draftDialogCurrentStep: {type: Object as PropType<DialogStep>, required: false},
    visibleBridgeheads: {type: Array as PropType<Bridgehead[]>, required: true},
    section: {type: Object as PropType<Section>, required: false},
    transformForSending: {
      type: Function as unknown as () => (input: string) => string,
      default: (input: string) => input
    },
    extraParams: {type: Object as PropType<Map<string, string>>, required: false},
  }
})
export default class ProjectFieldRow extends Vue {
  // Props
  readonly fieldKey!: string;
  readonly editProjectParam!: EditProjectParam[];
  readonly fieldValue!: string[];

  readonly bridgeheads?: BridgeheadsProjectField;
  readonly projectManagerBackendService!: ProjectManagerBackendService;
  readonly context!: ProjectManagerContext;
  readonly redirectUrl?: string;
  readonly module!: Module;
  readonly action!: Action | ActionFunction;
  readonly possibleValues?: string[];
  readonly displayPossibleValue!: (input: string) => string;
  readonly isEditable!: boolean;
  readonly callRefreshContext!: () => void;

  // For template:
  // noinspection JSUnusedGlobalSymbols
  readonly fieldDescription?: string;
  // noinspection JSUnusedGlobalSymbols
  readonly configurations?: Map<string, ProjectAndForms>;
  // noinspection JSUnusedGlobalSymbols
  readonly downloadAction?: Action;
  // noinspection JSUnusedGlobalSymbols
  readonly downloadModule?: Module;
  // noinspection JSUnusedGlobalSymbols
  readonly deleteAction?: Action;
  // noinspection JSUnusedGlobalSymbols
  readonly deleteModule?: Module;
  // noinspection JSUnusedGlobalSymbols
  readonly todos?: Explanations;
  // noinspection JSUnusedGlobalSymbols
  readonly existsFile?: boolean;
  // noinspection JSUnusedGlobalSymbols
  readonly mandatory!: boolean;
  // noinspection JSUnusedGlobalSymbols
  readonly draftDialogCurrentStep?: DialogStep;
  // noinspection JSUnusedGlobalSymbols
  readonly visibleBridgeheads!: Bridgehead[];
  // noinspection JSUnusedGlobalSymbols
  readonly section?: Section;
  readonly uploadAction?: Action;
  readonly type!: FormDataType;
  readonly transformForSending!: (input: string) => string;
  readonly extraParams?: Map<string, string>;

  editing = false;
  editedValue: string[] = [];
  tempFieldValue: string[] = [];
  isActionEnabled = false;
  Module = Module;
  Action = Action;
  showInputs = false;
  newValue = "";
  newKey = "";
  toggleHumanReadable = true;
  showDetails: boolean[] = [];
  copiedToClipboard = false;
  editingBridgeheads: Bridgehead[] = [];

  mounted() {
    watch(
        () => this.projectManagerBackendService,
        () => {
          this.resetIsActionEnabled();
        },
        {immediate: true, deep: true}
    );
    watch(
        () => this.fieldValue,
        (newValue: string[]) => {
          this.tempFieldValue = newValue;
        },
        {immediate: true, deep: true}
    );
  }

  get dialogStep() {
    return FixedDialogStep;
  }

  // configLabel used in {{ configLabel[key] }}
  // noinspection JSUnusedGlobalSymbols
  get configLabel(): Record<string, string> {
    return configLabel;
  }

  created() {
    this.editingBridgeheads = this.bridgeheads
        ? [...this.bridgeheads.selected]
        : [];

    this.tempFieldValue = this.fieldValue.slice();
    this.editedValue = this.fieldValue.slice();
    this.resetIsActionEnabled();

    this.possibleValues?.forEach(() => {
      this.showDetails.push(false);
    });
  }


  resetIsActionEnabled() {
    const action = this.fetchAction();
    const module = this.uploadAction ? Module.PROJECT_DOCUMENTS_MODULE : this.module;
    this.projectManagerBackendService
        .isModuleActionActive(module, action)
        .then((isActive) => (this.isActionEnabled = isActive));
  }

  private fetchAction(): Action {
    let action = this.uploadAction ? this.uploadAction : this.action;
    if (action instanceof ActionFunction) {
      action = action.fetchAction(this.editedValue);
    }
    return action;
  }

  editField() {
    this.editing = true;
    this.editedValue = this.tempFieldValue.slice();

    if (this.isBridgeheads() && this.bridgeheads) {
      this.editingBridgeheads = [...this.bridgeheads.selected];
    }
  }


  isFieldValueEditable() {
    return !this.editing && this.isEditable && this.isActionEnabled;
  }

  deleteField() {
    const params = new Map<string, string>();
    if (this.editProjectParam && this.editProjectParam.length > 0 && this.deleteModule && this.deleteAction) {

      for (let i = 0; i < this.editProjectParam.length; i++) {
        if (i < this.editedValue.length) {
          params.set(this.editProjectParam[i], this.applyTransformToSend(this.editedValue[i]));
        }
      }

      if (this.extraParams) {
        this.extraParams.forEach((value, key) => {
          params.set(key, value);
        })
      }

      this.projectManagerBackendService
          .fetchData(this.deleteModule, this.deleteAction, this.context, params)
          .then(() => this.callRefreshContext());
    }
  }

  saveField() {
    this.showInputs = false;
    this.editing = false;
    this.tempFieldValue = this.editedValue.slice();

    const params = new Map<string, string>();

    if (this.editProjectParam && this.editProjectParam.length > 0) {
      if (this.includesEditProjectParam(EditProjectParam.PROJECT_TYPE) && this.tempFieldValue[0] === "DATASHIELD") {
        params.set("output-format", "OPAL");
        params.set("template-id", "opal-ccp");
      }

      if (this.isBridgeheads() && this.bridgeheads) {
        const ids = this.editingBridgeheads.map(b => b.bridgehead).join(',');
        params.set(this.editProjectParam[0], ids);
      } else {
        for (let i = 0; i < this.editProjectParam.length; i++) {
          if (i < this.editedValue.length) {
            params.set(this.editProjectParam[i], this.applyTransformToSend(this.editedValue[i]));
          }
        }
      }

      if (this.extraParams) {
        this.extraParams.forEach((value, key) => {
          params.set(key, value);
        })
      }

      this.projectManagerBackendService
          .fetchData(this.module, this.fetchAction(), this.context, params)
          .then(() => this.callRefreshContext());
    }
  }

  applyTransformToSend(editedValue: any): any {
    if (editedValue === undefined || editedValue === null) {
      return ""
    }
    return Array.isArray(editedValue)
        ? editedValue.map(input => this.transformForSending(input))
        : this.transformForSending(editedValue);
  }

  includesEditProjectParam(param: EditProjectParam): boolean {
    return this.editProjectParam && this.editProjectParam.includes(param);
  }

  cancelEdit() {
    this.editing = false;
    this.showInputs = false;
    this.editingBridgeheads = this.bridgeheads
        ? [...this.bridgeheads.selected]
        : [];
  }


  redirectToURL() {
    if (this.redirectUrl) {
      window.location.href = this.redirectUrl;
    }
  }

  showInputFields() {
    this.showInputs = true;
  }

  /** BRIDGEHEADS METHODS **/
  addBridgehead(newBridgeheadId: string) {
    if (!this.bridgeheads) return;

    const bridgehead = this.bridgeheads.available.find(
        b => b.bridgehead === newBridgeheadId
    );

    if (bridgehead) {
      this.editingBridgeheads.push(bridgehead);
      this.newValue = "";
    }
  }


  removeBridgehead(index: number) {
    if (index >= 0 && index < this.editingBridgeheads.length) {
      this.editingBridgeheads.splice(index, 1);
    }
  }


  fetchOtherAvailableBridgeheadsToAdd(): Bridgehead[] {
    if (!this.bridgeheads) return [];

    const selectedIds = this.editingBridgeheads.map(b => b.bridgehead);

    return this.bridgeheads.available.filter(
        b => !selectedIds.includes(b.bridgehead)
    );
  }


  areThereMoreBridgeheadsAvailableToAdd(): boolean {
    return this.fetchOtherAvailableBridgeheadsToAdd().length > 0;
  }


  addEnvVariable() {
    if (this.newKey && this.newValue) {
      this.editedValue[0] != null ? this.editedValue[0] += ';' : this.editedValue[0] = '';
      this.editedValue[0] += this.newKey + '=' + this.newValue;
      this.newKey = '';
      this.newValue = '';
    }
  }

  removeEnvVariable(index: any) {
    if (this.editedValue.length > 0) {
      const pairs = this.editedValue[0].split(';');
      pairs.splice(index, 1);
      this.editedValue[0] = pairs.join(';');
    }
  }

  exitAndCallRefreshContext() {
    this.cancelEdit();
    this.callRefreshContext();
  }

  isQuery(): boolean {
    return this.includesEditProjectParam(EditProjectParam.HUMAN_READABLE);
  }

  isDescription(): boolean {
    return this.includesEditProjectParam(EditProjectParam.DESCRIPTION);
  }

  isBridgeheads(): boolean {
    return this.includesEditProjectParam(EditProjectParam.BRIDGEHEADS);
  }

  isConfiguration(): boolean {
    return this.includesEditProjectParam(EditProjectParam.PROJECT_CONFIGURATION);
  }

  isConfigType(): boolean {
    return this.includesEditProjectParam(EditProjectParam.PROJECT_TYPE) && this.fieldKey === 'Type';
  }

  isEnvironmentVariables(): boolean {
    return this.includesEditProjectParam(EditProjectParam.QUERY_CONTEXT);
  }

  isSelection(): boolean {
    return (this.possibleValues?.length ?? 0) > 0;
  }

  isTypeBoolean(): boolean {
    return this.type === FormDataType.BOOLEAN
  }

  getEditFieldCssClass() {
    if (this.isQuery()) return 'query-edit-field';
    if (this.isDescription()) return 'description-edit-field';
    if (this.isBridgeheads()) return 'bridgeheads-edit-field';
    if (this.isEnvironmentVariables()) return 'environment-variables-edit-field';
    if (this.isSelection()) return 'selection-edit-fields';
    if (this.uploadAction) return 'upload-edit-field';
    return 'other-edit-fields';
  }

  getButtonContainerCssClass() {
    if (this.isQuery()) return 'query-button-container';
    if (this.isSelection()) return 'selection-button-container';
    if (this.isDescription()) return 'description-button-container';
    if (this.isBridgeheads()) return 'bridgeheads-button-container';
    if (this.isEnvironmentVariables()) return 'environment-variables-button-container';
    if (this.uploadAction) return 'upload-button-container';
    return 'other-button-container';
  }

  async copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.copiedToClipboard = true;
    } catch ($e) {
      console.log($e);
    }
  }

  onBooleanValueChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.editedValue[0] = input.checked ? 'true' : 'false';
  }

}

</script>

<template>

  <!-- Section -->
  <template v-if="section">
    <template v-for="newSection in section.fetchNewSections()"
              :key="`${newSection.level}-${newSection.displayName ?? 'root'}`">

      <tr v-if="!newSection.displayName" class="section-row spacer-row">
        <td colspan="100">&nbsp;</td>
      </tr>

      <!-- Regular section row -->
      <tr v-if="newSection.displayName" class="section-row" :class="`level-${Math.min(newSection.level ?? 0, 4)}`">
        <td colspan="100">
          <div class="section-title"
               :class="`level-${Math.min(newSection.level ?? 0, 4)}`">
            {{ newSection.displayName }}
          </div>
          <div v-if="newSection.description" class="section-description">
            {{ newSection.description }}
          </div>
        </td>
      </tr>
    </template>
  </template>


  <tr v-if="isConfiguration() && !isConfigType() && draftDialogCurrentStep && draftDialogCurrentStep.id === dialogStep.SERVICES"
      class="config-box-row">
    <td colspan="3">
      <div style="display: flex;padding-left:0;margin:20px 0">
        <div v-for="(step, index) in possibleValues" :key="index" class="config-box"
             :class="{ 'active': editedValue[0] === step }">
          <div class="config-button"
               role="button"
               tabindex="0"
               @click="editedValue[0]=step; saveField()"
               @keydown.enter="editedValue[0]=step; saveField()"
               style="cursor: pointer; height:100%; min-width: fit-content;">
            <div style="height:100%; display: flex; flex-direction: column;">
              <div class="config-box-header">{{ configurations?.get(step)?.project?.label }}</div>
              <div class="config-box-body">
                <div v-if="configurations" style="display: flex;flex-direction: column">
                  <div style="margin-bottom:2%;text-align:left;min-height:200px">
                    {{ configurations?.get(step)?.project?.description }}
                  </div>
                  <div v-if="!configurations?.get(step)?.project?.isCustomConfigSelected"
                       style="text-align: right;margin-bottom:2%">
                    <button @click.stop="showDetails[index]=!showDetails[index]"
                            style="background: none; border:none; color: #007bff;">
                      <span v-if="!showDetails[index]">show details</span>
                      <span v-if="showDetails[index]">hide details</span>
                    </button>
                  </div>
                  <table v-if="showDetails[index]" style="text-align: left">
                    <tr v-for="(param, key) in configurations?.get(step)" :key="key">
                      <template v-if="!['customConfig', 'label', 'description'].includes(key.toString())">
                        <td style="font-weight: bold">{{ configLabel[key] }}:</td>
                        <td class="truncate-15" data-toggle="tooltip" data-placement="top" :title="param?.toString()">
                          {{ param }}
                        </td>
                      </template>
                    </tr>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </td>
  </tr>

  <tr v-else>
    <!-- FIRST COLUMN: HEADERS -->
    <td class="bold-text thinner-column" style="background-color: #f2f2f2; max-width: 170px;">
      <div style="display: flex;">
        <span>{{ fieldKey }}</span>
        <span v-if="this.mandatory">&nbsp*</span>
        <span v-if="this.uploadAction && todos?.get(this.uploadAction)"
              class="todo-circle-small">#{{ todos?.get(this.uploadAction)?.number }}</span>
        <span v-if="this.downloadAction && todos?.get(this.downloadAction) && this.existsFile"
              class="todo-circle-small">#{{ todos?.get(this.downloadAction)?.number }}</span>
      </div>
      <div class="field-description" v-html="fieldDescription"></div>
    </td>

    <!-- SECOND COLUMN: CONTENT -->
    <td style="width:80%">
      <div class="user-input-container">
        <!-- If editing -->
        <div v-if="editing" style="width:100%">
          <div :class="getEditFieldCssClass()">
            <div v-if="uploadAction" style="width:75%">
              <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                            :module="Module.PROJECT_DOCUMENTS_MODULE" :action="uploadAction"
                            :visible-bridgeheads="visibleBridgeheads" :use-bridgehead-chooser="fieldKey === 'Votum'"
                            :text="'Upload '+ fieldKey" :call-refresh-context="exitAndCallRefreshContext"
                            :is-file="true"/>
            </div>
            <div v-else style="width:75%">
              <div>
                <div v-if="isTypeBoolean()" style="width: 70%;">
                  <input
                      type="checkbox"
                      :checked="editedValue[0] === 'true'"
                      @change="onBooleanValueChange"
                  />
                </div>
                <div v-else-if="isQuery()" style="width: 70%;">
                  <span><strong>Human readable</strong></span>
                  <input type="text" v-model="editedValue[0]" class="form-control" style="width: 100%;"><br/>
                  <span><strong>Query</strong></span>
                  <input type="text" v-model="editedValue[1]" class="form-control" style="width: 100%;">
                </div>
                <div v-else-if="isDescription()" style="width:70%">
                  <textarea type="text" v-model="editedValue[0]" class="form-control"></textarea>
                </div>
                <div v-else-if="isBridgeheads() && editing" style="width: 75%">
                  <span v-if="editingBridgeheads && editingBridgeheads.length > 0">
                    <span v-for="(bridgehead, index) in editingBridgeheads" :key="index" class="btn btn-primary"
                          style="margin-right: 2%; margin-bottom: 0.5%">
                         <span>{{ bridgehead.humanReadable ?? bridgehead.bridgehead }}</span>
                      <button @click="removeBridgehead(index)" class="btn btn-sm" style="padding: 0"><i
                          style="color: white; font-size: 18px" class="bi bi-x"></i></button>
                    </span>
                  </span>
                  <span v-if="areThereMoreBridgeheadsAvailableToAdd()">
                    <button @click="showInputFields" class="btn btn-secondary"><i class="bi bi-plus"></i></button>
                    <span v-if="showInputs" style="display: flex; flex-flow: row; gap: 2%; padding-top: 2%">
                      <select class="form-select" v-model="newValue">
                        <option disabled value="">Bridgehead</option>
                        <option v-for="b in fetchOtherAvailableBridgeheadsToAdd()"
                                :key="b.bridgehead"
                                :value="b.bridgehead">
                            {{ b.humanReadable ?? b.bridgehead }}
                        </option>
                      </select>
                      <button class="btn btn-primary" @click="addBridgehead(newValue)">
                        <i style="font-size: 18px" class="bi bi-check"></i>
                      </button>
                    </span>
                  </span>
                </div>
                <div v-else-if="isEnvironmentVariables()" style="width:75%;">
                  <span v-if="editedValue && editedValue.length > 0 && editedValue[0]" style="width: 75%">
                    <span v-for="(pair, index) in editedValue[0].split(';')" :key="index"
                          style="margin-right: 2%;  display: inline;" class="btn btn-primary">
                      <span style="display: inline; margin-bottom: 2%">{{ pair }}</span>
                      <button @click="removeEnvVariable(index)" class="btn btn-sm" style="padding: 0"><i
                          style="color: white; font-size: 18px" class="bi bi-x"></i></button>
                    </span>
                  </span>
                  <button @click="showInputFields" class="btn btn-secondary"><i class="bi bi-plus"></i></button>
                  <div v-if="showInputs" style="display: flex; flex-flow: row; gap: 2%; padding-top: 2%; width:80%">
                    <input type="text" class="form-control" v-model="newKey" placeholder="Key">
                    <input type="text" class="form-control" v-model="newValue" placeholder="Value">
                    <button class="btn btn-primary" @click="addEnvVariable"><i style="font-size: 18px"
                                                                               class="bi bi-check"></i>
                    </button>
                  </div>
                </div>
                <div v-else-if="isSelection()" style="width: 70%;">
                  <select v-model="editedValue[0]" class="form-select" style="width: 100%;">
                    <option v-for="value in possibleValues" :key="value" :value="value">{{
                        displayPossibleValue(value)
                      }}</option>
                  </select>
                </div>
                <div v-else style="width: 70%;">
                  <input type="text" v-model="editedValue[0]" class="form-control" style="width: 100%;">
                </div>
              </div>
            </div>
            <div class="button-container" :class="getButtonContainerCssClass()">
              <button @click="cancelEdit" class="btn btn-outline-secondary"
                      style="padding:4px 15px 4px 15px;margin-left: auto">Cancel
              </button>
              <button v-if="!uploadAction" @click="saveField" class="btn btn-outline-primary"
                      style="padding:4px 20px 4px 20px;">Save
              </button>
            </div>
          </div>
        </div>

        <!-- If not editing -->
        <div v-else style="display:flex; width:100%">
          <div v-if="isBridgeheads()" style="width:100%">
            <div v-if="bridgeheads && bridgeheads.selected.length > 0" class="field-value">
              <span v-for="(bridgehead, index) in bridgeheads.selected" :key="index" class="btn btn-primary"
                    style="margin-right: 2%; margin-bottom: 0.5%">
                {{ bridgehead?.humanReadable ?? bridgehead?.bridgehead }}
              </span>
            </div>
          </div>
          <div v-else-if="tempFieldValue && tempFieldValue.length > 0 && tempFieldValue[0] && isEnvironmentVariables()"
               style="display:flex; width:100%">
            <div v-for="(pair, index) in tempFieldValue[0].split(';').filter(Boolean)" :key="index"
                 style="margin-right: 2%;  display: inline;" class="btn btn-primary">
              <span style="display: inline; margin-bottom: 1%">{{ pair }}</span>
            </div>
          </div>
          <div v-else-if="tempFieldValue && tempFieldValue.length > 0" style="width:70%">
            <template v-if="isQuery()">
              <div class="field-value clickable" :class="{ 'truncate-60': toggleHumanReadable }"
                   @click="toggleHumanReadable = !toggleHumanReadable" data-toggle="tooltip" data-placement="top"
                   :title="tempFieldValue[0]">{{ tempFieldValue[0] }}
              </div>
            </template>
            <template v-else-if="uploadAction">
              <span v-if="tempFieldValue[0]?.length > 0" class="truncate-60">{{ tempFieldValue[0] }}</span>
              <span v-if="!(tempFieldValue[0]?.length > 0) && tempFieldValue[1]?.length > 0"
                    class="truncate-60">{{ tempFieldValue[1] }}</span>
            </template>
            <template v-else>
              <div class="field-value truncate-60">{{ displayPossibleValue(tempFieldValue[0]) }}</div>
            </template>
          </div>
        </div>
      </div>
    </td>

    <!-- THIRD COLUMN: ACTIONS -->
    <td style="min-width: 50px;vertical-align: middle">
      <span style="display:flex; flex-flow:row; align-items: baseline">
        <span style="display:inline-flex; flex-flow:row; align-items: baseline">
          <button
              v-if="isFieldValueEditable() && (redirectUrl === null || redirectUrl === undefined || isBridgeheads() || isQuery())"
              class="btn btn-primary"
              data-toggle="tooltip"
              data-placement="top" title="Edit"
              style="background:none; border:none; color:black"><i class="bi bi-pencil me-2" @click="editField"></i>
          </button>
          <button
              v-if="isFieldValueEditable() && this.deleteAction && this.deleteModule"
              class="btn btn-primary"
              data-toggle="tooltip"
              data-placement="top" title="Delete"
              style="background:none; border:none; color:black"><i class="bi bi-trash me-2" @click="deleteField"></i>
          </button>

          <DownloadButton v-if="existsFile && downloadAction" :context="context"
                          :project-manager-backend-service="projectManagerBackendService"
                          :module="downloadModule" :action="downloadAction"/>
        </span>
        <button v-if="isFieldValueEditable() && redirectUrl !== null && redirectUrl !== undefined"
                class="btn btn-primary"
                data-toggle="tooltip"
                data-placement="top" title="CCP Explorer"
                style="background:none; border:none; color:black"><i class="bi bi-arrow-right-circle"
                                                                     @click="redirectToURL"></i>
        </button>
        <button v-if="isQuery() && fieldValue[0]" class="btn btn-primary"
                data-toggle="tooltip"
                data-placement="top" title="Copy Query to Clipboard"
                style="background:none; border:none; color:black"><i
            :class="copiedToClipboard ? 'bi bi-clipboard-check' : 'bi bi-copy'"
            @click="copyToClipboard(editedValue[1])"></i>
        </button>
      </span>
    </td>
  </tr>
</template>

<style scoped>
.bold-text {
  font-weight: bold;
}

.user-input-container {
  display: flex;
  align-items: center;
}

.button-container {
  margin-left: auto; /* Push buttons to the right */
}

.field-value {
  flex-grow: 1; /* Allow fieldValue to grow and occupy available space */
}

.bi-pencil {
  width: 100%; /* Make bi-pencil icon occupy all available space */
  text-align: center; /* Center the icon */
}

.truncate-15 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(15 * 1ch); /* 1ch is the width of one character */
}

.truncate-60 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(60 * 1ch); /* 1ch is the width of one character */
}

/*noinspection CssUnusedSymbol*/
.query-edit-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/*noinspection CssUnusedSymbol*/
.description-edit-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/*noinspection CssUnusedSymbol*/
.bridgeheads-edit-field {
  display: flex;
  flex-flow: row;
  width: 100%;
}

/*noinspection CssUnusedSymbol*/
.environment-variables-edit-field {
  display: flex;
  width: 100%;
}

/*noinspection CssUnusedSymbol*/
.selection-edit-fields {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/*noinspection CssUnusedSymbol*/
.upload-edit-field {
  display: flex;
  flex-flow: row;
  width: 100%;
}

/*noinspection CssUnusedSymbol*/
.other-edit-fields {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/*noinspection CssUnusedSymbol*/
.other-button-container,
.query-button-container,
.selection-button-container,
.description-button-container {
  width: 25%;
  display: flex;
  gap: 5%;
}

/*noinspection CssUnusedSymbol*/
.bridgeheads-button-container,
.environment-variables-button-container {
  width: 25%;
  display: flex;
  height: 20%;
  gap: 3%;
}

/*noinspection CssUnusedSymbol*/
.upload-button-container {
  width: 25%;
  gap: 3%;
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

.clickable {
  cursor: pointer;
}

.config-box {
  width: fit-content;
  text-align: center;
  margin: 10px;
  border: 1px solid #0000001E;
  border-radius: 10px;
  min-width: 250px;
  font-size: 20px;
}

.config-box.active, .config-box:hover {
  box-shadow: 0 2px 1px -1px rgba(149, 200, 220, 0.8),
  0 1px 1px 0 rgba(149, 200, 220, 0.5),
  0 1px 3px 0 rgba(149, 200, 220, 0.3);
}

.config-box-header {
  background-color: #95c8dc;
  padding: 10px 15px;
  border-radius: 10px 10px 0 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 68px;
}

.config-box.active .config-box-header {
  color: white;
  background-color: #007bff;
  font-weight: bold;
  font-size: 19px;
}

.config-box:hover .config-box-header {
  color: white;
  background-color: #007bff;
}

.config-box-body {
  padding: 10px;
  height: 100%;
  display: flex;
  justify-content: center;
  /*align-items: center;*/
  background-color: white;
  border-radius: 0 0 10px 10px;
  font-size: 0.7vw;
}

.config-box-row {
  border-top: 1px solid white;
  border-left: 1px solid white;
  border-right: 1px solid white;
  background-color: white;
}

.config-box-row:hover > * {
  --bs-table-bg-state: white;
}

.config-button {
  color: black;
  width: 100%;
}

.field-description {
  font-size: small;
  font-weight: normal;
}

/* Regular section rows */
.section-row {
  color: white;
}

/*noinspection CssUnusedSymbol*/
.section-row.level-1 {
  margin-top: 10px;
}

.section-row.level-1 td {
  background-color: #0056b3;
  color: white;
  border-left: none;
  border-right: none;
}

/* Spacer row for sections without displayName */
.section-row.spacer-row td {
  background-color: transparent; /* no color */
  height: 0.25rem; /* smaller vertical space */
  border-left: none;
  border-right: none;
  padding: 0; /* remove padding */
}

.section-row.empty-row td {
  background-color: transparent; /* no color */
  height: 0; /* smaller vertical space */
  border-left: none;
  border-right: none;
  padding: 0; /* remove padding */
}

/* Section titles */
.section-title {
  font-weight: 600;
  line-height: 1.4;
  margin: 0.5rem 0;
}

/* Prefix arrows for levels */
.section-title::before {
  display: inline-block;
  margin-right: 0.5rem;
  opacity: 0.8;
}

/*noinspection CssUnusedSymbol*/
.section-title.level-0::before {
  content: "";
}

/*noinspection CssUnusedSymbol*/
.section-title.level-1::before {
  content: "";
}

/*noinspection CssUnusedSymbol*/
.section-title.level-2::before {
  content: "❯";
}

/*noinspection CssUnusedSymbol*/
.section-title.level-3::before {
  content: "❯❯";
}

/*noinspection CssUnusedSymbol*/
.section-title.level-4::before {
  content: "❯❯❯";
}

/* Font sizes & weights per level */
/*noinspection CssUnusedSymbol*/
.section-title.level-0 {
  font-size: 1rem;
  font-weight: 500;
}

/*noinspection CssUnusedSymbol*/
.section-title.level-1 {
  font-size: 1.15rem;
  font-weight: 600;
}

/*noinspection CssUnusedSymbol*/
.section-title.level-2 {
  font-size: 1.05rem;
  font-weight: 600;
}

/*noinspection CssUnusedSymbol*/
.section-title.level-3 {
  font-size: 0.95rem;
  font-weight: 500;
}

/*noinspection CssUnusedSymbol*/
.section-title.level-4 {
  font-size: 0.9rem;
  font-weight: 500;
}

/* Section description styling */
.section-description {
  font-size: 0.85rem;
  color: #e0e0e0;
  margin-left: 1.75rem;
  margin-bottom: 0.5rem;
}

</style>
