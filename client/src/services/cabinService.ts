import { apiRequest } from "./api";
import type { Cabin, CabinStatus } from "../types";

type CabinsResponse = {
  message: string;
  cabins: Cabin[];
};

type CabinResponse = {
  message: string;
  cabin: Cabin;
};

type DeleteCabinResponse = {
  message: string;
};

type UploadSingleResponse = {
  message: string;
  imageUrl: string;
};

type UploadMultipleResponse = {
  message: string;
  imageUrls: string[];
};

export type CabinQuery = {
  search?: string;
  location?: string;
};

export type CabinFormData = {
  name: string;
  location: string;
  price: number;
  image?: string | null;
  images?: string[];
  description: string;
  facilities: string[];
};

function buildCabinQuery(params: CabinQuery = {}) {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.location) searchParams.set("location", params.location);

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
}

export function getCabins(params: CabinQuery = {}) {
  return apiRequest<CabinsResponse>(`/cabins${buildCabinQuery(params)}`);
}

export function getAdminCabins() {
  return apiRequest<CabinsResponse>("/cabins/admin/all");
}

export function getOwnerCabins() {
  return apiRequest<CabinsResponse>("/cabins/owner/my-cabins");
}

export function getCabinById(id: string) {
  return apiRequest<CabinResponse>(`/cabins/${id}`);
}

export function createCabin(data: CabinFormData) {
  return apiRequest<CabinResponse>("/cabins", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCabin(id: string, data: CabinFormData) {
  return apiRequest<CabinResponse>(`/cabins/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function updateCabinStatus(id: string, status: CabinStatus) {
  return apiRequest<CabinResponse>(`/cabins/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function updateCabinActiveStatus(id: string, isActive: boolean) {
  return apiRequest<CabinResponse>(`/cabins/${id}/active`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export function deleteCabin(id: string) {
  return apiRequest<DeleteCabinResponse>(`/cabins/${id}`, {
    method: "DELETE",
  });
}

export function uploadCabinImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  return apiRequest<UploadSingleResponse>("/cabins/upload-image", {
    method: "POST",
    body: formData,
  });
}

export function uploadCabinImages(files: File[]) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("images", file);
  });

  return apiRequest<UploadMultipleResponse>("/cabins/upload-images", {
    method: "POST",
    body: formData,
  });
}
