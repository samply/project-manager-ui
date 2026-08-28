import {FixedDialogStep} from "@/services/fixedDialogStep";
import {
    Action,
    Bridgehead,
    CUSTOM_PROJECT_CONFIGURATION,
    PmRequestParameter,
    FixedFormFieldKey,
    FormDataType,
    Module,
    Project,
    ProjectAndForms,
    ProjectConfigurationSelectionType,
    ProjectDocument,
    ProjectOutput,
    ProjectType
} from "@/services/projectManagerBackendService";
import {ProjectField} from "@/services/utils";

export interface FixedProjectFieldsContext {
    project?: Project;
    editMode: boolean;
    existsDraftDialog: boolean;
    projectDescription: ProjectDocument;
    existsProjectDescription: boolean;
    bridgeheads: Bridgehead[];
    allBridgeheads: Bridgehead[];
    currentProjectConfiguration: string[];
    projectConfigurationLabels: string[];
    projectConfigurations: Map<string, ProjectAndForms>;
    projectConfigurationSelectionType: ProjectConfigurationSelectionType;
    queryFormats: string[];
    projectTypes: string[];
    outputFormats: Partial<Record<ProjectType, string[]>>;
    exporterTemplateIds: Partial<Record<ProjectType, string[]>>;
    votumDescription: ProjectDocument;
    existsVotum: boolean;
    votumForAllBridgeheadsDescription: ProjectDocument;
    existsVotumForAllBridgeheads: boolean;
    isProjectManagerAdmin: () => boolean;
    isFixedFieldConfigured: (key: FixedFormFieldKey) => boolean;
    getFixedFieldDialogStep: (key: FixedFormFieldKey, defaultDialogStep: string) => string;
    isFixedFieldVisibleInCurrentStep: (key: FixedFormFieldKey, defaultDialogStep: string) => boolean;
    isCurrentStep: (step: string) => boolean;
    isNotIncludedInCurrentProjectConfiguration: (field: string) => boolean;
    fetchExtraParamsForProjectOutput: (
        editProjectParam: PmRequestParameter, output: ProjectOutput) => Map<string, string>;
}

function buildProjectOutputFields(context: FixedProjectFieldsContext): ProjectField[] {
    const outputs: ProjectOutput[] = context.project?.outputs?.length
        ? context.project.outputs
        : [{projectType: ProjectType.EXPORT} as ProjectOutput];

    return outputs.flatMap(output => [
        {
            fixedFieldKey: FixedFormFieldKey.PROJECT_TYPE,
            fieldKey: "Type",
            fieldValue: output.projectType ? [output.projectType] : [],
            editProjectParam: [PmRequestParameter.PROJECT_TYPE],
            isEditable: context.isNotIncludedInCurrentProjectConfiguration(
                output.projectType + ".projectType"),
            editMode: context.editMode,
            possibleValues: context.projectTypes,
            displayPossibleValue: (label: string) => ({name: label, description: ""}),
            mandatory: true,
            category: context.getFixedFieldDialogStep(
                FixedFormFieldKey.PROJECT_TYPE, FixedDialogStep.CUSTOM),
            visibilityCondition: context.isProjectManagerAdmin() &&
                context.isFixedFieldVisibleInCurrentStep(
                    FixedFormFieldKey.PROJECT_TYPE, FixedDialogStep.CUSTOM),
            extraParams: context.fetchExtraParamsForProjectOutput(
                PmRequestParameter.PROJECT_TYPE, output),
            deleteAction: Action.REMOVE_PROJECT_OUTPUT_ACTION,
            deleteModule: Module.PROJECT_EDITION_MODULE
        },
        {
            fixedFieldKey: FixedFormFieldKey.OUTPUT_FORMAT,
            fixedFieldDisplayNameSuffix: ` (${output.projectType})`,
            fieldKey: `Output Format (${output.projectType})`,
            fieldValue: output.outputFormat ? [output.outputFormat] : [],
            editProjectParam: [PmRequestParameter.OUTPUT_FORMAT],
            isEditable: context.isNotIncludedInCurrentProjectConfiguration(
                output.projectType + ".outputFormat"),
            editMode: context.editMode,
            possibleValues: context.outputFormats[output.projectType] ?? [],
            displayPossibleValue: (label: string) => ({name: label, description: ""}),
            mandatory: true,
            category: context.getFixedFieldDialogStep(
                FixedFormFieldKey.OUTPUT_FORMAT, FixedDialogStep.CUSTOM),
            visibilityCondition: context.isProjectManagerAdmin() &&
                context.isFixedFieldVisibleInCurrentStep(
                    FixedFormFieldKey.OUTPUT_FORMAT, FixedDialogStep.CUSTOM),
            extraParams: context.fetchExtraParamsForProjectOutput(
                PmRequestParameter.OUTPUT_FORMAT, output)
        },
        {
            fixedFieldKey: FixedFormFieldKey.TEMPLATE_ID,
            fixedFieldDisplayNameSuffix: ` (${output.projectType})`,
            fieldKey: `Template ID (${output.projectType})`,
            fieldValue: output.templateId ? [output.templateId] : [],
            editProjectParam: [PmRequestParameter.TEMPLATE_ID],
            isEditable: context.isNotIncludedInCurrentProjectConfiguration(
                output.projectType + ".templateId"),
            editMode: context.editMode,
            possibleValues: context.exporterTemplateIds[output.projectType] ?? [],
            displayPossibleValue: (label: string) => ({name: label, description: ""}),
            mandatory: true,
            category: context.getFixedFieldDialogStep(
                FixedFormFieldKey.TEMPLATE_ID, FixedDialogStep.CUSTOM),
            visibilityCondition: context.isProjectManagerAdmin() &&
                context.isFixedFieldVisibleInCurrentStep(
                    FixedFormFieldKey.TEMPLATE_ID, FixedDialogStep.CUSTOM),
            extraParams: context.fetchExtraParamsForProjectOutput(
                PmRequestParameter.TEMPLATE_ID, output)
        }
    ]);
}

