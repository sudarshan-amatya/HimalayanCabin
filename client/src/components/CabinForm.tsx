import type React from "react";
import { useState } from "react";
import type { ChangeEvent } from "react";
import { getApiAssetUrl } from "../services/api";
import { uploadCabinImage, uploadCabinImages } from "../services/cabinService";
import type { Cabin } from "../types";

export type CabinFormPayload = {
  name: string;
  location: string;
  price: number;
  image: string | null;
  images: string[];
  description: string;
  facilities: string[];
};

type FormState = {
  name: string;
  location: string;
  price: string;
  image: string;
  images: string[];
  description: string;
  facilities: string;
};

type CabinFormProps = {
  initialCabin?: Cabin | null;
  title: string;
  submitLabel: string;
  onSubmit: (payload: CabinFormPayload) => Promise<void>;
  onCancel?: () => void;
};

function getInitialState(cabin?: Cabin | null): FormState {
  return {
    name: cabin?.name || "",
    location: cabin?.location || "",
    price: cabin?.price ? String(cabin.price) : "",
    image: cabin?.image || "",
    images: cabin?.images || [],
    description: cabin?.description || "",
    facilities: cabin?.facilities?.join(", ") || "",
  };
}

function CabinForm({ initialCabin, title, submitLabel, onSubmit, onCancel }: CabinFormProps) {
  const [formData, setFormData] = useState<FormState>(() => getInitialState(initialCabin));
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleMainImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    setMainImageFile(event.target.files?.[0] || null);
  }

  function handleGalleryFileChange(event: ChangeEvent<HTMLInputElement>) {
    setGalleryFiles(Array.from(event.target.files || []));
  }

  function removeGalleryImage(image: string) {
    setFormData((current) => ({ ...current, images: current.images.filter((item) => item !== image) }));
  }

  async function buildPayload(): Promise<CabinFormPayload> {
    let mainImage = formData.image.trim() || null;
    let uploadedGallery: string[] = [];

    if (mainImageFile) {
      const uploadData = await uploadCabinImage(mainImageFile);
      mainImage = uploadData.imageUrl;
    }

    if (galleryFiles.length > 0) {
      const uploadData = await uploadCabinImages(galleryFiles);
      uploadedGallery = uploadData.imageUrls;
    }

    return {
      name: formData.name.trim(),
      location: formData.location.trim(),
      price: Number(formData.price),
      image: mainImage,
      images: [...formData.images, ...uploadedGallery],
      description: formData.description.trim(),
      facilities: formData.facilities.split(",").map((facility) => facility.trim()).filter(Boolean),
    };
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.name.trim() || !formData.location.trim() || !formData.price || !formData.description.trim()) {
      setError("Name, location, price, and description are required.");
      return;
    }

    if (Number(formData.price) < 1) {
      setError("Price must be at least Rs. 1.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload = await buildPayload();
      await onSubmit(payload);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save cabin");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md bg-[#eff8f5] p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#101918]">{title}</h2>
          <p className="mt-1 text-sm text-gray-600">Use a main image URL or upload a file. Gallery images appear inside cabin details.</p>
        </div>
        {onCancel && <button type="button" onClick={onCancel} className="cursor-pointer text-sm font-semibold text-[#24472f] underline">Cancel</button>}
      </div>

      {error && <p className="mt-5 rounded-md bg-red-100 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input name="name" value={formData.name} onChange={handleChange} placeholder="Cabin name" className="rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]" />
        <input name="location" value={formData.location} onChange={handleChange} placeholder="Location, Nepal" className="rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]" />
        <input name="price" value={formData.price} onChange={handleChange} type="number" min="1" placeholder="Price per person" className="rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]" />
        <input name="facilities" value={formData.facilities} onChange={handleChange} placeholder="Facilities: Wi-Fi, Fireplace, Breakfast" className="rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]" />

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-[#24472f]">Main image</label>
          <div className="grid gap-3 md:grid-cols-2">
            <input type="file" accept="image/*" onChange={handleMainImageFileChange} className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-3 text-sm" />
          </div>
          {(mainImageFile || formData.image) && <p className="mt-2 text-xs text-gray-500">{mainImageFile ? `Selected file: ${mainImageFile.name}` : "Using image URL"}</p>}
        </div>

        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="h-36 rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f] md:col-span-2" />

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-[#24472f]">More cabin detail images</label>
          <input type="file" accept="image/*" multiple onChange={handleGalleryFileChange} className="w-full cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-3 text-sm" />
          {galleryFiles.length > 0 && <p className="mt-2 text-xs text-gray-500">Selected {galleryFiles.length} new gallery image(s)</p>}

          {formData.images.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {formData.images.map((image) => (
                <div key={image} className="relative overflow-hidden rounded-md border bg-white">
                  <img src={getApiAssetUrl(image)} alt="Cabin gallery" className="h-28 w-full object-cover" />
                  <button type="button" onClick={() => removeGalleryImage(image)} className="absolute right-2 top-2 cursor-pointer rounded bg-white/90 px-2 py-1 text-xs font-semibold text-red-600">Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button type="submit" disabled={saving} className="mt-6 cursor-pointer rounded-md bg-[#24472f] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
        {saving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

export default CabinForm;
