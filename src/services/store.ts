// store.js
import { createStore } from 'vuex';

export default createStore({
    state: {
        isSidebarClosed: false,
    },
    mutations: {
        toggleSidebar(state) {
            state.isSidebarClosed = !state.isSidebarClosed;
        },
    },
});
