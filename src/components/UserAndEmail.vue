<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Prop } from "vue-property-decorator";

@Options({
  name: "UserAndEmail",
})
export default class UserAndEmail extends Vue {
  @Prop() readonly firstName?: string; // Optional property
  @Prop() readonly lastName?: string;  // Optional property
  @Prop() readonly email!: string;

  get completeName(): string {
    return (
        (this.firstName ? this.firstName : "") +
        (this.firstName && this.lastName ? " " : "") +
        (this.lastName ? this.lastName : "")
    );
  }

  async copyToClipboard(email: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(email);
      alert("Email copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy email:", error);
      alert("Failed to copy email. Please try again.");
    }
  }
}
</script>

<template>
  <!-- Check if firstName or lastName is available -->
  <div v-if="firstName || lastName">
    {{ completeName }}
    <button
        class="btn btn-link p-0 ms-2"
        @click="copyToClipboard(email)"
        title="Copy email"
    >
      <i class="bi bi-clipboard"></i>
    </button>
  </div>
  <!-- If no firstName or lastName, show just the email -->
  <div v-else>
    {{ email }}
  </div>
</template>

<style scoped>
</style>
