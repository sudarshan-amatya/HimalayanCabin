import { Router } from "express";
import {
  acceptGift,
  createGift,
  declineGift,
  getOwnerGiftRequests,
  getReceivedGifts,
  getSentGifts,
  updateOwnerGiftStatus,
} from "../controllers/gift.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { ownerOnly } from "../middlewares/owner.middleware.js";
import { userOnly } from "../middlewares/user.middleware.js";

const router = Router();

router.post("/", protect, userOnly, createGift);
router.get("/received", protect, userOnly, getReceivedGifts);
router.get("/sent", protect, userOnly, getSentGifts);
router.patch("/:id/accept", protect, userOnly, acceptGift);
router.patch("/:id/decline", protect, userOnly, declineGift);

router.get("/owner/requests", protect, ownerOnly, getOwnerGiftRequests);
router.patch("/owner/:id/status", protect, ownerOnly, updateOwnerGiftStatus);

export default router;
