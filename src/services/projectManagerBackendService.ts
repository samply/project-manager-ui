//projectManagerBackendService.ts
import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
import axiosRetry from "axios-retry";
import KeyCloakService from "@/services/keycloak";
import {getConfig} from "@/services/configLoader";


const bridgeheadParam = 'bridgehead'
const projectCodeParam = 'project-code'
const siteParam = 'site'

const actionsPath = '/actions'

export enum ProjectRole {
    CREATOR = "CREATOR",
    DEVELOPER = "DEVELOPER",
    PILOT = "PILOT",
    FINAL = "FINAL",
    BRIDGEHEAD_ADMIN = "BRIDGEHEAD_ADMIN",
    PROJECT_MANAGER_ADMIN = "PROJECT_MANAGER_ADMIN"
}

export enum Site {
    PROJECT_DASHBOARD_SITE = "project-dashboard",
    PROJECT_VIEW_SITE = "project-view"
}

export enum Module {
    PROJECTS_MODULE = "PROJECTS",
    USER_MODULE = "USER",
    PROJECT_STATE_MODULE = "PROJECT_STATE",
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
    DOWNLOAD_APPLICATION_FORM_TEMPLATE_ACTION = "DOWNLOAD_APPLICATION_FORM_TEMPLATE",
    SAVE_QUERY_IN_BRIDGEHEAD_ACTION = "SAVE_QUERY_IN_BRIDGEHEAD",
    SAVE_AND_EXECUTE_QUERY_IN_BRIDGEHEAD_ACTION = "SAVE_AND_EXECUTE_QUERY_IN_BRIDGEHEAD",
    DOWNLOAD_AUTHENTICATION_SCRIPT_ACTION = "DOWNLOAD_AUTHENTICATION_SCRIPT",
    EDIT_PROJECT_ACTION = "EDIT_PROJECT",
    FETCH_EXPORTER_TEMPLATES_ACTION = "EXPORTER_TEMPLATES",
    FETCH_QUERY_FORMATS_ACTION = "FETCH_QUERY_FORMATS",
    FETCH_OUTPUT_FORMATS_ACTION = "FETCH_OUTPUT_FORMATS",
    UPLOAD_VOTUM_ACTION = "UPLOAD_VOTUM",
    UPLOAD_APPLICATION_FORM_ACTION = "UPLOAD_APPLICATION_FORM",
    UPLOAD_PUBLICATION_ACTION = "UPLOAD_PUBLICATION",
    UPLOAD_SCRIPT_ACTION = "UPLOAD_SCRIPT",
    UPLOAD_OTHER_DOCUMENT_ACTION = "UPLOAD_OTHER_DOCUMENT",
    ADD_PUBLICATION_URL_ACTION = "ADD_PUBLICATION_URL",
    ADD_OTHER_DOCUMENT_URL_ACTION = "ADD_OTHER_DOCUMENT_URL",
    DOWNLOAD_VOTUM_ACTION = "DOWNLOAD_VOTUM",
    EXISTS_VOTUM_ACTION = "EXISTS_VOTUM",
    EXISTS_APPLICATION_FORM_ACTION = "EXISTS_APPLICATION_FORM",
    DOWNLOAD_APPLICATION_FORM_ACTION = "DOWNLOAD_APPLICATION_FORM",
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
    FETCH_APPLICATION_FORM_DESCRIPTION_ACTION = "FETCH_APPLICATION_FORM_DESCRIPTION",
    FETCH_VOTUM_DESCRIPTION_ACTION = "FETCH_VOTUM_DESCRIPTION",
    FETCH_SCRIPT_DESCRIPTION_ACTION = "FETCH_SCRIPT_DESCRIPTION",
    EXIST_INVITED_USERS_ACTION = "EXIST_INVITED_USERS",
    ACCEPT_PROJECT_ANALYSIS_ACTION = "ACCEPT_PROJECT_ANALYSIS",
    REJECT_PROJECT_ANALYSIS_ACTION = "REJECT_PROJECT_ANALYSIS",
    REQUEST_CHANGES_IN_PROJECT_ANALYSIS_ACTION = "REQUEST_CHANGES_IN_PROJECT_ANALYSIS",
    SEND_EXPORT_FILES_TO_RESEARCH_ENVIRONMENT_ACTION = "SEND_EXPORT_FILES_TO_RESEARCH_ENVIRONMENT",
    ARE_EXPORT_FILES_TRANSFERRED_TO_RESEARCH_ENVIRONMENT_ACTION = "ARE_EXPORT_FILES_TRANSFERRED_TO_RESEARCH_ENVIRONMENT"

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
    QUERY_CONTEXT = "query-context"
}

