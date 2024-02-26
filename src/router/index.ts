import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';
import ProjectView from '../components/ProjectView.vue';
import ProjectDashboard from "@/components/ProjectDashboard.vue";


const routes: Array<RouteRecordRaw> = [
    {
        path: '/project-view',
        name: 'ProjectView',
        component: ProjectView,
        props: (route) => ({
            projectCode: route.query['project-code'] // Accessing the project-code query parameter
        })
    },
    {
        path: '/',
        name: 'ProjectDashboard',
        component: ProjectDashboard,
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
