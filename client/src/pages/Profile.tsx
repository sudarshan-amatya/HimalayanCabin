import type React from "react";
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { Link, useNavigate } from "react-router";
import { getApiAssetUrl } from "../services/api";
import { getMe, updateProfile, updateProfileImage } from "../services/authService";
import type { User } from "../types";
import { getStoredUser, getUserInitials, saveAuth, saveUser } from "../utils/auth";

type ProfileFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

function Profile() {
  const navigate = useNavigate();
  const storedUser = getStoredUser();

  const [user, setUser] = useState<User | null>(storedUser);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: storedUser?.firstName || "",
    lastName: storedUser?.lastName || "",
    email: storedUser?.email || "",
    phone: storedUser?.phone || "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageSaving, setImageSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const data = await getMe();
        setUser(data.user);
        saveUser(data.user);
        setFormData({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          phone: data.user.phone || "",
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [navigate]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedImage(event.target.files?.[0] || null);
  }

  async function handleImageUpload() {
    if (!selectedImage) {
      setError("Please choose a profile image first");
      return;
    }

    try {
      setError("");
      setSuccess("");
      setImageSaving(true);
      const data = await updateProfileImage(selectedImage);
      saveUser(data.user);
      setUser(data.user);
      setSelectedImage(null);
      setSuccess("Profile photo updated successfully.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to upload profile photo");
    } finally {
      setImageSaving(false);
    }
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError("First name, last name, email, and contact number are required");
      return;
    }

    if (formData.phone.trim().length < 7) {
      setError("Please enter a valid contact number");
      return;
    }

    try {
      setError("");
      setSuccess("");
      setSaving(true);

      const data = await updateProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      });

      if (data.token) {
        saveAuth(data.token, data.user);
      } else {
        saveUser(data.user);
      }

      setUser(data.user);
      setSuccess("Profile updated successfully.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="px-4 py-20 text-center">Loading profile...</p>;
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <div className="mb-10">
        <p className="font-semibold text-[#17703a]">Your account</p>
        <h1 className="mt-3 font-serif text-4xl font-bold">Profile</h1>
        <p className="mt-3 text-sm text-gray-600">
          Update your account, contact details, profile photo, bookings, gifts, and credits.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="h-fit rounded-md bg-[#202b29] p-6 text-white">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#f4b855] text-2xl font-bold text-[#101918]">
            {user?.profileImage ? (
              <img src={getApiAssetUrl(user.profileImage)} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              getUserInitials(user)
            )}
          </div>
          <h2 className="mt-5 font-serif text-2xl font-bold">
            {user?.firstName} {user?.lastName}
          </h2>
          <p className="mt-2 text-sm text-gray-300">{user?.email}</p>
          <p className="mt-1 text-sm text-gray-300">{user?.phone || "No contact number added"}</p>
          <p className="mt-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
            {user?.role === "ADMIN" ? "Main admin" : user?.role === "OWNER" ? "Cabin owner" : "Guest"}
          </p>

          {user?.role === "USER" && (
            <div className="mt-5 rounded-md bg-white/10 p-4">
              <p className="text-xs text-gray-300">Gift credit balance</p>
              <p className="mt-1 text-2xl font-bold text-[#f4b855]">
                Rs. {(user.giftCredit || 0).toLocaleString()}
              </p>
            </div>
          )}

          <div className="mt-8 space-y-3 text-sm">
            {user?.role === "USER" && (
              <>
                <Link to="/my-bookings" className="block rounded-md bg-white/10 px-4 py-3 hover:bg-white/15">My bookings</Link>
                <Link to="/my-gifts" className="block rounded-md bg-white/10 px-4 py-3 hover:bg-white/15">Gifts received</Link>
                <Link to="/my-bookmarks" className="block rounded-md bg-white/10 px-4 py-3 hover:bg-white/15">My bookmarks</Link>
                <Link to="/cabins" className="block rounded-md bg-white/10 px-4 py-3 hover:bg-white/15">Browse cabins</Link>
              </>
            )}
            {user?.role === "OWNER" && (
              <>
                <Link to="/owner/cabins" className="block rounded-md bg-white/10 px-4 py-3 hover:bg-white/15">Manage my cabins</Link>
                <Link to="/owner/bookings" className="block rounded-md bg-white/10 px-4 py-3 hover:bg-white/15">Booking requests</Link>
              </>
            )}
            {user?.role === "ADMIN" && (
              <Link to="/admin" className="block rounded-md bg-[#f4b855] px-4 py-3 font-semibold text-[#101918]">Admin dashboard</Link>
            )}
          </div>
        </aside>

        <div className="space-y-6">
          <div className="rounded-md bg-[#eff8f5] p-6 shadow-sm">
            <h2 className="font-serif text-2xl font-bold">Profile photo</h2>
            <p className="mt-2 text-sm text-gray-600">Upload a clear profile image for your account.</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input type="file" accept="image/*" onChange={handleImageChange} className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm" />
              <button
                type="button"
                onClick={handleImageUpload}
                disabled={imageSaving}
                className="cursor-pointer rounded-md bg-[#24472f] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {imageSaving ? "Uploading..." : "Upload photo"}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-md bg-[#eff8f5] p-6 shadow-sm">
            <h2 className="font-serif text-2xl font-bold">Edit profile information</h2>

            {error && <p className="mt-5 rounded-md bg-red-100 px-4 py-3 text-sm text-red-700">{error}</p>}
            {success && <p className="mt-5 rounded-md bg-green-100 px-4 py-3 text-sm text-green-700">{success}</p>}

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-gray-700">First name</label>
                <input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]" />
              </div>

              <div>
                <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-gray-700">Last name</label>
                <input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]" />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]" />
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">Contact number</label>
                <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]" />
              </div>
            </div>

            <button type="submit" disabled={saving} className="mt-6 cursor-pointer rounded-md bg-[#24472f] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Profile;
