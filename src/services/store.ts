// store.js
// @ts-ignore
import { createStore } from 'vuex';

export default createStore({
    state: {
        isSidebarClosed: false,
    },
    mutations: {
        // @ts-ignore
        toggleSidebar(state) {
            state.isSidebarClosed = !state.isSidebarClosed;
        },
    },
});
