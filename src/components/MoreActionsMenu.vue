<script lang="ts">
import {defineComponent} from "vue";

// "More actions ▾": the rare actions of a card (reject, archive, …), out of the way of the main one. A menu
// button (WAI-ARIA menu button pattern): Escape closes it, arrow keys move between the entries. The list is
// placed in the body with fixed coordinates, so a card with overflow: hidden does not cut it off. It stays
// mounted while closed (v-show): an entry's confirmation dialog must outlive the menu closing.
export default defineComponent({
  name: "MoreActionsMenu",
  props: {
    label: {type: String, default: 'More actions'},
  },
  data() {
    return {
      open: false,
      top: 0,
      right: 0,
    };
  },
  computed: {
    menuId(): string {
      return `more-actions-${this.$.uid}`;
    },
  },
  beforeUnmount() {
    this.removeListeners();
  },
  methods: {
    toggle() {
      if (this.open) {
        this.close();
      } else {
        this.show();
      }
    },
    show() {
      const rect = (this.$refs.toggle as HTMLElement).getBoundingClientRect();
      this.top = rect.bottom + 4;
      this.right = window.innerWidth - rect.right;
      this.open = true;
      document.addEventListener('mousedown', this.onOutsideClick);
      window.addEventListener('scroll', this.close, true);
      window.addEventListener('resize', this.close);
      this.$nextTick(() => this.items()[0]?.focus());
    },
    close() {
      if (!this.open) return;
      this.open = false;
      this.removeListeners();
    },
    removeListeners() {
      document.removeEventListener('mousedown', this.onOutsideClick);
      window.removeEventListener('scroll', this.close, true);
      window.removeEventListener('resize', this.close);
    },
    items(): HTMLElement[] {
      return [...(this.$refs.menu as HTMLElement).querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)')];
    },
    onOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (!(this.$refs.menu as HTMLElement).contains(target) && !(this.$refs.toggle as HTMLElement).contains(target)) {
        this.close();
      }
    },
    onKeydown(event: KeyboardEvent) {
      const items = this.items();
      const index = items.indexOf(document.activeElement as HTMLElement);
      if (event.key === 'Escape') {
        this.close();
        (this.$refs.toggle as HTMLElement).focus();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        items[(index + 1) % items.length]?.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        items[(index - 1 + items.length) % items.length]?.focus();
      } else if (event.key === 'Tab') {
        this.close();
      }
    },
  },
});
</script>

<template>
  <button ref="toggle" type="button" class="more-actions-toggle" aria-haspopup="menu" :aria-expanded="open"
          :aria-controls="menuId" @click="toggle">
    {{ label }} <i class="bi bi-chevron-down" aria-hidden="true"></i>
  </button>
  <Teleport to="body">
    <div v-show="open" :id="menuId" ref="menu" class="more-actions-menu" role="menu" :aria-label="label"
         :style="{ top: `${top}px`, right: `${right}px` }" @keydown="onKeydown" @click="close">
      <slot></slot>
    </div>
  </Teleport>
</template>

<style scoped>
/* On the blue card header */
.more-actions-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, .6);
  border-radius: 6px;
}

.more-actions-toggle:hover,
.more-actions-toggle[aria-expanded="true"] {
  background: rgba(255, 255, 255, .15);
}

.more-actions-menu {
  position: fixed;
  z-index: 1050;
  min-width: 200px;
  padding: 6px 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(31, 42, 55, .18), 0 0 0 1px rgba(31, 42, 55, .06);
}

/* The entries are ProjectManagerButtons (span > div > button): full-width rows. */
.more-actions-menu :deep(.pm-button) {
  display: block;
  margin: 0;
}

.more-actions-menu :deep(button[role="menuitem"]) {
  display: block;
  width: 100%;
  padding: 8px 16px;
  text-align: left;
  font-size: 14px;
  color: #1f2a37;
  background: none;
  border: none;
}

.more-actions-menu :deep(button[role="menuitem"]:hover),
.more-actions-menu :deep(button[role="menuitem"]:focus-visible) {
  background: #eef3fa;
  outline: none;
}

.more-actions-menu :deep(button[role="menuitem"].menu-item-danger) {
  color: var(--status-danger-color);
}
</style>
