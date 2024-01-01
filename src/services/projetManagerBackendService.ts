// projetManagerBackendService.ts
import axios, {AxiosResponse} from 'axios';
import axiosRetry from "axios-retry";
import KeyCloakService from "@/services/keycloak";

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
    USER = "USER",
    PROJECT_STATE = "PROJECT_STATE",
    PROJECT_DOCUMENTS = "PROJECT_DOCUMENTS",
    EXPORT = "EXPORT",
    TOKEN_MANAGER = "TOKEN_MANAGER"
}

export enum Action {
    SET_DEVELOPER_USER = "SET_DEVELOPER_USER",
    SET_PILOT_USER = "SET_PILOT_USER",
    SET_FINAL_USER = "SET_FINAL_USER",
    CREATE_PROJECT = "CREATE_PROJECT",
    ACCEPT_PROJECT = "ACCEPT_PROJECT",
    REJECT_PROJECT = "REJECT_PROJECT",
    ARCHIVE_PROJECT = "ARCHIVE_PROJECT",
    START_DEVELOP_STAGE = "START_DEVELOP_STAGE",
    START_PILOT_STAGE = "START_PILOT_STAGE",
    START_FINAL_STAGE = "START_FINAL_STAGE",
    FINISH_PROJECT = "FINISH_PROJECT",
    UPLOAD_PROJECT_DOCUMENT = "UPLOAD_PROJECT_DOCUMENT",
    ADD_PROJECT_DOCUMENT_URL = "ADD_PROJECT_DOCUMENT_URL",
    DOWNLOAD_PROJECT_DOCUMENT = "DOWNLOAD_PROJECT_DOCUMENT",
    SAVE_QUERY_IN_BRIDGEHEAD = "SAVE_QUERY_IN_BRIDGEHEAD",
    SAVE_AND_EXECUTE_QUERY_IN_BRIDGEHEAD = "SAVE_AND_EXECUTE_QUERY_IN_BRIDGEHEAD",
    FETCH_AUTHENTICATION_SCRIPT = "FETCH_AUTHENTICATION_SCRIPT"
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
    private activeModuleActionsMetadata: Map<Module, Map<Action, ActionMetadata>> | undefined;

    constructor(context: ProjectManagerContext, site: Site) {
        this.baseURL = baseURL
        this.fetchActiveModuleActions(context, site)
    }

    fetchActiveModuleActions(context: ProjectManagerContext, site: Site) {
        const httpParams: Map<string, string> = new Map<string, string>()
        this.addContextToMap(httpParams, context)
        httpParams.set(siteParam, site)
        this.doHttpRequest(HttpMethod.GET, actionsPath, httpParams).then(data => this.activeModuleActionsMetadata = data)
    }

    isModuleActionActive(module: Module, action: Action): boolean {
        return (this.getActionMetadata(module, action) !== undefined)
    }

    getActionMetadata(module: Module, action: Action): ActionMetadata | undefined {
        const actionMetadataMap = this.activeModuleActionsMetadata?.get(module)
        if (actionMetadataMap) {
            return actionMetadataMap.get(action)
        }
        return undefined;
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
