<template>
  <div class="collab-panel">
    <div class="collab-section-header">
      <span class="collab-section-title">Collaborators</span>
      <span class="collab-section-desc">
        If applicable, please provide the names, affiliations, and email addresses of your collaborators at the chosen sites.
        All fields within a started entry are required.
      </span>
    </div>

    <div v-if="isInEditMode" class="collab-info-banner">
      <i class="bi bi-info-circle me-1"></i>
      Add a separate entry for each collaborator. Collaborators are optional — leave this section empty if not applicable.
    </div>

    <div class="collab-cards">
      <div v-for="(entry, idx) in entries" :key="idx" class="collab-card">

        <div class="collab-card-header">
          <button class="btn-collapse" type="button" :aria-label="entry.collapsed ? 'Expand' : 'Collapse'" @click="toggleCollapse(idx)">
            <i :class="entry.collapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-down'"></i>
          </button>
          <span class="collab-card-title">{{ cardTitle(idx) }}</span>
          <button
              v-if="isInEditMode"
              class="btn-remove"
              type="button"
              title="Remove this collaborator"
              @click="removeEntry(idx)"
          >
            <i class="bi bi-trash3"></i> Remove
          </button>
        </div>

        <div v-show="!entry.collapsed" class="collab-card-body">

          <!-- Name -->
          <div class="cl-field">
            <div class="cl-field-header">
              <span class="cl-field-title">Name<span class="mandatory-asterisk"> *</span></span>
              <div class="cl-field-desc">Full name of the collaborator</div>
            </div>
            <div class="cl-field-control">
              <template v-if="!isInEditMode">
                <span class="cl-display-value">{{ entry.name || '—' }}</span>
              </template>
              <template v-else>
                <input
                    type="text"
                    class="form-control grey"
                    :class="{ 'is-invalid': isFieldInvalid(entry, 'name') }"
                    :value="entry.name"
                    @input="onTextInput(idx, 'name', ($event.target as HTMLInputElement).value)"
                />
                <div v-if="isFieldInvalid(entry, 'name')" class="invalid-feedback">Required</div>
              </template>
            </div>
          </div>

          <!-- Affiliation -->
          <div class="cl-field">
            <div class="cl-field-header">
              <span class="cl-field-title">Affiliation<span class="mandatory-asterisk"> *</span></span>
              <div class="cl-field-desc">Institution or organisation of the collaborator</div>
            </div>
            <div class="cl-field-control">
              <template v-if="!isInEditMode">
                <span class="cl-display-value">{{ entry.affiliation || '—' }}</span>
              </template>
              <template v-else>
                <input
                    type="text"
                    class="form-control grey"
                    :class="{ 'is-invalid': isFieldInvalid(entry, 'affiliation') }"
                    :value="entry.affiliation"
                    @input="onTextInput(idx, 'affiliation', ($event.target as HTMLInputElement).value)"
                />
                <div v-if="isFieldInvalid(entry, 'affiliation')" class="invalid-feedback">Required</div>
              </template>
            </div>
          </div>

          <!-- Email -->
          <div class="cl-field">
            <div class="cl-field-header">
              <span class="cl-field-title">Email Address<span class="mandatory-asterisk"> *</span></span>
              <div class="cl-field-desc">Contact email address of the collaborator</div>
            </div>
            <div class="cl-field-control">
              <template v-if="!isInEditMode">
                <span class="cl-display-value">{{ entry.email || '—' }}</span>
              </template>
              <template v-else>
                <input
                    type="email"
                    class="form-control grey"
                    :class="{ 'is-invalid': isFieldInvalid(entry, 'email') }"
                    :value="entry.email"
                    @input="onTextInput(idx, 'email', ($event.target as HTMLInputElement).value)"
                />
                <div v-if="isFieldInvalid(entry, 'email')" class="invalid-feedback">Required</div>
              </template>
            </div>
          </div>

        </div>
      </div>
    </div>

    <div v-if="entries.length === 0 && !isInEditMode" class="collab-empty">
      No collaborators specified.
    </div>

    <div v-if="isInEditMode" class="collab-add-row">
      <button class="btn btn-add-collab" type="button" @click="addEntry">
        <i class="bi bi-plus-circle me-1"></i> Add collaborator
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {
  Action,
  EditProjectParam,
  FormField,
  Module,
  ProjectManagerBackendService,
  ProjectManagerContext
} from '@/services/projectManagerBackendService';
import type {DialogStep} from '@/services/fixedDialogStep';
import {FixedDialogStep} from '@/services/fixedDialogStep';

