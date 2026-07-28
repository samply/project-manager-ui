import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';
import {getFrontendUrl} from "@/services/frontendUrl";
import ProjectView from '../components/ProjectView.vue';
import ProjectDashboard from "@/components/ProjectDashboard.vue";
import AdminConfig from "@/components/AdminConfig.vue";

import {createStore} from 'vuex';

createStore({
    state: {
        username: '',
        role: ''
    },
    mutations: {
        setUsername(state, username) {
            state.username = username;
        },
        setRole(state, role) {
            state.role = role;
        }
    },
    actions: {
        /* Actions to set username and role */
    },
    getters: {
        /* Getters for retrieving username and role */
    }
});

const routes: Array<RouteRecordRaw> = [
    {
        path: '/project-view',
        name: 'ProjectView',
        meta: {title: 'Samply.Requester'},
        component: ProjectView,
        props: (route) => ({
            projectCode: route.query['project-code'] // Accessing the project-code query parameter
        })
    },
    {
        path: '/',
        name: 'ProjectDashboard',
        meta: {title: 'Samply.Requester'},
        component: ProjectDashboard,
    },
    {
        path: '/config',
        name: 'AdminConfig',
        meta: {title: 'PM-Admin Configuration'},
        component: AdminConfig,
    }
];

export function createAppRouter(frontendUrlValue: string) {
    const router = createRouter({
        history: createWebHistory(getFrontendUrl(frontendUrlValue).pathname),
        routes,
    });

    router.beforeEach((to, _from, next) => {
        document.title = to.meta.title as string;
        next();
    });

    return router;
}
