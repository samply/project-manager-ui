<template>
  <div>
    <nav class="navbar navbar-dark bg-dark" style="display:flex; align-content: flex-start; justify-content: space-between; padding-left:5%">
      <router-link style="margin-right:3%" class="navbar-brand" to="/">Project-Manager</router-link>
<!--      <button @click="toggleSidebar" class="btn btn-dark" style="padding-right:2%"><i class="bi bi-chat-right-text-fill"></i></button>-->
      <span class="white-text">{{keycloak.getEmail()}}</span>
      <div style="padding-right:2%">
        <button @click="logout" class="btn btn-outline-danger">
          <i class="bi bi-box-arrow-right"></i> logout
        </button>
      </div>
    </nav>
  </div>
</template>

<script>
import keycloak from "../services/keycloak";

export default {
  name: 'NavBar',
  computed: {
    keycloak() {
      return keycloak
    }
  },
  methods: {
    toggleSidebar() {
      this.$store.commit('toggleSidebar');
    },
    logout(){
      keycloak.logout();
    }
  },
};
</script>

<style scoped>
.white-text {
  color: white;

}
</style>
