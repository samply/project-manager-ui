import {createApp, h} from 'vue';
import singleSpaVue from 'single-spa-vue';
import App from './App.vue';
import KeyCloakService from "@/services/keycloak";
import router from './router';


import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import store from './services/store';


const app = createApp(App);

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


export const bootstrap = async () => {
    return new Promise((resolve) => {
        const onAuthenticatedCallback = () => {
            console.log('Authenticated!');
            resolve(vueLifecycles.bootstrap);
        };

        KeyCloakService.CallLogin(onAuthenticatedCallback);
    });
};

export const mount = vueLifecycles.mount;
export const unmount = vueLifecycles.unmount;
