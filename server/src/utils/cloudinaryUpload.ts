import { Writable } from "node:stream";
import type { UploadApiResponse } from "cloudinary";
import { assertCloudinaryConfigured, cloudinary } from "../config/cloudinary.js";
import { env } from "../config/env.js";

export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
};

function buildFolderPath(folder?: string) {
  const rootFolder = env.cloudinaryFolder.trim() || "himalayan-cabins";
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
    ) as Writable;

    uploadStream.end(file.buffer);
  });
}

export async function uploadImagesToCloudinary(
  files: Express.Multer.File[],
  folder?: string,
) {
  return Promise.all(files.map((file) => uploadImageToCloudinary(file, folder)));
}
