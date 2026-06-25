import {UserManager, UserManagerSettings} from "oidc-client-ts";

(async () => {
    const mgr = new UserManager({} as UserManagerSettings);
    await mgr.signinSilentCallback();
})();
