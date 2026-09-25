<script setup lang="ts">
defineProps<{
  content: string;
  isBlock?: boolean;
  // A field's own pre/post info: keep it closer to that field than to the
  // neighbouring one.
  attach?: 'next' | 'previous';
}>();
</script>

<template>
  <aside class="context-info-box" role="note" aria-label="Context information" :class="{ 'in-block': isBlock, 'attach-next': attach === 'next', 'attach-previous': attach === 'previous' }">
    <i class="bi bi-info-circle context-info-box-icon" aria-hidden="true"></i>
    <!-- Form configuration is trusted administrator-controlled HTML, like field descriptions. -->
    <div class="context-info-box-content" v-html="content"></div>
  </aside>
</template>

<style scoped>
/* No vertical margin of its own: the neighbouring fields' half gaps space it,
 * like any other field. */
.context-info-box {
  margin: 0 var(--form-inset);
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid #b8d6ee;
  /*border-left: 4px solid #2672a8;*/
  border-radius: 6px;
  background: #f3f8fc;
  color: #17324d;
  font-size: 0.9rem;
  line-height: 1.45;
}

.context-info-box.attach-next {
  margin-top: calc(var(--field-gap) / 2);
}

.context-info-box.attach-previous {
  margin-bottom: calc(var(--field-gap) / 2);
}

/* Two boxes in a row (e.g. a block's and a step's post-info). */
.context-info-box + .context-info-box {
  margin-top: var(--space-3);
}

.context-info-box.in-block {
  margin-left: var(--space-4);
  margin-right: var(--space-4);
}

.context-info-box-icon {
  flex: 0 0 auto;
  margin-top: 0.15rem;
  color: #2672a8;
  font-size: 1rem;
}

.context-info-box-content {
  min-width: 0;
}

.context-info-box-content :deep(> :last-child) {
  margin-bottom: 0;
}
</style>
