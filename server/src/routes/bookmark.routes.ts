import { Router } from "express";
import {
  addBookmark,
  getBookmarkStatus,
  getMyBookmarks,
  removeBookmark,
} from "../controllers/bookmark.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { userOnly } from "../middlewares/user.middleware.js";

const router = Router();

router.get("/", protect, userOnly, getMyBookmarks);
router.get("/:cabinId/status", protect, userOnly, getBookmarkStatus);
router.post("/:cabinId", protect, userOnly, addBookmark);
router.delete("/:cabinId", protect, userOnly, removeBookmark);

export default router;
