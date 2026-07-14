//projectManagerBackendService.ts
import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
import axiosRetry from "axios-retry";
import {getConfig} from "@/services/configLoader";
import {AuthService} from "@/services/auth";


const bridgeheadParam = 'bridgehead'
const projectCodeParam = 'project-code'
const siteParam = 'site'

const actionsPath = '/actions'

export const CUSTOM_PROJECT_CONFIGURATION = 'CUSTOM';

export enum ProjectRole {
    // These values are defined in the backend and come from the backend. Therefore, we suppress the warning:
    // noinspection JSUnusedGlobalSymbols
    CREATOR = "CREATOR",
    DEVELOPER = "DEVELOPER",
    PILOT = "PILOT",
    FINAL = "FINAL",
    BRIDGEHEAD_ADMIN = "BRIDGEHEAD_ADMIN",
    PROJECT_MANAGER_ADMIN = "PROJECT_MANAGER_ADMIN"
}

export enum Site {
    PROJECT_DASHBOARD_SITE = "project-dashboard",
    PROJECT_VIEW_SITE = "project-view",
    CONFIGURATION_SITE = "config",
    NAVIGATION_BAR_SITE = "nav-bar"
}

export enum Module {
    PROJECTS_MODULE = "PROJECTS",
    USER_MODULE = "USER",
    PROJECT_STATE_MODULE = "PROJECT_STATE",
    PROJECT_RESULTS_MODULE = "PROJECT_RESULTS",
    PROJECT_BRIDGEHEAD_MODULE = "PROJECT_BRIDGEHEAD",
    PROJECT_EDITION_MODULE = "PROJECT_EDITION",
    PROJECT_DOCUMENTS_MODULE = "PROJECT_DOCUMENTS",
    NOTIFICATIONS_MODULE = "NOTIFICATIONS",
    EXPORT_MODULE = "EXPORT",
    TOKEN_MANAGER_MODULE = "TOKEN_MANAGER"
}

function getModuleFromString(value: string): Module | undefined {
    return Object.values(Module).find((module) => module === value) as Module | undefined;
}

