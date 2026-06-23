import "dotenv/config";

function cleanValue(value: string | undefined) {
  return value?.trim().replace(/^['\"]|['\"]$/g, "");
}

export function getOptionalEnv(name: string, fallback = "") {
  return cleanValue(process.env[name]) || fallback;
}

export function getRequiredEnv(name: string) {
  const value = getOptionalEnv(name);

  if (!value) {
    throw new Error(`${name} is missing in server environment variables.`);
  }

  return value;
}

export function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getRequiredUrlEnv(name: string) {
  return trimTrailingSlash(getRequiredEnv(name));
}

export function parseCsvEnv(name: string, fallbackName?: string) {
  const rawValue = getOptionalEnv(name) || (fallbackName ? getOptionalEnv(fallbackName) : "");

  return rawValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map(trimTrailingSlash);
}

export const env = {
  nodeEnv: getOptionalEnv("NODE_ENV", "development"),
  port: Number(getOptionalEnv("PORT", "4000")),

  databaseUrl: getRequiredEnv("DATABASE_URL"),
  directUrl: getOptionalEnv("DIRECT_URL"),

  jwtSecret: getRequiredEnv("JWT_SECRET"),

  frontendUrl: getOptionalEnv("FRONTEND_URL"),
  clientOrigins: parseCsvEnv("CLIENT_ORIGINS", "FRONTEND_URL"),
  apiBaseUrl: getOptionalEnv("API_BASE_URL"),

  googleClientId: getOptionalEnv("GOOGLE_CLIENT_ID"),

  cloudinaryCloudName: getOptionalEnv("CLOUDINARY_CLOUD_NAME"),
  cloudinaryApiKey: getOptionalEnv("CLOUDINARY_API_KEY"),
  cloudinaryApiSecret: getOptionalEnv("CLOUDINARY_API_SECRET"),
  cloudinaryFolder: getOptionalEnv("CLOUDINARY_FOLDER", "himalayan-cabins"),

  esewaMode: getOptionalEnv("ESEWA_MODE", "test"),
  esewaProductCode: getOptionalEnv("ESEWA_PRODUCT_CODE", "EPAYTEST"),
  esewaSecretKey: getOptionalEnv("ESEWA_SECRET_KEY", "8gBm/:&EnhH.1/q"),
  esewaFormUrl: getOptionalEnv("ESEWA_FORM_URL"),
  esewaStatusUrl: getOptionalEnv("ESEWA_STATUS_URL"),
};
