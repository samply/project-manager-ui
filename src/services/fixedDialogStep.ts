import {FormTitle} from "@/services/projectManagerBackendService";

export enum FixedDialogStep {
    SERVICES = "services",
    PROJECT = "project",
    QUERY = "query",
    CUSTOM = "custom",
    SUMMARY = "summary",
}

export interface DialogStep {
    readonly id: string;
    displayName: string;
    description: string;
    shortDescription?: string;
    preInfo?: string;
    postInfo?: string;
}

export const FixedDialogSteps: readonly DialogStep[] = [
    {
        id: FixedDialogStep.QUERY,
        displayName: "Query",
        description: "Review or define the query associated with this project."
    },
    {
        id: FixedDialogStep.SERVICES,
        displayName: "Services",
        description: "Select the services or resources needed for this project.",
    },
    {
        id: FixedDialogStep.PROJECT,
        displayName: "Project",
        description: "Provide information about the project."
    },
    {
        id: FixedDialogStep.CUSTOM,
        displayName: "Custom",
        description: "Configure additional project options.",
    },
    {
        id: FixedDialogStep.SUMMARY,
        displayName: "Summary",
        description: "Review the entered information before submission.",
    },
] as const;

/* -----------------------------
 * Helpers
 * ----------------------------- */

function formTitleToDialogStep(formTitle: FormTitle): DialogStep {
    return {
        id: formTitle.title,
        displayName: formTitle.titleDisplayName ?? formTitle.title,
        description: formTitle.titleDescription ?? "",
        shortDescription: formTitle.titleShortDescription,
        preInfo: formTitle.titlePreInfo,
        postInfo: formTitle.titlePostInfo,
    };
}

function mergeDialogStepMetadata(existing: DialogStep, formTitle: FormTitle, isFixedStep: boolean): void {
    const nextDisplayName = formTitle.titleDisplayName ??
        (isFixedStep ? existing.displayName : formTitle.title);
    const nextDescription = formTitle.titleDescription ??
        (isFixedStep ? existing.description : "");
    const nextShortDescription = formTitle.titleShortDescription ??
        (isFixedStep ? existing.shortDescription : undefined);
    const nextPreInfo = formTitle.titlePreInfo ??
        (isFixedStep ? existing.preInfo : undefined);
    const nextPostInfo = formTitle.titlePostInfo ??
        (isFixedStep ? existing.postInfo : undefined);

    if (
        existing.displayName !== nextDisplayName ||
        existing.description !== nextDescription ||
        existing.shortDescription !== nextShortDescription ||
        existing.preInfo !== nextPreInfo ||
        existing.postInfo !== nextPostInfo
    ) {
        existing.displayName = nextDisplayName;
        existing.description = nextDescription;
        existing.shortDescription = nextShortDescription;
        existing.preInfo = nextPreInfo;
        existing.postInfo = nextPostInfo;
    }
}

function overrideDialogStepMetadata(existing: DialogStep, formTitle: FormTitle): void {
    existing.displayName = formTitle.titleDisplayName ?? existing.displayName;
    existing.description = formTitle.titleDescription ?? existing.description;
    existing.shortDescription = formTitle.titleShortDescription ?? existing.shortDescription;
    existing.preInfo = formTitle.titlePreInfo ?? existing.preInfo;
    existing.postInfo = formTitle.titlePostInfo ?? existing.postInfo;
}

/* -----------------------------
 * DialogStepper
 * ----------------------------- */

export class DialogStepper {

    /* ---------- Internal state ---------- */

    private readonly allSteps: DialogStep[] = [];
    private readonly filteredStepIds = new Set<string>();
    private currentStepId: string | null = null;
    private hasAppliedCanonicalOrder = false;

    /* ---------- Reactive state ---------- */

    public currentStep: DialogStep | null = null;
    public currentSteps: DialogStep[] = [];
    public hasNextStep = false;
    public hasPreviousStep = false;
    public visitedSteps = new Set<string>();

    /* ---------- External callback ---------- */

