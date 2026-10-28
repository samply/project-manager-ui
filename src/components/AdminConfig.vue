<template>
  <div class="container custom-width-projects">
    <!-- The email lists of the roles (docs/user-lists.md in the backend) -->
    <div v-for="list in roleLists" :key="list.title" class="mailing-blacklist">
      <div class="box-header">{{ list.title }}</div>
      <div style="padding: 2%">
        <RoleUserList :project-manager-backend-service="projectManagerBackendService" :role-name="list.roleName"
                      :fetch-action="list.fetchAction" :add-action="list.addAction" :remove-action="list.removeAction"
                      :with-bridgehead="list.withBridgehead"/>
      </div>
    </div>
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
import RoleUserList from "@/components/RoleUserList.vue";
import {DEFAULT_CENTRAL_APPROVAL_COMMITTEE_NAME, getCentralApprovalCommitteeName} from "@/services/configLoader";

export default defineComponent({
  components: {MailingBlackList, RoleUserList},

  data() {
    return {
      committeeName: DEFAULT_CENTRAL_APPROVAL_COMMITTEE_NAME,
      site: Site.CONFIGURATION_SITE,
      context: new ProjectManagerContext(undefined, undefined),
      projectManagerBackendService: new ProjectManagerBackendService(new ProjectManagerContext(undefined, undefined), Site.CONFIGURATION_SITE)
    };
  },
  computed: {
    roleLists() {
      return [
        {
          title: "Project Managers", roleName: "project managers", withBridgehead: false,
          fetchAction: Action.FETCH_PROJECT_MANAGER_ADMINS_ACTION, addAction: Action.ADD_PROJECT_MANAGER_ADMIN_ACTION,
          removeAction: Action.REMOVE_PROJECT_MANAGER_ADMIN_ACTION
        },
        {
          title: this.committeeName, roleName: this.committeeName, withBridgehead: false,
          fetchAction: Action.FETCH_CENTRAL_APPROVAL_COMMITTEE_MEMBERS_ACTION,
          addAction: Action.ADD_CENTRAL_APPROVAL_COMMITTEE_MEMBER_ACTION,
          removeAction: Action.REMOVE_CENTRAL_APPROVAL_COMMITTEE_MEMBER_ACTION
        },
        {
          title: "Site Admins", roleName: "site admins", withBridgehead: true,
          fetchAction: Action.FETCH_BRIDGEHEAD_ADMINS_ACTION, addAction: Action.ADD_BRIDGEHEAD_ADMIN_ACTION,
          removeAction: Action.REMOVE_BRIDGEHEAD_ADMIN_ACTION
        }
      ];
    }
  },
  watch: {},
  mounted() {
    getCentralApprovalCommitteeName().then(name => this.committeeName = name);
    this.fetchProjectRoles()
  },
  methods: {
    async fetchProjectRoles() {
      try {
        this.projectManagerBackendService.isModuleActionActive(Module.USER_MODULE, Action.FETCH_MAILING_BLACK_LIST_ACTION, this.context).then(condition => {
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
