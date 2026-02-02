import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';
import ProjectView from '../components/ProjectView.vue';
import ProjectDashboard from "@/components/ProjectDashboard.vue";
import AdminConfig from "@/components/AdminConfig.vue";

import { createStore } from 'vuex';
import OidcCallback from "@/components/OidcCallback.vue";

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
        // Actions zum Setzen von Benutzername und Rolle
    },
    getters: {
        // Getters zum Abrufen von Benutzername und Rolle
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

const router = createRouter({
    history: createWebHistory(),
    routes,
});
router.beforeEach((to, from, next) => {
    document.title = to.meta.title as string;
    next();
});

export default router;
