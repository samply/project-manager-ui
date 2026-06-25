<template>
  <header class="site-header">
    <a href="https://dktk.dkfz.de/" class="header-logo">
      <img src="@/assets/logo-dktk-sign.svg" class="dktk-logo" alt="DKTK Logo" />
      <div class="dktk-text">
        <div class="dktk-name">DKTK</div>
        <div class="dktk-slogan">Deutsches Konsortium für<br>Translationale Krebsforschung</div>
      </div>
    </a>

    <router-link class="header-app-name" to="/">
      Samply<span class="header-dot">.</span>Requester
    </router-link>

    <div class="header-user">
      <span class="user-info" :title="auth.getEmail()">
        <i class="bi bi-person-fill"></i>
        {{ auth.getFirstName() + " " + auth.getLastName() }}
      </span>
      <router-link v-if="isProjectManagerAdmin" class="admin-link" to="/config" title="Admin config">
        <i class="bi bi-gear"></i>
      </router-link>
      <button @click="logout" class="logout-btn">
        <i class="bi bi-box-arrow-right"></i> logout
      </button>
    </div>
  </header>
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
.site-header {
  background: #fff;
  border-bottom: 1px solid #dde1e7;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  height: 60px;
  padding: 0 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 11px;
  text-decoration: none;
}

.dktk-logo {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.dktk-text {
  display: flex;
  flex-direction: column;
}

.dktk-name {
  font-size: 17px;
  font-weight: 700;
  color: #1a3a6b;
  letter-spacing: 1.5px;
  line-height: 1.2;
}

.dktk-slogan {
  font-size: 8.5px;
  color: #64748b;
  line-height: 1.35;
}

.header-app-name {
  font-size: 17px;
  font-weight: 600;
  color: #1a3a6b;
  letter-spacing: 0.3px;
  text-decoration: none;
}

.header-dot {
  color: #e05c2a;
  font-weight: 300;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #475569;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

.admin-link {
  color: #2655a2;
  text-decoration: none;
  font-size: 16px;
}

.admin-link:hover {
  color: #1a3a6b;
}

.logout-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #2655a2;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  font-family: inherit;
}

.logout-btn:hover {
  text-decoration: underline;
}
</style>
