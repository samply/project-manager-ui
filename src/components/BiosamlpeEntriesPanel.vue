<template>
  <div class="biosample-panel">
    <!-- Info banner (edit mode only, not summary) -->
    <div v-if="isInEditMode" class="biosample-info-banner">
      <i class="bi bi-info-circle me-1"></i>
      Add a separate entry for each required biosample type.
    </div>

    <!-- Entry cards -->
    <div ref="cardsContainer" class="biosample-cards">
      <div v-for="(entry, idx) in entries" :key="idx" class="biosample-card">

        <!-- Card header -->
        <div class="biosample-card-header">
          <button class="btn-collapse" type="button" :aria-label="entry.collapsed ? 'Expand' : 'Collapse'" @click="toggleCollapse(idx)">
            <i :class="entry.collapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-down'"></i>
          </button>
          <span class="biosample-card-title">{{ cardTitle(idx) }}</span>
          <button
              v-if="isInEditMode"
              class="btn-remove"
              type="button"
              :disabled="entries.length <= 1"
              :title="entries.length <= 1 ? 'At least one biosample entry is required' : 'Remove this entry'"
              @click="removeEntry(idx)"
          >
            <i class="bi bi-trash3"></i> Remove
          </button>
        </div>

        <!-- Card body (collapsible) -->
        <div v-show="!entry.collapsed" class="biosample-card-body">

          <!-- Biosample type (ENUM, required) -->
          <div class="bs-field">
            <div class="bs-field-header">
              <span class="bs-field-title">Biosample type<span class="mandatory-asterisk"> *</span></span>
              <div class="bs-field-desc">Material type of the biosample</div>
            </div>
            <div class="bs-field-control">
              <template v-if="!isInEditMode">
                <span class="bs-display-value">{{ typeDisplayName(entry.type) || '—' }}</span>
              </template>
              <template v-else>
                <select
                    class="form-select"
                    :class="{ 'is-invalid': !entry.type }"
                    :value="entry.type"
                    @change="onTypeChange(idx, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="">&#8212; Select a type &#8212;</option>
                  <option v-for="opt in allowedTypeValues" :key="opt.label" :value="opt.label">
                    {{ opt.displayName }}
                  </option>
                </select>
                <div v-if="!entry.type" class="invalid-feedback">Required</div>
              </template>
            </div>
          </div>

          <!-- Biosample quantity -->
          <div class="bs-field">
            <div class="bs-field-header">
              <span class="bs-field-title">Biosample quantity & unit</span>
              <div class="bs-field-desc">Volume of serum, number of slides, or DNA density required. Include the unit where necessary.</div>
            </div>
            <div class="bs-field-control">
              <template v-if="!isInEditMode">
                <span class="bs-display-value">{{ entry.quantity || '—' }}</span>
              </template>
              <input
                  v-else
                  type="text"
                  class="form-control grey"
                  :value="entry.quantity"
                  @input="onTextInput(idx, 'quantity', ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>

          <!-- Biosample preparation -->
          <div class="bs-field">
            <div class="bs-field-header">
              <span class="bs-field-title">Biosample preparation</span>
              <div class="bs-field-desc">How should the sample be prepared (e.g. staining, thickness, digitised slides)?</div>
            </div>
            <div class="bs-field-control">
              <template v-if="!isInEditMode">
                <span class="bs-display-value">{{ entry.preparation || '—' }}</span>
              </template>
              <textarea
                  v-else
                  class="form-control grey"
                  rows="2"
                  :value="entry.preparation"
                  @input="onTextInput(idx, 'preparation', ($event.target as HTMLTextAreaElement).value)"
              ></textarea>
            </div>
          </div>

          <!-- Planned analysis method -->
          <div class="bs-field">
            <div class="bs-field-header">
              <span class="bs-field-title">Biosample planned analysis method</span>
              <div class="bs-field-desc">Planned analysis method and who will perform it (applicant, biobank, or pathologist)</div>
            </div>
            <div class="bs-field-control">
              <template v-if="!isInEditMode">
                <span class="bs-display-value">{{ entry.plannedAnalysisMethod || '—' }}</span>
              </template>
              <textarea
                  v-else
                  class="form-control grey"
                  rows="2"
                  :value="entry.plannedAnalysisMethod"
                  @input="onTextInput(idx, 'plannedAnalysisMethod', ($event.target as HTMLTextAreaElement).value)"
              ></textarea>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Add button -->
    <div v-if="isInEditMode" class="biosample-add-row">
      <button class="btn btn-add-biosample" type="button" @click="addEntry">
        <i class="bi bi-plus-circle me-1"></i> Add another biosample type
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
  FormFieldValue,
  Module,
  ProjectManagerBackendService,
  ProjectManagerContext
} from '@/services/projectManagerBackendService';
import type {DialogStep} from '@/services/fixedDialogStep';
import {FixedDialogStep} from '@/services/fixedDialogStep';

