<template>
  <div class="pi-panel">
    <div class="pi-section-header">
      <span class="pi-section-title">Principal Investigator (Applicant)</span>
      <span class="pi-section-desc">
        The applicant serves as the primary point of contact.
      </span>
    </div>

    <div class="pi-card">
      <!-- Title and Name -->
      <div class="pi-field">
        <div class="pi-field-header">
          <span class="pi-field-title">Title and Name<span class="mandatory-asterisk"> *</span></span>
          <div class="pi-field-desc">Academic title and full name of the principal investigator</div>
        </div>
        <div class="pi-field-control">
          <template v-if="!isInEditMode">
            <span class="pi-display-value">{{ entry.titleName || '—' }}</span>
          </template>
          <template v-else>
            <input
                type="text"
                class="form-control grey"
                :class="{ 'is-invalid': showValidation && !entry.titleName }"
                :value="entry.titleName"
                @input="onTextInput('titleName', ($event.target as HTMLInputElement).value)"
            />
            <div v-if="showValidation && !entry.titleName" class="invalid-feedback">Required</div>
          </template>
        </div>
      </div>

      <!-- Affiliation -->
      <div class="pi-field">
        <div class="pi-field-header">
          <span class="pi-field-title">Affiliation<span class="mandatory-asterisk"> *</span></span>
          <div class="pi-field-desc">Institution or organisation of the principal investigator</div>
        </div>
        <div class="pi-field-control">
          <template v-if="!isInEditMode">
            <span class="pi-display-value">{{ entry.affiliation || '—' }}</span>
          </template>
          <template v-else>
            <input
                type="text"
                class="form-control grey"
                :class="{ 'is-invalid': showValidation && !entry.affiliation }"
                :value="entry.affiliation"
                @input="onTextInput('affiliation', ($event.target as HTMLInputElement).value)"
            />
            <div v-if="showValidation && !entry.affiliation" class="invalid-feedback">Required</div>
          </template>
        </div>
      </div>

      <!-- Email Address -->
      <div class="pi-field">
        <div class="pi-field-header">
          <span class="pi-field-title">Email Address<span class="mandatory-asterisk"> *</span></span>
          <div class="pi-field-desc">Contact email address of the principal investigator</div>
        </div>
        <div class="pi-field-control">
          <template v-if="!isInEditMode">
            <span class="pi-display-value">{{ entry.email || '—' }}</span>
          </template>
          <template v-else>
            <input
                type="email"
                class="form-control grey"
                :class="{ 'is-invalid': showValidation && !entry.email }"
                :value="entry.email"
                @input="onTextInput('email', ($event.target as HTMLInputElement).value)"
            />
            <div v-if="showValidation && !entry.email" class="invalid-feedback">Required</div>
          </template>
        </div>
      </div>
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
const PI_LABEL_REGEX = /^principal_investigator_(title_name|affiliation|email)$/;

interface PrincipalInvestigatorEntry {
  titleName: string;
  affiliation: string;
  email: string;
}

export default defineComponent({
  name: 'PrincipalInvestigatorPanel',

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
      entry: {titleName: '', affiliation: '', email: ''} as PrincipalInvestigatorEntry,
      saveTimer: null as ReturnType<typeof setTimeout> | null,
      showValidation: false,
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
      return Boolean(this.entry.titleName) && Boolean(this.entry.affiliation) && Boolean(this.entry.email);
    }
  },

  watch: {
    isValid: {
      immediate: true,
      handler(val: boolean) {
        this.$emit('validity-change', val);
      }
    },
    isInEditMode(val: boolean) {
      if (!val) this.showValidation = false;
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
      const piFields = fields.filter(
          f => f.title === PROJECT_FORM_TITLE && PI_LABEL_REGEX.test(f.label)
      );
      for (const field of piFields) {
        const m = field.label.match(PI_LABEL_REGEX);
        if (!m) continue;
        const base = m[1];
        switch (base) {
          case 'title_name':  this.entry.titleName   = field.value ?? ''; break;
          case 'affiliation': this.entry.affiliation = field.value ?? ''; break;
          case 'email':       this.entry.email       = field.value ?? ''; break;
        }
      }
    },

    onTextInput(field: keyof PrincipalInvestigatorEntry, value: string) {
      this.entry[field] = value;
      this.showValidation = true;
      if (this.saveTimer) clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => this.saveEntry(), 600);
    },

    async saveEntry() {
      const fieldsToSave = [
        {title: PROJECT_FORM_TITLE, label: 'principal_investigator_title_name', value: this.entry.titleName},
        {title: PROJECT_FORM_TITLE, label: 'principal_investigator_affiliation', value: this.entry.affiliation},
        {title: PROJECT_FORM_TITLE, label: 'principal_investigator_email',       value: this.entry.email},
      ];

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
        console.error('Error saving principal investigator entry:', error);
      }
    }
  }
});
</script>

<style scoped>
.pi-panel {
  padding: 0.5rem 2rem 0.75rem;
}

.pi-section-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 14px 10px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 12px;
}

.pi-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #2655a2;
}

.pi-section-desc {
  color: #64748b;
  font-size: 11px;
}

.pi-card {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
  padding: 4px 0 8px;
}

.pi-field {
  display: flex;
  align-items: flex-start;
  padding: 8px 14px;
  gap: 12px;
}

.pi-field-header {
  width: 30%;
  flex-shrink: 0;
  padding-top: 6px;
}

.pi-field-title {
  font-size: 13px;
  font-weight: 600;
  color: #2655a2;
}

.mandatory-asterisk {
  color: #e05c2a;
  font-weight: 700;
}

.pi-field-desc {
  color: #64748b;
  font-size: 11px;
  margin-top: 2px;
}

.pi-field-control {
  flex: 1;
}

.pi-display-value {
  font-size: 14px;
  color: #1f2937;
  padding: 6px 0;
  display: block;
}

.pi-field-control .form-control.grey {
  background-color: #fff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 7px 10px;
  color: #1f2937;
  width: 100%;
  font-size: 14px;
}

.pi-field-control .form-control.grey:focus {
  outline: none;
  border-color: #2655a2;
  box-shadow: 0 0 0 3px rgba(38, 85, 162, 0.14);
}

.pi-field-control .form-control.grey.is-invalid {
  border-color: #dc3545;
}

.pi-field-control .invalid-feedback {
  color: #dc3545;
  font-size: 11px;
  margin-top: 3px;
  display: block;
}
</style>
