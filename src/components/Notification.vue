<script lang="ts">

import {
  Action,
  Module,
  Notification,
  ProjectManagerBackendService,
  ProjectManagerContext
} from "@/services/projectManagerBackendService";
import {Options, Vue} from "vue-class-component";
import {DisplayFormatKey, formatDisplayDate, resolveDisplayFormatKey} from "@/services/displayFormatService";
import {getConfig} from "@/services/configLoader";
import {PropType, watch} from "vue";
import '@/assets/styles/table.css'
import UserAndEmail from "@/components/UserAndEmail.vue";

// Notifications as the content of a tab (project view and dashboard): a table with the unread ones first shown,
// "All" for the history, and one "Mark as read" per row.
@Options({
  name: "NotificationBox",
  components: {UserAndEmail},
  props: {
    projectManagerBackendService: {type: Object as PropType<ProjectManagerBackendService>, required: true},
    notifications: {type: Array as PropType<Notification[]>, required: true},
    context: {type: Object as PropType<ProjectManagerContext>, required: true},
    callUpdateNotifications: {type: Function as unknown as () => () => Promise<unknown>, required: true},
    // On the dashboard the notifications belong to several requests
    showProject: {type: Boolean, default: false}
  }
})
export default class NotificationBox extends Vue {
  readonly projectManagerBackendService!: ProjectManagerBackendService;
  readonly notifications!: Notification[];
  readonly context!: ProjectManagerContext;
  readonly callUpdateNotifications!: () => Promise<unknown>;
  // noinspection JSUnusedGlobalSymbols
  readonly showProject!: boolean;

  showAll = false;
  currentPage = 1;
  notificationsPerPage = 10;
  markingAsRead = new Set<number>();
  timestampDisplayFormat: DisplayFormatKey = DisplayFormatKey.DATE_TIME_WITH_SECONDS_FORMAT;

  mounted() {
    watch(() => this.notifications, () => {
      this.currentPage = Math.min(this.currentPage, this.totalPages);
    });
    this.fetchTimestampDisplayFormat();
  }

  async fetchTimestampDisplayFormat() {
    const config = await getConfig();
    this.timestampDisplayFormat = resolveDisplayFormatKey(
        config.NOTIFICATION_TIMESTAMP_DISPLAY_FORMAT, DisplayFormatKey.DATE_TIME_WITH_SECONDS_FORMAT);
  }

  // Newest first: the backend sorts per request only
  get sortedNotifications(): Notification[] {
    return [...(this.notifications ?? [])].sort((a, b) =>
        new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime());
  }

  get unreadCount(): number {
    return this.sortedNotifications.filter(notification => !notification.read).length;
  }

  get filteredNotifications(): Notification[] {
    return this.showAll ? this.sortedNotifications : this.sortedNotifications.filter(notification => !notification.read);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredNotifications.length / this.notificationsPerPage));
  }

  get pagedNotifications(): Notification[] {
    const start = (this.currentPage - 1) * this.notificationsPerPage;
    return this.filteredNotifications.slice(start, start + this.notificationsPerPage);
  }

  setShowAll(showAll: boolean) {
    this.showAll = showAll;
    this.currentPage = 1;
  }

  convertDate(date: string | Date) {
    return formatDisplayDate(date, this.timestampDisplayFormat)
  }

  // CHANGE_PROJECT_STATE -> Change project state
  operationLabel(operationType?: string): string {
    if (!operationType) return '';
    const words = operationType.toLowerCase().split('_').join(' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
  }

  site(notification: Notification): string {
    if (!notification.bridgehead || notification.bridgehead === 'NONE') return '';
    return notification.humanReadableBridgehead || notification.bridgehead;
  }

  async markAsRead(notification: Notification) {
    if (notification.id === undefined) return;
    const params = new Map<string, string>();
    params.set('notification-id', '' + notification.id);
    this.markingAsRead.add(notification.id);
    try {
      await this.projectManagerBackendService.fetchData(Module.NOTIFICATIONS_MODULE, Action.SET_NOTIFICATION_AS_READ_ACTION, this.context, params);
      await this.callUpdateNotifications();
    } catch (error) {
      console.error('Error marking the notification as read:', error);
    } finally {
      this.markingAsRead.delete(notification.id);
    }
  }

  firstPage() {
    this.currentPage = 1;
  }

  previousPage() {
    this.currentPage = Math.max(1, this.currentPage - 1);
  }

  nextPage() {
    this.currentPage = Math.min(this.totalPages, this.currentPage + 1);
  }

  lastPage() {
    this.currentPage = this.totalPages;
  }
}
</script>