const SAMPLES_FORM_TITLE = 'samples';

interface BiosamlpeEntry {
  type: string;
  quantity: string;
  preparation: string;
  plannedAnalysisMethod: string;
  collapsed: boolean;
}

export default defineComponent({
  name: 'BiosamlpeEntriesPanel',

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
      entries: [] as BiosamlpeEntry[],
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

    allowedTypeValues(): FormFieldValue[] {
      const typeField = this.formFields.find(
          f => f.label === 'type' && f.title === SAMPLES_FORM_TITLE && f.allowedValues
      );
      return typeField?.allowedValues ?? [];
    },

    isValid(): boolean {
      return this.entries.length > 0 && this.entries.every(e => Boolean(e.type));
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
          f => f.title === SAMPLES_FORM_TITLE &&
               /^(type|quantity|preparation|planned_analysis_method)_\d+$/.test(f.label)
      );

      if (indexedFields.length === 0) {
        this.entries = [this.newEntry()];
        this.maxSavedIndex = -1;
        return;
      }

      const entryMap: Record<number, BiosamlpeEntry> = {};
      let maxIdx = -1;

      for (const field of indexedFields) {
        const m = field.label.match(/^(type|quantity|preparation|planned_analysis_method)_(\d+)$/);
        if (!m) continue;
        const [, base, idxStr] = m;
        const idx = parseInt(idxStr, 10);
        maxIdx = Math.max(maxIdx, idx);
        if (!entryMap[idx]) entryMap[idx] = this.newEntry();
        switch (base) {
          case 'type':                    entryMap[idx].type                 = field.value ?? ''; break;
          case 'quantity':                entryMap[idx].quantity             = field.value ?? ''; break;
          case 'preparation':             entryMap[idx].preparation          = field.value ?? ''; break;
          case 'planned_analysis_method': entryMap[idx].plannedAnalysisMethod = field.value ?? ''; break;
        }
      }

      const result: BiosamlpeEntry[] = [];
      for (let i = 0; i <= maxIdx; i++) {
        const e = entryMap[i];
        if (e && (e.type || e.quantity || e.preparation || e.plannedAnalysisMethod)) {
          result.push(e);
        }
      }

      this.entries = result.length > 0 ? result : [this.newEntry()];
      this.maxSavedIndex = maxIdx;
    },

    newEntry(): BiosamlpeEntry {
      return {type: '', quantity: '', preparation: '', plannedAnalysisMethod: '', collapsed: false};
    },

    addEntry() {
      this.entries.push(this.newEntry());
      this.$nextTick(() => {
        const cards = (this.$el as HTMLElement)?.querySelectorAll('.biosample-card');
        if (cards?.length) {
          cards[cards.length - 1].scrollIntoView({behavior: 'smooth', block: 'nearest'});
        }
      });
    },

    removeEntry(index: number) {
      if (this.entries.length <= 1) return;
      this.entries.splice(index, 1);
      this.saveEntries();
    },

    toggleCollapse(index: number) {
      this.entries[index].collapsed = !this.entries[index].collapsed;
    },

    typeDisplayName(label: string): string {
      if (!label) return '';
      const found = this.allowedTypeValues.find(v => v.label === label);
      return found?.displayName ?? label;
    },

    cardTitle(index: number): string {
      const entry = this.entries[index];
      const typeLabel = entry.type ? ` — ${this.typeDisplayName(entry.type)}` : '';
      return `Biosample #${index + 1}${typeLabel}`;
    },

    onTypeChange(idx: number, value: string) {
      this.entries[idx].type = value;
      this.saveEntries();
    },

    onTextInput(idx: number, field: keyof Pick<BiosamlpeEntry, 'quantity' | 'preparation' | 'plannedAnalysisMethod'>, value: string) {
      this.entries[idx][field] = value;
      if (this.saveTimer) clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => this.saveEntries(), 600);
    },

    async saveEntries() {
      const fieldsToSave: Array<{title: string; label: string; value: string}> = [];

      for (let i = 0; i < this.entries.length; i++) {
        fieldsToSave.push({title: SAMPLES_FORM_TITLE, label: `type_${i}`,                    value: this.entries[i].type});
        fieldsToSave.push({title: SAMPLES_FORM_TITLE, label: `quantity_${i}`,                value: this.entries[i].quantity});
        fieldsToSave.push({title: SAMPLES_FORM_TITLE, label: `preparation_${i}`,             value: this.entries[i].preparation});
        fieldsToSave.push({title: SAMPLES_FORM_TITLE, label: `planned_analysis_method_${i}`, value: this.entries[i].plannedAnalysisMethod});
      }

      // Clear any previously saved entries beyond current count
      const clearUpTo = Math.max(this.maxSavedIndex, this.entries.length - 1);
      for (let i = this.entries.length; i <= clearUpTo; i++) {
        fieldsToSave.push({title: SAMPLES_FORM_TITLE, label: `type_${i}`,                    value: ''});
        fieldsToSave.push({title: SAMPLES_FORM_TITLE, label: `quantity_${i}`,                value: ''});
        fieldsToSave.push({title: SAMPLES_FORM_TITLE, label: `preparation_${i}`,             value: ''});
        fieldsToSave.push({title: SAMPLES_FORM_TITLE, label: `planned_analysis_method_${i}`, value: ''});
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
        console.error('Error saving biosample entries:', error);
      }
    }
  }
});
</script>