export enum Action {
    SET_DEVELOPER_USER_ACTION = "SET_DEVELOPER_USER",
    SET_PILOT_USER_ACTION = "SET_PILOT_USER",
    SET_FINAL_USER_ACTION = "SET_FINAL_USER",
    CREATE_PROJECT_ACTION = "CREATE_PROJECT",
    ACCEPT_PROJECT_ACTION = "ACCEPT_PROJECT",
    REJECT_PROJECT_ACTION = "REJECT_PROJECT",
    ARCHIVE_PROJECT_ACTION = "ARCHIVE_PROJECT",
    START_DEVELOP_STAGE_ACTION = "START_DEVELOP_STAGE",
    START_PILOT_STAGE_ACTION = "START_PILOT_STAGE",
    START_FINAL_STAGE_ACTION = "START_FINAL_STAGE",
    FINISH_PROJECT_ACTION = "FINISH_PROJECT",
    SAVE_QUERY_IN_BRIDGEHEAD_ACTION = "SAVE_QUERY_IN_BRIDGEHEAD",
    SAVE_AND_EXECUTE_QUERY_IN_BRIDGEHEAD_ACTION = "SAVE_AND_EXECUTE_QUERY_IN_BRIDGEHEAD",
    DOWNLOAD_AUTHENTICATION_SCRIPT_ACTION = "DOWNLOAD_AUTHENTICATION_SCRIPT",
    EDIT_PROJECT_ACTION = "EDIT_PROJECT",
    FETCH_EXPORTER_TEMPLATES_ACTION = "EXPORTER_TEMPLATES",
    FETCH_QUERY_FORMATS_ACTION = "FETCH_QUERY_FORMATS",
    FETCH_OUTPUT_FORMATS_ACTION = "FETCH_OUTPUT_FORMATS",
    UPLOAD_DESCRIPTION_ACTION = "UPLOAD_DESCRIPTION",
    UPLOAD_VOTUM_ACTION = "UPLOAD_VOTUM",
    UPLOAD_VOTUM_FOR_ALL_BRIDGEHEADS_ACTION = "UPLOAD_VOTUM_FOR_ALL_BRIDGEHEADS",
    UPLOAD_PUBLICATION_ACTION = "UPLOAD_PUBLICATION",
    UPLOAD_SCRIPT_ACTION = "UPLOAD_SCRIPT",
    UPLOAD_OTHER_DOCUMENT_ACTION = "UPLOAD_OTHER_DOCUMENT",
    ADD_PUBLICATION_URL_ACTION = "ADD_PUBLICATION_URL",
    ADD_OTHER_DOCUMENT_URL_ACTION = "ADD_OTHER_DOCUMENT_URL",
    DOWNLOAD_DESCRIPTION_ACTION = "DOWNLOAD_DESCRIPTION",
    DOWNLOAD_VOTUM_ACTION = "DOWNLOAD_VOTUM",
    DOWNLOAD_VOTUM_FOR_ALL_BRIDGEHEADS_ACTION = "DOWNLOAD_VOTUM_FOR_ALL_BRIDGEHEADS",
    EXISTS_DESCRIPTION_ACTION = "EXISTS_DESCRIPTION",
    FETCH_DESCRIPTION_ACTION = "FETCH_DESCRIPTION",
    EXISTS_VOTUM_ACTION = "EXISTS_VOTUM",
    EXISTS_VOTUM_FOR_ALL_BRIDGEHEADS_ACTION = "EXISTS_VOTUM_FOR_ALL_BRIDGEHEADS",
    DOWNLOAD_PUBLICATION_ACTION = "DOWNLOAD_PUBLICATION",
    DOWNLOAD_SCRIPT_ACTION = "DOWNLOAD_SCRIPT",
    EXISTS_SCRIPT_ACTION = "EXISTS_SCRIPT",
    DOWNLOAD_OTHER_DOCUMENT_ACTION = "DOWNLOAD_OTHER_DOCUMENT",
    ACCEPT_BRIDGEHEAD_PROJECT_ACTION = "ACCEPT_BRIDGEHEAD_PROJECT",
    REJECT_BRIDGEHEAD_PROJECT_ACTION = "REJECT_BRIDGEHEAD_PROJECT",
    ACCEPT_SCRIPT_ACTION = "ACCEPT_SCRIPT",
    REJECT_SCRIPT_ACTION = "REJECT_SCRIPT",
    REQUEST_SCRIPT_CHANGES_ACTION = "REQUEST_SCRIPT_CHANGES",
    FETCH_PROJECT_BRIDGEHEADS_ACTION = "FETCH_PROJECT_BRIDGEHEADS",
    FETCH_PROJECT_TYPES_ACTION = "FETCH_PROJECT_TYPES",
    FETCH_PROJECTS_ACTION = "FETCH_PROJECTS",
    FETCH_PUBLICATIONS_ACTION = "FETCH_PUBLICATIONS",
    FETCH_OTHER_DOCUMENTS_ACTION = "FETCH_OTHER_DOCUMENTS",
    ACCEPT_PROJECT_RESULTS_ACTION = "ACCEPT_PROJECT_RESULTS",
    REJECT_PROJECT_RESULTS_ACTION = "REJECT_PROJECT_RESULTS",
    REQUEST_CHANGES_IN_PROJECT_ACTION = "REQUEST_CHANGES_IN_PROJECT",
    FETCH_NOTIFICATIONS_ACTION = "FETCH_NOTIFICATIONS",
    SET_NOTIFICATION_AS_READ_ACTION = "SET_NOTIFICATION_AS_READ",
    FETCH_PROJECT_ACTION = "FETCH_PROJECT",
    FETCH_PROJECT_STATES_ACTION = "FETCH_PROJECT_STATES",
    FETCH_ALL_REGISTERED_BRIDGEHEADS_ACTION = "FETCH_ALL_REGISTERED_BRIDGEHEADS",
    FETCH_DATASHIELD_STATUS_ACTION = "FETCH_DATASHIELD_STATUS",
    FETCH_USERS_FOR_AUTOCOMPLETE_ACTION = "FETCH_USERS_FOR_AUTOCOMPLETE",
    FETCH_PROJECT_USERS_ACTION = "FETCH_PROJECT_USERS",
    FETCH_CURRENT_USER_ACTION = "FETCH_CURRENT_USER",
    FETCH_PROJECT_CONFIGURATIONS_ACTION = "FETCH_PROJECT_CONFIGURATIONS",
    FETCH_CURRENT_PROJECT_CONFIGURATION_ACTION = "FETCH_CURRENT_PROJECT_CONFIGURATION",
    EXISTS_AUTHENTICATION_SCRIPT_ACTION = "EXISTS_AUTHENTICATION_SCRIPT",
    SET_PROJECT_CONFIGURATION_ACTION = "SET_PROJECT_CONFIGURATION",
    FETCH_VISIBLE_PROJECT_BRIDGEHEADS_ACTION = "FETCH_VISIBLE_PROJECT_BRIDGEHEADS",
    FETCH_PROJECT_ROLES_ACTION = "FETCH_PROJECT_ROLES",
    FETCH_VOTUM_DESCRIPTION_ACTION = "FETCH_VOTUM_DESCRIPTION",
    FETCH_VOTUM_FOR_ALL_BRIDGEHEADS_DESCRIPTION_ACTION = "FETCH_VOTUM_FOR_ALL_BRIDGEHEADS_DESCRIPTION",
    FETCH_SCRIPT_DESCRIPTION_ACTION = "FETCH_SCRIPT_DESCRIPTION",
    EXIST_INVITED_USERS_ACTION = "EXIST_INVITED_USERS",
    ACCEPT_PROJECT_ANALYSIS_ACTION = "ACCEPT_PROJECT_ANALYSIS",
    REJECT_PROJECT_ANALYSIS_ACTION = "REJECT_PROJECT_ANALYSIS",
    REQUEST_CHANGES_IN_PROJECT_ANALYSIS_ACTION = "REQUEST_CHANGES_IN_PROJECT_ANALYSIS",
    SEND_EXPORT_FILES_TO_RESEARCH_ENVIRONMENT_ACTION = "SEND_EXPORT_FILES_TO_RESEARCH_ENVIRONMENT",
    ARE_EXPORT_FILES_TRANSFERRED_TO_RESEARCH_ENVIRONMENT_ACTION = "ARE_EXPORT_FILES_TRANSFERRED_TO_RESEARCH_ENVIRONMENT",
    ADD_USER_TO_MAILING_BLACK_LIST_ACTION = "ADD_USER_TO_MAILING_BLACK_LIST",
    REMOVE_USER_FROM_MAILING_BLACK_LIST_ACTION = "REMOVE_USER_FROM_MAILING_BLACK_LIST",
    FETCH_MAILING_BLACK_LIST_ACTION = "FETCH_MAILING_BLACK_LIST",
    FETCH_USERS_FOR_AUTOCOMPLETE_IN_MAILING_BLACK_LIST_ACTION = "FETCH_USERS_FOR_AUTOCOMPLETE_IN_MAILING_BLACK_LIST",
    ADD_PROJECT_BRIDGEHEAD_RESULTS_URL_ACTION = "ADD_PROJECT_BRIDGEHEAD_RESULTS_URL",
    ADD_PROJECT_RESULTS_URL_ACTION = "ADD_PROJECT_RESULTS_URL",
    ACCEPT_PROJECT_RESULTS_URL_ACTION = "ACCEPT_PROJECT_RESULTS_URL",
    REJECT_PROJECT_RESULTS_URL_ACTION = "REJECT_PROJECT_RESULTS_URL",
    REQUEST_CHANGES_IN_PROJECT_RESULTS_URL_ACTION = "REQUEST_CHANGES_IN_PROJECT_RESULTS_URL",
    ACCEPT_PROJECT_BRIDGEHEAD_RESULTS_URL_ACTION = "ACCEPT_PROJECT_BRIDGEHEAD_RESULTS_URL",
    REJECT_PROJECT_BRIDGEHEAD_RESULTS_URL_ACTION = "REJECT_PROJECT_BRIDGEHEAD_RESULTS_URL",
    REQUEST_CHANGES_IN_PROJECT_BRIDGEHEAD_RESULTS_URL_ACTION = "REQUEST_CHANGES_IN_PROJECT_BRIDGEHEAD_RESULTS_URL",
    FETCH_PROJECT_RESULTS_ACTION = "FETCH_PROJECT_RESULTS",
    FETCH_PROJECT_BRIDGEHEAD_RESULTS_ACTION = "FETCH_PROJECT_BRIDGEHEAD_RESULTS",
    FETCH_PROJECT_BRIDGEHEAD_RESULTS_FOR_OWN_BRIDGEHEAD_ACTION = "FETCH_PROJECT_BRIDGEHEAD_RESULTS_FOR_OWN_BRIDGEHEAD",
    FETCH_EMAIL_MESSAGE_AND_SUBJECT_ACTION = "FETCH_EMAIL_MESSAGE_AND_SUBJECT",
    IS_PROJECT_MANAGER_ADMIN_ACTION = "IS_PROJECT_MANAGER_ADMIN",
    FETCH_RESEARCH_ENVIRONMENT_URL_ACTION = "FETCH_RESEARCH_ENVIRONMENT_URL",
    EXISTS_RESEARCH_ENVIRONMENT_WORKSPACE_ACTION = "EXISTS_RESEARCH_ENVIRONMENT_WORKSPACE",
    FETCH_PROJECT_FORM_FIELDS_ACTION = "FETCH_PROJECT_FORM_FIELDS",
    FETCH_BEST_PROJECT_FORM_TEMPLATES_ACTION = "FETCH_BEST_FORM_TEMPLATES",
    EDIT_PROJECT_FORM_FIELDS_ACTION = "EDIT_PROJECT_FORM_FIELDS",
    DOWNLOAD_FORM_AS_PDF_ACTION = "DOWNLOAD_FORM_AS_PDF",
    FETCH_SELECTED_PROJECT_FORMS_ACTION = "FETCH_SELECTED_PROJECT_FORMS",
    ADD_SELECTED_PROJECT_FORM_ACTION = "ADD_SELECTED_PROJECT_FORM",
    REMOVE_SELECTED_PROJECT_FORM_ACTION = "REMOVE_SELECTED_PROJECT_FORM",
    REMOVE_PROJECT_OUTPUT_ACTION = "REMOVE_PROJECT_OUTPUT",
    EXISTS_PUBLICATION_ACTION = "EXISTS_PUBLICATION",
    UPLOAD_FINAL_REPORT_ACTION = "UPLOAD_FINAL_REPORT",
    ADD_FINAL_REPORT_URL_ACTION = "ADD_FINAL_REPORT_URL",
    EXISTS_FINAL_REPORT_ACTION = "EXISTS_FINAL_REPORT",
    DOWNLOAD_FINAL_REPORT_ACTION = "DOWNLOAD_FINAL_REPORT",
    FETCH_FINAL_REPORTS_ACTION = "FETCH_FINAL_REPORTS",
    DELETE_PROJECT_ACTION = "DELETE_PROJECT",
    DELETE_FORM_FIELD_BLOCK_ACTION = "DELETE_FORM_FIELD_BLOCK"
}