    /** Called whenever the current step changes */
    public onCurrentStepChanged?: (step: DialogStep | null) => void;

    /* ---------- Initialization ---------- */

    constructor(onCurrentStepChanged?: (step: DialogStep | null) => void) {
        this.onCurrentStepChanged = onCurrentStepChanged;
        this.initializeFixedSteps();
        this.reset();
    }

    /* ---------- Public API ---------- */

    /** Reset navigation (filters cleared, the first step selected) */
    public reset(): void {
        this.filteredStepIds.clear();
        this.currentStepId = this.allSteps[0]?.id ?? null;
        this.updateFields();
    }

    /** Add or update dynamic steps derived from FormTitles */
    public addFormTitles(formTitles: FormTitle[]): void {
        if (!formTitles.length) return;

        const summaryIndex = this.allSteps.findIndex(
            s => s.id === FixedDialogStep.SUMMARY
        );

        if (summaryIndex === -1) {
            throw new Error("SUMMARY step must exist");
        }

        const fixedIds = new Set(FixedDialogSteps.map(s => s.id));
        const existingStepsById = new Map(
            this.allSteps.map(step => [step.id, step])
        );

        let structureChanged = false;

        for (const formTitle of formTitles) {
            const step = formTitleToDialogStep(formTitle);
            const isFixedStep = fixedIds.has(step.id);
            const existing = existingStepsById.get(step.id);

            if (existing) {
                mergeDialogStepMetadata(existing, formTitle, isFixedStep);
                continue;
            }

            if (isFixedStep) continue;

            // --- New dynamic step ---
            this.allSteps.splice(summaryIndex, 0, step);
            structureChanged = true;
        }

        // If the current step was filtered out or removed, recover gracefully
        if (!this.isCurrentStepActive()) {
            this.currentStepId = this.fetchActiveSteps()[0]?.id ?? null;
        }

        if (structureChanged || formTitles.length > 0) {
            this.updateFields();
        }
    }

    /**
     * Applies the canonical backend order and metadata to steps that already
     * exist. Merely appearing in the canonical order never creates a dynamic
     * step; dynamic-step membership remains controlled by addFormTitles().
     */
    public applyFormTitleCanonicalOrder(formTitles: FormTitle[]): void {
        if (!formTitles.length) return;

        const canonicalTitlesById = new Map(
            formTitles.map(formTitle => [formTitle.title, formTitle])
        );
        const existingStepsById = new Map(
            this.allSteps.map(step => [step.id, step])
        );
        const canonicalSteps = Array.from(canonicalTitlesById.values())
            .map(formTitle => {
                const step = existingStepsById.get(formTitle.title);
                if (step) overrideDialogStepMetadata(step, formTitle);
                return step;
            })
            .filter((step): step is DialogStep => step !== undefined);
        const canonicalStepIds = new Set(canonicalSteps.map(step => step.id));
        const canonicalIndexes = this.allSteps
            .map((step, index) => canonicalStepIds.has(step.id) ? index : -1)
            .filter(index => index !== -1);
        const reorderedSteps = [...this.allSteps];

        canonicalIndexes.forEach((index, canonicalIndex) => {
            reorderedSteps[index] = canonicalSteps[canonicalIndex];
        });
        this.allSteps.splice(0, this.allSteps.length, ...reorderedSteps);

        if (!this.hasAppliedCanonicalOrder || !this.isCurrentStepActive()) {
            this.currentStepId = this.fetchActiveSteps()[0]?.id ?? null;
        }
        this.hasAppliedCanonicalOrder = true;
        this.updateFields();
    }

    public hasSameFormTitles(formTitles: FormTitle[]): boolean {
        const fixedIds = new Set(FixedDialogSteps.map(s => s.id));

        const incomingIds = new Set(formTitles.map(t => t.title));

        const dynamicIds = new Set(
            this.allSteps
                .map(s => s.id)
                .filter(id => !fixedIds.has(id))
        );

        // Rule 1: I ⊆ (F ∪ D)
        for (const id of incomingIds) {
            if (!fixedIds.has(id) && !dynamicIds.has(id)) {
                return false;
            }
        }

        // Rule 2: D ⊆ I
        for (const id of dynamicIds) {
            if (!incomingIds.has(id)) {
                return false;
            }
        }

        return true;
    }

