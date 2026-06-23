const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function getApiBaseUrl() {
  if (!API_URL) {
    throw new Error("VITE_API_URL is missing. Add it in client/.env, for example VITE_API_URL=http://localhost:4000");
  }

  return API_URL;
}

export function getApiAssetUrl(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("token");
  const isFormData = options.body instanceof FormData;
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const response = await fetch(`${getApiBaseUrl()}${normalizedEndpoint}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data as T;
}
