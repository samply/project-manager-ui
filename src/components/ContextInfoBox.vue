<script setup lang="ts">
defineProps<{
  content: string;
}>();
</script>

<template>
  <aside class="context-info-box" role="note" aria-label="Context information">
    <i class="bi bi-info-circle context-info-box-icon" aria-hidden="true"></i>
    <!-- Form configuration is trusted administrator-controlled HTML, like field descriptions. -->
    <div class="context-info-box-content" v-html="content"></div>
  </aside>
</template>

<style scoped>
.context-info-box {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin: 0.75rem 4rem;
  padding: 0.75rem 1rem;
  border: 1px solid #b8d6ee;
  /*border-left: 4px solid #2672a8;*/
  border-radius: 6px;
  background: #f3f8fc;
  color: #17324d;
  font-size: 0.9rem;
  line-height: 1.45;
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
