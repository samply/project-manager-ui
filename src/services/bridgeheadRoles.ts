// On whose behalf a user may act in a project: for the whole project (no bridgehead) or in the name of a bridgehead.
// Background and the rules: docs/bridgehead-context.md.
import {ProjectRole} from "@/services/projectManagerBackendService";

// The roles that belong to one bridgehead. The backend counts them only for the bridgehead sent with a call
// (UserRoles.containsRole); CREATOR and PROJECT_MANAGER_ADMIN do not depend on a bridgehead.
export const BRIDGEHEAD_ROLES: readonly ProjectRole[] =
    [ProjectRole.BRIDGEHEAD_ADMIN, ProjectRole.DEVELOPER, ProjectRole.PILOT, ProjectRole.FINAL];

// The bridgehead roles of the user, by bridgehead id.
export type BridgeheadRoles = Map<string, Set<ProjectRole>>;

/**
 * The bridgehead roles of each bridgehead, from the answers of FETCH_PROJECT_ROLES asked once per bridgehead. Each
 * answer also contains the roles that do not depend on a bridgehead, which are left out here. A bridgehead without an
 * answer has no bridgehead roles.
 */
export function toBridgeheadRoles(rolesByBridgehead: Map<string, ProjectRole[] | undefined>): BridgeheadRoles {
    return new Map(Array.from(rolesByBridgehead, ([bridgehead, roles]) =>
        [bridgehead, new Set((roles ?? []).filter(role => BRIDGEHEAD_ROLES.includes(role)))]));
}

/** The creator and the project manager admin may act for the whole project, without a bridgehead. */
export function canActForWholeProject(projectRoles: ProjectRole[]): boolean {
    return projectRoles.includes(ProjectRole.CREATOR) || projectRoles.includes(ProjectRole.PROJECT_MANAGER_ADMIN);
}

/**
 * The bridgeheads the user may act for with one of the allowed bridgehead roles: the project manager admin for every
 * bridgehead, everyone else for the bridgeheads where they have one of these roles. In the order of the given
 * bridgeheads.
 */
export function actingBridgeheads<T extends { bridgehead: string }>(
    bridgeheads: T[], bridgeheadRoles: BridgeheadRoles, projectRoles: ProjectRole[],
    allowedRoles: readonly ProjectRole[] = BRIDGEHEAD_ROLES): T[] {
    if (projectRoles.includes(ProjectRole.PROJECT_MANAGER_ADMIN)) return bridgeheads;
    return bridgeheads.filter(bridgehead =>
        allowedRoles.some(role => bridgeheadRoles.get(bridgehead.bridgehead)?.has(role)));
}
