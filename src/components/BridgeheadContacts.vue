<template>
  <div v-if="contacts?.length" class="bridgehead-contacts" @click.stop>
    <button
        type="button"
        class="btn btn-link bridgehead-contacts-button"
        title="Contact information"
        aria-label="Contact information"
        :aria-expanded="open"
        @click.stop="open = !open"
    >
      <i class="bi bi-person-vcard"></i>
    </button>
    <div v-if="open" class="bridgehead-contacts-popover" role="dialog" aria-label="Contact information">
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

  mounted() {
    document.addEventListener("click", this.closePopover);
  }

  beforeUnmount() {
    document.removeEventListener("click", this.closePopover);
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
  position: absolute;
  z-index: 1050;
  top: calc(100% + 0.35rem);
  right: 0;
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
