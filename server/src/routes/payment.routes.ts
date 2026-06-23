import { Router } from "express";
import {
  esewaFailure,
  esewaSuccess,
  initiateBookingEsewaPayment,
  initiateGiftEsewaPayment,
} from "../controllers/payment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { userOnly } from "../middlewares/user.middleware.js";

const router = Router();

router.post("/esewa/bookings/:id", protect, userOnly, initiateBookingEsewaPayment);
router.post("/esewa/gifts", protect, userOnly, initiateGiftEsewaPayment);
router.get("/esewa/success", esewaSuccess);
router.get("/esewa/failure", esewaFailure);

export default router;
