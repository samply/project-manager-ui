import {User, UserManager, WebStorageStateStore} from "oidc-client-ts";
import {getConfig} from "@/services/configLoader";
import {getFrontendRelativeLocation, getFrontendUrl} from "@/services/frontendUrl";

let userManager: UserManager | null = null;
let cachedUser: User | null = null;

// Key used to persist the intended destination across the auth redirect
const TARGET_URL_KEY = "oidc:target_url";

export async function getUserManager(): Promise<UserManager> {
    if (!userManager) {
        const config = await getConfig();
        const frontendUrl = getFrontendUrl(config.VUE_APP_FRONTEND_URL);

        userManager = new UserManager({
            authority: config.VUE_APP_OIDC_URL,
            client_id: config.VUE_APP_OIDC_CLIENT_ID,
            redirect_uri: frontendUrl.toString(),
            post_logout_redirect_uri: frontendUrl.toString(),
            silent_redirect_uri: new URL('silent-renew.html', frontendUrl).toString(),
            silentRequestTimeoutInSeconds: 1,
            response_type: "code",
            scope: "openid profile email offline_access",
            userStore: new WebStorageStateStore({store: window.localStorage}),
            automaticSilentRenew: true,
            revokeTokensOnSignout: true,
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

export async function startLoginFlow(): Promise<void> {
    const mgr = await getUserManager();
    const config = await getConfig();

    // Save the current URL *before* the redirect wipes it
    const intended = getFrontendRelativeLocation(config.VUE_APP_FRONTEND_URL);
    if (intended && intended !== "/") {
        sessionStorage.setItem(TARGET_URL_KEY, intended);
    }

    await mgr.signinRedirect();
}

export async function finishLoginFlow(): Promise<string> {
    const mgr = await getUserManager();
    const user = await mgr.signinCallback();
    cachedUser = user ?? null;

    // Retrieve and clear the saved destination
    const targetUrl = sessionStorage.getItem(TARGET_URL_KEY) ?? "/";
    sessionStorage.removeItem(TARGET_URL_KEY);
    return targetUrl;
}

export async function tryLoadUserFromStorage(): Promise<void> {
    const mgr = await getUserManager();
    let user = await mgr.getUser();

    if (user && user.expired) {
        try {
            // signinSilent prefers the refresh token when available (fast, no iframe)
            // and only falls back to the iframe flow if no refresh token exists
            user = await mgr.signinSilent();
        } catch (err) {
            console.warn("Silent renew failed on startup", err);
            user = null;
        }
    }

    cachedUser = user ?? null;
}

export const AuthService = {
    async getToken(): Promise<string | null> {
        const mgr = await getUserManager();

        if (!cachedUser || cachedUser.expired) {
            try {
                const user = await mgr.signinSilent(); // uses refresh token if available
                cachedUser = user ?? null;
            } catch (err) {
                console.error("Silent renew failed, redirecting to login", err);
                await startLoginFlow(); // preserves current URL before redirecting
                return null;
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
        cachedUser = null;
        await mgr.removeUser();
        await mgr.signoutRedirect();
    },
};
