import {EmailRecipientType} from "@/services/projectManagerBackendService";

// How each backend recipient type is named in "An email is sent to …".
const RECIPIENT_TEXTS: Record<EmailRecipientType, string> = {
    [EmailRecipientType.EMAIL_ANNOTATION]: "the invited user",
    [EmailRecipientType.CREATOR]: "the requester",
    [EmailRecipientType.PROJECT_MANAGER_ADMIN]: "the project managers",
    [EmailRecipientType.ALL_DEVELOPERS]: "the developers of this request",
    [EmailRecipientType.ALL_PILOTS]: "the pilot users of this request",
    [EmailRecipientType.ALL_FINALS]: "the final users of this request",
    [EmailRecipientType.ALL_BRIDGEHEAD_ADMINS]: "the admins of all sites",
    [EmailRecipientType.BRIDGEHEAD_ADMIN]: "the admin of this site",
    [EmailRecipientType.BRIDGEHEAD_ADMINS_WHO_HAVE_NOT_ACCEPTED_NOR_REJECTED_THE_PROJECT]:
        "the site admins who have not decided yet",
    [EmailRecipientType.PROJECT_ALL]: "everyone involved in this request",
};

/** "the requester and the admins of all sites"; empty when nobody gets an email. */
export function describeEmailRecipients(recipients: EmailRecipientType[]): string {
    // PROJECT_ALL already covers everyone else.
    const types = recipients.includes(EmailRecipientType.PROJECT_ALL) ? [EmailRecipientType.PROJECT_ALL] : recipients;
    const texts = [...new Set(types.map(type => RECIPIENT_TEXTS[type]).filter(Boolean))];
    if (texts.length <= 1) return texts[0] ?? '';
    return `${texts.slice(0, -1).join(', ')} and ${texts[texts.length - 1]}`;
}
