<template>
  <div>
    <nav class="navbar navbar-dark custom-navbar">
      <div class="navbar__logo">
        <a :href="projectUrl" class="navbar-brand dk-logo" target="_blank" rel="noopener noreferrer">
          <span v-if="logoUrl" class="dk-logo__sign"><img :src="logoUrl" :alt="logoText"></span>
          <span v-if="logoHtml" v-html="logoHtml"></span>
        </a>
      </div>
      <router-link class="navbar-brand" to="/">
        <span class="navbar-title" v-html="frontendName"></span>
      </router-link>
      <div class="user-logout-container">
        <span class="user-info" :title="auth.getEmail()">
          <i class="bi bi-person-fill user-icon"></i>
          {{ auth.getFirstName() + " " + auth.getLastName() }}
        </span>
        <router-link v-if="isProjectManagerAdmin" class="btn admin-button" to="/config">
          <i class="bi bi-gear"></i>
        </router-link>
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
      logoUrl: "",
      logoText: "",
      logoHtml: "",
      projectUrl: "#",
      logoStyleElement: null as HTMLStyleElement | null,
      context: new ProjectManagerContext(undefined, undefined),
      projectManagerBackendService: new ProjectManagerBackendService(new ProjectManagerContext(undefined, undefined), Site.NAVIGATION_BAR_SITE),
    };
  },

  mounted() {
    this.fetchProjectRoles();
    this.fetchFrontendConfig();
  },

  beforeUnmount() {
    this.removeLogoStyle();
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

    async fetchFrontendConfig() {
      const config = await getConfig();
      this.frontendName = config.VUE_APP_FRONTEND_NAME;
      this.logoUrl = config.LOGO_URL ?? "";
      this.logoText = config.LOGO_TEXT ?? "";
      this.projectUrl = config.PROJECT_URL ?? "#";
      this.logoHtml = await this.fetchTextAsset(config.LOGO_HTML);
      this.applyLogoCss(await this.fetchTextAsset(config.LOGO_CSS));
    },

    async fetchTextAsset(url?: unknown): Promise<string> {
      if (typeof url !== "string" || !url) {
        return "";
      }

      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`Failed to load asset ${url}: request returned status ${response.status}`);
          return "";
        }
        return await response.text();
      } catch (error) {
        console.warn(`Failed to load asset ${url}:`, error);
        return "";
      }
    },

    applyLogoCss(cssText: string) {
      this.removeLogoStyle();

      if (!cssText) {
        return;
      }

      const style = document.createElement("style");
      style.textContent = cssText;
      style.setAttribute("data-navbar-logo-style", "true");
      document.head.appendChild(style);
      this.logoStyleElement = style;
    },

    removeLogoStyle() {
      this.logoStyleElement?.remove();
      this.logoStyleElement = null;
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
  color: #fa7b26 !important;
  border: none !important;
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
}

.dk-logo__sign img {
  vertical-align: middle;
  width: 100%;
}

/* noinspection CssUnusedSymbol */
div.ccm-page {
  letter-spacing: -2px;
}

</style>