    public resetFormTitles(): void {
        const previousStepId = this.currentStepId;

        // Rebuild step structure to fixed-only
        this.initializeFixedSteps();

        // If the previously selected step still exists, keep it
        if (
            previousStepId &&
            this.allSteps.some(step => step.id === previousStepId)
        ) {
            this.currentStepId = previousStepId;
        } else {
            this.currentStepId = this.allSteps[0]?.id ?? null;
        }

        this.updateFields();
    }

    public nextStep(): void {
        const next = this.getRelativeStep(1);
        if (next) {
            this.currentStepId = next.id;
            this.updateFields();
        }
    }

    public previousStep(): void {
        const prev = this.getRelativeStep(-1);
        if (prev) {
            this.currentStepId = prev.id;
            this.updateFields();
        }
    }

    public setCurrentStep(stepId: string): void {
        if (this.isStepActive(stepId)) {
            this.currentStepId = stepId;
            this.updateFields();
        }
    }

    public filterStep(stepId: string): void {
        this.filteredStepIds.add(stepId);

        if (!this.isCurrentStepActive()) {
            this.currentStepId = this.fetchActiveSteps()[0]?.id ?? null;
        }

        this.updateFields();
    }

    public removeFilteredStep(stepId: string): void {
        this.filteredStepIds.delete(stepId);
        this.updateFields();
    }

    /* ---------- Derived state ---------- */

    public fetchActiveSteps(): DialogStep[] {
        return this.allSteps.filter(step => !this.filteredStepIds.has(step.id));
    }

    public fetchStep(stepId: string): DialogStep | undefined {
        return this.allSteps.find(step => step.id === stepId);
    }

    /* ---------- Internal helpers ---------- */

    private initializeFixedSteps(): void {
        this.allSteps.length = 0;
        // Metadata overrides mutate active steps. Clone the generic definitions so
        // deployment-specific values never leak back into the shared fallbacks.
        const fixedSteps = FixedDialogSteps.map(step => ({...step}));

        const fixedWithoutSummary = fixedSteps.filter(
            s => s.id !== FixedDialogStep.SUMMARY
        );

        const summary = fixedSteps.find(
            s => s.id === FixedDialogStep.SUMMARY
        );

        if (!summary) {
            throw new Error("SUMMARY step is required");
        }

        this.allSteps.push(...fixedWithoutSummary, summary);
    }

    private getRelativeStep(offset: number): DialogStep | null {
        const steps = this.currentSteps;
        const index = steps.findIndex(s => s.id === this.currentStepId);
        return steps[index + offset] ?? null;
    }

    private isStepActive(stepId: string): boolean {
        return !this.filteredStepIds.has(stepId);
    }

    private isCurrentStepActive(): boolean {
        return this.currentStepId !== null && this.isStepActive(this.currentStepId);
    }

    private updateFields(): void {
        const previousStep = this.currentStep;

        if (previousStep) {
            this.visitedSteps.add(previousStep.displayName)
        }

        this.currentSteps = this.fetchActiveSteps();

        this.currentStep =
            this.currentSteps.find(s => s.id === this.currentStepId) ?? null;

        this.hasPreviousStep =
            this.currentStep !== null &&
            this.currentSteps[0]?.id !== this.currentStep.id;

        this.hasNextStep =
            this.currentStep !== null &&
            this.currentSteps[this.currentSteps.length - 1]?.id !== this.currentStep.id;

        // --- Notify external listener if the step actually changed ---
        if (this.onCurrentStepChanged && this.currentStep !== previousStep) {
            this.onCurrentStepChanged(this.currentStep);
        }
    }

    public hasCurrentStep(stepId: string): boolean {
        return this.currentSteps.some(step => step.id === stepId);
    }

}
