<template>
  <div>
    <nav class="navbar navbar-dark bg-dark custom-navbar">
      <router-link class="navbar-brand" to="/">Data Science Orchestrator</router-link>
      <div class="user-logout-container">
        <!-- User information -->
        <span class="user-info">
          <i class="bi bi-person-fill user-icon"></i>
          {{ keycloak.getFirstName() + " " + keycloak.getLastName() }}
        </span>
        <!-- Logout button -->
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
.custom-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 5%;
}

.user-logout-container {
  display: flex;
  align-items: center;
  padding-right: 2%;
}

.user-info {
  display: flex;
  align-items: center;
  margin-right: 10px;
  color: white;
}

.user-icon {
  margin-right: 5px;
}
</style>
