import {EmailRecipientType} from "@/services/projectManagerBackendService";
import {DEFAULT_CENTRAL_APPROVAL_COMMITTEE_NAME} from "@/services/configLoader";

// How each backend recipient type is named in "An email is sent to …"; the committee by its configured name.
const RECIPIENT_TEXTS: Record<Exclude<EmailRecipientType, EmailRecipientType.CENTRAL_APPROVAL_COMMITTEE>, string> = {
    [EmailRecipientType.EMAIL_ANNOTATION]: "the invited user",
    [EmailRecipientType.CREATOR]: "the requester",
    [EmailRecipientType.PROJECT_MANAGER_ADMIN]: "the project managers",
    [EmailRecipientType.ALL_DEVELOPERS]: "the developers of this request",
    [EmailRecipientType.ALL_PILOTS]: "the pilot users of this request",
    [EmailRecipientType.ALL_FINALS]: "the final users of this request",
    [EmailRecipientType.ALL_BRIDGEHEAD_ADMINS]: "the admins of all sites",
    [EmailRecipientType.BRIDGEHEAD_ADMIN]: "the admin of this site",
    [EmailRecipientType.BRIDGEHEAD_APPROVAL_CONTACTS]: "the local approval contacts of the sites",
    [EmailRecipientType.BRIDGEHEAD_ADMINS_WHO_HAVE_NOT_ACCEPTED_NOR_REJECTED_THE_PROJECT]:
        "the site admins who have not decided yet",
    [EmailRecipientType.PROJECT_ALL]: "everyone involved in this request",
};

/** "the requester and the admins of all sites"; empty when nobody gets an email. */
export function describeEmailRecipients(recipients: EmailRecipientType[],
                                        committeeName = DEFAULT_CENTRAL_APPROVAL_COMMITTEE_NAME): string {
    // PROJECT_ALL already covers everyone else.
    const types = recipients.includes(EmailRecipientType.PROJECT_ALL) ? [EmailRecipientType.PROJECT_ALL] : recipients;
    const texts = [...new Set(types.map(type => type === EmailRecipientType.CENTRAL_APPROVAL_COMMITTEE
        ? `the ${committeeName}` : RECIPIENT_TEXTS[type]).filter(Boolean))];
    if (texts.length <= 1) return texts[0] ?? '';
    return `${texts.slice(0, -1).join(', ')} and ${texts[texts.length - 1]}`;
}
