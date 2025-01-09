<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {Prop} from "vue-property-decorator";
import {ProjectManagerBackendService} from "@/services/projectManagerBackendService";

@Options({
  name: "PasswordSharingTool",
})
export default class PasswordSharingTool extends Vue {
  @Prop() readonly projectManagerBackendService!: ProjectManagerBackendService;
  @Prop() readonly recipientsEmail!: string[];

  recipientsCopied = false;
  passwordVisible = false;
  password = '';
  emailTemplateCopied = false;
  emailLinkGenerated = false;
  generatedLink = '';

  // Computed to determine if the password input is required
  get passwordRequired(): boolean {
    return true; // Always show the password field for options 2 and 3
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  copyRecipients(): void {
    if (Array.isArray(this.recipientsEmail)) {
      const recipientsStr = this.recipientsEmail.join("; ");
      navigator.clipboard.writeText(recipientsStr).then(() => {
        this.recipientsCopied = true;
        setTimeout(() => {
          this.recipientsCopied = false;
        }, 2000);
      });
    } else {
      console.error("Invalid recipients format. Expected an array.");
    }
  }

  copyEmailTemplate(): void {
    const message = this.generateEmailMessage();
    navigator.clipboard.writeText(message).then(() => {
      this.emailTemplateCopied = true;
      setTimeout(() => {
        this.emailTemplateCopied = false;
      }, 2000);
    });
  }

  generateEmailLink(): void {
    const mailtoLink = this.generateMailtoLink();
    this.generatedLink = mailtoLink;
    this.emailLinkGenerated = true;
  }

  generateEmailMessage(): string {
    return `
The password for accessing the secure file is:

${this.password}

To enhance security, we recommend encrypting and signing this email using your email client.

Best regards,
Your Team
`;
  }

  generateMailtoLink(): string {
    const subject = "Secure File Access Password";
    const body = this.generateEmailMessage();
    const recipientList = this.recipientsEmail.join("; ");
    return `mailto:?bcc=${encodeURIComponent(recipientList)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        body
    )}`;
  }
}
</script>

<template>
  <div class="password-sharing-tool">
    <h3>Password Sharing Tool</h3>
    <p>Please choose an option below to share the password securely. No passwords will be sent automatically, and the tool runs exclusively in your browser.</p>

    <!-- Option 1: Copy emails of recipients -->
    <div class="option">
      <h4>Option 1:</h4>
      <button @click="copyRecipients" class="btn btn-primary">
        <i class="bi bi-clipboard"></i> Copy Recipients' Emails
      </button>
      <p v-if="recipientsCopied">Recipients' emails copied to clipboard!</p>
      <br>
    </div>

    <!-- Password input field -->
    <div class="password-section" v-if="passwordRequired">
      <h5>Enter Password (For Options 2 and 3):</h5>
      <div class="input-group">
        <input
            :type="passwordVisible ? 'text' : 'password'"
            v-model="password"
            placeholder="Enter password"
            class="form-control"
        />
        <button @click="togglePasswordVisibility" class="btn btn-secondary">
          <i :class="passwordVisible ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
        </button>
      </div>
      <br>
    </div>

    <!-- Option 2: Copy email template -->
    <div class="option">
      <h4>Option 2:</h4>
      <button @click="copyEmailTemplate" class="btn btn-primary">
        <i class="bi bi-clipboard"></i> Copy Email Template
      </button>
      <p v-if="emailTemplateCopied">Email template copied to clipboard!</p>
      <br>
    </div>

    <!-- Option 3: Generate link for email app -->
    <div class="option">
      <h4>Option 3:</h4>
      <button @click="generateEmailLink" class="btn btn-primary">
        <i class="bi bi-envelope"></i> Generate Email Link
      </button>
      <p v-if="emailLinkGenerated">Email link generated! Click to open in email app.</p>
      <a v-if="generatedLink" :href="generatedLink" target="_blank" class="btn btn-link">Open Email App</a>
    </div>

    <!-- User recommendation -->
    <div class="recommendation">
      <p>
        <strong>Recommendation:</strong> We strongly recommend that you encrypt and sign the email before sending it to ensure the privacy and integrity of the password and message.
      </p>
    </div>
  </div>
</template>

<style scoped>
.password-sharing-tool {
  padding: 20px;
}

.option {
  margin-bottom: 20px;
}

.password-section {
  margin-top: 20px;
}

.input-group {
  display: flex;
}

.input-group .form-control {
  flex: 1;
}

.bi {
  margin-right: 5px;
}

p {
  color: green;
  font-style: italic;
}

.recommendation {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
}

.recommendation a {
  color: #007bff;
  text-decoration: none;
}

.recommendation a:hover {
  text-decoration: underline;
}
</style>