const PROJECT_FORM_TITLE = 'project';
const COLLAB_LABEL_REGEX = /^collaborator_(name|affiliation|email)_(\d+)$/;

interface CollaboratorEntry {
  name: string;
  affiliation: string;
  email: string;
  collapsed: boolean;
}

export default defineComponent({
  name: 'CollaboratorEntriesPanel',

  emits: ['validity-change'],

  props: {
    formFields: {
      type: Array as PropType<FormField[]>,
      required: true
    },
    isEditable: {
      type: Boolean,
      default: true
    },
    editMode: {
      type: Boolean,
      default: false
    },
    projectManagerBackendService: {
      type: Object as PropType<Pick<ProjectManagerBackendService, 'fetchData'>>,
      required: true
    },
    context: {
      type: Object as PropType<ProjectManagerContext>,
      required: true
    },
    draftDialogCurrentStep: {
      type: Object as PropType<DialogStep>,
      default: undefined
    },
    existsDraftDialog: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      entries: [] as CollaboratorEntry[],
      maxSavedIndex: -1,
      saveTimer: null as ReturnType<typeof setTimeout> | null,
    };
  },

  computed: {
    isSummaryStep(): boolean {
      return this.draftDialogCurrentStep?.id === FixedDialogStep.SUMMARY;
    },

    isInEditMode(): boolean {
      if (this.isSummaryStep) return false;
      if (!this.isEditable) return false;
      if (!this.existsDraftDialog && !this.editMode) return false;
      return true;
    },

    isValid(): boolean {
      return this.entries.every(e => Boolean(e.name) && Boolean(e.affiliation) && Boolean(e.email));
    }
  },

  watch: {
    isValid: {
      immediate: true,
      handler(val: boolean) {
        this.$emit('validity-change', val);
      }
    }
  },

  created() {
    this.initFromFormFields(this.formFields);
  },

  beforeUnmount() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
  },

  methods: {
    initFromFormFields(fields: FormField[]) {
      const indexedFields = fields.filter(
          f => f.title === PROJECT_FORM_TITLE && COLLAB_LABEL_REGEX.test(f.label)
      );

      if (indexedFields.length === 0) {
        this.entries = [];
        this.maxSavedIndex = -1;
        return;
      }

      const entryMap: Record<number, CollaboratorEntry> = {};
      let maxIdx = -1;

      for (const field of indexedFields) {
        const m = field.label.match(COLLAB_LABEL_REGEX);
        if (!m) continue;
        const [, base, idxStr] = m;
        const idx = parseInt(idxStr, 10);
        maxIdx = Math.max(maxIdx, idx);
        if (!entryMap[idx]) entryMap[idx] = this.newEntry();
        switch (base) {
          case 'name':        entryMap[idx].name        = field.value ?? ''; break;
          case 'affiliation': entryMap[idx].affiliation = field.value ?? ''; break;
          case 'email':       entryMap[idx].email       = field.value ?? ''; break;
        }
      }

      const result: CollaboratorEntry[] = [];
      for (let i = 0; i <= maxIdx; i++) {
        const e = entryMap[i];
        if (e && (e.name || e.affiliation || e.email)) {
          result.push(e);
        }
      }

      this.entries = result;
      this.maxSavedIndex = maxIdx;
    },

    newEntry(): CollaboratorEntry {
      return {name: '', affiliation: '', email: '', collapsed: false};
    },

    addEntry() {
      this.entries.push(this.newEntry());
      this.$nextTick(() => {
        const cards = (this.$el as HTMLElement)?.querySelectorAll('.collab-card');
        if (cards?.length) {
          cards[cards.length - 1].scrollIntoView({behavior: 'smooth', block: 'nearest'});
        }
      });
    },

    removeEntry(index: number) {
      this.entries.splice(index, 1);
      this.saveEntries();
    },

    toggleCollapse(index: number) {
      this.entries[index].collapsed = !this.entries[index].collapsed;
    },

    cardTitle(index: number): string {
      const entry = this.entries[index];
      const namePart = entry.name ? ` — ${entry.name}` : '';
      return `Collaborator #${index + 1}${namePart}`;
    },

    isFieldInvalid(entry: CollaboratorEntry, field: keyof Pick<CollaboratorEntry, 'name' | 'affiliation' | 'email'>): boolean {
      const hasAnyField = Boolean(entry.name || entry.affiliation || entry.email);
      return hasAnyField && !entry[field];
    },

    onTextInput(idx: number, field: keyof Pick<CollaboratorEntry, 'name' | 'affiliation' | 'email'>, value: string) {
      this.entries[idx][field] = value;
      if (this.saveTimer) clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => this.saveEntries(), 600);
    },

    async saveEntries() {
      const fieldsToSave: Array<{title: string; label: string; value: string}> = [];

      for (let i = 0; i < this.entries.length; i++) {
        fieldsToSave.push({title: PROJECT_FORM_TITLE, label: `collaborator_name_${i}`,        value: this.entries[i].name});
        fieldsToSave.push({title: PROJECT_FORM_TITLE, label: `collaborator_affiliation_${i}`, value: this.entries[i].affiliation});
        fieldsToSave.push({title: PROJECT_FORM_TITLE, label: `collaborator_email_${i}`,       value: this.entries[i].email});
      }

      const clearUpTo = Math.max(this.maxSavedIndex, this.entries.length - 1);
      for (let i = this.entries.length; i <= clearUpTo; i++) {
        fieldsToSave.push({title: PROJECT_FORM_TITLE, label: `collaborator_name_${i}`,        value: ''});
        fieldsToSave.push({title: PROJECT_FORM_TITLE, label: `collaborator_affiliation_${i}`, value: ''});
        fieldsToSave.push({title: PROJECT_FORM_TITLE, label: `collaborator_email_${i}`,       value: ''});
      }

      this.maxSavedIndex = this.entries.length - 1;

      try {
        const params = new Map<string, unknown>();
        params.set(EditProjectParam.FORM_FIELDS, fieldsToSave);

        await this.projectManagerBackendService.fetchData(
            Module.PROJECT_EDITION_MODULE,
            Action.EDIT_PROJECT_FORM_FIELDS_ACTION,
            this.context,
            params
        );
      } catch (error) {
        console.error('Error saving collaborator entries:', error);
      }
    }
  }
});
</script>