export interface Project {
    code: string | null;
    creatorEmail: string | null | undefined;
    creatorName: string | null;
    createdAt: Date | null;
    expiresAt: Date | null;
    archivedAt: Date | null;
    modifiedAt: Date | null;
    state: string | null;
    type: string | null;
    query: string | null;
    humanReadable: string | null;
    queryFormat: string | null;
    outputFormat: string | null;
    templateId: string | null;
    label: string | null;
    description: string | null;
    explorerUrl: string | null;
    queryContext: string | null;
    isCustomConfig: boolean | null;
}

export interface Notification {
    id: number | null;
    email: string | null;
    timestamp: Date | null;
    projectCode: string | null;
    bridgehead: string | null;
    humanReadableBridgehead: string | null;
    operationType: string | null;
    details: string | null;
    error: string | null;
    httpStatus: number | null;
    read: boolean | null;
}

export interface User {
    email: string;
    firstName: string | null;
    lastName: string | null;
    bridgehead: string;
    humanReadableBridgehead: string | null;
    projectRole: string;
    projectState: string;
}


export interface Bridgehead {
    projectCode: string;
    bridgehead: string;
    humanReadable: string | null;
    state: string;
    modifiedAt: string;
    queryState: string;
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

export interface ProjectField {
    fieldKey: string
    editProjectParam: EditProjectParam[]
    fieldValue: string[]
    redirectUrl?: string
    isEditable: boolean
    possibleValues?: string[]
    configurations?: Map<string, Project>
    uploadAction?: Action
    downloadAction?: Action
    downloadModule?: Module
    todos?: Explanations
    existFile?: boolean
    transformForSending?: (input: string) => string
    draftDialogCurrentStep: number
    visibilityCondition: boolean
}

export interface DataShieldProjectStatus {
    project_id: string;
    bk: string;
    project_status: string;
}

export interface ActionModule {
    module: Module
    action: Action
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
    visibilityCondition?: boolean
}

function getActionFromString(value: string): Action | undefined {
    return Object.values(Action).find((action) => action === value) as Action | undefined;
}

export enum HttpMethod {
    GET,
    POST
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
        // Add more mappings if necessary
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
    private initializedPromise: Promise<void> | undefined;

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
                // Only include actions where explanation is not null or undefined
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
    ): Promise<AxiosResponse<any, any>> {
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
    ): Promise<AxiosResponse<any, any>> {
        if (!this.axiosInstance) throw new Error("Axios instance not initialized");

        const config: AxiosRequestConfig = {
            headers: {
                Authorization: `Bearer ${KeyCloakService.getToken()}`,
            },
            params: this.convertToUrlSearchParams(params),
            withCredentials: true,
        };

        if (endpoint.includes('download')) config.responseType = 'blob';

        if (endpoint.includes('upload')) {
            config.headers!["Content-Type"] = 'multipart/form-data';
            const uploadFile = params.get(UPLOAD_DOCUMENT_PARAM);
            if (!uploadFile) throw new Error("Upload file not provided");
            params.delete(UPLOAD_DOCUMENT_PARAM);
            const data = new FormData();
            data.append('document', uploadFile as File);
            return this.axiosInstance.post(endpoint, data, config);
        }

        axiosRetry(this.axiosInstance, {retries: 2, retryDelay: axiosRetry.exponentialDelay});

        switch (httpMethod) {
            case HttpMethod.GET:
                return this.axiosInstance.get(endpoint, config);
            case HttpMethod.POST:
                return this.axiosInstance.post(endpoint, {}, config);
            default:
                throw new Error(`Unsupported HTTP method: ${httpMethod}`);
        }
    }

    private convertToUrlSearchParams(map: Map<string, unknown>): URLSearchParams {
        const result = new URLSearchParams();
        for (const [key, value] of map) {
            result.append(key, String(value));
        }
        return result;
    }

}