export enum EditProjectParam {
    PROJECT_CONFIGURATION = "project-configuration",
    QUERY_FORMAT = "query-format",
    BRIDGEHEADS = "bridgeheads",
    LABEL = "label",
    DESCRIPTION = "description",
    OUTPUT_FORMAT = "output-format",
    TEMPLATE_ID = "template-id",
    HUMAN_READABLE = "human-readable",
    PROJECT_TYPE = "project-type",
    QUERY_CONTEXT = "query-context",
    FORM_FIELDS = "form-fields",
    FORM_FIELD = "form-field",
    FORM_TEMPLATE = "form-template",
    FORM_TITLE = "form-title",
    COHORT_DEFINITION = "cohort-definition",
    QUERY_DETAILS = "query-details"
}

export enum ProjectType {
    // These values are defined in the backend and come from the backend. Therefore, we suppress the warning:
    // noinspection JSUnusedGlobalSymbols
    EXPORT = "EXPORT",
    SAMPLES = "SAMPLES", // Interacts with Negotiator
    DATASHIELD = "DATASHIELD",
    RESEARCH_ENVIRONMENT = "RESEARCH_ENVIRONMENT"
}

export enum ProjectState {
    ALL = "ALL",
    DRAFT = "DRAFT",
    REVIEW = "REVIEW",
    APPROVAL = "APPROVAL",
    DEVELOP = "DEVELOP",
    PILOT = "PILOT",
    FINAL = "FINAL",
    FINISHED = "FINISHED",
    REJECTED = "REJECTED",
    ARCHIVED = "ARCHIVED"
}

