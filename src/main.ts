import {createApp, h} from 'vue';
import singleSpaVue from 'single-spa-vue';
import App from './App.vue';
import router from './router';


import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import store from './services/store';
import {AuthService, finishLoginFlow, tryLoadUserFromStorage} from "@/services/auth";


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

        // Remove code & state via router, not window.history
        const cleanPath = url.pathname + url.search
            .replace(/([&?])(code|state)=[^&]+/g, '')
            .replace(/^&/, '?');

        await router.replace(cleanPath || "/");
    }
}


export const bootstrap = async () => {

    // If coming from OIDC redirect, process login
    await handleOidcRedirect();
    // Try to load cached user first
    await tryLoadUserFromStorage();
    // Trigger login if no valid user exists
    if (!AuthService.isLoggedIn()) {
        try {
            await AuthService.getToken(); // triggers silent renew first
        } catch {
            await AuthService.login();
        }
    }


    return vueLifecycles.bootstrap;
};

export const mount = vueLifecycles.mount;
export const unmount = vueLifecycles.unmount;
