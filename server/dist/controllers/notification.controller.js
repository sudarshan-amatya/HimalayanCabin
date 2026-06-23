import { prisma } from "../config/prisma.js";
export async function getMyNotifications(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authorized" });
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: "desc" },
            take: 80,
        });
        const unreadCount = notifications.filter((notification) => !notification.readAt).length;
        return res.status(200).json({
            message: "Notifications fetched successfully",
            notifications,
            unreadCount,
        });
    }
    catch (error) {
        console.error("Get notifications error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export async function markNotificationRead(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authorized" });
        const notification = await prisma.notification.findFirst({
            where: { id: req.params.id, userId: req.user.id },
        });
        if (!notification)
            return res.status(404).json({ message: "Notification not found" });
        const updatedNotification = await prisma.notification.update({
            where: { id: notification.id },
            data: { readAt: notification.readAt || new Date() },
        });
        return res.status(200).json({ message: "Notification marked as read", notification: updatedNotification });
    }
    catch (error) {
        console.error("Mark notification read error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export async function markAllNotificationsRead(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authorized" });
        await prisma.notification.updateMany({
            where: { userId: req.user.id, readAt: null },
            data: { readAt: new Date() },
        });
        return res.status(200).json({ message: "All notifications marked as read" });
    }
    catch (error) {
        console.error("Mark all notifications read error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export async function deleteNotification(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authorized" });
        const notification = await prisma.notification.findFirst({
            where: { id: req.params.id, userId: req.user.id },
        });
        if (!notification)
            return res.status(404).json({ message: "Notification not found" });
        await prisma.notification.delete({ where: { id: notification.id } });
        return res.status(200).json({ message: "Notification deleted successfully" });
    }
    catch (error) {
        console.error("Delete notification error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
