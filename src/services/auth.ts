import {User, UserManager, WebStorageStateStore} from "oidc-client-ts";
import {getConfig} from "@/services/configLoader";

let userManager: UserManager | null = null;
let cachedUser: User | null = null;

/**
 * Create or return the UserManager instance
 */
export async function getUserManager(): Promise<UserManager> {
    if (!userManager) {
        const config = await getConfig();

        userManager = new UserManager({
            authority: config.VUE_APP_OIDC_URL,
            client_id: config.VUE_APP_OIDC_CLIENT_ID,
            redirect_uri: `${window.location.origin}/`,
            post_logout_redirect_uri: window.location.origin,
            silent_redirect_uri: `${window.location.origin}/silent-renew.html`,
            response_type: "code",
            scope: "openid profile email",
            userStore: new WebStorageStateStore({store: window.localStorage}),
            automaticSilentRenew: true,
            revokeTokensOnSignout: true
        });

        userManager.events.addUserLoaded(user => {
            cachedUser = user;
        });

        userManager.events.addUserUnloaded(() => {
            cachedUser = null;
        });

        userManager.events.addAccessTokenExpired(() => {
            console.warn("Access token expired");
            cachedUser = null;
        });

        userManager.events.addSilentRenewError(err => {
            console.error("Silent renew failed", err);
            cachedUser = null;
        });

    }
    return userManager;
}

/**
 * Start login by redirecting to Authentik
 */
export async function startLoginFlow(): Promise<void> {
    const mgr = await getUserManager();

    await mgr.signinRedirect({
        state: {
            targetUrl: window.location.pathname + window.location.search
        }
    });
}


/**
 * Finish login after Authentik redirects back to /callback
 */
export async function finishLoginFlow(): Promise<void> {
    const mgr = await getUserManager();
    const user = await mgr.signinCallback();

    cachedUser = user ?? null;

    const state = user?.state as { targetUrl?: string } | undefined;
    const targetUrl = state?.targetUrl;
    if (targetUrl) {
        window.history.replaceState({}, document.title, targetUrl);
    }
}

/**
 * Try to load an already authenticated user from storage on startup
 */
export async function tryLoadUserFromStorage(): Promise<void> {
    const mgr = await getUserManager();
    let user = await mgr.getUser();

    if (user && user.expired) {
        try {
            user = await mgr.signinSilent();
        } catch (err) {
            console.warn("Silent renew failed on startup", err);
            user = null;
        }
    }

    cachedUser = user ?? null;
}

/**
 * Synchronous accessors
 */
export const AuthService = {

    async getToken(): Promise<string | null> {
        const mgr = await getUserManager();

        // If no user or token expired, try silent renew
        if (!cachedUser || cachedUser.expired) {
            try {
                const user = await mgr.signinSilent();
                cachedUser = user ?? null;
            } catch (err) {
                console.error("Silent renew failed, redirecting to login", err);
                await mgr.signinRedirect();
                return null; // user will be redirected
            }
        }

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
        return cachedUser != null && !cachedUser.expired;
    },

    async login(): Promise<void> {
        return startLoginFlow();
    },

    async logout(): Promise<void> {
        const mgr = await getUserManager();

        // Clear local user first
        cachedUser = null;
        await mgr.removeUser();

        // Redirect to IdP logout endpoint (ends Authentik SSO session)
        await mgr.signoutRedirect();
    }

};
