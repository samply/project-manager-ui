import {createApp, h} from 'vue';
import singleSpaVue from 'single-spa-vue';
import App from './App.vue';
import {createAppRouter} from './router';
import store from './services/store';
import type {Router} from "vue-router";
import {getConfig} from "@/services/configLoader";

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';

import {AuthService, finishLoginFlow, tryLoadUserFromStorage} from "@/services/auth";

let router: Router | null = null;

async function handleOidcRedirect(appRouter: Router) {
    const url = new URL(window.location.href);

    if (url.searchParams.has("code")) {
        // finishLoginFlow now returns the saved target URL
        const targetUrl = await finishLoginFlow();
        await appRouter.replace(targetUrl);
    }
}

// noinspection JSUnusedGlobalSymbols
/**
 * These lifecycle functions (bootstrap, mount, unmount) are intentionally
 * not referenced within this project.
 *
 * They are required entry points for Single-SPA. The root-config application
 * dynamically loads this micro frontend and invokes these exports at runtime.
 *
 * Because the usage happens externally, IntelliJ and TypeScript mark them
 * as "unused". The `// noinspection JSUnusedGlobalSymbols` suppression is
 * therefore intentional and should not be removed.
 */

// noinspection JSUnusedGlobalSymbols
const vueLifecycles = singleSpaVue({
    createApp,
    appOptions: {
        render() {
            return h(App);
        },
    },
    handleInstance(app) {
        if (!router) {
            throw new Error('Router has not been initialized');
        }
        app.use(router);
        app.use(store);
    },
});

// noinspection JSUnusedGlobalSymbols
export const bootstrap = [
    async () => {
        const config = await getConfig();
        router = createAppRouter(config.VUE_APP_FRONTEND_URL);

        await handleOidcRedirect(router);
        await tryLoadUserFromStorage();

        if (!AuthService.isLoggedIn()) {
            try {
                await AuthService.getToken();
            } catch {
                await AuthService.login();
            }
        }
    },
    vueLifecycles.bootstrap,
];

// noinspection JSUnusedGlobalSymbols
export const mount = vueLifecycles.mount;
// noinspection JSUnusedGlobalSymbols
export const unmount = vueLifecycles.unmount;