<style scoped>
.biosample-panel {
  padding: 0.5rem 2rem 0.75rem;
}

.biosample-info-banner {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  color: #1e40af;
  font-size: 13px;
  padding: 8px 12px;
  margin-bottom: 1rem;
}

.biosample-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.biosample-card {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
}

.biosample-card-header {
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

.biosample-card-title {
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

.btn-remove:not(:disabled):hover {
  color: #dc2626;
  border-color: #fca5a5;
}

.btn-remove:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.biosample-card-body {
  padding: 4px 0 8px;
}

/* Individual field rows inside a card */
.bs-field {
  display: flex;
  align-items: flex-start;
  padding: 8px 14px;
  gap: 12px;
}

.bs-field-header {
  width: 30%;
  flex-shrink: 0;
  padding-top: 6px;
}

.bs-field-title {
  font-size: 13px;
  font-weight: 600;
  color: #2655a2;
}

.mandatory-asterisk {
  color: #e05c2a;
  font-weight: 700;
}

.bs-field-desc {
  color: #64748b;
  font-size: 11px;
  margin-top: 2px;
}

.bs-field-control {
  flex: 1;
}

.bs-display-value {
  font-size: 14px;
  color: #1f2937;
  padding: 6px 0;
  display: block;
}

/* Inherit input styles from existing app */
.bs-field-control .form-control.grey {
  background-color: #fff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 7px 10px;
  color: #1f2937;
  width: 100%;
  font-size: 14px;
}

.bs-field-control .form-control.grey:focus {
  outline: none;
  border-color: #2655a2;
  box-shadow: 0 0 0 3px rgba(38, 85, 162, 0.14);
}

.bs-field-control .form-select {
  background-color: #fff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 7px 10px;
  color: #1f2937;
  width: 100%;
  font-size: 14px;
}

.bs-field-control .form-select:focus {
  outline: none;
  border-color: #2655a2;
  box-shadow: 0 0 0 3px rgba(38, 85, 162, 0.14);
}

.bs-field-control .form-select.is-invalid {
  border-color: #dc3545;
}

.bs-field-control .invalid-feedback {
  color: #dc3545;
  font-size: 11px;
  margin-top: 3px;
}

/* Add button row */
.biosample-add-row {
  margin-top: 12px;
}

.btn-add-biosample {
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

.btn-add-biosample:hover {
  background: #eff6ff;
}
</style>
