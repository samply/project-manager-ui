<template>
  <div>
    <nav class="navbar navbar-dark custom-navbar">
      <div class="navbar__logo">
        <a href="https://dktk.dkfz.de/" class="navbar-brand dk-logo">
          <span class="dk-logo__sign"><img src="../assets/logo-dktk-sign.svg" alt="dktk"></span>
          <span class="dk-logo__brand">
            <span class="dk-logo__brand-part1">D</span><span class="dk-logo__brand-part2">K</span><span class="dk-logo__brand-part3">TK</span>
          </span>
          <span class="dk-logo__slogan">Deutsches Konsortium für <br> Translationale Krebsforschung</span>
        </a>
      </div>
      <router-link class="navbar-brand" to="/">
        <span class="navbar-title" v-html="frontendName"></span>
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
import {getConfig} from "@/services/configLoader";

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
      frontendName: '<b>Samply</b>.Requester',
      context: new ProjectManagerContext(undefined, undefined),
      projectManagerBackendService: new ProjectManagerBackendService(new ProjectManagerContext(undefined, undefined), Site.NAVIGATION_BAR_SITE),
    };
  },

  mounted() {
    this.fetchProjectRoles();
    this.fetchFrontendName();
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
    async fetchFrontendName() {
      const config = await getConfig();
      this.frontendName = config.VUE_APP_FRONTEND_NAME;
    },

  },
});
</script>

<style scoped>
.custom-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 2%;
}
.navbar-title {
  color: #00489c;
  font-size: larger;
}
.navbar-icon {
  margin-right: 5px;
  color: #00489c;
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
  color: #00489c;
  font-weight: bold;
}

.user-icon {
  margin-right: 5px;
}

.admin-button {
  color: #00489c;
  margin-right: 10px;
}

.admin-button:hover {
  color: white;
  font-size: large;
  padding: 0.3rem 0.68rem;
}
.btn-outline-danger {
  color: #fa7b26!important;
  border: none!important;
  font-weight: bold;
}
.dk-logo {
  align-items: center;
  color: #00489c;
  display: flex;
  flex-wrap: wrap;
  font-family: Open Sans, serif;
  font-weight: 200;
  height: auto;
}
.dk-logo__sign {
  display: inline-block;
  margin-right: 15px;
  vertical-align: top;
  width: 40px;
}
.dk-logo__sign img {
  vertical-align: middle;
}
.dk-logo__brand {
  color: #00489c;
  display: inline-block;
  font-size: 48px;
  margin-right: 15px;
}
div.ccm-page .dk-logo__brand-part1 {
  letter-spacing: -2px;
}
.dk-logo__brand-part2 {
  letter-spacing: 2px;
}
.dk-logo__slogan {
  color: #00489c;
  display: inline-block;
  font-size: 17px;
  font-weight: 200;
  line-height: 1.4;
}
</style>
