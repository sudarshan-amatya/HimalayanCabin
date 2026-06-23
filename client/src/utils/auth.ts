import type { User } from "../types";

export function getToken() {
  return localStorage.getItem("token");
}

export function getStoredUser(): User | null {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export function saveAuth(token: string, user: User) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  window.dispatchEvent(new Event("auth-changed"));
}

export function saveUser(user: User) {
  localStorage.setItem("user", JSON.stringify(user));
  window.dispatchEvent(new Event("auth-changed"));
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("auth-changed"));
}

export function getUserInitials(user: User | null) {
  if (!user) return "";

  const first = user.firstName?.trim().charAt(0).toUpperCase() || "";
  const last = user.lastName?.trim().charAt(0).toUpperCase() || "";

  return `${first}${last}` || user.email.charAt(0).toUpperCase();
}
