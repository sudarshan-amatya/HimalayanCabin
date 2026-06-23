function cleanValue(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/^['\"]|['\"]$/g, "");
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

const apiUrl = trimTrailingSlash(cleanValue(import.meta.env.VITE_API_URL));

export const clientEnv = {
  apiUrl,
  googleClientId: cleanValue(import.meta.env.VITE_GOOGLE_CLIENT_ID),
};

export function getRequiredClientEnv(name: keyof typeof clientEnv) {
  const value = clientEnv[name];

  if (!value) {
    throw new Error(`${name} is missing. Add it to your client environment variables.`);
  }

  return value;
}
