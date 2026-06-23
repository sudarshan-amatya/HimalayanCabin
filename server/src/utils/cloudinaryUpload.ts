import type { UploadApiResponse } from "cloudinary";
import { assertCloudinaryConfigured, cloudinary } from "../config/cloudinary.js";

export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
};

function getRootFolder() {
  return process.env.CLOUDINARY_FOLDER?.trim() || "himalayan-cabins";
}

function buildFolderPath(folder?: string) {
  const rootFolder = getRootFolder();
  const childFolder = folder?.trim().replace(/^\/+|\/+$/g, "");

  return childFolder ? `${rootFolder}/${childFolder}` : rootFolder;
}

export function uploadImageToCloudinary(
  file: Express.Multer.File,
  folder?: string,
): Promise<CloudinaryUploadResult> {
  assertCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: buildFolderPath(folder),
        resource_type: "image",
      },
      (error, result?: UploadApiResponse) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary upload failed. No result was returned."));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    uploadStream.end(file.buffer);
  });
}

export async function uploadImagesToCloudinary(
  files: Express.Multer.File[],
  folder?: string,
) {
  return Promise.all(files.map((file) => uploadImageToCloudinary(file, folder)));
}
