import { toPublicUploadUrl } from "../middlewares/upload.middleware.js";
export function uploadSingleImage(req, res) {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ message: "Image file is required" });
    }
    return res.status(201).json({
        message: "Image uploaded successfully",
        imageUrl: toPublicUploadUrl(file.filename),
    });
}
export function uploadMultipleImages(req, res) {
    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).json({ message: "At least one image file is required" });
    }
    return res.status(201).json({
        message: "Images uploaded successfully",
        imageUrls: files.map((file) => toPublicUploadUrl(file.filename)),
    });
}
