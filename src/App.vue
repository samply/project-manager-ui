<template>
  <div id="app">
    <NavBar/>
    <ActionFeedbackToast/>
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import ActionFeedbackToast from '@/components/ActionFeedbackToast.vue';
import NavBar from '@/components/NavBar.vue';

export default defineComponent({
  components: {
    ActionFeedbackToast,
    NavBar,
  },
});
</script>

<style>
#app {
  background-color: #EEEEEE;
  font-family: Open Sans, sans-serif;
}
@font-face {
  font-family: 'Open Sans';
  font-style: normal;
  font-weight: 300;
  src: url(assets/OpenSans-Light.woff2) format("woff2");
}

:root {
  background-color: #EEEEEE;
  /* Shared, subdued status palette - used wherever red/green/yellow signal
     success/warning/danger, so the meaning reads consistently across the app. */
  --status-success-color: #3f8f45;
  --status-warning-color: #e0ab18;
  --status-danger-color: #c0504d;

  /* Spacing scale. Components take their spacing from here instead of
     choosing their own px/rem/% values. */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 1.75rem;
  --space-7: 2rem;

  /* Form rhythm (request dialog, summary and request view).
     --field-gap:         between two fields while filling in the draft
     --field-gap-summary: between two fields in the summary and review
     --header-gap:        between a field title/description and its control
     --option-gap:        between the options of one radio/checkbox list
     --form-inset:        left/right edge of everything in the form card:
                          card and step headers, fields, sections, blocks
     Each half of a gap belongs to one side, so two neighbours add up to one
     gap without collapsing or doubling. Values agreed on 2026-09-25, see
     plans/2026-09-25-plan-audit-vertical-spacing.md. */
  --field-gap: 2rem;
  --field-gap-summary: calc(var(--field-gap) * 0.5);
  --header-gap: var(--space-2);
  --option-gap: 0.35rem;
  --form-inset: 2rem;
  --page-top: 28px;
}

/* Runs of optional Yes/No checkboxes (see ProjectView optionalBooleanRunClasses)
   read as one checklist: the checkboxes of one run sit an option gap apart and
   only the run's outer edges keep the field gap. Global because the run class
   is set by ProjectView and the padding belongs to ProjectFieldRow. */
:root .bool-run .optional-boolean-field > .input-field {
  padding-top: calc(var(--option-gap) / 2);
  padding-bottom: calc(var(--option-gap) / 2);
}
:root .bool-run-first .optional-boolean-field > .input-field {
  padding-top: calc(var(--field-gap) / 2);
}
:root .bool-run-last .optional-boolean-field > .input-field {
  padding-bottom: calc(var(--field-gap) / 2);
}
*, *::before, *::after {
  box-sizing: border-box;
}
html, body {
  margin: 0;
  padding: 0;
}
</style>
