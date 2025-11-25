import {createApp, h} from 'vue';
import singleSpaVue from 'single-spa-vue';
import App from './App.vue';
import router from './router';


import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import store from './services/store';
import {AuthService, finishLoginFlow, startLoginFlow, tryLoadUserFromStorage} from "@/services/auth";


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

async function handleOidcRedirect() {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has("code")) {
        // Process the login callback automatically
        await finishLoginFlow();

        // Replace URL so user sees main app page instead of query parameters
        window.history.replaceState({}, document.title, "/");
    }
}

export const bootstrap = async () => {
    // Try to load cached user first
    await tryLoadUserFromStorage();

    // If coming from OIDC redirect, process login
    await handleOidcRedirect();

    // Trigger login if no valid user exists
    if (!AuthService.isLoggedIn()) {
        await AuthService.login();
    }

    return vueLifecycles.bootstrap;
};

export const mount = vueLifecycles.mount;
export const unmount = vueLifecycles.unmount;
