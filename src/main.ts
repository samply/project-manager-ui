import { createApp, h } from 'vue';
import singleSpaVue from 'single-spa-vue';
import App from './App.vue';
import KeyCloakService from "@/services/keycloak";
import router from './router';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import store from './services/store';

// Fetch the config.json file before initializing the app
fetch('/config.json')
    .then(response => response.json())
    .then(config => {
        // Create the app after the config is loaded
        const app = createApp(App);

        // Add the config to global properties so it can be accessed in components
        app.config.globalProperties.$config = config;

        const vueLifecycles = singleSpaVue({
            createApp: () => app,
            appOptions: {
                render() {
                    return h(App);
                },
            },
        });

        app.use(router);
        app.use(store);

        // Bootstrap function for single-spa lifecycle
        export const bootstrap = async () => {
            return new Promise((resolve) => {
                const onAuthenticatedCallback = () => {
                    console.log('Authenticated!');
                    resolve(vueLifecycles.bootstrap);
                };

                KeyCloakService.CallLogin(onAuthenticatedCallback);
            });
        };

        // Export mount and unmount for single-spa
        export const mount = vueLifecycles.mount;
        export const unmount = vueLifecycles.unmount;

    })
    .catch(error => {
        console.error('Failed to load config.json:', error);
    });