export enum UserProjectState {
    CREATED = "CREATED",
    REQUEST_CHANGES = "REQUEST_CHANGES",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED"
}

export interface Project {
    code?: string;
    creatorEmail?: string;
    creatorName?: string;
    createdAt?: Date;
    expiresAt?: Date;
    archivedAt?: Date;
    modifiedAt?: Date;
    state?: ProjectState;
    query?: string;
    humanReadable?: string;
    queryFormat?: string;
    queryDetails?: string;
    label?: string;
    description?: string;
    explorerUrl?: string;
    queryContext?: string;
    isCustomConfigSelected?: boolean;
    creatorState?: UserProjectState;
    resultsUrl?: string;
    cohortDefinition?: string;
    outputs?: ProjectOutput[];
}

export interface ProjectOutput {
    projectType: ProjectType;
    outputFormat?: string;
    templateId?: string;
}

export function getAllProjectTypes(project?: Project): ProjectType[] {
    return project?.outputs?.map(o => o.projectType) ?? [];
}

export function getAllProjectTypesFromBridgehead(bridgehead?: Bridgehead): ProjectType[] {
    return bridgehead?.executions?.map(e => e.projectType) ?? [];
}

export function hasProjectType(project?: Project, type?: ProjectType): boolean {
    if (!type) return false; // nothing to check
    return project?.outputs?.some(o => o.projectType === type) ?? false;
}

