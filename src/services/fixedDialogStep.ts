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
}

export const FixedDialogSteps: readonly DialogStep[] = [
    {
        id: FixedDialogStep.SERVICES,
        displayName: "Services",
        description: "Please provide information on the resources you are requesting",
    },
    {
        id: FixedDialogStep.QUERY,
        displayName: "Query",
        description: "Your selection criteria and query logic",
    },
    {
        id: FixedDialogStep.PROJECT,
        displayName: "Project",
        description: "Please provide information about your project",
    },
    {
        id: FixedDialogStep.CUSTOM,
        displayName: "Custom",
        description: "Configure how and where the results will be delivered",
    },
    {
        id: FixedDialogStep.SUMMARY,
        displayName: "Summary",
        description: "Review all selections before final submission",
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
    };
}

/* -----------------------------
 * DialogStepper
 * ----------------------------- */

export class DialogStepper {

    /* ---------- Internal state ---------- */

    private readonly allSteps: DialogStep[] = [];
    private readonly filteredStepIds = new Set<string>();
    private currentStepId: string | null = null;

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

            // Ignore if it collides with fixed steps
            if (fixedIds.has(step.id)) continue;

            const existing = existingStepsById.get(step.id);

            if (!existing) {
                // --- New dynamic step ---
                this.allSteps.splice(summaryIndex, 0, step);
                structureChanged = true;
            } else {
                // --- Existing step: update metadata if changed ---
                if (
                    existing.displayName !== step.displayName ||
                    existing.description !== step.description
                ) {
                    existing.displayName = step.displayName;
                    existing.description = step.description;
                }
            }
        }

        // If the current step was filtered out or removed, recover gracefully
        if (!this.isCurrentStepActive()) {
            this.currentStepId = this.fetchActiveSteps()[0]?.id ?? null;
        }

        if (structureChanged) {
            this.updateFields();
        }
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

    /* ---------- Internal helpers ---------- */

    private initializeFixedSteps(): void {
        this.allSteps.length = 0;

        const fixedWithoutSummary = FixedDialogSteps.filter(
            s => s.id !== FixedDialogStep.SUMMARY
        );

        const summary = FixedDialogSteps.find(
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
