<script lang="ts">
import {Options, Vue} from "vue-class-component";

@Options({
  name: "UserAndEmail",
  props: {
    firstName: {type: String, required: false},
    lastName: {type: String, required: false},
    email: {type: String, required: false}
  }
})
export default class UserAndEmail extends Vue {

  readonly firstName?: string;
  readonly lastName?: string;
  readonly email?: string;

  copiedToClipboard = false;

  get completeName(): string {
    return (
        (this.firstName ? this.firstName : "") +
        (this.firstName && this.lastName ? " " : "") +
        (this.lastName ? this.lastName : "")
    );
  }

  async copyToClipboard(email?: string): Promise<void> {
    try {
      if (email){
        await navigator.clipboard.writeText(email);
        this.copiedToClipboard = true;
      }
    } catch (error) {
      console.error("Failed to copy email:", error);
    }
  }
}
</script>

<template>
  <!-- Check if firstName or lastName is available -->
  <div v-if="firstName || lastName" :title="email">
    {{ completeName }}
    <button
        class="btn btn-link p-0 ms-2"
        @click="copyToClipboard(email)"
        title="Copy email"
    >
      <i :class="copiedToClipboard ? 'bi bi-clipboard-check' : 'bi bi-copy'"></i>
    </button>
  </div>
  <!-- If no firstName or lastName, show just the email -->
  <div v-else>
    {{ email }}
  </div>
</template>

<style scoped>
</style>
