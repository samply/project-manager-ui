<script lang="ts">
import {Options, Vue} from "vue-class-component";
import {Prop, Watch} from "vue-property-decorator";
import {
  Action,
  MessageSubject,
  Module,
  ProjectManagerBackendService,
  ProjectManagerContext,
  ProjectRole
} from "@/services/projectManagerBackendService";
import {EmailRole} from "@/services/emailRole";
interface options {
  label: string,
  shortDescription: string,
  longDescription: string
}
@Options({
  name: "CredentialsSharingTool",
})
export default class CredentialsSharingTool extends Vue {
  @Prop() readonly projectManagerBackendService!: ProjectManagerBackendService;
  @Prop() readonly recipientsEmails!: EmailRole[];
  @Prop() readonly context!: ProjectManagerContext;
  @Prop() readonly projectRoles!: ProjectRole[];

  recipientsCopied = false;
  passwordVisible = false;
  password = '';
  emailTemplateCopied = false;
  emailLinkGenerated = false;
  emlLinksGenerated = false;
  htmlLinksGenerated = false;
  generatedLinks: string[] = [];
  emlLinks: string[] = [];
  htmlLinks: string[] = [];
  copiedLinks: boolean[] = []; // Track copied state for email links
  emlDownloaded: boolean[] = [];
  htmlDownloaded: boolean[] = [];
  recipientsMessageSubjects: MessageSubject[] = [];
  selectedOption = 0;
  optionDropdownToggle = false;
  credentialOptions = [
    {
      label: "Option1: Copy Recipients' Email",
      shortDescription: "Copy a list of mail addresses to your clipboard",
      longDescription: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua....."
    },{
      label: "Option2: Copy Email Template",
      shortDescription: "Copy an email template of mail addresses to your clipboard",
      longDescription: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua....."
    },{
      label: "Option3: Generate Email Links",
      shortDescription: "generate  a link to your email template ...",
      longDescription: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua....."
    },{
      label: "Option4: Generate EML Files",
      shortDescription: "generate an EML file template ...",
      longDescription: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua....."
    },{
      label: "Option5: Generate HTML Files",
      shortDescription: "generate an HTML file template ...",
      longDescription: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua....."
    }
  ] as options[]

  @Watch('projectManagerBackendService', {immediate: true})
  onProjectManagerBackendService(newValue: EmailRole[], oldValue: EmailRole[]) {
    this.updateRecipientMessagesSubjects()
  }

  updateRecipientMessagesSubjects(): void {
    this.recipientsMessageSubjects = [];
    if (this.recipientsEmails){
      this.recipientsEmails.forEach(emailRole => {
        this.projectManagerBackendService.isModuleActionActive(Module.PROJECT_RESULTS_MODULE, Action.FETCH_EMAIL_MESSAGE_AND_SUBJECT_ACTION).then(condition => {
          if (condition){
            this.projectManagerBackendService.fetchData(Module.PROJECT_RESULTS_MODULE, Action.FETCH_EMAIL_MESSAGE_AND_SUBJECT_ACTION, this.context,
                new Map([['email', emailRole.email], ['project-role', emailRole.projectRole], ['email-template-type', this.fetchEmailTemplateType()]])).then(messageSubject => {
              if (messageSubject){
                messageSubject.emailTo = emailRole.email;
                this.addMessageSubject(messageSubject);
              }
            })
          }
        })
      });
    }
  }

  addMessageSubject(messageSubject: MessageSubject){
    this.recipientsMessageSubjects.push(messageSubject);
  }

