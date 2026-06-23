import { Router } from "express";
import { getMe, googleLogin, login, signup, updateProfile, updateProfileImage } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/me", protect, getMe);
router.patch("/me", protect, updateProfile);
router.patch("/me/profile-image", protect, upload.single("profileImage"), updateProfileImage);
router.get("/test", (_req, res) => res.json({ message: "Auth route working" }));

export default router;
