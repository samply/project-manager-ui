<template>
  <!-- Always the label's colour: red is kept for errors (see docs/mandatory-fields.md).
       Hidden from screen readers, which get aria-required on the input instead. -->
  <span v-if="mandatory" class="mandatory-field-marker" aria-hidden="true">&nbsp;*</span>
</template>

<script lang="ts">
import {defineComponent} from "vue";

export default defineComponent({
  name: "MandatoryFieldMarker",
  props: {
    mandatory: {
      type: Boolean,
      default: false
    }
  }
});
</script>