export function buildFixedProjectFields(context: FixedProjectFieldsContext): ProjectField[] {
    return [
        {
            fixedFieldKey: FixedFormFieldKey.PROJECT_TITLE,
            fieldKey: "Project Title",
            fieldValue: context.project?.label ? [context.project.label] : [],
            editProjectParam: [PmRequestParameter.LABEL],
            isEditable: true,
            editMode: context.editMode,
            mandatory: true,
            category: context.getFixedFieldDialogStep(
                FixedFormFieldKey.PROJECT_TITLE, FixedDialogStep.PROJECT),
            visibilityCondition: context.isFixedFieldVisibleInCurrentStep(
                FixedFormFieldKey.PROJECT_TITLE, FixedDialogStep.PROJECT)
        },
        {
            fixedFieldKey: FixedFormFieldKey.PROJECT_DESCRIPTION,
            fieldKey: "Project Description",
            fieldValue: context.project?.description ? [context.project.description] : [],
            editProjectParam: [PmRequestParameter.DESCRIPTION],
            fieldDescription: "Briefly describe your project in a few words. What is the objective or aim of your project?",
            type: FormDataType.LONG_STRING,
            isEditable: true,
            editMode: context.editMode,
            mandatory: true,
            category: context.getFixedFieldDialogStep(
                FixedFormFieldKey.PROJECT_DESCRIPTION, FixedDialogStep.PROJECT),
            visibilityCondition: context.isFixedFieldVisibleInCurrentStep(
                FixedFormFieldKey.PROJECT_DESCRIPTION, FixedDialogStep.PROJECT)
        },
        {
            fixedFieldKey: FixedFormFieldKey.DESCRIPTION_UPLOAD,
            fieldKey: "DescriptionUpload",
            fieldValue: [context.projectDescription?.label, context.projectDescription?.originalFilename],
            isEditable: true,
            editMode: context.editMode,
            existFile: context.existsProjectDescription,
            uploadAction: Action.UPLOAD_DESCRIPTION_ACTION,
            downloadAction: Action.DOWNLOAD_DESCRIPTION_ACTION,
            downloadModule: Module.PROJECT_DOCUMENTS_MODULE,
            category: context.getFixedFieldDialogStep(
                FixedFormFieldKey.DESCRIPTION_UPLOAD, FixedDialogStep.PROJECT),
            visibilityCondition: context.isFixedFieldVisibleInCurrentStep(
                FixedFormFieldKey.DESCRIPTION_UPLOAD, FixedDialogStep.PROJECT)
        },
        {
            fixedFieldKey: FixedFormFieldKey.QUERIED_SITES,
            fieldKey: "Queried Sites",
            fieldDescription: "Sites identified via the Explorer as having samples or data matching your search criteria.",
            fieldValue: [],
            bridgeheads: {selected: context.bridgeheads, available: context.allBridgeheads},
            editProjectParam: [PmRequestParameter.BRIDGEHEADS],
            isEditable: true,
            editMode: context.editMode,
            mandatory: true,
            redirectUrl: context.project?.explorerUrl ?? undefined,
            category: context.getFixedFieldDialogStep(
                FixedFormFieldKey.QUERIED_SITES, FixedDialogStep.PROJECT),
            transformForSending: (humanReadable: string) =>
                context.allBridgeheads.find(bridgehead =>
                    bridgehead.humanReadable === humanReadable)?.bridgehead || humanReadable,
            visibilityCondition: context.isFixedFieldVisibleInCurrentStep(
                FixedFormFieldKey.QUERIED_SITES, FixedDialogStep.PROJECT)
        },
        {
            fixedFieldKey: FixedFormFieldKey.PROJECT_CONFIGURATION,
            fieldKey: "Configuration",
            fieldValue: context.currentProjectConfiguration,
            editProjectParam: [PmRequestParameter.PROJECT_CONFIGURATION],
            isEditable: true,
            editMode: context.editMode,
            possibleValues: context.projectConfigurationLabels,
            configurations: context.projectConfigurations,
            configurationSelectionType: context.projectConfigurationSelectionType,
            category: context.getFixedFieldDialogStep(
                FixedFormFieldKey.PROJECT_CONFIGURATION, FixedDialogStep.SERVICES),
            visibilityCondition: !context.existsDraftDialog ||
                context.isCurrentStep(context.getFixedFieldDialogStep(
                    FixedFormFieldKey.PROJECT_CONFIGURATION, FixedDialogStep.SERVICES)) ||
                (context.isProjectManagerAdmin() && context.isCurrentStep(FixedDialogStep.SUMMARY)),
            action: Action.SET_PROJECT_CONFIGURATION_ACTION
        },
        {
            fixedFieldKey: FixedFormFieldKey.SELECTED_COHORT,
            fieldKey: "Selected Cohort",
            fieldDescription: "This query was automatically imported from your Explorer session. Use \"Edit in Explorer\" to adjust your search criteria.",
            fieldValue: [
                context.project?.humanReadable ?? "",
                context.project?.query ?? "",
                context.project?.queryDetails ?? ""
            ],
            editProjectParam: [PmRequestParameter.HUMAN_READABLE],
            bridgeheads: {selected: context.bridgeheads, available: context.allBridgeheads},
            isEditable: true,
            editMode: context.editMode,
            mandatory: true,
            redirectUrl: context.project?.explorerUrl ?? undefined,
            category: context.getFixedFieldDialogStep(
                FixedFormFieldKey.SELECTED_COHORT, FixedDialogStep.QUERY),
            visibilityCondition: context.isFixedFieldVisibleInCurrentStep(
                FixedFormFieldKey.SELECTED_COHORT, FixedDialogStep.QUERY)
        },
        {
            fixedFieldKey: FixedFormFieldKey.QUERY_FORMAT,
            fieldKey: "Query Format",
            fieldValue: context.project?.queryFormat ? [context.project.queryFormat] : [],
            editProjectParam: [PmRequestParameter.QUERY_FORMAT],
            isEditable: true,
            editMode: context.editMode,
            redirectUrl: context.project?.explorerUrl ?? undefined,
            possibleValues: context.queryFormats,
            displayPossibleValue: (label: string) => ({name: label, description: ""}),
            mandatory: true,
            category: context.getFixedFieldDialogStep(
                FixedFormFieldKey.QUERY_FORMAT, FixedDialogStep.QUERY),
            visibilityCondition: context.isProjectManagerAdmin() &&
                (context.isFixedFieldConfigured(FixedFormFieldKey.QUERY_FORMAT)
                    ? context.isFixedFieldVisibleInCurrentStep(
                        FixedFormFieldKey.QUERY_FORMAT, FixedDialogStep.QUERY)
                    : (!context.existsDraftDialog || context.isCurrentStep(FixedDialogStep.SUMMARY)))
        },
        {
            fixedFieldKey: FixedFormFieldKey.ADDITIONAL_FILTER_CRITERIA,
            fieldKey: "Additional filter criteria",
            fieldDescription: "Please provide filter criteria that could not select in the Explorer, or further notes on the resources you want to request",
            fieldValue: context.project?.cohortDefinition ? [context.project.cohortDefinition] : [],
            editProjectParam: [PmRequestParameter.COHORT_DEFINITION],
            type: FormDataType.LONG_STRING,
            isEditable: true,
            editMode: context.editMode,
            category: context.getFixedFieldDialogStep(
                FixedFormFieldKey.ADDITIONAL_FILTER_CRITERIA, FixedDialogStep.QUERY),
            visibilityCondition: context.isFixedFieldVisibleInCurrentStep(
                FixedFormFieldKey.ADDITIONAL_FILTER_CRITERIA, FixedDialogStep.QUERY)
        },
        ...buildProjectOutputFields(context),
        {
            fixedFieldKey: FixedFormFieldKey.ENVIRONMENT_VARIABLES,
            fieldKey: "Environment Variables",
            fieldValue: context.project?.queryContext ? [context.project.queryContext] : [],
            editProjectParam: [PmRequestParameter.QUERY_CONTEXT],
            isEditable: context.isNotIncludedInCurrentProjectConfiguration("queryContext"),
            editMode: context.editMode,
            category: context.getFixedFieldDialogStep(
                FixedFormFieldKey.ENVIRONMENT_VARIABLES, FixedDialogStep.CUSTOM),
            visibilityCondition: context.isProjectManagerAdmin() &&
                (!context.existsDraftDialog ||
                    context.currentProjectConfiguration.includes(CUSTOM_PROJECT_CONFIGURATION) &&
                    context.isCurrentStep(context.getFixedFieldDialogStep(
                        FixedFormFieldKey.ENVIRONMENT_VARIABLES, FixedDialogStep.CUSTOM)) ||
                    context.isCurrentStep(FixedDialogStep.SUMMARY))
        }
    ];
}

