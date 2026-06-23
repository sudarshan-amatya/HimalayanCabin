import type { Request, Response } from "express";
import { uploadImagesToCloudinary, uploadImageToCloudinary } from "../utils/cloudinaryUpload.js";

export async function uploadSingleImage(req: Request, res: Response) {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const uploadedImage = await uploadImageToCloudinary(file, "cabins/main");

    return res.status(201).json({
      message: "Image uploaded successfully",
      imageUrl: uploadedImage.url,
    });
  } catch (error) {
    console.error("Single image upload error:", error);
    return res.status(500).json({ message: "Image upload failed" });
  }
}

export async function uploadMultipleImages(req: Request, res: Response) {
  try {
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "At least one image file is required" });
    }

    const uploadedImages = await uploadImagesToCloudinary(files, "cabins/gallery");

    return res.status(201).json({
      message: "Images uploaded successfully",
      imageUrls: uploadedImages.map((image) => image.url),
    });
  } catch (error) {
    console.error("Multiple image upload error:", error);
    return res.status(500).json({ message: "Images upload failed" });
  }
}
