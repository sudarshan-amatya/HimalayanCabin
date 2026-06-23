import { apiRequest } from "./api";
import type { User, UserRole } from "../types";

type AuthResponse = {
  message: string;
  token: string;
  user: User;
};

type MeResponse = {
  message: string;
  user: User;
};

export type SignupData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role?: Extract<UserRole, "USER" | "OWNER">;
};

export type LoginData = {
  email: string;
  password: string;
};

export type GoogleAuthData = {
  credential: string;
  role?: Extract<UserRole, "USER" | "OWNER">;
};

export type UpdateProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export function signupUser(data: SignupData) {
  return apiRequest<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function loginUser(data: LoginData) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function googleAuth(data: GoogleAuthData) {
  return apiRequest<AuthResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMe() {
  return apiRequest<MeResponse>("/auth/me");
}

export function updateProfile(data: UpdateProfileData) {
  return apiRequest<AuthResponse>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function updateProfileImage(file: File) {
  const formData = new FormData();
  formData.append("profileImage", file);

  return apiRequest<MeResponse>("/auth/me/profile-image", {
    method: "PATCH",
    body: formData,
  });
}
