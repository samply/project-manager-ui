import {
    Action,
    Bridgehead,
    EditProjectParam,
    Explanations,
    FormDataType,
    FormField,
    FormFieldGroup,
    Module,
    Project
} from "@/services/projectManagerBackendService";

export interface BridgeheadsProjectField {
    selected: Bridgehead[];
    available: Bridgehead[];
}

export interface ProjectField {
    fieldKey: string
    editProjectParam?: EditProjectParam[]
    fieldValue: string[]
    fieldDescription?: string
    bridgeheads?: BridgeheadsProjectField
    redirectUrl?: string
    isEditable: boolean
    possibleValues?: string[]
    configurations?: Map<string, Project>
    uploadAction?: Action
    downloadAction?: Action
    downloadModule?: Module
    todos?: Explanations
    existFile?: boolean
    transformForSending?: (input: string) => string
    draftDialogCurrentStep?: number
    visibilityCondition: boolean
    action?: Action | ActionFunction
    module?: Module,
    section?: Section,
    mandatory?: boolean
    type?: FormDataType
}


/**
 * Groups class is responsible for detecting "new sections" in a list of form fields.
 *
 * Each form field can belong to a hierarchical set of groups. This class compares
 * the groups of the current fields with the previous field to determine if new
 * section titles must be emitted.
 *
 * Concepts:
 * - Sections are ONLY titles (headings), not fields
 * - Fields themselves will later be indented based on their own level
 * - Level 0 represents "ungrouped" content
 */
export interface NewSection {
    level: number;          // 0 = ungrouped
    displayName?: string;   // undefined for level 0
    description?: string;
}

export class Section {
    private formFields: FormField[];
    private index: number;

    constructor(formFields: FormField[], index: number) {
        this.formFields = formFields;
        this.index = index;
    }

    private getCurrentGroups(): FormFieldGroup[] {
        return this.formFields[this.index]?.groups ?? [];
    }

    private getPreviousGroups(): FormFieldGroup[] {
        return this.formFields[this.index - 1]?.groups ?? [];
    }

    /**
     * Returns all new section titles that start at the current field.
     *
     * Rules:
     * - Level 0 is emitted ONLY when transitioning between grouped and ungrouped content
     * - Repeated level 0 emissions are avoided (CASE B)
     * - Sections are emitted only for group changes, not for plain fields (CASE A)
     */
    fetchNewSections(): NewSection[] {
        const current = this.getCurrentGroups();
        const previous = this.getPreviousGroups();

        const sections: NewSection[] = [];

        const currentLevel = current.length;
        const previousLevel = previous.length;

        /**
         * CASE B FIX
         * Emit level 0 ONLY on transition:
         * grouped → ungrouped
         */
        if (previousLevel > 0 && currentLevel === 0) {
            sections.push({level: 0});
            return sections;
        }

        /**
         * Entering grouped content from ungrouped
         * (emit level 0 once, then level 1+ below)
         */
        if (previousLevel === 0 && currentLevel > 0) {
            sections.push({level: 0});
        }

        /**
         * CASE A FIX
         * Only emit section titles for actual group hierarchy changes.
         * Plain fields that belong only to level 1 must NOT be interpreted
         * as level 2 or 3 sections.
         */
        const maxDepth = Math.max(currentLevel, previousLevel);

        for (let i = 0; i < maxDepth; i++) {
            const curr = current[i];
            const prev = previous[i];

            // No group at this level → nothing to emit
            if (!curr) {
                break;
            }

            // New group or changed group at this level
            if (!prev || curr.group !== prev.group) {
                sections.push({
                    level: i + 1,
                    displayName: curr.displayName,
                    description: curr.description,
                });
            }
        }

        return sections;
    }

    /**
     * Returns the indentation level for the current field.
     * The UI uses this to indent fields independently
     * of section titles.
     */
    fetchFieldLevel(): number {
        return this.getCurrentGroups().length;
    }

    /**
     * Returns the change in group depth compared to the previous field.
     * Positive → current field is deeper
     * Negative → current field is shallower
     * 0 → same level
     */
    fetchLevelChange(): number {
        const currentGroups = this.getCurrentGroups() ?? [];
        const previousGroups = this.getPreviousGroups() ?? [];

        // Safety: length always a number
        const currentLength = Array.isArray(currentGroups) ? currentGroups.length : 0;
        const previousLength = Array.isArray(previousGroups) ? previousGroups.length : 0;

        return currentLength - previousLength;
    }

    fetchGroups(): string[] {
        return this.getCurrentGroups().map(group => group.group);
    }


}


export class ActionFunction {

    constructor(
        private readonly fn: (input: string[]) => Action) {
    }

    fetchAction(input: string[]): Action {
        return this.fn(input);
    }

}
