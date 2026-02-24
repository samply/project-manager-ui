<script lang="ts">

import {
  Action,
  Module,
  Notification,
  ProjectManagerBackendService,
  ProjectManagerContext
} from "@/services/projectManagerBackendService";
import {Options, Vue} from "vue-class-component";
import {format} from "date-fns";
import {watch} from "vue";

@Options({
  name: "NotificationBox",
  props: {
    projectManagerBackendService: {type: Object as () => ProjectManagerBackendService, required: true},
    notifications: {type: Array as () => Notification[], required: true},
    context: {type: Object as () => ProjectManagerContext, required: true},
    showNotification: {type: Boolean, required: true},
    showInPanel: {type: Boolean, required: true},
    callUpdateNotifications: {type: Function as unknown as () => () => void, required: true},
    callToggleNotification: {type: Function as unknown as () => () => void, required: true}
  }
})
export default class NotificationBox extends Vue {
  readonly projectManagerBackendService!: ProjectManagerBackendService;
  readonly notifications!: Notification[];
  readonly context!: ProjectManagerContext;
  // For the templates:
  // noinspection JSUnusedGlobalSymbols
  readonly showNotification!: boolean;
  // noinspection JSUnusedGlobalSymbols
  readonly showInPanel!: boolean;
  // noinspection JSUnusedGlobalSymbols
  readonly callToggleNotification!: () => void;
  readonly callUpdateNotifications!: () => void;


  currentPage = 1;
  totalPages = 1;
  notificationsPerPage = 8;
  pagedNotifications: Notification[] = [];

  mounted() {
    // Replace the old @Watch
    watch(
        () => this.notifications,
        (newValue) => {
          this.totalPages = Math.ceil(newValue.length / this.notificationsPerPage);
          this.pagingNotifications();
        },
        {immediate: true, deep: true}
    );
  }

  convertDate(date: Date) {
    return format(date, 'yyyy-MM-dd HH:mm:ss')
  }

  removeNotification(notificationId: number): void {
    const params = new Map<string, string>;
    params.set('notification-id', '' + notificationId)
    this.projectManagerBackendService.fetchData(Module.NOTIFICATIONS_MODULE, Action.SET_NOTIFICATION_AS_READ_ACTION, this.context, params)
    this.pagingNotifications()
    this.callUpdateNotifications()
  }

  pagingNotifications() {
    this.pagedNotifications = this.notifications.slice((this.currentPage - 1) * this.notificationsPerPage, ((this.currentPage - 1) * this.notificationsPerPage) + this.notificationsPerPage)
  }

  firstPage() {
    this.currentPage = 1;
    this.pagingNotifications()
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--
    }
    this.pagingNotifications()
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++
    }
    this.pagingNotifications()
  }

  lastPage() {
    this.currentPage = this.totalPages;
    this.pagingNotifications()
  }
}
</script>

<template>
  <div v-if="showNotification" :class="{ 'custom-width-notifications': showInPanel }">
    <div v-if="showInPanel" class="box-header" style="display:flex; flex-flow:row; justify-content:space-between ">
      <div>Notifications</div>
      <button style="padding: 0 15px 0 0; margin-bottom: -4px" @click="callToggleNotification" class="btn"
              v-if="showNotification">
        <i style="font-size: 20px" class="bi bi-x"></i> <!-- Close symbol for Progress -->
      </button>
    </div>
    <div class="notification-box">
      <div v-for="(notification,index) in pagedNotifications" :key="index" class="card mb-3">
        <!--<div class="card-body" :class="{ 'expanded': true }">-->
        <div class="card-body" v-if="!notification.read">
          <div style="display:flex; flex-flow: row; justify-content: space-between">
            <h5 class="card-title">{{ notification.details }}</h5>
            <div class="notification-header">
              <button type="button" class="btn-close"
                      @click="removeNotification(notification && notification.id ? notification.id : 0)"
                      aria-label="Close"></button>
            </div>
          </div>
          <!-- TODO: Add rest of notification information -->
          <div class="card-text">
            <div style="font-size: small">{{
                notification && notification.timestamp ? convertDate(notification.timestamp) : ''
              }}
            </div>
            <div style="margin-top:8px;">
              <div><strong>Project: </strong> {{ notification.projectCode }}</div>
              <div><strong>User: </strong> {{ notification.email }}</div>
            </div>
          </div>

          <!--            <div class="expand-icon" @click="toggleExpand(notification)">
                        <i :class="['bi', 'bi-chevron-compact-down', { 'rotate': notification.isExpanded }]"></i>
                      </div>-->
        </div>
      </div>
    </div>
    <div v-if="totalPages > 1" class="pager">
      <button @click="firstPage" class="btn btn-primary">
        <i class="bi bi-skip-start-fill" style="font-size: medium"></i>
      </button>
      <button @click="previousPage" class="btn btn-primary" style="rotate: 180deg">
        <i class="bi bi-play-fill" style="font-size: medium"></i>
      </button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button @click="nextPage" class="btn btn-primary">
        <i class="bi bi-play-fill" style="font-size: medium"></i>
      </button>
      <button @click="lastPage" class="btn btn-primary">
        <i class="bi bi-skip-end-fill" style="font-size: medium"></i>
      </button>
    </div>
  </div>
</template>

<style scoped>

.custom-width-notifications {
  width: 25%;
  background-color: white;
  color: black;
  order: 2;
  position: relative;
  z-index: 1;
  overflow-y: auto;
  transition: transform 0.3s ease-in-out;
  border-radius: 10px;
  box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
  0 1px 1px 0 rgba(0, 0, 0, 0.14),
  0 1px 3px 0 rgba(0, 0, 0, 0.12);

  margin-top: 1.5%;
  margin-bottom: 4%;
  margin-right: 0.5%;
}

.notification-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 2px;
}

.notification-box {
  padding: 2%;
  font-family: "Calibri Light", Calibri, sans-serif;
}

.card-body {
  padding: 1rem;
}

.card {
  border-radius: 10px;
  background-color: rgba(149, 200, 220, 0.1);
}

.box-header {
  padding: 12px 0 12px 2%;
  background-color: #95c8dc;
  color: black;
  font-size: large;
  font-weight: bold;
  border: 1px solid #95c8dc;
  border-radius: 10px 10px 0 0;
}

.card-title {
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 2px;
}

.btn-close {
  width: 0.5em;
  height: 0.5em;
}

.pager {
  display: flex;
  justify-content: end;
  padding: 2%;
}

.pager span {
  display: flex;
  border: 1px solid #cccccc;
  border-radius: 5px;
  padding: 0 10px 1px 10px;
  background-color: white;
}

.pager button {
  padding-top: 3px;
  padding-bottom: 3px;
}

.pager button, .pager span {
  margin-left: 10px;
  align-items: center;
}
</style>
