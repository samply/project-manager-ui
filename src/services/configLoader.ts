// configLoader.ts
let config: any = null;
let isLoading = false; // Track whether the config is being loaded

const loadConfig = async () => {
    if (!isLoading) {
        isLoading = true; // Prevent multiple concurrent loads
        try {
            const response = await fetch('/config.json');
            config = await response.json();
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

export const getConfig = async () => {
    if (config === null) {
        await loadConfig(); // Load the config if it's not already loaded
    }
    return config;
};
