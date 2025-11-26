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
    const url = new URL(window.location.href);

    if (url.searchParams.has("code")) {
        await finishLoginFlow();

        // Remove only code & state, keep everything else
        url.searchParams.delete("code");
        url.searchParams.delete("state");

        window.history.replaceState({}, document.title, url.toString());
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