<template>
  <div class="notifications-card">
    <div class="box-header">
      <span>Notifications</span>
      <div class="notification-filter" role="group" aria-label="Which notifications">
        <button type="button" :class="{ active: !showAll }" :aria-pressed="!showAll" @click="setShowAll(false)">
          Unread <span class="count">{{ unreadCount }}</span>
        </button>
        <button type="button" :class="{ active: showAll }" :aria-pressed="showAll" @click="setShowAll(true)">
          All <span class="count">{{ sortedNotifications.length }}</span>
        </button>
      </div>
    </div>
    <div class="table-box">
      <table class="pm-table notifications-table">
        <thead>
        <tr>
          <th scope="col">Time</th>
          <th v-if="showProject" scope="col">Request</th>
          <th scope="col">Event</th>
          <th scope="col">Site</th>
          <th scope="col">User</th>
          <th scope="col"><span class="visually-hidden">Actions</span></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="notification in pagedNotifications" :key="notification.id" :class="{ read: notification.read }">
          <td class="time-cell">
            <span v-if="!notification.read" class="unread-dot" title="Unread"></span>
            {{ notification.timestamp ? convertDate(notification.timestamp) : '' }}
          </td>
          <td v-if="showProject">
            <router-link :to="{ name: 'ProjectView', query: { 'project-code': notification.projectCode } }"
                         class="label-link">{{ notification.projectCode }}</router-link>
          </td>
          <td>
            <div class="event-label">{{ operationLabel(notification.operationType) }}</div>
            <div v-if="notification.details" class="event-details">{{ notification.details }}</div>
            <div v-if="notification.error" class="event-error">
              <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
              {{ notification.httpStatus ? `Error ${notification.httpStatus}: ` : 'Error: ' }}{{ notification.error }}
            </div>
          </td>
          <td class="nowrap">{{ site(notification) }}</td>
          <td><UserAndEmail :email="notification.email"/></td>
          <td class="action-cell">
            <button v-if="!notification.read" type="button" class="btn btn-outline-primary btn-sm mark-read"
                    :disabled="notification.id !== undefined && markingAsRead.has(notification.id)"
                    @click="markAsRead(notification)">
              <i class="bi bi-check2" aria-hidden="true"></i> Mark as read
            </button>
          </td>
        </tr>
        <tr v-if="pagedNotifications.length === 0" class="empty-row">
          <td :colspan="showProject ? 6 : 5">
            {{ showAll ? 'There are no notifications yet.' : 'No unread notifications.' }}
          </td>
        </tr>
        </tbody>
      </table>
    </div>
    <div v-if="totalPages > 1" class="pager">
      <button @click="firstPage" class="pager-btn" aria-label="First page">
        <i class="bi bi-skip-start-fill"></i>
      </button>
      <button @click="previousPage" class="pager-btn" style="rotate: 180deg" aria-label="Previous page">
        <i class="bi bi-play-fill"></i>
      </button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button @click="nextPage" class="pager-btn" aria-label="Next page">
        <i class="bi bi-play-fill"></i>
      </button>
      <button @click="lastPage" class="pager-btn" aria-label="Last page">
        <i class="bi bi-skip-end-fill"></i>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Same card as the other tabs and the requests dashboard: blue header, pm-table, pager below. */
.notifications-card {
  background: #fff;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2),
  0 1px 1px 0 rgba(0, 0, 0, 0.14),
  0 1px 3px 0 rgba(0, 0, 0, 0.12);
}

.box-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  padding: 17px 28px;
  background-color: #2655a2;
  color: #fff;
  font-size: 19px;
  font-weight: 600;
}

.notification-filter {
  display: inline-flex;
  border: 1px solid rgba(255, 255, 255, .6);
  border-radius: 7px;
  overflow: hidden;
}

.notification-filter button {
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  padding: 5px 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.notification-filter button + button {
  border-left: 1px solid rgba(255, 255, 255, .6);
}

.notification-filter button.active {
  background: #fff;
  color: #2655a2;
}

.notification-filter .count {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  opacity: .85;
}

.table-box {
  overflow-x: auto;
}

.time-cell {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  color: #5b6b7c;
  font-size: 13px;
}

.unread-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2655a2;
  margin-right: 6px;
  vertical-align: middle;
}

.event-label {
  font-weight: 600;
}

.event-details {
  color: #5b6b7c;
  font-size: 13px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.event-error {
  color: #b42318;
  font-size: 13px;
  margin-top: 2px;
}

.nowrap {
  white-space: nowrap;
}

.action-cell {
  text-align: right;
  white-space: nowrap;
}

.mark-read {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* Read notifications stay in "All" as history, quieter than the unread ones. */
tr.read td {
  color: #7a8794;
}

tr.read .event-label {
  font-weight: 400;
}

.empty-row td {
  color: #5b6b7c;
  text-align: center;
}

.label-link {
  text-decoration: none;
  color: #2655a2;
  font-weight: 600;
  white-space: nowrap;
}

.label-link:hover {
  text-decoration: underline;
}

.pager {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 14px 22px;
}

.pager span {
  font-size: 13px;
  color: #5b6b7c;
  font-variant-numeric: tabular-nums;
  padding: 0 6px;
}

.pager-btn {
  border: 1px solid #d7e2ed;
  background: #fff;
  color: #5b6b7c;
  width: 30px;
  height: 30px;
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.pager-btn:hover {
  border-color: #2655a2;
  color: #2655a2;
}
</style>
