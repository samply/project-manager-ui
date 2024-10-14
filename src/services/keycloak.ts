import Keycloak from "keycloak-js";

const keycloakInstance = new Keycloak();

interface CallbackOneParam<T1 = void, T2 = void> {
    (param1: T1): T2;
}
/**
 * Initializes Keycloak instance and calls the provided callback function if successfully authenticated.
 *
 * @param onAuthenticatedCallback
 */
const Login = (onAuthenticatedCallback: CallbackOneParam) => {
    keycloakInstance
        .init({ onLoad: "login-required" })
        .then(function (authenticated) {
            if (authenticated) {
                keycloakInstance.loadUserProfile().then(() => {
                    onAuthenticatedCallback();
                });
            } else {
                alert("Non-authenticated");
            }
        })
        .catch((e) => {
            console.dir(e);
            console.log(`keycloak init exception: ${e}`);
        });
};

const refreshToken = () => {
    keycloakInstance
        .updateToken()
        .then((refreshed) => {
            if (refreshed) {
                console.log('Token refreshed');
            } else {
                console.log('Token not refreshed, or the token is still valid');
            }
        })
        .catch((error) => {
            console.error('Token refresh failed:', error);
        });
};

// Set up timer to refresh token periodically
const tokenRefreshInterval = setInterval(refreshToken, 5 * 60 * 1000); // Refresh token every 5 minutes

const KeyCloakService = {
    getToken: () => keycloakInstance.token,
    getEmail: () => (keycloakInstance && keycloakInstance.profile && keycloakInstance.profile.email) ? keycloakInstance.profile.email : '',
    getFirstName: () => (keycloakInstance && keycloakInstance.profile && keycloakInstance.profile.firstName) ? keycloakInstance.profile.firstName : '',
    getLastName: () => (keycloakInstance && keycloakInstance.profile && keycloakInstance.profile.firstName) ? keycloakInstance.profile.lastName : '',
    CallLogin: Login,
    logout: () => {
        keycloakInstance.logout();
    }
};

export default KeyCloakService;
