import { Router } from "express";
import {
  deleteMyCabinReview,
  getCabinReviews,
  getMyCabinReview,
  upsertCabinReview,
} from "../controllers/review.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { userOnly } from "../middlewares/user.middleware.js";

const router = Router();

router.get("/cabins/:cabinId", getCabinReviews);
router.get("/cabins/:cabinId/my", protect, userOnly, getMyCabinReview);
router.post("/cabins/:cabinId", protect, userOnly, upsertCabinReview);
router.delete("/cabins/:cabinId/my", protect, userOnly, deleteMyCabinReview);

export default router;
