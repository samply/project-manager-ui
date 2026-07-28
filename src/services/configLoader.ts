// configLoader.ts
import {FRONTEND_VARIABLES_PATH} from "@/services/BridgeheadOverviewHeaders";

export interface FrontendConfig {
    VUE_APP_BACKEND_URL: string;
    VUE_APP_OIDC_URL: string;
    VUE_APP_OIDC_CLIENT_ID: string;
    VUE_APP_FRONTEND_NAME: string;
    VUE_APP_LOGO_URL?: string;
    LOGO_TEXT?: string;
    LOGO_URL?: string;
    PROJECT_URL?: string;
    LOGO_HTML?: string;
    LOGO_CSS?: string;
    [key: string]: unknown;
}

let config: FrontendConfig | null = null;
let isLoading = false; // Track whether the config is being loaded


const fetchJson = async <T>(url: string): Promise<T> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Request failed for ${url} with status ${response.status}`);
    }
    return await response.json() as T;
};

const loadConfig = async () => {
    if (!isLoading) {
        isLoading = true; // Prevent multiple concurrent loads
        try {
            const frontendConfig = await fetchJson<FrontendConfig>('/config.json');

            let backendConfig: Partial<FrontendConfig> = {};
            try {
                backendConfig = await fetchJson<Partial<FrontendConfig>>(
                    `${frontendConfig.VUE_APP_BACKEND_URL}${FRONTEND_VARIABLES_PATH}`
                );
            } catch (error) {
                console.warn('Failed to load backend config:', error);
            }

            config = {
                ...frontendConfig,
                ...backendConfig,
            };
        } catch (error) {
            console.error('Failed to load config.json:', error);
            throw new Error('Configuration loading failed');
        } finally {
            isLoading = false; // Reset loading state
        }
    }

    // Wait until config is loaded
    while (config === null) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Polling
    }
};

export const getConfig = async (): Promise<FrontendConfig> => {
    if (config === null) {
        await loadConfig(); // Load the config if it's not already loaded
    }

    if (config === null) {
        throw new Error('Configuration loading failed');
    }

    return config;
};
