export enum DialogStep {
    PROJECT = "Project",
    QUERY = "Query",
    PROFILES = "Profiles",
    OUTPUT = "Output",
    SUMMARY = "Summary",
}

export class DialogStepper {

    private currentStepIndex: number | null = 0; // Start at the first step or null if no valid step exists
    private steps: DialogStep[] = Object.values(DialogStep);
    private filteredSteps: Set<DialogStep> = new Set<DialogStep>();

    // Reactive properties
    public currentStep: DialogStep | null = this.steps[0]; // The current step
    public currentSteps: DialogStep[] = []; // All steps not filtered
    public hasNextStep = false; // Whether there is a valid next step
    public hasPreviousStep = false; // Whether there is a valid previous step

    constructor() {
        this.reset();
    }

    // Resets the stepper to its initial state
    public reset(): void {
        this.currentStepIndex = 0;
        this.filteredSteps.clear();
        this.updateFields(); // Update the fields after reset
    }

    // Advances to the next valid step
    public nextStep(): void {
        if (this.currentStepIndex !== null) {
            const nextStep = this.fetchNextStepIndex();
            if (nextStep !== null) {
                this.currentStepIndex = nextStep;
                this.updateFields();
            }
        }
    }

    // Moves to the previous valid step
    public previousStep(): void {
        if (this.currentStepIndex !== null) {
            const previousStep = this.fetchPreviousStepIndex();
            if (previousStep !== null) {
                this.currentStepIndex = previousStep;
                this.updateFields();
            }
        }
    }

    // Checks if there is a next valid step
    public checkHasNextStep(): boolean {
        return this.currentStepIndex !== null && this.fetchNextStepIndex() !== null;
    }

    // Checks if there is a previous valid step
    public checkHasPreviousStep(): boolean {
        return this.currentStepIndex !== null && this.fetchPreviousStepIndex() !== null;
    }

    // Filters a step and adjusts the current step if needed
    public filterStep(step: DialogStep): void {
        this.filteredSteps.add(step);

        if (this.steps.length === this.filteredSteps.size) {
            // If all steps are filtered, disable navigation
            this.currentStepIndex = null;
        } else if (this.currentStepIndex !== null && this.steps[this.currentStepIndex] === step) {
            // If the current step is filtered, move to the next or previous valid step
            this.nextStep();
            if (this.currentStepIndex !== null && this.isStepFiltered(this.currentStepIndex)) {
                this.previousStep();
            }
        }
        this.updateFields(); // Update the fields after filtering
    }

    // Retrieves the list of active (non-filtered) steps
    public fetchActiveSteps(): DialogStep[] {
        return this.steps.filter(step => !this.filteredSteps.has(step));
    }

    // Fetches the index of the next valid step
    private fetchNextStepIndex(): number | null {
        if (this.currentStepIndex === null) {
            return null;
        }

        let nextStep = this.currentStepIndex + 1;
        while (nextStep < this.steps.length) {
            if (!this.isStepFiltered(nextStep)) {
                return nextStep;
            }
            nextStep++;
        }
        return null; // No valid next step
    }

    // Fetches the index of the previous valid step
    private fetchPreviousStepIndex(): number | null {
        if (this.currentStepIndex === null) {
            return null;
        }

        let previousStep = this.currentStepIndex - 1;
        while (previousStep >= 0) {
            if (!this.isStepFiltered(previousStep)) {
                return previousStep;
            }
            previousStep--;
        }
        return null; // No valid previous step
    }

    // Utility method to check if a step is filtered
    private isStepFiltered(index: number): boolean {
        return this.filteredSteps.has(this.steps[index]);
    }

    // Utility method to update the reactive fields
    private updateFields(): void {
        const tempCurrentSteps = this.fetchActiveSteps();

        // Only update `currentSteps` and `currentStep` if the values have changed (deep comparison)
        if (!this.areArraysEqual(this.currentSteps, tempCurrentSteps)) {
            this.currentSteps = tempCurrentSteps;
        }

        const tempCurrentStep = this.steps[this.currentStepIndex || 0];

        // Only update `currentStep` if the value has changed
        if (this.currentStep !== tempCurrentStep) {
            this.currentStep = tempCurrentStep;
        }

        this.hasNextStep = this.checkHasNextStep();
        this.hasPreviousStep = this.checkHasPreviousStep();
    }

    // Utility method to compare arrays (deep comparison)
    private areArraysEqual(arr1: DialogStep[], arr2: DialogStep[]): boolean {
        if (arr1.length !== arr2.length) return false;

        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }

        return true;
    }

    public setCurrentStep(step: DialogStep): void {
        const stepIndex = this.steps.indexOf(step);

        // If the step exists in the steps array, update currentStepIndex
        if (stepIndex !== -1) {
            this.currentStepIndex = stepIndex;
            this.updateFields(); // Call updateFields to update the other reactive properties
        }
    }

    public removeFilteredStep(step: DialogStep): void {
        // If the step is currently filtered, remove it from the filteredSteps set
        if (this.filteredSteps.has(step)) {
            this.filteredSteps.delete(step);

            // Check if the current step is now part of the filtered steps
            if (this.currentStep !== null && this.currentStepIndex !== null && this.isStepFiltered(this.currentStepIndex)) {
                // If the current step is now filtered, move to the next valid step
                this.nextStep();
            }
        }

        // Update the reactive fields after removing the filter
        this.updateFields();
    }

}
