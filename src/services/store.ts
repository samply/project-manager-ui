// store.js
import { createStore } from 'vuex';

export enum ActionFeedbackType {
    SUCCESS = 'success',
    ERROR = 'error',
}

export interface ActionFeedback {
    id: number;
    type: ActionFeedbackType;
    message: string;
}

let nextFeedbackId = 1;

export default createStore({
    state: {
        isSidebarClosed: false,
        actionFeedbackMessages: [] as ActionFeedback[],
    },
    mutations: {
        toggleSidebar(state) {
            state.isSidebarClosed = !state.isSidebarClosed;
        },
        showActionFeedback(state, feedback: Omit<ActionFeedback, 'id'>) {
            state.actionFeedbackMessages.push({
                ...feedback,
                id: nextFeedbackId++,
            });
        },
        dismissActionFeedback(state, id: number) {
            state.actionFeedbackMessages = state.actionFeedbackMessages.filter(
                feedback => feedback.id !== id
            );
        },
    },
});
