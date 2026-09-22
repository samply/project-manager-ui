<template>
  <div v-if="contacts?.length" class="bridgehead-contacts" @click.stop>
    <button
        ref="triggerRef"
        type="button"
        class="btn btn-link bridgehead-contacts-button"
        title="Contact information"
        aria-label="Contact information"
        :aria-expanded="open"
        @click.stop="toggle"
    >
      <i class="bi bi-person-vcard"></i>
    </button>
    <!-- Teleported to <body> so it isn't clipped by an ancestor's
         overflow:hidden (e.g. the rounded-corner .panel-card it can sit
         inside) - positioned via JS-computed fixed coordinates instead of
         being absolutely positioned relative to a parent that might clip it. -->
    <Teleport to="body">
      <div v-if="open" class="bridgehead-contacts-popover" role="dialog" aria-label="Contact information"
           :style="popoverStyle" @click.stop>
        <div v-for="(contact, index) in contacts" :key="`${contact.emailAddress ?? 'contact'}-${index}`"
             class="bridgehead-contact">
          <div class="bridgehead-contact-name">{{ contact.name }}</div>
          <div v-if="contact.description" class="bridgehead-contact-description">
            {{ contact.description }}
          </div>
          <div v-if="contact.emailAddress" class="bridgehead-contact-email">
            <a :href="`mailto:${contact.emailAddress}`" @click.stop>{{ contact.emailAddress }}</a>
            <button type="button" class="btn btn-link bridgehead-contact-copy"
                    title="Copy email address" aria-label="Copy email address"
                    @click.stop="copyEmail(contact.emailAddress)">
              <i class="bi" :class="copiedEmail === contact.emailAddress ? 'bi-check' : 'bi-clipboard'"></i>
            </button>
          </div>
          <hr v-if="index < contacts.length - 1"/>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {PropType} from "vue";
import {BridgeheadContact} from "@/services/projectManagerBackendService";

@Options({
  name: "BridgeheadContacts",
  props: {
    contacts: {
      type: Array as PropType<BridgeheadContact[]>,
      required: true
    }
  }
})
export default class BridgeheadContacts extends Vue {
  readonly contacts!: BridgeheadContact[];

  open = false;
  copiedEmail: string | null = null;
  popoverStyle: Record<string, string> = {};

  mounted() {
    document.addEventListener("click", this.closePopover);
    // Fixed positioning is relative to the viewport, not the trigger button,
    // so a scroll/resize would leave the popover visually detached from it -
    // simplest fix is to just close it, matching how most popovers behave.
    window.addEventListener("scroll", this.closePopover, true);
    window.addEventListener("resize", this.closePopover);
  }

  beforeUnmount() {
    document.removeEventListener("click", this.closePopover);
    window.removeEventListener("scroll", this.closePopover, true);
    window.removeEventListener("resize", this.closePopover);
  }

  toggle() {
    if (this.open) {
      this.closePopover();
      return;
    }
    const trigger = this.$refs.triggerRef as HTMLElement | undefined;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    // Right-aligned to the button, same as the old `right: 0` within a
    // relatively-positioned parent - just computed in viewport coordinates
    // now that the popover is teleported out to <body>.
    this.popoverStyle = {
      position: 'fixed',
      top: `${rect.bottom + 6}px`,
      left: `${rect.right}px`,
      transform: 'translateX(-100%)'
    };
    this.open = true;
  }

  closePopover() {
    this.open = false;
  }

  async copyEmail(emailAddress: string) {
    try {
      await navigator.clipboard.writeText(emailAddress);
      this.copiedEmail = emailAddress;
      window.setTimeout(() => {
        if (this.copiedEmail === emailAddress) this.copiedEmail = null;
      }, 1500);
    } catch {
      this.copiedEmail = null;
    }
  }
}
</script>

<style scoped>
.bridgehead-contacts {
  display: inline-block;
  position: relative;
  margin-left: 0.25rem;
}

.bridgehead-contacts-button,
.bridgehead-contact-copy {
  padding: 0 0.25rem;
  color: inherit;
  vertical-align: middle;
}

.bridgehead-contacts-button:hover,
.bridgehead-contact-copy:hover {
  color: #0056b3;
}

.bridgehead-contacts-popover {
  /* position/top/left come from :style (popoverStyle), computed from the
     trigger button's actual screen position - see toggle(). */
  z-index: 1050;
  min-width: 18rem;
  max-width: min(28rem, 80vw);
  padding: 0.75rem;
  color: #212529;
  text-align: left;
  background: #fff;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.bridgehead-contact-name {
  font-weight: 600;
}

.bridgehead-contact-description {
  margin-top: 0.15rem;
  font-size: 0.9rem;
}

.bridgehead-contact-email {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.35rem;
  white-space: nowrap;
}

.bridgehead-contact-email a {
  overflow: hidden;
  text-overflow: ellipsis;
}

.bridgehead-contacts-popover hr {
  margin: 0.65rem 0;
}
</style>
