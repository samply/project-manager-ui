import { createApp, h } from 'vue';
import singleSpaVue from 'single-spa-vue';
import App from './App.vue';
import KeyCloakService from "@/services/keycloak";
import router from './router';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import store from './services/store';

let vueLifecycles: any;
let config: any;

// Fetch the config.json file before initializing the app
export const bootstrap = async () => {
    try {
        const response = await fetch('/config.json');
        config = await response.json();

        // Create the app after the config is loaded
        const app = createApp(App);

        // Add the config to global properties so it can be accessed in components
        app.config.globalProperties.$config = config;

        vueLifecycles = singleSpaVue({
            createApp: () => app,
            appOptions: {
                render() {
                    return h(App);
                },
            },
        });

        app.use(router);
        app.use(store);

        // Initialize Keycloak with loaded config if necessary
        return new Promise((resolve) => {
            const onAuthenticatedCallback = () => {
                console.log('Authenticated!');
                resolve(vueLifecycles.bootstrap);
            };
            KeyCloakService.CallLogin(onAuthenticatedCallback);
        });
    } catch (error) {
        console.error('Failed to load config.json:', error);
        throw new Error('Configuration loading failed');
    }
};

// Export mount and unmount for single-spa lifecycle
export const mount = async () => {
    if (vueLifecycles) {
        return vueLifecycles.mount();
    }
    console.error('Vue lifecycles not initialized');
};

export const unmount = async () => {
    if (vueLifecycles) {
        return vueLifecycles.unmount();
    }
    console.error('Vue lifecycles not initialized');
};
