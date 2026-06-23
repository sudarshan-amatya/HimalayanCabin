import crypto from "crypto";
import { env, getRequiredUrlEnv, trimTrailingSlash } from "../config/env.js";

export type EsewaPurpose = "BOOKING" | "GIFT_VOUCHER" | "GIFT_CABIN";

export type EsewaFormPayload = {
  amount: string;
  tax_amount: string;
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  product_service_charge: string;
  product_delivery_charge: string;
  success_url: string;
  failure_url: string;
  signed_field_names: string;
  signature: string;
};

export type DecodedEsewaResponse = {
  transaction_code?: string;
  status?: string;
  total_amount?: string | number;
  transaction_uuid?: string;
  product_code?: string;
  signed_field_names?: string;
  signature?: string;
  [key: string]: unknown;
};

function getBaseUrl() {
  return getRequiredUrlEnv("API_BASE_URL");
}

export function getFrontendUrl() {
  return getRequiredUrlEnv("FRONTEND_URL");
}

export function getEsewaConfig() {
  const mode = env.esewaMode;
  const isProduction = mode === "production" || mode === "live";

  const defaultFormUrl = isProduction
    ? "https://epay.esewa.com.np/api/epay/main/v2/form"
    : "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

  const defaultStatusUrl = isProduction
    ? "https://esewa.com.np/api/epay/transaction/status/"
    : "https://rc.esewa.com.np/api/epay/transaction/status/";

  return {
    productCode: env.esewaProductCode,
    secretKey: env.esewaSecretKey,
    formUrl: trimTrailingSlash(env.esewaFormUrl || defaultFormUrl),
    statusUrl: env.esewaStatusUrl || defaultStatusUrl,
    successUrl: `${getBaseUrl()}/payments/esewa/success`,
    failureUrl: `${getBaseUrl()}/payments/esewa/failure`,
  };
}

export function generateTransactionUuid(prefix: string) {
  const safePrefix = prefix.replace(/[^A-Za-z0-9-]/g, "").slice(0, 12) || "HC";
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const random = crypto.randomBytes(4).toString("hex");
  return `${safePrefix}-${stamp}-${random}`;
}

export function createSignature(message: string, secretKey = getEsewaConfig().secretKey) {
  return crypto.createHmac("sha256", secretKey).update(message).digest("base64");
}

export function signedMessageFromPayload(payload: Record<string, string>, signedFieldNames: string) {
  return signedFieldNames
    .split(",")
    .map((field) => `${field}=${payload[field]}`)
    .join(",");
}

export function createEsewaFormPayload(amount: number, transactionUuid: string): EsewaFormPayload {
  const config = getEsewaConfig();
  const totalAmount = String(amount);
  const signedFieldNames = "total_amount,transaction_uuid,product_code";

  const basePayload: Record<string, string> = {
    amount: totalAmount,
    tax_amount: "0",
    total_amount: totalAmount,
    transaction_uuid: transactionUuid,
    product_code: config.productCode,
    product_service_charge: "0",
    product_delivery_charge: "0",
    success_url: config.successUrl,
    failure_url: config.failureUrl,
    signed_field_names: signedFieldNames,
  };

  const message = signedMessageFromPayload(basePayload, signedFieldNames);

  return {
    ...(basePayload as Omit<EsewaFormPayload, "signature">),
    signature: createSignature(message, config.secretKey),
  };
}

export function decodeEsewaData(data: unknown): DecodedEsewaResponse {
  if (!data || typeof data !== "string") {
    throw new Error("Missing eSewa response data");
  }

  const json = Buffer.from(data, "base64").toString("utf-8");
  return JSON.parse(json) as DecodedEsewaResponse;
}

export function verifyEsewaResponseSignature(response: DecodedEsewaResponse) {
  const signedFieldNames = String(response.signed_field_names || "");
  const providedSignature = String(response.signature || "");

  if (!signedFieldNames || !providedSignature) return false;

  const fields = signedFieldNames.split(",");
  const message = fields.map((field) => `${field}=${String(response[field] ?? "")}`).join(",");
  const expectedSignature = createSignature(message);

  try {
    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(providedSignature));
  } catch {
    return false;
  }
}

export async function checkEsewaStatus(transactionUuid: string, amount: number) {
  const config = getEsewaConfig();
  const url = new URL(config.statusUrl);
  url.searchParams.set("product_code", config.productCode);
  url.searchParams.set("total_amount", String(amount));
  url.searchParams.set("transaction_uuid", transactionUuid);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not verify eSewa transaction status");
  }

  return (await response.json()) as { status?: string; ref_id?: string | null; total_amount?: number | string };
}
