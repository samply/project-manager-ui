<script lang="ts">
import {defineComponent, PropType} from "vue";

export type ReasonMode = 'none' | 'optional' | 'required';

// Confirmation for an action that notifies others or cannot be undone: what happens, who gets an email and,
// where the others need it, a reason. A native <dialog> opened with showModal(): focus stays inside, Escape
// cancels, and the page behind cannot be used meanwhile.
export default defineComponent({
  name: "ActionDialog",
  props: {
    // The action's label, also the confirm button ("Reject request")
    title: {type: String, required: true},
    description: {type: String, default: ''},
    // "the requester and the admins of all sites"; empty = no email line
    recipients: {type: String, default: ''},
    reasonMode: {type: String as PropType<ReasonMode>, default: 'none'},
    danger: {type: Boolean, default: false},
    pending: {type: Boolean, default: false},
    // Shown inside the dialog: a toast behind the modal backdrop would not be seen.
    errorMessage: {type: String, default: ''},
  },
  emits: ['confirm', 'cancel'],
  data() {
    return {
      reason: '',
      showReasonError: false,
    };
  },
  computed: {
    reasonId(): string {
      return `action-dialog-reason-${this.$.uid}`;
    },
    titleId(): string {
      return `action-dialog-title-${this.$.uid}`;
    },
  },
  methods: {
    open() {
      this.reason = '';
      this.showReasonError = false;
      (this.$refs.dialog as HTMLDialogElement).showModal();
    },
    close() {
      (this.$refs.dialog as HTMLDialogElement).close();
    },
    confirm() {
      if (this.reasonMode === 'required' && this.reason.trim().length === 0) {
        this.showReasonError = true;
        (this.$refs.reasonInput as HTMLTextAreaElement | undefined)?.focus();
        return;
      }
      this.$emit('confirm', this.reason.trim());
    },
    // Escape and the Cancel button; not while the action is running.
    onCancel(event?: Event) {
      if (this.pending) {
        event?.preventDefault();
        return;
      }
      this.close();
      this.$emit('cancel');
    },
  },
});
</script>

<template>
  <dialog ref="dialog" class="action-dialog" :aria-labelledby="titleId" @cancel="onCancel">
    <form method="dialog" @submit.prevent="confirm">
      <h2 :id="titleId" class="action-dialog-title">{{ title }}</h2>
      <p v-if="description" class="action-dialog-text">{{ description }}</p>
      <p v-if="recipients" class="action-dialog-text">
        <i class="bi bi-envelope" aria-hidden="true"></i> An email is sent to {{ recipients }}.
      </p>

      <div v-if="reasonMode !== 'none'" class="action-dialog-reason">
        <label :for="reasonId" class="action-dialog-label">
          {{ reasonMode === 'required' ? 'Reason' : 'Message' }}<span v-if="reasonMode === 'required'"
            aria-hidden="true">&nbsp;*</span><span v-else class="action-dialog-optional">(optional)</span>
        </label>
        <textarea :id="reasonId" ref="reasonInput" v-model="reason" rows="4" class="form-control"
                  :class="{ 'is-invalid': showReasonError && reason.trim().length === 0 }"
                  :aria-required="reasonMode === 'required' ? 'true' : undefined"
                  :aria-describedby="showReasonError ? `${reasonId}-error` : undefined"
                  @input="showReasonError = false"></textarea>
        <div v-if="showReasonError" :id="`${reasonId}-error`" class="action-dialog-error">
          Please enter a reason.
        </div>
      </div>

      <div v-if="errorMessage" class="action-dialog-error" role="alert">{{ errorMessage }}</div>

      <div class="action-dialog-buttons">
        <button type="button" class="btn btn-outline-secondary" :disabled="pending" @click="onCancel()">Cancel</button>
        <button type="submit" class="btn" :class="danger ? 'btn-danger' : 'btn-primary'" :disabled="pending"
                :aria-busy="pending">
          <span v-if="pending" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>{{ title }}
        </button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.action-dialog {
  width: min(520px, calc(100vw - 32px));
  padding: var(--space-5);
  border: none;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(31, 42, 55, .25);
  color: #1f2a37;
}

.action-dialog::backdrop {
  background: rgba(31, 42, 55, .45);
}

.action-dialog-title {
  font-size: 19px;
  font-weight: 600;
  color: #2655a2;
  margin: 0 0 var(--space-3);
}

.action-dialog-text {
  margin: 0 0 var(--space-3);
  font-size: 14px;
}

.action-dialog-text .bi {
  color: #5b6b7c;
  margin-right: 4px;
}

.action-dialog-reason {
  margin-top: var(--space-4);
}

.action-dialog-label {
  display: block;
  font-weight: 600;
  color: #00489cf2;
  margin-bottom: var(--space-1);
}

.action-dialog-optional {
  margin-left: 6px;
  font-weight: normal;
  font-size: 0.85em;
  color: #5b6b7c;
}

.action-dialog-error {
  margin-top: var(--space-2);
  font-size: 13px;
  color: var(--status-danger-color);
}

.action-dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-5);
}
</style>
