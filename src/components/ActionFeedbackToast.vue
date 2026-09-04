<script lang="ts">
import {defineComponent} from 'vue';
import store, {ActionFeedback, ActionFeedbackType} from '@/services/store';

export default defineComponent({
  name: 'ActionFeedbackToast',
  data() {
    return {
      dismissalTimers: new Map<number, number>(),
      feedbackType: ActionFeedbackType,
    };
  },
  computed: {
    feedbackMessages(): ActionFeedback[] {
      return store.state.actionFeedbackMessages;
    },
  },
  watch: {
    feedbackMessages: {
      handler(messages: ActionFeedback[]) {
        messages.forEach(message => {
          if (!this.dismissalTimers.has(message.id)) {
            const duration = message.type === ActionFeedbackType.SUCCESS ? 5000 : 8000;
            const timer = window.setTimeout(() => this.dismiss(message.id), duration);
            this.dismissalTimers.set(message.id, timer);
          }
        });
      },
      deep: true,
      immediate: true,
    },
  },
  beforeUnmount() {
    this.dismissalTimers.forEach(timer => window.clearTimeout(timer));
    this.dismissalTimers.clear();
  },
  methods: {
    dismiss(id: number) {
      const timer = this.dismissalTimers.get(id);
      if (timer !== undefined) {
        window.clearTimeout(timer);
        this.dismissalTimers.delete(id);
      }
      store.commit('dismissActionFeedback', id);
    },
  },
});
</script>

<template>
  <div class="action-feedback-container" aria-atomic="false">
    <div
        v-for="feedback in feedbackMessages"
        :key="feedback.id"
        class="alert alert-dismissible fade show shadow action-feedback"
        :class="feedback.type === feedbackType.SUCCESS ? 'alert-success' : 'alert-danger'"
        :role="feedback.type === feedbackType.SUCCESS ? 'status' : 'alert'"
        :aria-live="feedback.type === feedbackType.SUCCESS ? 'polite' : 'assertive'"
    >
      <i
          class="bi action-feedback-icon"
          :class="feedback.type === feedbackType.SUCCESS ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'"
          aria-hidden="true"
      ></i>
      <span v-html="feedback.message"></span>
      <button
          type="button"
          class="btn-close"
          :aria-label="feedback.type === feedbackType.SUCCESS ? 'Dismiss success message' : 'Dismiss error message'"
          @click="dismiss(feedback.id)"
      ></button>
    </div>
  </div>
</template>

<style scoped>
.action-feedback-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1100;
  width: min(28rem, calc(100vw - 2rem));
}

.action-feedback {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding-right: 3rem;
}

.action-feedback-icon {
  flex: 0 0 auto;
  margin-top: 0.1rem;
}
</style>