export interface Notification {
    id?: number;
    email?: string;
    timestamp?: Date;
    projectCode?: string;
    bridgehead?: string;
    humanReadableBridgehead?: string;
    operationType?: string;
    details?: string;
    error?: string;
    httpStatus?: number;
    read?: boolean;
}

export interface User {
    email: string;
    firstName?: string;
    lastName?: string;
    bridgehead: string;
    humanReadableBridgehead?: string;
    projectRole: string;
    projectState: string;
}

export interface MessageSubject {
    message: string;
    subject: string;
    emailTo: string; // This field is not included in the backend
}

export enum ProjectBridgeheadState {
    CREATED = "CREATED",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED"
}

export interface Bridgehead {
    bridgehead: string;
    humanReadable?: string;
    projectCode?: string;
    modifiedAt?: string;
    creatorState?: UserProjectState;
    state?: ProjectBridgeheadState;
    executions?: BridgeheadExecution[];
}

export enum QueryState {
    CREATED = "CREATED",
    TO_BE_SENT = "TO_BE_SENT",
    TO_BE_SENT_AND_EXECUTED = "TO_BE_SENT_AND_EXECUTED",
    SENDING = "SENDING",
    SENDING_AND_EXECUTING = "SENDING_AND_EXECUTING",
    EXPORT_RUNNING_1 = "EXPORT_RUNNING_1",
    EXPORT_RUNNING_2 = "EXPORT_RUNNING_2",
    ERROR = "ERROR",
    FINISHED = "FINISHED"
}

export function isQueryOnTheWay(queryState: QueryState) {
    return [QueryState.TO_BE_SENT, QueryState.TO_BE_SENT_AND_EXECUTED, QueryState.SENDING, QueryState.SENDING_AND_EXECUTING].includes(queryState);
}

export interface BridgeheadExecution {
    projectType: ProjectType;
    queryState: QueryState;
}

export function hasExecution(bridgehead?: Bridgehead, projectType?: ProjectType, queryState?: QueryState): boolean {
    if (!bridgehead?.executions?.length) return false; // no executions at all

    return bridgehead.executions.some(exec => {
        // if projectType is defined, it must match
        const typeMatches = projectType ? exec.projectType === projectType : true;
        // if queryState is defined, it must match
        const stateMatches = queryState ? exec.queryState === queryState : true;

        return typeMatches && stateMatches;
    });
}

export function getQueryState(bridgehead: Bridgehead, projectType?: ProjectType): string | undefined {
    return projectType
        ? bridgehead.executions?.find(e => e.projectType === projectType)?.queryState
        : undefined;
}

export function getMergedQueryStates(
    bridgehead: Bridgehead,
    types: ProjectType[]
): { state: string; types: ProjectType[] }[] {
    const stateMap = new Map<string, ProjectType[]>();

    for (const type of types) {
        const state = getQueryState(bridgehead, type) ?? 'unknown';
        if (!stateMap.has(state)) {
            stateMap.set(state, []);
        }
        stateMap.get(state)!.push(type);
    }

    return Array.from(stateMap.entries()).map(([state, types]) => ({ state, types }));
}

