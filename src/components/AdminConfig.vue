<template>
  <div class="container custom-width-projects">
    <div class="mailing-blacklist">
      <div class="box-header">Mailing Blacklist</div>
      <div style="padding: 2%">
        <MailingBlackList :project-manager-backend-service="projectManagerBackendService"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {
  Action,
  Module,
  ProjectManagerBackendService,
  ProjectManagerContext,
  Site
} from "@/services/projectManagerBackendService";
import MailingBlackList from "@/components/MailingBlackList.vue";

export default defineComponent({
  components: {MailingBlackList},

  data() {
    return {
      site: Site.CONFIGURATION_SITE,
      context: new ProjectManagerContext(undefined, undefined),
      projectManagerBackendService: new ProjectManagerBackendService(new ProjectManagerContext(undefined, undefined), Site.CONFIGURATION_SITE)
    };
  },
  watch: {},
  mounted() {
    this.fetchProjectRoles()
  },
  methods: {
    async fetchProjectRoles() {
      try {
        this.projectManagerBackendService.isModuleActionActive(Module.USER_MODULE, Action.FETCH_MAILING_BLACK_LIST_ACTION).then(condition => {
          //this.isProjectManagerAdmin = false;
          console.log(condition)
          if (condition) {
            this.projectManagerBackendService.fetchData(Module.USER_MODULE, Action.FETCH_MAILING_BLACK_LIST_ACTION, this.context, new Map()).then(isProjectManagerAdmin => {
              //this.isProjectManagerAdmin = isProjectManagerAdmin;
              console.log(isProjectManagerAdmin)
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
.mailing-blacklist {
  background-color: white;
  margin-bottom: 1.5%;
  border-radius: 10px;
}

.box-header {
  padding: 12px 0 0 2%;
  background-color: #00489c;
  color: white;
  font-size: large;
  font-weight: bold;
  border: 1px solid #95c8dc;
  border-radius: 10px 10px 0 0;
}

.custom-width-projects {
  flex: 1;
  margin-top: 2%;


  height: 100%;
}
</style>
