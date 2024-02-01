// projetManagerBackendService.ts
import axios, {AxiosResponse} from 'axios';
import axiosRetry from "axios-retry";


const baseURL = process.env.VUE_APP_PROJECT_MANAGER_BACKEND_URL

const bridgeheadParam = 'bridgehead'
const projectCodeParam = 'project-code'
const siteParam = 'site'

const actionsPath = '/actions'

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
    VOTUM_ACTIONS_MODULE = "VOTUM_ACTIONS",
    EXPORT_MODULE = "EXPORT",
    TOKEN_MANAGER_MODULE = "TOKEN_MANAGER"
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
    FETCH_AUTHENTICATION_SCRIPT_ACTION = "FETCH_AUTHENTICATION_SCRIPT",
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
    DOWNLOAD_APPLICATION_FORM_ACTION = "DOWNLOAD_APPLICATION_FORM",
    DOWNLOAD_PUBLICATION_ACTION = "DOWNLOAD_PUBLICATION",
    DOWNLOAD_SCRIPT_ACTION = "DOWNLOAD_SCRIPT",
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
    FETCH_NOTIFICATIONS_ACTION = "FETCH_NOTIFICATIONS"
}

export enum HttpMethod {
    GET,
    POST
}

export type ActionMetadata = {
    path: string;
    method: HttpMethod;
    params: string [];
}

export class ProjectManagerContext {
    projectCode: string | undefined;
    bridgehead: string | undefined;
}

export class ProjetManagerBackendService {
    private baseURL: string | undefined;
    //private activeModuleActionsMetadata: Map<Module, Map<Action, ActionMetadata>> | undefined;
    private activeModuleActionsMetadata: any;
    private _isInitialized: Promise<void> | undefined;

    constructor(context: ProjectManagerContext, site: Site) {
        this.baseURL = baseURL
        this.fetchActiveModuleActions(context, site)
    }

    async fetchActiveModuleActions(context: ProjectManagerContext, site: Site) {
        const httpParams: Map<string, string> = new Map<string, string>();
        this.addContextToMap(httpParams, context);
        httpParams.set(siteParam, site);
        console.log('Fetching active module actions...');
        this._isInitialized = this.doHttpRequest(HttpMethod.GET, actionsPath, httpParams)
            .then(data => {
                console.log('Active Module Actions Metadata:', data);
                this.activeModuleActionsMetadata = data;
            })
            .catch(error => {
                console.error('Error fetching active module actions:', error);
            });
    }

    isInitialized(): Promise<void> | undefined {
        return this._isInitialized;
    }

    isModuleActionActive(module: Module, action: Action): boolean {
        return this.getActionMetadata(module, action) !== undefined;
    }

    getActionMetadata(module: Module, action: Action): ActionMetadata | undefined {
        console.log(this.activeModuleActionsMetadata);
        return this.activeModuleActionsMetadata[module][action];
        /*const actionMetadataMap = this.activeModuleActionsMetadata?.get(module)
        if (actionMetadataMap) {
            return actionMetadataMap.get(action)
        }
        return undefined;*/
    }

    addContextToMap(map: Map<string, string>, context: ProjectManagerContext) {
        if (context.projectCode) {
            map.set(projectCodeParam, context.projectCode)
        }
        if (context.bridgehead) {
            map.set(bridgeheadParam, context.bridgehead)
        }
    }

    async fetchData(module: Module, action: Action, context: ProjectManagerContext, params: Map<string, string>): Promise<any> {
        const actionMetadata = this.getActionMetadata(module, action);
        console.log("getActionMetadata passed");
        console.log(actionMetadata);
        if (actionMetadata) {
            return this.doHttpRequest(actionMetadata.method, actionMetadata.path, this.fetchHttpParams(module, action, context, params))
        } else {
            throw new Error('Action ' + action + ' for module ' + module + ' not active')
        }
    }

    fetchHttpParams(module: Module, action: Action, context: ProjectManagerContext, params: Map<string, string>): Map<string, string> {
        const result = new Map<string, string>()
        const actionMetadata = this.getActionMetadata(module, action);
        if (actionMetadata) {
            this.addContextToMap(result, context)
            for (const param of actionMetadata.params) {
                const value = params.get(param);
                if (value) {
                    result.set(param, value)
                }
            }
        }
        return result
    }

    async doHttpRequest(httpMethod: HttpMethod, endpoint: string, httpParams: Map<string, string>): Promise<any> {
        try {
            //const token = KeyCloakService.getToken();
            const url = `${this.baseURL}${endpoint}`
            const config = {
                /*headers: {
                    Authorization: `Bearer ${token}`
                },*/
                params: this.convertToUrlSearchParams(httpParams),
                withCredentials: true
            }
            axiosRetry(axios, {
                retries: 2,
                retryDelay: axiosRetry.exponentialDelay,
                /*retryCondition: (error) => {
                    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ETIMEDOUT';
                }*/
            });
            let response: AxiosResponse<any, any>;
            switch (httpMethod) {
                case HttpMethod.GET:
                    response = await axios.get(url, config)
                    break;
                case HttpMethod.POST:
                    //TODO: data not null
                    response = await axios.post(url, {}, config)
                // Other methods for PUT, DELETE, etc. (Currently not used in Project Manager Backend)
            }
            console.log('HTTP Response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }

    convertToUrlSearchParams(map: Map<string, string>): URLSearchParams {
        const result = new URLSearchParams();
        if (map) {
            for (const [key, value] of map) {
                result.append(key, value);
            }
        }
        return result;
    }

}
