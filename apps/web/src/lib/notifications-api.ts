import { apiGet, apiPost } from "./api";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link_url: string | null;
  is_read: number;
  created_at: string;
}

export const notificationsApi = {
  list(unreadOnly = false) {
    return apiGet<{ notifications: Notification[]; unreadCount: number }>(
      `/api/notifications${unreadOnly ? "?unread=true" : ""}`
    );
  },

  markRead(id: string) {
    return apiPost<{ message: string }>(`/api/notifications/${id}/read`);
  },

  markAllRead() {
    return apiPost<{ message: string }>("/api/notifications/read-all");
  },
};
