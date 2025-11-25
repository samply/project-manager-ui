import { UserManager, WebStorageStateStore, User } from "oidc-client-ts";
import { getConfig } from "@/services/configLoader";

let userManager: UserManager | null = null;
let cachedUser: User | null = null;

/**
 * Create or return the UserManager instance
 */
export async function getUserManager(): Promise<UserManager> {
    if (!userManager) {
        const config = await getConfig();

        userManager = new UserManager({
            authority: config.OIDC_URL,
            client_id: config.OIDC_CLIENT_ID,
            redirect_uri: window.location.origin,
            post_logout_redirect_uri: window.location.origin,
            response_type: "code",
            scope: "openid profile email",
            userStore: new WebStorageStateStore({ store: window.localStorage }),
            automaticSilentRenew: true
        });
    }
    return userManager;
}

/**
 * Start login by redirecting to Authentik
 */
export async function startLoginFlow(): Promise<void> {
    const mgr = await getUserManager();
    return mgr.signinRedirect();
}

/**
 * Finish login after Authentik redirects back to /callback
 */
export async function finishLoginFlow(): Promise<void> {
    const mgr = await getUserManager();
    const user = await mgr.signinCallback();

    // Normalize undefined/null → null
    cachedUser = user ?? null;
}

/**
 * Try to load an already authenticated user from storage on startup
 */
export async function tryLoadUserFromStorage(): Promise<void> {
    const mgr = await getUserManager();
    const user = await mgr.getUser();

    cachedUser = user ?? null;
}

/**
 * Synchronous accessors
 */
export const AuthService = {

    getToken(): string | null {
        return cachedUser?.access_token ?? null;
    },

    getEmail(): string {
        return cachedUser?.profile?.email ?? "";
    },

    getFirstName(): string {
        return cachedUser?.profile?.given_name ?? "";
    },

    getLastName(): string {
        return cachedUser?.profile?.family_name ?? "";
    },

    isLoggedIn(): boolean {
        return cachedUser != null;
    },

    async login(): Promise<void> {
        return startLoginFlow();
    },

    async logout(): Promise<void> {
        const mgr = await getUserManager();
        return mgr.signoutRedirect();
    }
};
