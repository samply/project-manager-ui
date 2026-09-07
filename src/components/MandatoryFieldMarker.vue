<template>
  <span v-if="mandatory" class="mandatory-field-marker" :class="{ missing }">&nbsp;*</span>
</template>

<script lang="ts">
import {defineComponent} from "vue";

export default defineComponent({
  name: "MandatoryFieldMarker",
  props: {
    mandatory: {
      type: Boolean,
      default: false
    },
    missing: {
      type: Boolean,
      default: false
    }
  }
});
</script>

<style scoped>
.mandatory-field-marker.missing {
  color: red;
}
</style>