<style scoped>
.collab-panel {
  padding: 0.5rem 2rem 0.75rem;
}

.collab-section-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 14px 10px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 12px;
}

.collab-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #2655a2;
}

.collab-section-desc {
  color: #64748b;
  font-size: 11px;
}

.collab-info-banner {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  color: #1e40af;
  font-size: 13px;
  padding: 8px 12px;
  margin-bottom: 1rem;
}

.collab-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.collab-card {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
}

.collab-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f8f9fa;
  border-bottom: 1px solid #d1d5db;
  cursor: default;
}

.btn-collapse {
  background: none;
  border: none;
  color: #374151;
  padding: 2px 4px;
  cursor: pointer;
  flex-shrink: 0;
  line-height: 1;
}

.btn-collapse:hover {
  color: #2655a2;
}

.collab-card-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.btn-remove {
  background: none;
  border: 1px solid transparent;
  border-radius: 4px;
  color: #6b7280;
  font-size: 13px;
  padding: 3px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  transition: color 0.15s, border-color 0.15s;
}

.btn-remove:hover {
  color: #dc2626;
  border-color: #fca5a5;
}

.collab-card-body {
  padding: 4px 0 8px;
}

.cl-field {
  display: flex;
  align-items: flex-start;
  padding: 8px 14px;
  gap: 12px;
}

.cl-field-header {
  width: 30%;
  flex-shrink: 0;
  padding-top: 6px;
}

.cl-field-title {
  font-size: 13px;
  font-weight: 600;
  color: #2655a2;
}

.mandatory-asterisk {
  color: #e05c2a;
  font-weight: 700;
}

.cl-field-desc {
  color: #64748b;
  font-size: 11px;
  margin-top: 2px;
}

.cl-field-control {
  flex: 1;
}

.cl-display-value {
  font-size: 14px;
  color: #1f2937;
  padding: 6px 0;
  display: block;
}

.cl-field-control .form-control.grey {
  background-color: #fff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 7px 10px;
  color: #1f2937;
  width: 100%;
  font-size: 14px;
}

.cl-field-control .form-control.grey:focus {
  outline: none;
  border-color: #2655a2;
  box-shadow: 0 0 0 3px rgba(38, 85, 162, 0.14);
}

.cl-field-control .form-control.grey.is-invalid {
  border-color: #dc3545;
}

.cl-field-control .invalid-feedback {
  color: #dc3545;
  font-size: 11px;
  margin-top: 3px;
  display: block;
}

.collab-empty {
  color: #9ca3af;
  font-size: 13px;
  font-style: italic;
  padding: 8px 14px;
}

.collab-add-row {
  margin-top: 12px;
}

.btn-add-collab {
  background: none;
  border: 1.5px dashed #2655a2;
  border-radius: 6px;
  color: #2655a2;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 18px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  width: 100%;
}

.btn-add-collab:hover {
  background: #eff6ff;
}
</style>
