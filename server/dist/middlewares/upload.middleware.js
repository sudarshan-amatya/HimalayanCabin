import multer from "multer";
const storage = multer.memoryStorage();
function fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
        cb(new Error("Only image uploads are allowed"));
        return;
    }
    cb(null, true);
}
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
/**
 * Kept only for backward compatibility with old local upload URLs already saved in the database.
 * New uploads now return Cloudinary secure_url values directly.
 */
export function toPublicUploadUrl(filenameOrUrl) {
    if (filenameOrUrl.startsWith("http://") || filenameOrUrl.startsWith("https://")) {
        return filenameOrUrl;
    }
    if (filenameOrUrl.startsWith("/uploads/")) {
        return filenameOrUrl;
    }
    return `/uploads/${filenameOrUrl}`;
}
