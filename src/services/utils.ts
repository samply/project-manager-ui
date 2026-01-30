import {
    Action,
    Bridgehead,
    EditProjectParam,
    Explanations,
    Module,
    Project
} from "@/services/projectManagerBackendService";

export interface BridgeheadsProjectField {
    selected: string[];
    available: string[];
}

export interface ProjectField {
    fieldKey: string
    editProjectParam?: EditProjectParam[]
    fieldValue: string[]
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
    visibilityCondition: boolean,
    action?: Action
    module?: Module
}

export const extractHumanReadable = (list: Bridgehead[]): string[] =>
    list
        .map(b => b.humanReadable)
        .filter((v): v is string => typeof v === "string");