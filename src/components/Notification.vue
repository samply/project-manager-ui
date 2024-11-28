<script lang="ts">

import {Prop, Watch} from 'vue-property-decorator';
import {
  Action,
  Module,
  Notification,
  ProjectManagerContext,
  ProjectManagerBackendService
} from "@/services/projectManagerBackendService";
import {Options, Vue} from "vue-class-component";
import {format} from "date-fns";

@Options({
  name: "NotificationBox"
})
export default class NotificationBox extends Vue {

  @Prop() readonly projectManagerBackendService!: ProjectManagerBackendService;
  @Prop() readonly notifications!: Notification[];
  @Prop() readonly context!: ProjectManagerContext;
  @Prop() readonly showNotification!: boolean;
  @Prop({ type: Function, required: true }) readonly callUpdateNotifications!: () => void;
  @Prop({ type: Function, required: true }) readonly callToggleNotification!: () => void;

  convertDate(date: Date) {
    return format(date, 'yyyy-MM-dd HH:mm:ss')
  }

  removeNotification(notificationId: number): void {
    const params = new Map<string, string>;
    params.set('notification-id', '' + notificationId)
    this.projectManagerBackendService.fetchData(Module.NOTIFICATIONS_MODULE, Action.SET_NOTIFICATION_AS_READ_ACTION, this.context, params)
    this.callUpdateNotifications()
  }

}
</script>

<template>
  <div v-if="showNotification" class="custom-width-notifications">
    <div class="box-header" style="display:flex; flex-flow:row; justify-content:space-between ">
      <div>Notifications</div>
      <button style="padding: 0 15px 0 0; margin-bottom: -4px" @click="callToggleNotification" class="btn" v-if="showNotification">
        <i style="font-size: 20px" class="bi bi-x"></i> <!-- Schließsymbol für Progress -->
      </button>
    </div>
    <div class="notification-box">
      <div v-for="(notification,index) in notifications" :key="index" class="card mb-3">
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
            <div style="display:flex; align-items: end; gap:10px;margin-top:4px;">
              <strong>Project:</strong> {{ notification.projectCode }}
              <strong>User:</strong> {{ notification.email }}
            </div>
          </div>

          <!--            <div class="expand-icon" @click="toggleExpand(notification)">
                        <i :class="['bi', 'bi-chevron-compact-down', { 'rotate': notification.isExpanded }]"></i>
                      </div>-->
        </div>
      </div>
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
  box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12);
  margin-top: 1.5%;
  margin-bottom: 4%;
  margin-right: 0.5%;
}

.notification-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}
.notification-box {
  padding: 2%;
  font-family: "Calibri Light";
}
.expand-icon {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  cursor: pointer;
}

.expand-icon i.rotate {
  transform: rotate(180deg);
}
.card-body.expanded {
  height: 300px;
}
.card-body {
  padding: 1.25rem 1rem;
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
}
.btn-close {
  width: 0.5em;
  height: 0.5em;
}
</style>