export function hasValidOutputs(project?: Project): boolean {
    return (
        (project?.outputs?.length ?? 0) > 0 &&
        project!.outputs!.every(
            o => o.templateId !== undefined && o.outputFormat !== undefined && o.projectType !== undefined
        )
    );
}

export interface ProjectDocument {
    projectCode: string;
    originalFilename: string;
    url: string;
    createdAt: string;
    bridgehead: string;
    humanReadableBridgehead: string | null;
    creatorEmail: string;
    label: string;
    type: string;
}

export interface Results {
    bridgehead: string
    humanReadableBridgehead: string
    email: string
    firstName: string
    lastName: string
    url: string
    creatorState: string
    bridgeheadAdminState: string,
    finalUserState: string
}

export interface DataShieldProjectStatus {
    project_id: string;
    bk: string;
    project_status: string;
}

export interface ActionButtonGroup {
    label: string
    button: ActionButton[]
}

export interface ActionButton {
    module: Module
    action: Action
    refreshContextCallFunction: () => void
    text: string
    withMessage: boolean
    cssClass: string
    params?: Map<string, string>
    visibilityCondition?: boolean
    doActionOnClick?: () => void
}

export interface FormFieldGroup {
    group: string
    displayName: string
    description: string
}

export interface FormFieldValue {
    label: string
    displayName: string
    description?: string
}

export enum FormDataType {
    // These values are defined in the backend and come from the backend. Therefore, we suppress the warning:
    // noinspection JSUnusedGlobalSymbols
    INTEGER = "INTEGER",
    DOUBLE = "DOUBLE",
    BOOLEAN = "BOOLEAN",
    STRING = "STRING",
    LONG_STRING = "LONG_STRING",
    DATE = "DATE",
    TIMESTAMP = "TIMESTAMP",
    ENUM = "ENUM"
}

export interface FormTitle {
    title: string;
    titleDisplayName?: string;
    titleDescription?: string;
}

export interface FormField extends FormTitle {
    label: string;
    labelDisplayName?: string;
    labelDescription?: string;
    groups?: FormFieldGroup[];
    type?: FormDataType;
    allowedValues?: FormFieldValue[];
    mandatory?: boolean;
    block?: string,
    blockInstance?: number,
    multipleBlock?: boolean,
    minBlockInstances?: number,
    blockDisplayName?: string,
    blockDescription?: string,
    order?: number;
    value?: string;
}

export interface ProjectAndForms {
    project?: Project;
    forms?: FormTitle[];
    formFields: FormField[];
}

export interface FormTemplate {
    template: string
    displayName: string
}

function getActionFromString(value: string): Action | undefined {
    return Object.values(Action).find((action) => action === value) as Action | undefined;
}

export enum HttpMethod {
    GET,
    POST,
    PUT,
    DELETE
}

export type ActionMetadata = {
    path: string;
    method: HttpMethod;
    params: string [];
    explanation: string;
    priority: number;
}

export type Explanations = Map<string, { number: number, message: string }>

export enum configLabel {
    type = 'Type',
    outputFormat = 'Output Format',
    templateId = 'Template ID'
}

function jsonToActionMetadata(json: any): ActionMetadata | undefined {
    const methodMapping: Record<string, HttpMethod> = {
        'GET': HttpMethod.GET,
        'POST': HttpMethod.POST,
        'PUT': HttpMethod.PUT,
        'DELETE': HttpMethod.DELETE
    };
    const method: HttpMethod | undefined = methodMapping[json.method];
    if (method === undefined) {
        return undefined; // or throw an error if you prefer
    }
    return {
        path: json.path,
        method: method,
        params: json.params || [],  // assuming params is an array, provide a default value if it's optional
        explanation: json.explanation,
        priority: json.priority
    };
}

export class ProjectManagerContext {
    projectCode: string | undefined;
    bridgehead: Bridgehead | undefined;

    constructor(projectCode: string | undefined, bridgehead: Bridgehead | undefined) {
        this.projectCode = projectCode;
        this.bridgehead = bridgehead;
    }

}

export const UPLOAD_DOCUMENT_PARAM = 'document';
export const UPLOAD_DOCUMENT_URL_PARAM = 'document-url';

// Variable to hold the backend URL once loaded
let projectManagerBackendUrl: string | null = null;

// Initialize configuration on first load
const initializeConfig = async () => {
    const config = await getConfig();
    projectManagerBackendUrl = config.VUE_APP_PROJECT_MANAGER_BACKEND_URL;
};

