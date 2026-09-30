<script lang="ts">

import {
  Action,
  Module,
  Notification,
  ProjectManagerBackendService,
  ProjectManagerContext,
  ProjectState,
  projectStateLabel
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
  // The filters work on the loaded notifications; like on the requests dashboard, each one is offered
  // only when there is something to choose from. '' = no filter.
  selectedRequest = '';
  selectedState: '' | ProjectState = '';
  // NO_USER = events without a user (e.g. scheduled jobs), otherwise the email
  selectedUser = '';
  readonly NO_USER = '__no_user__';
  // NO_SITE = request-wide events, otherwise the bridgehead id
  selectedSite = '';
  readonly NO_SITE = '__no_site__';
  currentPage = 1;
  notificationsPerPage = 10;
  markingAsRead = new Set<number>();
  markingPageAsRead = false;
  timestampDisplayFormat: DisplayFormatKey = DisplayFormatKey.DATE_TIME_WITH_SECONDS_FORMAT;

  mounted() {
    watch(() => this.notifications, () => {
      this.resetUnavailableFilters();
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

  // The sites that appear in the notifications, for the site filter
  get sites(): { id: string, label: string }[] {
    const sites = new Map<string, string>();
    this.sortedNotifications.forEach(notification => {
      if (this.hasSite(notification)) {
        sites.set(notification.bridgehead as string, this.site(notification));
      }
    });
    return [...sites.entries()]
        .map(([id, label]) => ({id, label}))
        .sort((a, b) => a.label.localeCompare(b.label));
  }

  // The requests that appear in the notifications, for the request filter (several only on the dashboard)
  get requests(): string[] {
    const requests = new Set<string>();
    this.sortedNotifications.forEach(notification => {
      if (notification.projectCode) requests.add(notification.projectCode);
    });
    return [...requests].sort((a, b) => a.localeCompare(b));
  }

  // The phases of those requests, in the order of the process
  get projectStates(): ProjectState[] {
    const states = new Set(this.sortedNotifications.map(notification => notification.projectState));
    return Object.values(ProjectState).filter(state => states.has(state));
  }

  // The users that appear in the notifications, for the user filter
  get users(): { email: string, label: string }[] {
    const users = new Map<string, string>();
    this.sortedNotifications.forEach(notification => {
      if (notification.email && !users.get(notification.email)) {
        users.set(notification.email, notification.userName ?? '');
      }
    });
    return [...users.entries()]
        .map(([email, name]) => ({email, label: name ? `${name} (${email})` : email}))
        .sort((a, b) => a.label.localeCompare(b.label));
  }

  get hasNotificationsWithoutUser(): boolean {
    return this.sortedNotifications.some(notification => !notification.email);
  }

  get showUserFilter(): boolean {
    return this.users.length + (this.hasNotificationsWithoutUser ? 1 : 0) > 1;
  }

  get hasFilters(): boolean {
    return this.requests.length > 1 || this.projectStates.length > 1 || this.showUserFilter || this.sites.length > 0;
  }

  get isFiltered(): boolean {
    return this.selectedRequest !== '' || this.selectedState !== '' || this.selectedUser !== '' || this.selectedSite !== '';
  }

  matchesUser(notification: Notification): boolean {
    if (this.selectedUser === '') return true;
    if (this.selectedUser === this.NO_USER) return !notification.email;
    return notification.email === this.selectedUser;
  }

  matchesSite(notification: Notification): boolean {
    if (this.selectedSite === '') return true;
    if (this.selectedSite === this.NO_SITE) return !this.hasSite(notification);
    return notification.bridgehead === this.selectedSite;
  }

  // The notifications that match the request, phase, user and site filters
  get matchingNotifications(): Notification[] {
    return this.sortedNotifications.filter(notification =>
        (this.selectedRequest === '' || notification.projectCode === this.selectedRequest) &&
        (this.selectedState === '' || notification.projectState === this.selectedState) &&
        this.matchesUser(notification) &&
        this.matchesSite(notification));
  }

  get unreadCount(): number {
    return this.matchingNotifications.filter(notification => !notification.read).length;
  }

  get filteredNotifications(): Notification[] {
    return this.showAll ? this.matchingNotifications : this.matchingNotifications.filter(notification => !notification.read);
  }

  get emptyMessage(): string {
    if (this.isFiltered) {
      return this.showAll ? 'No notifications match the filters.' : 'No unread notifications match the filters.';
    }
    return this.showAll ? 'There are no notifications yet.' : 'No unread notifications.';
  }

  // After a reload a selected request, phase, user or site may no longer appear (e.g. the request changed phase)
  resetUnavailableFilters() {
    if (this.selectedRequest !== '' && !this.requests.includes(this.selectedRequest)) this.selectedRequest = '';
    if (this.selectedState !== '' && !this.projectStates.includes(this.selectedState)) this.selectedState = '';
    if (this.selectedUser === this.NO_USER ? !this.hasNotificationsWithoutUser
        : this.selectedUser !== '' && !this.users.some(user => user.email === this.selectedUser)) {
      this.selectedUser = '';
    }
    if (this.selectedSite !== '' && this.selectedSite !== this.NO_SITE && !this.sites.some(site => site.id === this.selectedSite)) {
      this.selectedSite = '';
    }
  }

  stateLabel(state: ProjectState): string {
    return projectStateLabel(state);
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

  changeFilter() {
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

  hasSite(notification: Notification): boolean {
    return !!notification.bridgehead && notification.bridgehead !== 'NONE';
  }

  site(notification: Notification): string {
    return this.hasSite(notification) ? (notification.humanReadableBridgehead || notification.bridgehead as string) : '';
  }

  // The unread notifications on the current page, for "Mark page as read"
  get unreadOnPage(): Notification[] {
    return this.pagedNotifications.filter(notification => !notification.read && notification.id !== undefined);
  }

  sendAsRead(notificationId: number) {
    const params = new Map<string, string>();
    params.set('notification-id', '' + notificationId);
    return this.projectManagerBackendService.fetchData(Module.NOTIFICATIONS_MODULE, Action.SET_NOTIFICATION_AS_READ_ACTION, this.context, params);
  }

  async markAsRead(notification: Notification) {
    if (notification.id === undefined) return;
    this.markingAsRead.add(notification.id);
    try {
      await this.sendAsRead(notification.id);
      await this.callUpdateNotifications();
    } catch (error) {
      console.error('Error marking the notification as read:', error);
    } finally {
      this.markingAsRead.delete(notification.id);
    }
  }

  // Only the page on screen, not every unread notification: the user has seen these.
  // The backend marks one notification per call; a page holds at most notificationsPerPage.
  async markPageAsRead() {
    const ids = this.unreadOnPage.map(notification => notification.id as number);
    if (ids.length === 0) return;
    this.markingPageAsRead = true;
    ids.forEach(id => this.markingAsRead.add(id));
    try {
      const results = await Promise.allSettled(ids.map(id => this.sendAsRead(id)));
      results.filter(result => result.status === 'rejected')
          .forEach(result => console.error('Error marking the notification as read:', (result as PromiseRejectedResult).reason));
      await this.callUpdateNotifications();
    } catch (error) {
      console.error('Error updating the notifications:', error);
    } finally {
      ids.forEach(id => this.markingAsRead.delete(id));
      this.markingPageAsRead = false;
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
      <div class="header-actions">
        <button v-if="unreadOnPage.length > 0" type="button" class="btn btn-outline-light btn-sm mark-page-read"
                :disabled="markingPageAsRead" :aria-busy="markingPageAsRead"
                title="Mark the unread notifications on this page as read" @click="markPageAsRead">
          <i class="bi bi-check2-all" aria-hidden="true"></i>
          {{ markingPageAsRead ? 'Marking…' : 'Mark page as read' }}
        </button>
        <div class="notification-filter" role="group" aria-label="Which notifications">
          <button type="button" :class="{ active: !showAll }" :aria-pressed="!showAll" @click="setShowAll(false)">
            Unread <span class="count">{{ unreadCount }}</span>
          </button>
          <button type="button" :class="{ active: showAll }" :aria-pressed="showAll" @click="setShowAll(true)">
            All <span class="count">{{ matchingNotifications.length }}</span>
          </button>
        </div>
      </div>
    </div>
    <div v-if="hasFilters" class="filter-box">
      <select v-if="requests.length > 1" v-model="selectedRequest" class="form-select" aria-label="Request"
              @change="changeFilter">
        <option value="">All requests</option>
        <option v-for="request in requests" :key="request" :value="request">{{ request }}</option>
      </select>
      <select v-if="projectStates.length > 1" v-model="selectedState" class="form-select" aria-label="Phase"
              @change="changeFilter">
        <option value="">All phases</option>
        <option v-for="state in projectStates" :key="state" :value="state">{{ stateLabel(state) }}</option>
      </select>
      <select v-if="showUserFilter" v-model="selectedUser" class="form-select" aria-label="User" @change="changeFilter">
        <option value="">All users</option>
        <option v-for="user in users" :key="user.email" :value="user.email">{{ user.label }}</option>
        <option v-if="hasNotificationsWithoutUser" :value="NO_USER">No user (system)</option>
      </select>
      <select v-if="sites.length > 0" v-model="selectedSite" class="form-select" aria-label="Site"
              @change="changeFilter">
        <option value="">All sites</option>
        <option v-for="site in sites" :key="site.id" :value="site.id">{{ site.label }}</option>
        <option :value="NO_SITE">No site (whole request)</option>
      </select>
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
          <td><UserAndEmail :first-name="notification.userName" :email="notification.email"/></td>
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
            {{ emptyMessage }}
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
  /* Same height as a text-only card header (17px padding around a 19px
   * title); the filter pills must not make it taller. */
  min-height: 62.5px;
  padding: 0 28px;
  background-color: #2655a2;
  color: #fff;
  font-size: 19px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.mark-page-read {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
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

/* Same filter row as the requests dashboard */
.filter-box {
  background-color: #e9eef8;
  padding: 14px 22px;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  border-bottom: 1px solid #d7e2ed;
}

.filter-box .form-select {
  width: auto;
  min-width: 200px;
  /* A long "name (email)" must not push the other filters out of the row */
  max-width: 100%;
  cursor: pointer;
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
