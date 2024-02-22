import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';
import ProjectView from '../components/ProjectView.vue';
import MainDashboard from '../components/MainDashboard.vue';


const routes: Array<RouteRecordRaw> = [
    {
        path: '/project-view/:projectId',
        name: 'ProjectView',
        component: ProjectView,
        props: true
    },
    {
        path: '/',
        name: 'MainDashboard',
        component: MainDashboard,
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
