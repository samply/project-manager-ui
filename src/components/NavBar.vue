<template>
  <div>
    <nav class="navbar navbar-dark bg-dark custom-navbar">
      <router-link class="navbar-brand" to="/">
        <i class="bi bi-boxes navbar-icon"></i> Samply.Requester
      </router-link>
      <div class="user-logout-container">
        <!-- User information -->
        <span class="user-info" :title="auth.getEmail()">
          <i class="bi bi-person-fill user-icon"></i>
          {{ auth.getFirstName() + " " + auth.getLastName() }}
        </span>
        <!-- PM-Admin Config  -->
        <router-link v-if="isProjectManagerAdmin" class="btn admin-button" to="/config">
          <i class="bi bi-gear"></i>
        </router-link>
        <!-- Logout button -->
        <button @click="logout" class="btn btn-outline-danger">
          <i class="bi bi-box-arrow-right"></i> logout
        </button>
      </div>
    </nav>
  </div>
</template>

<script lang="ts">
import {
  Action,
  Module,
  ProjectManagerBackendService,
  ProjectManagerContext,
  ProjectRole,
  Site
} from "@/services/projectManagerBackendService";
import {defineComponent} from "vue";
import {AuthService} from "@/services/auth";

export default defineComponent({
  computed: {
      auth() {
        return AuthService;
      },
      ProjectRole() {
        return ProjectRole;
    },
  },
  data() {
    return {
      isProjectManagerAdmin: false,
      context: new ProjectManagerContext(undefined, undefined),
      projectManagerBackendService: new ProjectManagerBackendService(new ProjectManagerContext(undefined, undefined), Site.NAVIGATION_BAR_SITE),
    };
  },

  mounted() {
    this.fetchProjectRoles()
  },
  methods: {
    logout() {
      this.auth.logout();
    },

    async fetchProjectRoles() {
      try {
        this.projectManagerBackendService.isModuleActionActive(Module.USER_MODULE, Action.IS_PROJECT_MANAGER_ADMIN_ACTION).then(condition => {
          this.isProjectManagerAdmin = false;
          if (condition) {
            this.projectManagerBackendService.fetchData(Module.USER_MODULE, Action.IS_PROJECT_MANAGER_ADMIN_ACTION, this.context, new Map()).then(isProjectManagerAdmin => {
              this.isProjectManagerAdmin = isProjectManagerAdmin;
            })
          }
        })
      } catch (error) {
        console.error('Error loading user roles:', error);
      }
    },

  },
});
</script>

<style scoped>
.custom-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 5%;
}

.navbar-icon {
  margin-right: 5px;
  color: white;
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

.admin-button {
  color: white;
  margin-right: 10px;
}
.admin-button:hover {
  color: white;
  font-size: large;
  padding:0.3rem 0.68rem;
}
</style>
