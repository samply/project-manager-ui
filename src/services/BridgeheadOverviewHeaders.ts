import {ProjectType} from "@/services/projectManagerBackendService";

export enum BridgeheadOverviewHeader {
    SITES = 'Sites',
    VOTUM = 'Votum',
    TEILER = 'Teiler',
    USER_ACCESS = 'User Access',
    APPLICANT_RESULTS_ACCEPTANCE = 'Applicant Results Acceptance'
}

export class MultiHeader {

    // Build Teiler header for a given projectType
    static build(projectType: ProjectType, headerType: BridgeheadOverviewHeader): string {
        return `${headerType} (${projectType})`;
    }

    // Check if a header string is a Teiler header
    static isHeaderOfHeaderType(header: string, headerType: BridgeheadOverviewHeader): boolean {
        return header.includes(headerType);
    }

    // Extract projectType from a Teiler header string
    static extractProjectType(header: string): ProjectType | undefined {
        const match = header.match(/\((.*?)\)/);
        return match ? (match[1] as ProjectType) : undefined;
    }

}
