<template>
  <div id="app">
    <HelloWorld :msg="message" />
    <button @click="login">Login</button>
    <button @click="logout">Logout</button>
  </div>
</template>


<script>
import HelloWorld from './components/HelloWorld.vue'
import keycloak from "@/services/keycloak";

export default {
  name: 'App',
  components: {
    HelloWorld
  },
  methods: {
    login() {
      keycloak
          .init({onLoad: 'login-required'})
          .then((authenticated) => {
            if (authenticated) {
              console.log('User is authenticated');
            } else {
              console.log('User is not authenticated');
            }
          })
          .catch((error) => {
            console.error('Authentication error', error);
          });
    },
    logout() {
      keycloak.logout();
    },
  },

}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
