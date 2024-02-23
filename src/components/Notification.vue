<script lang="ts">

import {Prop, Watch} from 'vue-property-decorator';
import {
  Action,
  Module,
  Notification,
  ProjectManagerContext,
  ProjetManagerBackendService
} from "@/services/projetManagerBackendService";
import {Options, Vue} from "vue-class-component";
import {format} from "date-fns";

@Options({
  name: "NotificationBox"
})
export default class NotificationBox extends Vue {

  @Prop() readonly projectManagerBackendService!: ProjetManagerBackendService;
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
    <div style="display:flex; flex-flow:row; justify-content:space-between ">
      <h2>Notifications</h2>
      <button style="padding:5px" @click="callToggleNotification" class="btn btn-dark" v-if="showNotification">
        <i style="font-size: 30px" class="bi bi-x"></i> <!-- Schließsymbol für Notification -->
      </button>
    </div>
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
          <div style="display:flex; float: right; align-items: end; gap:10px">
            <strong>Project:</strong> {{ notification.projectCode }}
            <strong>User:</strong> {{ notification.email }}
          </div>
        </div>
        <br>

        <!--            <div class="expand-icon" @click="toggleExpand(notification)">
                      <i :class="['bi', 'bi-chevron-compact-down', { 'rotate': notification.isExpanded }]"></i>
                    </div>-->
      </div>
    </div>
  </div>
</template>

<style scoped>

.custom-width-notifications {
  width: 28%;
  background-color: #212529;
  color: white;
  padding: 15px;
  order: 2;
  position: relative;
  z-index: 1;
  font-family: "Calibri Light";
  overflow-y: auto;
  transition: transform 0.3s ease-in-out;
  height: 100vh;
}

.notification-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
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

.card {
  border: none;
  border-radius: 10px;
}


</style>
