import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeName = path
            .basename(file.originalname, ext)
            .replace(/[^a-z0-9]/gi, "-")
            .toLowerCase()
            .slice(0, 40);
        cb(null, `${Date.now()}-${safeName}${ext}`);
    },
});
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
export function toPublicUploadUrl(filename) {
    return `/uploads/${filename}`;
}