// Ensure configuration is initialized at module load
initializeConfig().catch(error => {
    console.error('Error initializing configuration:', error);
});

// Function to create Axios instance with the loaded backend URL
const createAxiosInstance = async (): Promise<AxiosInstance> => {
    if (!projectManagerBackendUrl) {
        await initializeConfig();
    }

    if (!projectManagerBackendUrl) {
        throw new Error("Backend URL not loaded.");
    }

    return axios.create({
        baseURL: projectManagerBackendUrl,
        headers: {
            'Content-Type': 'application/json',
        },
    });
};


export class ProjectManagerBackendService {
    private axiosInstance?: AxiosInstance;
    private activeModuleActionsMetadata?: Map<Module, Map<Action, ActionMetadata>> | undefined;
    private activeModuleActionsMetadataWithExplanation?: Map<Module, Map<Action, ActionMetadata>> | undefined;
    private readonly initializedPromise: Promise<void> | undefined;

    constructor(context: ProjectManagerContext, site: Site) {
        this.initializedPromise = this.initialize(context, site);
    }

    private async initialize(context: ProjectManagerContext, site: Site): Promise<void> {
        try {
            this.axiosInstance = await createAxiosInstance();
            await this.fetchActiveModuleActions(context, site);
        } catch (error) {
            console.error("Initialization failed:", error);
            throw error;
        }
    }

    private async fetchActiveModuleActions(context: ProjectManagerContext, site: Site): Promise<void> {
        const params = new Map<string, string>();
        this.addContextToMap(params, context);
        params.set(siteParam, site);

        try {
            const response = await this.doHttpRequest(HttpMethod.GET, actionsPath, params);
            this.activeModuleActionsMetadata = this.parseModuleActions(response.data);
            this.activeModuleActionsMetadataWithExplanation = this.filterModuleActionsWithExplanations(this.activeModuleActionsMetadata);
        } catch (error) {
            console.error("Error fetching active module actions:", error);
            throw error;
        }
    }

    private filterModuleActionsWithExplanations(actions: Map<Module, Map<Action, ActionMetadata>>):
        Map<Module, Map<Action, ActionMetadata>> {
        const filteredActions = new Map<Module, Map<Action, ActionMetadata>>();

        for (const [module, actionMap] of actions) {
            // Create a new map for the filtered actions of this module
            const filteredActionMap = new Map<Action, ActionMetadata>();

            for (const [action, metadata] of actionMap) {
                // Only include actions where the explanation is not null or undefined
                if (metadata.explanation) {
                    filteredActionMap.set(action, metadata);
                }
            }

            // If there are any filtered actions, add them to the result map
            if (filteredActionMap.size > 0) {
                filteredActions.set(module, filteredActionMap);
            }
        }

        return filteredActions;
    }

    public fetchExplanations(): Explanations {
        const result = new Map()
        const temporal: any[] = [];
        this.activeModuleActionsMetadataWithExplanation?.forEach((module) => {
            module.forEach((action, key) =>
                temporal.push({message: action.explanation, action: key, priority: action.priority}))
        })
        temporal.sort((a, b) => b.priority - a.priority);
        let index = 1;
        temporal.forEach(item => {
            result.set(item.action, {number: index, message: item.message});
            index++;
        })
        return result
    }

    private parseModuleActions(data: any): Map<Module, Map<Action, ActionMetadata>> {
        const resultMap = new Map<Module, Map<Action, ActionMetadata>>();
        for (const moduleName in data) {
            if (Object.prototype.hasOwnProperty.call(data, moduleName)) {
                const module = getModuleFromString(moduleName);
                if (module) {
                    const moduleMap = new Map<Action, ActionMetadata>();
                    const moduleData = data[moduleName];
                    for (const actionName in moduleData) {
                        if (Object.prototype.hasOwnProperty.call(moduleData, actionName)) {
                            const action = getActionFromString(actionName);
                            const actionMetadata = jsonToActionMetadata(moduleData[actionName]);
                            if (action && actionMetadata) {
                                moduleMap.set(action, actionMetadata);
                            }
                        }
                    }
                    resultMap.set(module, moduleMap);
                }
            }
        }
        return resultMap;
    }

    public async isModuleActionActive(module: Module, action: Action): Promise<boolean> {
        await this.initializedPromise;
        return this.getActionMetadata(module, action) !== undefined;
    }

