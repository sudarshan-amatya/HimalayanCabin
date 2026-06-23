import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import bookmarkRoutes from "./routes/bookmark.routes.js";
import cabinRoutes from "./routes/cabin.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import giftRoutes from "./routes/gift.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const allowedOrigins = (process.env.CLIENT_ORIGINS || process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
app.use(cors({
    origin(origin, callback) {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked this origin: ${origin}`));
    },
    credentials: true,
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use((req, _res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
app.get("/", (_req, res) => {
    res.json({
        message: "Himalayan Cabins API is running",
    });
});
app.get("/test", (_req, res) => {
    res.json({
        message: "Test route working",
    });
});
app.use("/auth", authRoutes);
app.use("/cabins", cabinRoutes);
app.use("/bookings", bookingRoutes);
app.use("/bookmarks", bookmarkRoutes);
app.use("/reviews", reviewRoutes);
app.use("/gifts", giftRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/payments", paymentRoutes);
app.use("/notifications", notificationRoutes);
app.use((_req, res) => {
    res.status(404).json({
        message: "Route not found",
    });
});
const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
