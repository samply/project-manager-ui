import { h, createApp } from 'vue';
import singleSpaVue from 'single-spa-vue';

import App from './App.vue';
import KeyCloakService from "@/services/keycloak";

const vueLifecycles = singleSpaVue({
  createApp,
  appOptions: {
    render() {
      return h(App, {
        // single-spa props are available on the "this" object. Forward them to your component as needed.
        // https://single-spa.js.org/docs/building-applications#lifecycle-props
        // if you uncomment these, remember to add matching prop definitions for them in your App.vue file.
        /*
        name: this.name,
        mountParcel: this.mountParcel,
        singleSpa: this.singleSpa,
        */
      });
    },
  },
});

// Call the Keycloak login function during bootstrap
export const bootstrap = async () => {
  // Assuming the onAuthenticatedCallback is handled here
  const onAuthenticatedCallback = () => {
    // Code to handle authentication success
    console.log('Authenticated!');
  };

  // Call the Keycloak login function during bootstrap
  await KeyCloakService.CallLogin(onAuthenticatedCallback);
  return vueLifecycles.bootstrap;
};

//export const bootstrap = vueLifecycles.bootstrap;
export const mount = vueLifecycles.mount;
export const unmount = vueLifecycles.unmount;
