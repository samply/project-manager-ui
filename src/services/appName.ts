import {getConfig} from "@/services/configLoader";

// The application's display name, as configured per instance (PAGE_TITLE, the
// same variable as the browser tab title). Texts that name the application
// use this instead of a hard-coded product name.
export const DEFAULT_APP_NAME = 'Data Request';

export const getAppName = async (): Promise<string> => {
    try {
        return (await getConfig()).PAGE_TITLE?.trim() || DEFAULT_APP_NAME;
    } catch {
        return DEFAULT_APP_NAME;
    }
};