    // Computed to determine if the password input is required
  get passwordRequired(): boolean {
    return true; // Always show the password field for options 2 and 3
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  copyRecipients(): void {
    if (Array.isArray(this.recipientsEmails)) {
      const recipientsStr = this.recipientsEmails.map(recipient => recipient.email).join("; ");
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
    const concatenatedMessages = this.recipientsMessageSubjects
        .map((recipient) => this.generateEmailInEmlFormat(recipient))  // Generate email for each recipient
        .join("\n\n********************************\n\n");  // Add line breaks between emails

    navigator.clipboard.writeText(concatenatedMessages).then(() => {
      this.emailTemplateCopied = true;
      setTimeout(() => {
        this.emailTemplateCopied = false;
      }, 2000);
    });
  }

  generateEmailInEmlFormat(recipient: MessageSubject): string {
    return 'To: ' + recipient.emailTo + '\nSubject: ' + recipient.subject + '\nContent-Type: text/html; charset="UTF-8"\n\n' + this.generateEmailMessage(recipient);
  }


  // Generate email links for all recipients
  generateEmailLink(): void {
    //this.resetCopiedState();
    // Generate mailto link for each recipient
    this.generatedLinks = this.recipientsMessageSubjects.map((recipient) => {
      return this.generateMailtoLink(recipient);
    });

    // Initialize copiedLinks array
    this.copiedLinks = new Array(this.generatedLinks.length).fill(false);

    // Set the flag to indicate that links have been generated
    this.emailLinkGenerated = true;
  }

  // Copy the link to clipboard and display the success icon
  copyToClipboard(index: number): void {
    const link = this.generatedLinks[index];

    // Copy the link to the clipboard
    navigator.clipboard.writeText(link).then(() => {
      // Set the copied state for this link
      this.copiedLinks[index] = true;
    });
  }

  generateMailtoLink(recipient: MessageSubject): string {
    return `mailto:${recipient.emailTo}?subject=${encodeURIComponent(recipient.subject)}&body=${encodeURIComponent(this.generateEmailMessage(recipient))}`;
  }

  generateEmailMessage(recipient: MessageSubject): string {
    return recipient.message.replace("{{password}}", this.password);
  }

  generateEmlFiles(): void {
    this.emlLinks = this.recipientsMessageSubjects.map((recipient) => {
      const content = this.generateEmailInEmlFormat(recipient);
      return this.createDownloadLink(content, 'message/rfc822');
    });
    this.emlDownloaded = new Array(this.emlLinks.length).fill(false);
    this.emlLinksGenerated = true;
  }

  generateHtmlFiles(): void {
    this.htmlLinks = this.recipientsMessageSubjects.map((recipient) => {
      const content = this.generateEmailMessage(recipient);
      return this.createDownloadLink(content, 'text/html');
    });
    this.htmlDownloaded = new Array(this.htmlLinks.length).fill(false);
    this.htmlLinksGenerated = true;
  }

  createDownloadLink(content: string, mimeType: string): string {
    const blob = new Blob([content], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  generatePassword(): void {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*";
    this.password = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  fetchEmailTemplateType(): string{
    return (this.projectRoles.includes(ProjectRole.BRIDGEHEAD_ADMIN)) ? 'SEND_CREDENTIALS_FROM_BRIDGEHEAD' : 'SEND_CREDENTIALS';
  }

}
</script>

<template>
  <div class="password-sharing-tool">
    <h3>Credentials Sharing Tool</h3>
    <p>Please choose an option below to share the credentials securely. No credentials will be sent automatically to any external server, and the tool runs exclusively in your browser.</p>

    <div class="options">
      <div style="margin-right: 10%;">
        <button class="option-button" @click="optionDropdownToggle = !optionDropdownToggle">
          <div class="dropdown-display">
            <div class="dropdown-label">{{credentialOptions[selectedOption].label}}</div>
            <div class="dropdown-short">{{credentialOptions[selectedOption].shortDescription}}</div>
          </div>
          <div class="dropdown-icon">
            <i class="bi bi-chevron-down"></i>
          </div>
        </button>

        <div style="display:flex">
          <div v-if="optionDropdownToggle" class="dropdown-div">
            <div v-for="(option2, index) in credentialOptions" :key="index"
                 class="dropdown-display dropdown-display-hover"
                 @click="selectedOption=index;optionDropdownToggle=false"
            >
              <div class="dropdown-label">{{option2.label}}</div>
              <div class="dropdown-short">{{option2.shortDescription}}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="option-variants">
        <!-- Option 1: Copy emails of recipients -->
        <div v-if="selectedOption === 0" class="option">
          <button @click="copyRecipients" class="btn btn-primary">
            <i class="bi bi-clipboard"></i> Copy Recipients' Emails
          </button>
          <p v-if="recipientsCopied">Recipients' emails copied to clipboard!</p>
        </div>

        <!-- Password input field -->
        <div v-if="passwordRequired && selectedOption > 0">
          <div class="input-group">
            <input
                :type="passwordVisible ? 'text' : 'password'"
                v-model="password"
                placeholder="Enter password"
                class="form-control"
            />
            <button @click="togglePasswordVisibility" class="btn btn-secondary" title="Toggle password visibility">
              <i :class="passwordVisible ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
            <button @click="generatePassword" class="btn btn-secondary ms-2" title="Generate a new password">
              <i class="bi bi-shuffle"></i>
            </button>
          </div>
          <br>
        </div>

        <!-- Option 2: Copy email template -->
        <div v-if="selectedOption === 1" class="option">
          <button @click="copyEmailTemplate" class="btn btn-primary">
            <i class="bi bi-clipboard"></i> Copy Email Template
          </button>
          <p v-if="emailTemplateCopied">Email template copied to clipboard!</p>
        </div>

        <!-- Option 3: Generate link for email app -->
        <div v-if="selectedOption === 2" class="option">
          <button @click="generateEmailLink" class="btn btn-primary">
            <i class="bi bi-envelope"></i> Generate Email Links
          </button>
          <p v-if="emailLinkGenerated">Email links generated! Click to open in email app.</p>
          <div v-if="emailLinkGenerated">
            <p v-for="(link, index) in generatedLinks" :key="index">
              <a :href="link" target="_blank" class="btn btn-link" @click="copyToClipboard(index)">
                Open Email App for {{recipientsEmails[index].email}} with role {{ recipientsEmails[index].projectRole}}
              </a>
              <!-- Bootstrap icon to show when copied -->
              <i v-if="copiedLinks[index]" class="bi bi-check-circle text-success"></i>
            </p>
          </div>
        </div>

        <!-- Option 4: Download EML files -->
        <div v-if="selectedOption === 3" class="option">
          <button @click="generateEmlFiles" class="btn btn-primary">
            <i class="bi bi-download"></i> Generate EML Files
          </button>
          <p v-if="emlLinksGenerated">EML files ready for download:</p>
          <div v-if="emlLinksGenerated">
            <p v-for="(link, index) in emlLinks" :key="index">
              <a :href="link" :download="`email_${recipientsEmails[index].email}.eml`" class="btn btn-link">
                Download EML for {{ recipientsEmails[index].email }} with role {{ recipientsEmails[index].projectRole}}
              </a>
              <i v-if="emlDownloaded[index]" class="bi bi-check-circle text-success"></i>
            </p>
          </div>
        </div>

        <!-- Option 5: Download HTML files -->
        <div v-if="selectedOption === 4" class="option">
          <button @click="generateHtmlFiles" class="btn btn-primary">
            <i class="bi bi-download"></i> Generate HTML Files
          </button>
          <p v-if="htmlLinksGenerated">HTML files ready for download:</p>
          <div v-if="htmlLinksGenerated">
            <p v-for="(link, index) in htmlLinks" :key="index">
              <a :href="link" :download="`email_${recipientsEmails[index].email}.html`" class="btn btn-link">
                Download HTML for {{ recipientsEmails[index].email }} with role {{ recipientsEmails[index].projectRole}}
              </a>
              <i v-if="htmlDownloaded[index]" class="bi bi-check-circle text-success"></i>
            </p>
          </div>
        </div>
        <p>{{credentialOptions[selectedOption].longDescription}}</p>
      </div>
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
.option-button {
  display: flex;
  border-radius: 5px;
  border: 1px solid grey;
  background: none;
  padding:0;
  position: relative;
  width: 310px;
  max-height: 78px;
}
.dropdown-display {
  text-align: left;
  padding: 10px 15px;
}
.dropdown-icon {
  margin: auto;
  padding-right: 10px;
}
.dropdown-label {
  font-size: 16px;
  font-weight: bold
}
.dropdown-short {
  font-size: 11px;
}
.dropdown-div {
  background: white;
  position: absolute;
  padding-top: 5px;
  border-bottom: 1px solid grey;
  border-left: 1px solid grey;
  border-right: 1px solid grey;
  width: 310px;
}
.dropdown-display-hover:hover {
  background-color: #007bff;
  color: white;
  cursor: pointer;
}
.options {
  display: flex;
  min-height: 200px;
}
.option-variants {
  max-width: 350px;
  min-height: 120px;
}
.option {
  margin-bottom: 20px;
}
</style>
