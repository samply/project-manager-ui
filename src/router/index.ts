import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';
import ProjectView from '../components/ProjectView.vue';
import MainDashboard from '../components/MainDashboard.vue';


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
        name: 'MainDashboard',
        component: MainDashboard,
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