    private getActionMetadata(module: Module, action: Action): ActionMetadata | undefined {
        return this.activeModuleActionsMetadata?.get(module)?.get(action);
    }

    public addContextToMap(map: Map<string, unknown>, context: ProjectManagerContext): void {
        if (context.projectCode) map.set(projectCodeParam, context.projectCode);
        if (context.bridgehead) map.set(bridgeheadParam, context.bridgehead.bridgehead);
    }

    public async downloadFile(
        module: Module,
        action: Action,
        context: ProjectManagerContext,
        params: Map<string, unknown>
    ): Promise<void> {
        try {
            const response = await this.fetchHttpResponse(module, action, context, params);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            const contentDisposition = response.headers['content-disposition'];
            const fileName = contentDisposition
                ? contentDisposition.match(/filename="?([^"]+)"?/)?.[1] || 'downloaded-file'
                : 'downloaded-file';

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error downloading file:", error);
            throw error;
        }
    }

    public async fetchData(
        module: Module,
        action: Action,
        context: ProjectManagerContext,
        params: Map<string, unknown>
    ) {
        return (await this.fetchHttpResponse(module, action, context, params)).data;
    }

    public async fetchHttpResponse(
        module: Module,
        action: Action,
        context: ProjectManagerContext,
        params: Map<string, unknown>
    ): Promise<AxiosResponse> {
        await this.initializedPromise;
        const actionMetadata = this.getActionMetadata(module, action);
        if (!actionMetadata) {
            throw new Error(`Action ${action} for module ${module} is not active`);
        }
        return this.doHttpRequest(actionMetadata.method, actionMetadata.path, this.buildHttpParams(context, params, actionMetadata));
    }

    private buildHttpParams(
        context: ProjectManagerContext,
        params: Map<string, unknown>,
        actionMetadata: ActionMetadata
    ): Map<string, unknown> {
        const httpParams = new Map<string, unknown>();
        this.addContextToMap(httpParams, context);
        for (const param of actionMetadata.params) {
            const value = params.get(param);
            if (value) httpParams.set(param, value);
        }
        return httpParams;
    }

    private async doHttpRequest(
        httpMethod: HttpMethod,
        endpoint: string,
        params: Map<string, unknown>
    ): Promise<AxiosResponse> {
        if (!this.axiosInstance) throw new Error("Axios instance not initialized");

        const token = await AuthService.getToken();
        const config: AxiosRequestConfig = {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
        };

        // If this is a download, expect blob
        if (endpoint.includes('download')) {
            config.responseType = 'blob';
        }

        // If this is an upload, send it as multipart/form-data
        if (endpoint.includes('upload')) {
            config.headers!["Content-Type"] = 'multipart/form-data';
            const uploadFile = params.get(UPLOAD_DOCUMENT_PARAM);
            if (!uploadFile) throw new Error("Upload file not provided");
            params.delete(UPLOAD_DOCUMENT_PARAM);

            const data = new FormData();
            data.append('document', uploadFile as File);

            // Append all other params to FormData
            for (const [key, value] of params) {
                if (value !== undefined && value !== null) {
                    data.append(key, String(value));
                }
            }

            return this.axiosInstance.post(endpoint, data, config);
        }

        // Retry configuration for normal requests
        axiosRetry(this.axiosInstance, {retries: 2, retryDelay: axiosRetry.exponentialDelay});

        // Convert Map params to a plain object
        const plainParams: Record<string, unknown> = {};
        for (const [key, value] of params) {
            plainParams[key] = value;
        }

        switch (httpMethod) {
            case HttpMethod.GET:
            case HttpMethod.DELETE:
                // Variables as query parameters
                config.params = plainParams;
                if (httpMethod === HttpMethod.GET) {
                    return this.axiosInstance.get(endpoint, config);
                } else {
                    return this.axiosInstance.delete(endpoint, config);
                }

            case HttpMethod.POST:
            case HttpMethod.PUT:
                // Variables as JSON body
                if (httpMethod === HttpMethod.POST) {
                    return this.axiosInstance.post(endpoint, plainParams, config);
                } else {
                    return this.axiosInstance.put(endpoint, plainParams, config);
                }

            default:
                throw new Error(`Unsupported HTTP method: ${httpMethod}`);
        }
    }

}
