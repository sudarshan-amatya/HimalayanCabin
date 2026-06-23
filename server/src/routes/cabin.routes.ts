import { Router } from "express";
import {
  createCabin,
  deleteCabin,
  getAdminCabins,
  getCabinById,
  getCabins,
  getOwnerCabins,
  updateCabin,
  updateCabinActiveStatus,
  updateCabinStatus,
} from "../controllers/cabin.controller.js";
import { uploadMultipleImages, uploadSingleImage } from "../controllers/upload.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/admin.middleware.js";
import { ownerOnly, ownerOrAdminOnly } from "../middlewares/owner.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

router.get("/", getCabins);
router.get("/admin/all", protect, adminOnly, getAdminCabins);
router.get("/owner/my-cabins", protect, ownerOnly, getOwnerCabins);

router.post("/upload-image", protect, ownerOrAdminOnly, upload.single("image"), uploadSingleImage);
router.post("/upload-images", protect, ownerOrAdminOnly, upload.array("images", 8), uploadMultipleImages);

router.get("/:id", getCabinById);

router.post("/", protect, ownerOnly, createCabin);
router.put("/:id", protect, ownerOrAdminOnly, updateCabin);
router.patch("/:id/status", protect, adminOnly, updateCabinStatus);
router.patch("/:id/active", protect, ownerOrAdminOnly, updateCabinActiveStatus);
router.delete("/:id", protect, ownerOnly, deleteCabin);

export default router;
