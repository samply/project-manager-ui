import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import ProjectView from '../components/projectView.vue';
import MainDashboard from '../components/mainDashboard.vue';
import RequestForm from '../components/requestForm.vue';

const routes: Array<RouteRecordRaw> = [
    {
        path: '/project-view/:projectId',
        name: 'projectView',
        component: ProjectView,
        props: true
    },
    {
        path: '/',
        name: 'mainDashboard',
        component: MainDashboard,
    },
    {
        path: '/request-form',
        name: 'requestForm',
        component: RequestForm,
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
