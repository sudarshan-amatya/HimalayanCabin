import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";

import { env } from "./config/env.js";
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
const allowedOrigins = env.clientOrigins;

app.use(
  cors({
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/+$/, "");

      if (allowedOrigins.length === 0 || allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked this origin: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(express.json());

// Kept only for old database records that still point to /uploads/...
// New images are uploaded to Cloudinary.
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Himalayan Cabins API is running",
    environment: env.nodeEnv,
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "himalayan-cabins-api",
  });
});

app.get("/test", (_req: Request, res: Response) => {
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

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});
