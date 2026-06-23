import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { deleteNotification, getNotifications, markAllNotificationsRead, markNotificationRead } from "../services/notificationService";
import type { Notification } from "../types";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function typeClass(type: Notification["type"]) {
  if (type === "BOOKING") return "bg-green-100 text-green-700";
  if (type === "GIFT") return "bg-[#f4b855]/25 text-[#8a5a00]";
  if (type === "CABIN") return "bg-blue-100 text-blue-700";
  if (type === "FEEDBACK") return "bg-purple-100 text-purple-700";
  if (type === "PAYMENT") return "bg-emerald-100 text-emerald-700";
  return "bg-gray-100 text-gray-700";
}

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchNotifications() {
    try {
      setError("");
      const data = await getNotifications();
      setNotifications(data.notifications);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function handleOpen(notification: Notification) {
    try {
      if (!notification.readAt) {
        await markNotificationRead(notification.id);
        setNotifications((current) => current.map((item) => (item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item)));
        window.dispatchEvent(new Event("notifications-changed"));
      }
      if (notification.link) navigate(notification.link);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to open notification");
    }
  }

  async function handleMarkAll() {
    try {
      setActionLoading(true);
      await markAllNotificationsRead();
      setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
      window.dispatchEvent(new Event("notifications-changed"));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to mark all as read");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setActionLoading(true);
      await deleteNotification(id);
      setNotifications((current) => current.filter((item) => item.id !== id));
      window.dispatchEvent(new Event("notifications-changed"));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete notification");
    } finally {
      setActionLoading(false);
    }
  }

  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-semibold text-[#17703a]">Profile</p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-[#101918]">Notifications</h1>
          <p className="mt-3 text-sm text-gray-600">Booking confirmations, gifts, cabin approvals, payments, and dashboard actions appear here.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={actionLoading || unreadCount === 0} onClick={handleMarkAll} className="cursor-pointer rounded-md bg-[#24472f] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            <CheckCheck size={16} className="mr-2 inline" /> Mark all read
          </button>
          <Link to="/profile" className="rounded-md border border-[#24472f] px-5 py-3 text-sm font-semibold text-[#24472f]">Back to profile</Link>
        </div>
      </div>

      {error && <p className="mt-8 rounded-md bg-red-100 px-4 py-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="mt-10 rounded-md bg-[#eff8f5] p-6 text-sm text-gray-600">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <div className="mt-10 rounded-md bg-[#eff8f5] p-10 text-center">
          <Bell className="mx-auto text-[#24472f]" />
          <h2 className="mt-4 font-serif text-2xl font-bold">No notifications yet</h2>
          <p className="mt-2 text-sm text-gray-600">Important booking, gift, and dashboard updates will show here.</p>
        </div>
      ) : (
        <div className="mt-10 grid gap-4">
          {notifications.map((notification) => (
            <article key={notification.id} className={`rounded-md border bg-white p-5 shadow-sm ${notification.readAt ? "border-gray-100" : "border-[#f4b855]/60"}`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <button type="button" onClick={() => handleOpen(notification)} className="min-w-0 cursor-pointer text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${typeClass(notification.type)}`}>{notification.type}</span>
                    {!notification.readAt && <span className="rounded-full bg-[#173f2a] px-2 py-1 text-[11px] font-semibold text-white">New</span>}
                  </div>
                  <h2 className="mt-3 break-words font-serif text-2xl font-bold text-[#101918]">{notification.title}</h2>
                  <p className="mt-2 break-words text-sm leading-6 text-gray-600">{notification.message}</p>
                  <p className="mt-3 text-xs text-gray-400">{formatDate(notification.createdAt)}</p>
                </button>
                <button type="button" disabled={actionLoading} onClick={() => handleDelete(notification.id)} className="cursor-pointer rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-60">
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Notifications;