export function buildVotumProjectFields(context: FixedProjectFieldsContext): ProjectField[] {
    return [
        {
            fixedFieldKey: FixedFormFieldKey.ETHICS_VOTE,
            fieldKey: "Ethics vote",
            fieldValue: [context.votumDescription.label, context.votumDescription.originalFilename],
            isEditable: true,
            editMode: context.editMode,
            existFile: context.existsVotum,
            uploadAction: Action.UPLOAD_VOTUM_ACTION,
            downloadAction: Action.DOWNLOAD_VOTUM_ACTION,
            downloadModule: Module.PROJECT_DOCUMENTS_MODULE,
            category: context.getFixedFieldDialogStep(
                FixedFormFieldKey.ETHICS_VOTE, FixedDialogStep.PROJECT),
            visibilityCondition: context.isFixedFieldVisibleInCurrentStep(
                FixedFormFieldKey.ETHICS_VOTE, FixedDialogStep.PROJECT)
        },
        {
            fixedFieldKey: FixedFormFieldKey.ETHICS_VOTE_FOR_ALL_SITES,
            fieldKey: "Ethics vote for all sites",
            fieldValue: [
                context.votumForAllBridgeheadsDescription.label,
                context.votumForAllBridgeheadsDescription.originalFilename
            ],
            isEditable: true,
            editMode: context.editMode,
            existFile: context.existsVotumForAllBridgeheads,
            uploadAction: Action.UPLOAD_VOTUM_FOR_ALL_BRIDGEHEADS_ACTION,
            downloadAction: Action.DOWNLOAD_VOTUM_FOR_ALL_BRIDGEHEADS_ACTION,
            downloadModule: Module.PROJECT_DOCUMENTS_MODULE,
            category: context.getFixedFieldDialogStep(
                FixedFormFieldKey.ETHICS_VOTE_FOR_ALL_SITES, FixedDialogStep.PROJECT),
            visibilityCondition: context.isFixedFieldVisibleInCurrentStep(
                FixedFormFieldKey.ETHICS_VOTE_FOR_ALL_SITES, FixedDialogStep.PROJECT)
        }
    ];
}
