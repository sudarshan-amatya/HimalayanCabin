import { prisma } from "../config/prisma.js";
import { toPublicUploadUrl } from "../middlewares/upload.middleware.js";
import { notifyAdmins } from "../utils/notification.js";
const feedbackInclude = {
    user: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
            role: true,
        },
    },
};
export async function createFeedback(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authorized" });
        if (req.user.role !== "USER" && req.user.role !== "OWNER") {
            return res.status(403).json({ message: "Only guests and cabin owners can send feedback" });
        }
        const { subject, message } = req.body;
        if (!subject || !message) {
            return res.status(400).json({ message: "Subject and message are required" });
        }
        const screenshot = req.file ? toPublicUploadUrl(req.file.filename) : null;
        const feedback = await prisma.feedback.create({
            data: {
                userId: req.user.id,
                subject: String(subject).trim(),
                message: String(message).trim(),
                screenshot,
            },
            include: feedbackInclude,
        });
        await notifyAdmins({
            title: "New feedback message",
            message: `${feedback.user.firstName} ${feedback.user.lastName} sent feedback: ${feedback.subject}`,
            type: "FEEDBACK",
            link: "/admin/feedback",
        });
        return res.status(201).json({ message: "Feedback sent successfully", feedback });
    }
    catch (error) {
        console.error("Create feedback error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export async function getAllFeedbacks(_req, res) {
    try {
        const feedbacks = await prisma.feedback.findMany({
            include: feedbackInclude,
            orderBy: { createdAt: "desc" },
        });
        return res.status(200).json({ message: "Feedbacks fetched successfully", feedbacks });
    }
    catch (error) {
        console.error("Get feedbacks error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export async function deleteFeedback(req, res) {
    try {
        const feedback = await prisma.feedback.findUnique({ where: { id: req.params.id } });
        if (!feedback)
            return res.status(404).json({ message: "Feedback not found" });
        await prisma.feedback.delete({ where: { id: req.params.id } });
        return res.status(200).json({ message: "Feedback deleted successfully" });
    }
    catch (error) {
        console.error("Delete feedback error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
