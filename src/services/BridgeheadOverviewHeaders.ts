import {ProjectType} from "@/services/projectManagerBackendService";

export enum BridgeheadOverviewHeader {
  SITES = 'Sites',
  VOTUM = 'Ethic vote',
  TEILER = 'Data export authorised',
  USER_ACCESS = 'Data accessible',
  APPLICANT_RESULTS_ACCEPTANCE = 'Data received and accepted',
  REPORT_OR_PUBLICATION = 'Report or publication',
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
