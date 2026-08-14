<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {
  Action,
  Bridgehead,
  configLabel,
  EditProjectParam,
  Explanations,
  FormDataType,
  Module,
  ProjectAndForms,
  ProjectConfigurationSelectionType,
  ProjectManagerBackendService,
  ProjectManagerContext,
  NOT_SELECTED_PROJECT_CONFIGURATION
} from "@/services/projectManagerBackendService";
import DownloadButton from "@/components/DownloadButton.vue";
import UploadButton from "@/components/UploadButton.vue";
import type {DialogStep} from "@/services/fixedDialogStep";
import {FixedDialogStep} from "@/services/fixedDialogStep";
import type {Block, BridgeheadsProjectField} from "@/services/utils";
import {ActionFunction, Section, Utils} from "@/services/utils";
import {handleError, PropType, watch} from "vue";
import "@samply/lens";
import {QueryItem, setOptions, setQueryStore} from "@samply/lens";

@Options({
  name: "ProjectFieldRow",
  methods: {handleError},
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
    fieldShortDescription: {type: String, required: false},
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
      type: Function as unknown as () => (input: string) => {name: string, description: string, shortDescription?: string},
      default: (input: string) => input
    },
    configurations: {type: Object as PropType<Map<string, ProjectAndForms>>, required: false},
    configurationSelectionType: {
      type: String as PropType<ProjectConfigurationSelectionType>,
      default: ProjectConfigurationSelectionType.SINGLE
    },
    isEditable: {type: Boolean, required: true},
    editMode: {type: Boolean, required: true},
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
    block: {type: Object as PropType<Block>, required: false},
    transformForSending: {
      type: Function as unknown as () => (input: string) => string,
      default: (input: string) => input
    },
    extraParams: {type: Object as PropType<Map<string, string>>, required: false},
    properties: {type: Array as PropType<string[]>, required: false},
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
  readonly properties?: string[];
  // noinspection JSUnusedGlobalSymbols
  readonly displayPossibleValue!: (input: string) => {name: string, description: string, shortDescription: string};
  // noinspection JSUnusedGlobalSymbols
  readonly isEditable!: boolean;
  readonly callRefreshContext!: () => void;

  // For template:

  // noinspection JSUnusedGlobalSymbols
  readonly editMode!: boolean;
  // noinspection JSUnusedGlobalSymbols
  readonly fieldDescription?: string;
  // noinspection JSUnusedGlobalSymbols
  readonly fieldShortDescription?: string;
  // noinspection JSUnusedGlobalSymbols
  readonly configurations?: Map<string, ProjectAndForms>;
  readonly configurationSelectionType!: ProjectConfigurationSelectionType;
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
  // noinspection JSUnusedGlobalSymbols
  readonly block?: Block;
  uploadAction?: Action;
  // noinspection JSUnusedGlobalSymbols
  downloadAction?: Action;
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
  showDetails: boolean[] = [];
  copiedToClipboard = false;
  editingBridgeheads: Bridgehead[] = [];
  FormDataType = FormDataType
  showPseudocode: boolean = false

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
    watch(
        () => this.bridgeheads,
        (newValue: BridgeheadsProjectField | undefined) => {
          if (newValue) {
            this.editingBridgeheads = [...newValue.selected];
          } else {
            this.editingBridgeheads = [];
          }
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

    if(this.isQuery()) {
      setOptions({autoUpdateQueryInUrl:false})
      setQueryStore(this.getQueryDetails())
    }
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
        params.set(EditProjectParam.OUTPUT_FORMAT, "OPAL");
        params.set(EditProjectParam.TEMPLATE_ID, "opal-ccp");
      }

      if (this.isBridgeheads() && this.bridgeheads) {
        const ids = this.editingBridgeheads.map(b => b.bridgehead).join(',');
        params.set(this.editProjectParam[0], ids);
      } else {
        if (this.isConfiguration()) {
          params.set(this.editProjectParam[0], this.editedValue.join(','));
        } else {
          for (let i = 0; i < this.editProjectParam.length; i++) {
            if (i < this.editedValue.length) {
              params.set(this.editProjectParam[i], this.applyTransformToSend(this.editedValue[i]));
            }
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
   let bridgeheads:string[] = []
    let query = "";

    if (this.bridgeheads?.selected?.length) {
      bridgeheads = this.bridgeheads.selected.map((bridgehead) => bridgehead.bridgehead)
    }
    if (this.editedValue[2]) {
      query = this.editedValue[2]
    }
    if (this.redirectUrl) {
      const projectCode = new URLSearchParams(this.redirectUrl).get("project-code")
      window.location.href = this.redirectUrl.split('?')[0] + '?query=' + query + '&datarequests='+Utils.encodeBase64(JSON.stringify(bridgeheads)) + '&project-code=' + projectCode;
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
    this.saveField()
  }


  removeBridgehead(index: number) {
    if (index >= 0 && index < this.editingBridgeheads.length) {
      this.editingBridgeheads.splice(index, 1);
      this.saveField()
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
      this.saveField()
    }
  }

  removeEnvVariable(index: any) {
    if (this.editedValue.length > 0) {
      const pairs = this.editedValue[0].split(';');
      pairs.splice(index, 1);
      this.editedValue[0] = pairs.join(';');
      this.saveField()
    }
  }

  exitAndCallRefreshContext() {
    this.cancelEdit();
    this.callRefreshContext();
  }

  isActiveStep(step: string): boolean {
    return this.editedValue.includes(step)
  }
  setActiveSteps(step: string): void {
    if (this.isConfiguration()) {
      if (!this.isMultipleConfigurationSelection()) {
        this.editedValue = [step];
      } else if (step === 'CUSTOM') {
        this.editedValue = [step];
      } else if (this.editedValue.includes(step)) {
        const remainingValues = this.editedValue.filter(item => item !== step);
        this.editedValue = remainingValues.length > 0
            ? remainingValues
            : [NOT_SELECTED_PROJECT_CONFIGURATION];
      } else {
        this.editedValue = [
          ...this.editedValue.filter(item => item !== 'CUSTOM' && item !== NOT_SELECTED_PROJECT_CONFIGURATION),
          step
        ];
      }
      return;
    }

    if(this.editedValue.includes(step)) {
      this.editedValue = this.editedValue.filter(item => item !== step)
    } else {
      this.editedValue.push(step)
      if (this.editedValue.length > 1) {
        this.editedValue = this.editedValue.filter(item => item !== 'CUSTOM')
      }
    }
  }

  isQuery(): boolean {
    return this.includesEditProjectParam(EditProjectParam.HUMAN_READABLE);
  }
  isCohortDefinition(): boolean {
    return this.includesEditProjectParam(EditProjectParam.COHORT_DEFINITION)
  }
  isDescription(): boolean {
    return this.includesEditProjectParam(EditProjectParam.DESCRIPTION);
  }
  isDescriptionUpload(): boolean {
    return this.fieldKey === "DescriptionUpload";
  }
  isBridgeheads(): boolean {
    return this.includesEditProjectParam(EditProjectParam.BRIDGEHEADS);
  }

  isConfiguration(): boolean {
    return this.includesEditProjectParam(EditProjectParam.PROJECT_CONFIGURATION);
  }

  isMultipleConfigurationSelection(): boolean {
    return this.configurationSelectionType === ProjectConfigurationSelectionType.MULTIPLE;
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

  isComments(): boolean {
    return this.includesEditProjectParam(EditProjectParam.FORM_FIELDS) && this.fieldKey === 'Comments';
  }
  isDraft(): boolean {
    return this.draftDialogCurrentStep  !== undefined
  }
  isSummaryStep(): boolean {
    return this.draftDialogCurrentStep?.id === this.dialogStep.SUMMARY
  }
  isBlock(): boolean {
    return !!this.block
  }
  get displayedFieldDescription(): string | undefined {
    return !this.isDraft() || this.isSummaryStep() || this.isBlock()
      ? this.fieldShortDescription ?? this.fieldDescription
      : this.fieldDescription;
  }
  getInputType(): string {
    if (this.type === FormDataType.INTEGER) return 'number'
    if (this.type === FormDataType.STRING) return 'text'
    if (this.type === FormDataType.LONG_STRING) return 'longtext'
    return 'text'
  }
  isInputType(type: FormDataType): boolean {
    return this.type === type
  }
  getEditFieldCssClass() {
    let sidewise = "";
    if(!this.isDraft() || this.isSummaryStep()) sidewise = " sidewise"
    if (this.isQuery()) return 'query-edit-field' + sidewise;
    if (this.isDescription()) return 'description-edit-field' + sidewise;
    if (this.isBridgeheads()) return 'bridgeheads-edit-field' + sidewise;
    if (this.isEnvironmentVariables()) return 'environment-variables-edit-field' + sidewise;
    if (this.isSelection()) return 'selection-edit-fields' + sidewise;
    if (this.uploadAction) return 'upload-edit-field' + sidewise;
    return 'other-edit-fields' + sidewise;
  }

  getQueryDetails(): QueryItem[][] {
    if (this.editedValue[2]) {
      return JSON.parse(Utils.decodeBase64(this.editedValue[2])) as QueryItem[][]}
    return [[{id: "", key: "", name: "", type: "", values: []}]]
  }

  getBooleanValue(): string {
    if (this.editedValue[0] === "true") {return "Yes"}
    else {
      if (this.editedValue[0] === "false") {return "No"}
      else {
        if (this.mandatory) {return "not specified"}
      }
    }
    return ""
  }
  hasSection(): boolean {
    const groups = this.section?.fetchGroups();
    return !!(groups && groups.length > 0);
  }

  hasShortTitle(): boolean {
    return (!this.isInputType(FormDataType.BOOLEAN) && (!this.isDraft() || this.isSummaryStep())) || this.isBlock() || (this.isInputType(FormDataType.BOOLEAN) && (!this.isDraft() || this.isSummaryStep()) && this.mandatory)
  }
  onBooleanValueChange(_event: Event) {
    const input = _event.target as HTMLInputElement;
    this.editedValue[0] = input.checked ? 'true': 'false';
    this.saveField()
  }

  onInputChange(_event: Event) {
    this.saveField()
  }

  async copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.copiedToClipboard = true;
    } catch ($e) {
      console.log($e);
    }
  }

  getFirstLevelCriteria(queryBase64: string): any[] {
    if(queryBase64?.length > 0) {
      const query = JSON.parse(atob(queryBase64))
      if (query?.lang === "ast") {
        const payload = JSON.parse(atob(query.payload))
        return payload.ast?.children[0]?.children;
      }
    }
    return []
  }

  getCriteriaDetails(criteria: any): string {
    let label = ""
    if (criteria?.children[0]?.type !== undefined) {
      label = criteria?.children[0]?.key + " = ";
      criteria?.children?.forEach((child: any, index: number) => {
        if (child?.type === "EQUALS") {
          label += child?.value
          if(index < criteria?.children?.length - 1) {
            label += ", "
          }
        }
        if (child?.type === "BETWEEN") {
          label += child?.value?.min + " - " + child?.value?.max
        }
      })
    }
    else {
      criteria.children.forEach((child: any, index: number) => {
        label += child?.key
        if(index < criteria?.children?.length - 1) {
          label += ", "
        }
      })
    }
    return label
  }

  getCriterium(crit: any): QueryItem | undefined {
    return this.getQueryDetails()[0].find((element) => element.key === crit.key)
  }

  getCssProperty(): string {
    const cssClasses = this.properties?.filter((property) => property.substring(0,3) === "css")
    return cssClasses && cssClasses?.length > 0 ? cssClasses.join(",")+' layout' : "";
  }
  getWidth(): string {
    let width = "80%"
    if (this.getCssProperty().includes("layout")) {
      if (this.getCssProperty().includes("unit")) {
        width = "30%"
      }
      if (this.getCssProperty().includes("unit-value")) {
        width = "54%"
      }
      if (this.getCssProperty().includes("checkbox")) {
        width = "100%"
      }
    } else {
      if (this.hasShortTitle()) {
        if (this.hasSection()) {
          width = "28%"
        } else {
          width = "30%"
        }
      }
    }
    return width
  }
}

</script>

<template>
  <tr v-if="isConfiguration() && !isConfigType() && draftDialogCurrentStep && draftDialogCurrentStep.id === dialogStep.SERVICES"
      class="config-box-row">
    <td colspan="3" style="display: block;width:100%">
      <div>
        <div v-for="(step, index) in possibleValues" :key="index" class="config-box"
             :class="{ 'active': isActiveStep(step) }">
          <div class="config-button"
               role="button"
               tabindex="0"
               @click="setActiveSteps(step); saveField()"
               @keydown.enter="setActiveSteps(step); saveField()"
               style="cursor: pointer; height:100%; min-width: fit-content;">
            <div style="display: flex;flex-direction: row;">
              <div class="form-check">
                <input class="form-check-input"
                       :type="isMultipleConfigurationSelection() ? 'checkbox' : 'radio'"
                       name="project-configuration"
                       value=""
                       :checked="isActiveStep(step)">
              </div>
              <div style="height:100%; display: flex; flex-direction: column;width:100%">
                <div class="config-box-header">{{ configurations?.get(step)?.project?.label }}</div>
                <div class="config-box-body">
                  <div v-if="configurations" style="display: flex;flex-direction: column;width:100%">
                    <div style="margin-bottom:2%;text-align:left;">
                      {{ configurations?.get(step)?.project?.description }}
                    </div>
                    <div v-if="!configurations?.get(step)?.project?.isCustomConfigSelected"
                         style="text-align: right;margin-bottom:2%">
                      <!--<button @click.stop="showDetails[index]=!showDetails[index]"
                              style="background: none; border:none; color: #007bff;">
                        <span v-if="!showDetails[index]">show details</span>
                        <span v-if="showDetails[index]">hide details</span>
                      </button>-->
                    </div>
                    <table v-if="showDetails[index]" style="text-align: left">
                      <tr v-for="(param, key) in configurations?.get(step)?.project?.outputs?.[0]" :key="key">
                        <!--<template v-if="!['customConfig', 'label', 'description'].includes(key.toString())">-->
                          <td style="width: 20%">{{ configLabel[key] }}:</td>
                          <td class="truncate-15" data-toggle="tooltip" data-placement="top" :title="param?.toString()">
                            {{ param }}
                          </td>
                        <!--</template>-->
                      </tr>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </td>
  </tr>


  <div v-else :class="getCssProperty()">

    <div class="input-field" :class="{ 'sidewise': !isDraft() || isSummaryStep(), 'block': isBlock(), 'section': hasSection(), 'wide': isSummaryStep() }" :style="isDescription() ? 'margin-bottom:0px!important' : ''">
      <div style="display:flex" :style="{width: getWidth()}">
        <input
            v-if="isInputType(FormDataType.BOOLEAN) && !this.mandatory"
            type="checkbox"
            style="margin-right:20px"
            :checked="editedValue[0] === 'true'"
            @change="onBooleanValueChange"
            :disabled=" (isDraft() && isSummaryStep()) || (!isDraft() && !editMode)"
        />
        <div class="input-field-header" :class="{ 'sidewise': !isDraft() || isSummaryStep() || isBlock() }">
          <div v-if="!isDescriptionUpload()" style="display: flex;">
            <span class="input-field-title">{{ fieldKey }}<span v-if="this.mandatory" :style="(!isBridgeheads() && !editedValue[0]) || (isBridgeheads() && editingBridgeheads?.length === 0) ? 'color: red' : ''">&nbsp*</span></span>

            <span v-if="this.uploadAction && todos?.get(this.uploadAction)"
                  class="todo-circle-small">#{{ todos?.get(this.uploadAction)?.number }}</span>
            <span v-if="this.downloadAction && todos?.get(this.downloadAction) && this.existsFile"
                  class="todo-circle-small">#{{ todos?.get(this.downloadAction)?.number }}</span>
          </div>
          <div v-if="displayedFieldDescription" class="field-description" v-html="displayedFieldDescription" :class="{ 'short-description': !isDraft() || isSummaryStep() || isBlock() }"></div>
        </div>
      </div>
      <div v-if="!(isInputType(FormDataType.BOOLEAN) && !this.mandatory)" :class="[getEditFieldCssClass(),{ 'sidewise': !isDraft() || isSummaryStep() || isBlock() }]">
        <div v-if="uploadAction && !isDescriptionUpload()" style="width:100%;padding: 0 0.75rem">
          <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                        :module="Module.PROJECT_DOCUMENTS_MODULE" :upload-action="uploadAction"
                        :download-action="downloadAction"
                        :visible-bridgeheads="visibleBridgeheads" :use-bridgehead-chooser="fieldKey === 'Votum'"
                        :text="'Upload '+ fieldKey" :call-refresh-context="exitAndCallRefreshContext"
                        :is-file="true" :toggle-input="fieldKey.substring(0,5) === 'Votum'" :file-name="fieldValue[1]" :exists-file="existsFile"/>
        </div>
        <div v-else style="width:100%">
          <div>
            <div v-if="isInputType(FormDataType.BOOLEAN)" style="width: 70%;">
              <select v-if="((isDraft() && !isSummaryStep()) || editMode) && mandatory" v-model="editedValue[0]" @change="saveField()" class="form-select" style="width: fit-content;">
                <option value=true>Yes</option>
                <option value=false>No</option>
              </select>
              <div v-if="(!isDraft() || isSummaryStep()) && !editMode && mandatory">
                <div style="padding: 0 0.75rem">{{getBooleanValue()}}</div>
              </div>
            </div>
            <div v-else-if="isQuery()">
              <div  v-if="editedValue[2]" style="display: flex">
                <lens-search-bar
                    placeholderText=""
                    readOnly="true"
                    style="width: 100%"
                />
                <lens-query-explain-button
                    noQueryMessage="Empty Search."
                ></lens-query-explain-button>
              </div>

              <!--<div style="display: flex;flex-wrap: wrap">
                  <span v-for="box in getFirstLevelCriteria(editedValue[1])"
                      class="btn btn-primary dktk-darkblue"
                      style="margin-right: 2%; margin-bottom: 0.5%;width:max-content">
                    {{getCriteriaDetails(box)}}
                  </span>
                  <lens-query-explain-button
                      v-if="editedValue[2]"
                      noQueryMessage="Empty Search."
                  ></lens-query-explain-button>
              </div>-->
              <br/>
              <br/>
              <div style="display: flex; justify-content: space-between">
                <div style="margin-bottom: 10px">
                  <span class="query-link-button"
                          data-toggle="tooltip"
                          data-placement="top" :title='showPseudocode ? "Hide Pseudocode": "Show Pseudocode"'
                          @click="showPseudocode = !showPseudocode"
                    ><i :class="showPseudocode ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    <span style="font-size: small; padding: 2px 0 0 5px">{{showPseudocode ? "Hide Pseudocode": "Show Pseudocode"}}</span>
                  </span>
                  <span v-if="isQuery() && fieldValue[0]" class="query-link-button"
                          data-toggle="tooltip"
                          data-placement="top" title="Copy Query to Clipboard"
                          @click="copyToClipboard(editedValue[1])"
                    ><i :class="copiedToClipboard ? 'bi bi-clipboard-check' : 'bi bi-copy'"></i>
                    <span style="font-size: small; padding: 2px 0 0 5px">Copy Query to Clipboard</span>
                  </span>
                  <span v-if="redirectUrl !== null && redirectUrl !== undefined"
                          class="query-link-button"
                          data-toggle="tooltip"
                          data-placement="top" title="Return to the DKTK Explorer to edit the request."
                          @click="redirectToURL">
                    <i class="bi bi-arrow-right-circle"></i>
                    <span style="font-size: small; padding: 2px 0 0 5px">Edit in Explorer</span>
                  </span>
                </div>
              </div>
              <Transition name="expand">
              <div v-if="showPseudocode" class="grow-wrap" :data-replicated-value="editedValue[0]">
                <textarea
                  type="text"
                  v-model="editedValue[0]"
                  @change="onInputChange"
                  class="form-control"
                  :class="(!isDraft() || isSummaryStep()) && !editMode ? 'grey' : 'white'"
                  :disabled="(!isDraft() || isSummaryStep()) && !editMode"
                ></textarea>
              </div>
              </Transition>
            </div>

            <div v-else-if="isDescriptionUpload()" style="margin:1rem 0 0 1rem">
              <UploadButton :context="context" :project-manager-backend-service="projectManagerBackendService"
                            :module="Module.PROJECT_DOCUMENTS_MODULE" :upload-action="uploadAction"
                            :download-action="downloadAction"
                            text="Upload project description" :call-refresh-context="exitAndCallRefreshContext" :is-file="true" :exists-file="existsFile"
                            :file-name="fieldValue[1]" :toggle-input="true"/>
            </div>

            <div v-else-if="isBridgeheads()" style="width: 100%;padding: 0 0.75rem">
                    <span v-if="editingBridgeheads && editingBridgeheads.length > 0">
                      <span v-for="(bridgehead, index) in editingBridgeheads" :key="index" class="btn btn-primary dktk-darkblue"
                            style="margin-right: 2%; margin-bottom: 0.5%;">
                           <span>{{ bridgehead.humanReadable ?? bridgehead.bridgehead }}</span>
                        <button @click="removeBridgehead(index)" class="btn btn-sm dktk-darkblue" style="padding: 0 0 0 10px;height: 28px;margin-top:-3px"
                                v-if="(isDraft() && !isSummaryStep()) || editMode">
                          <i style="color: white; font-size: 18px;" class="bi bi-x dktk-darkblue"></i>
                        </button>
                      </span>
                    </span>
              <span v-if="areThereMoreBridgeheadsAvailableToAdd() && ((isDraft() && !isSummaryStep()) || editMode)">
                      <button @click="showInputFields" class="btn btn-secondary"><i class="bi bi-plus"></i></button>
                      <span v-if="showInputs" style="display: flex; flex-flow: row; gap: 2%; padding-top: 2%">
                        <select class="form-select" v-model="newValue" >
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
                        <button class="btn btn-primary" @click="showInputs=false">
                          <i style="font-size: 18px" class="bi bi-x"></i>
                        </button>
                      </span>
                    </span>
            </div>
            <div v-else-if="isEnvironmentVariables()" style="width:100%;">
                    <span v-if="editedValue && editedValue.length > 0 && editedValue[0]" style="width: 100%">
                      <span v-for="(pair, index) in editedValue[0].split(';')" :key="index"
                            style="margin-right: 2%;  display: inline;" class="btn btn-primary dktk-darkblue">
                        <span style="display: inline; margin-bottom: 2%">{{ pair }}</span>
                        <button @click="removeEnvVariable(index)" class="btn btn-sm dktk-darkblue" style="padding: 0"><i v-if="isDraft() && !isSummaryStep()"
                            style="color: white; font-size: 18px" class="bi bi-x dktk-darkblue"></i></button>
                      </span>
                    </span>
              <button v-if="isDraft() && !isSummaryStep()" @click="showInputFields" class="btn btn-secondary"><i class="bi bi-plus"></i></button>
              <div v-if="showInputs && isDraft() && !isSummaryStep()" style="display: flex; flex-flow: row; gap: 2%; padding-top: 2%; width:80%">
                <input type="text" class="form-control" v-model="newKey" placeholder="Key">
                <input type="text" class="form-control" v-model="newValue" placeholder="Value">
                <button class="btn btn-primary" @click="addEnvVariable"><i style="font-size: 18px"
                                                                           class="bi bi-check"></i>
                </button>
              </div>
            </div>
            <div v-else-if="isSelection() && !isConfiguration()" style="width: 100%;">
              <select v-if="(isDraft() && !isSummaryStep()) || editMode" v-model="editedValue[0]" @change="onInputChange" class="form-select">
                <option v-for="value in possibleValues" :key="value" :value="value">
                  {{ displayPossibleValue(value).name }}
                  <!--<span style="font-size: smaller"> {{displayPossibleValue(value).description}}</span>-->
                </option>
              </select>
              <div v-if="(!isDraft() || isSummaryStep()) && !editMode" style="padding: 0 0.75rem">
                <div>{{displayPossibleValue(editedValue[0]).name}}</div>
                <div style="font-size: 12px">{{displayPossibleValue(editedValue[0]).shortDescription ?? displayPossibleValue(editedValue[0]).description}}</div>
              </div>
            </div>
            <div v-else-if="isInputType(FormDataType.LONG_STRING)" style="width:100%">
              <div class="grow-wrap" :data-replicated-value="editedValue[0]">
                <textarea
                    type="text"
                    v-model="editedValue[0]"
                    @change="onInputChange"
                    class="form-control auto-textarea"
                    :class="(!isDraft() || isSummaryStep()) && !editMode ? 'grey' : 'white'"
                    :disabled="(!isDraft() || isSummaryStep()) && !editMode"
                ></textarea>
              </div>
            </div>
            <div v-else style="width:100%">
              <input
                  :type="getInputType()"
                  v-model="editedValue[0]"
                  @change="onInputChange"
                  class="form-control"
                  :class="((!isDraft() || isSummaryStep()) && !editMode) || isConfiguration() ? 'grey' : 'white'"
                  :style="{width: getInputType()==='number' ? '100%' : '100%'}"
                  :disabled="((!isDraft() || isSummaryStep()) && !editMode) || isConfiguration()"
              >
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>


</template>

<style scoped>

.truncate-15 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(15 * 1ch); /* 1ch is the width of one character */
}
/*noinspection CssUnusedSymbol*/
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
.query-edit-field.sidewise {
  width: 70%;
}

/*noinspection CssUnusedSymbol*/
.description-edit-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
/*noinspection CssUnusedSymbol*/
.description-edit-field.sidewise {
  width: 70%;
}
/*noinspection CssUnusedSymbol*/
.bridgeheads-edit-field {
  display: flex;
  flex-flow: row;
  width: 100%;
}
/*noinspection CssUnusedSymbol*/
.bridgeheads-edit-field.sidewise {
  width: 70%;
}
/*noinspection CssUnusedSymbol*/
.environment-variables-edit-field {
  display: flex;
  width: 100%;
}
/*noinspection CssUnusedSymbol*/
.environment-variables-edit-field.sidewise {
  width: 70%;
}
/*noinspection CssUnusedSymbol*/
.selection-edit-fields {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
/*noinspection CssUnusedSymbol*/
.selection-edit-fields.sidewise {
  width: 70%;
}
/*noinspection CssUnusedSymbol*/
.upload-edit-field {
  display: flex;
  flex-flow: row;
  width: 70%;
}
/*noinspection CssUnusedSymbol*/
.other-edit-fields {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
/*noinspection CssUnusedSymbol*/
.other-edit-fields.sidewise {
  width: 70%;
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

.config-box {
  /*width: fit-content;
  /*text-align: center;*/
  margin: 20px 30px;
  /*border: 1px solid #0000001E;*/
  border-radius: 10px;
  min-width: 250px;
  font-size: 20px;
}

.config-box.active, .config-box:hover {
  box-shadow: 0 2px 1px -1px rgba(149, 200, 220, 0.8),
  0 0 1px 0 rgba(149, 200, 220, 0.5),
  0 0 3px 0 rgba(149, 200, 220, 0.3);
}

.config-box-header {
  /*background-color: #95c8dc;*/
  color: #00489c;
  padding: 10px;
  border-radius: 10px 10px 0 0;
  /*display: flex;
  justify-content: center;
  align-items: center;
  min-height: 68px;*/
}

.config-box.active .config-box-header {
  color: #00489c;
  /*background-color: #007bff;*/
  font-weight: bold;
  font-size: 19px;
}

.config-box:hover .config-box-header {
  color: #00489c;
  /*background-color: #007bff;*/
}

.config-box-body {
  padding: 10px;
  height: 100%;
  display: flex;
  /*justify-content: center;
  align-items: center;*/
  background-color: white;
  border-radius: 0 0 10px 10px;
  font-size: 18px;
}

.config-box-row {
  border: 1px solid white;
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
  font-size: 12px;
  font-weight: normal;
  margin-bottom: 3px;
}

.input-field {
  padding: 1.5rem 4rem;
  border-radius: 10px;
}

.input-field-title {
  font-weight: bold;
  color: #00489cf2;
}

.input-field .form-control.white {
  border-color: #c2c6ca;
}
.input-field .form-control.grey {
  background-color: #fbfbfb;
  border-color: #fff;
  resize: none;
}
.form-check {
  display: flex;
  margin: 10px;
}
.form-check-input {
  border-color: #9e9e9e;
}
 .input-field.sidewise {
   display: flex;
   padding: 1rem 4rem;
   /*width: 85%;*/
}
.layout > .input-field {
  padding: 1.5rem 0.5rem 1.5rem 4rem;
}
.input-field.sidewise.section {
  /*width:80%;*/
  margin-left: 10px;
}
.input-field.sidewise.wide {
  width: 98%;
}
.input-field.section {
  margin-left: 10px;
}
.input-field.block {
  display: flex;
  padding: 1rem;
}
 .input-field-header.sidewise {
   width: 100%;
   margin-right: 1%;
   display: flex;
   flex-direction: column;
   padding-top: 2px;
 }
 textarea.form-control {
   /*resize: both;*/
   /*height: 200px;*/
  max-height: 300px;
 }
 .dktk-darkblue {
   background-color: #00529c!important;
   border-color: #00529c!important;
 }
.form-check-input:checked {
  background-color: #00489c;
  border-color: #00489c;
}
.short-description {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 90%;
  height: 1.5rem;
}
.query-link-button {
  background:none;
  border:none;
  color:black;
  cursor: pointer;
  margin-right: 20px;
}
.query-link-button:hover {
  color: #00489c;
  background: none;
}
.query-link-button:hover span {
  text-decoration: underline;
}

.grow-wrap {
  /* easy way to plop the elements on top of each other and have them both sized based on the tallest one's height */
  display: grid;
  min-height: 150px;
  max-height: 300px;
}
.grow-wrap::after {
  /* Note the weird space! Needed to prevent jumpy behavior */
  content: attr(data-replicated-value) " ";

  /* This is how textarea text behaves */
  white-space: pre-wrap;

  /* Hidden from view, clicks, and screen readers */
  visibility: hidden;
}
.grow-wrap > textarea {
  /* You could leave this, but after a user resizes, then it ruins the auto sizing */
  resize: none;
}
.grow-wrap > textarea,
.grow-wrap::after {
  /* Identical styling required!! */
  border: 1px solid black;
  padding: 0.5rem;
  font-size: medium;

  /* Place on top of each other */
  grid-area: 1 / 1 / 2 / 2;
}
.css-unit-value {
  width:70%;
}
.css-unit {
  width:30%;
}
lens-query-explain-button::part(lens-info-button-dialogue),
lens-search-bar::part(lens-info-button-dialogue)
{
  border: 1px solid grey;
  border-radius: 5px;
  padding: 8px;
  background-color: white;
  color: black;
}
lens-query-explain-button::part(lens-query-explain-button) {
  padding: 8px;
}

lens-search-bar::part(lens-searchbar) {
  border: solid 1px lightgray;
  border-radius: 5px;
  padding: 5px 10px;
}
lens-search-bar::part(lens-searchbar-input) {
  padding: 10px;
}
lens-search-bar::part(lens-searchbar-chips) {
  gap: 10px;
  padding-right: 10px;
}
lens-search-bar::part(lens-searchbar-chip) {
  background-color: #00529c;
  color: white;
  border-radius: 5px;
  padding: 5px 10px;
  gap: 10px;
  user-select: none;
}
lens-search-bar::part(lens-searchbar-chip-item) {
  gap: 5px;
}
lens-search-bar::part(lens-info-button) {
  color: white;
  margin-left: 5px;
}

  .expand-enter-active,
  .expand-leave-active {
    transition: all 0.4s ease;
    overflow: hidden;
  }

  .expand-enter-from,
  .expand-leave-to {
    max-height: 0;
    opacity: 0;
  }

  .expand-enter-to,
  .expand-leave-from {
    max-height: 500px;
    opacity: 1;
  }
</style>
