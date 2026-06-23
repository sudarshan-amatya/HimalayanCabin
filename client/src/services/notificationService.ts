import { apiRequest } from "./api";
import type { Notification } from "../types";

type NotificationsResponse = {
  message: string;
  notifications: Notification[];
  unreadCount: number;
};

type NotificationResponse = {
  message: string;
  notification: Notification;
};

type BasicResponse = {
  message: string;
};

export function getNotifications() {
  return apiRequest<NotificationsResponse>("/notifications");
}

export function markNotificationRead(id: string) {
  return apiRequest<NotificationResponse>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export function markAllNotificationsRead() {
  return apiRequest<BasicResponse>("/notifications/read-all", {
    method: "PATCH",
  });
}

export function deleteNotification(id: string) {
  return apiRequest<BasicResponse>(`/notifications/${id}`, {
    method: "DELETE",
  });
}
