import crypto from "crypto";
function getRequiredEnv(name) {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`${name} is missing in server .env`);
    }
    return value.replace(/\/$/, "");
}
function getBaseUrl() {
    return getRequiredEnv("API_BASE_URL");
}
export function getFrontendUrl() {
    return getRequiredEnv("FRONTEND_URL");
}
export function getEsewaConfig() {
    const mode = process.env.ESEWA_MODE || "test";
    const isProduction = mode === "production" || mode === "live";
    return {
        productCode: process.env.ESEWA_PRODUCT_CODE || "EPAYTEST",
        secretKey: process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q",
        formUrl: process.env.ESEWA_FORM_URL ||
            (isProduction
                ? "https://epay.esewa.com.np/api/epay/main/v2/form"
                : "https://rc-epay.esewa.com.np/api/epay/main/v2/form"),
        statusUrl: process.env.ESEWA_STATUS_URL ||
            (isProduction
                ? "https://esewa.com.np/api/epay/transaction/status/"
                : "https://rc.esewa.com.np/api/epay/transaction/status/"),
        successUrl: `${getBaseUrl()}/payments/esewa/success`,
        failureUrl: `${getBaseUrl()}/payments/esewa/failure`,
    };
}
export function generateTransactionUuid(prefix) {
    const safePrefix = prefix.replace(/[^A-Za-z0-9-]/g, "").slice(0, 12) || "HC";
    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
    const random = crypto.randomBytes(4).toString("hex");
    return `${safePrefix}-${stamp}-${random}`;
}
export function createSignature(message, secretKey = getEsewaConfig().secretKey) {
    return crypto.createHmac("sha256", secretKey).update(message).digest("base64");
}
export function signedMessageFromPayload(payload, signedFieldNames) {
    return signedFieldNames
        .split(",")
        .map((field) => `${field}=${payload[field]}`)
        .join(",");
}
export function createEsewaFormPayload(amount, transactionUuid) {
    const config = getEsewaConfig();
    const totalAmount = String(amount);
    const signedFieldNames = "total_amount,transaction_uuid,product_code";
    const basePayload = {
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
        ...basePayload,
        signature: createSignature(message, config.secretKey),
    };
}
export function decodeEsewaData(data) {
    if (!data || typeof data !== "string") {
        throw new Error("Missing eSewa response data");
    }
    const json = Buffer.from(data, "base64").toString("utf-8");
    return JSON.parse(json);
}
export function verifyEsewaResponseSignature(response) {
    const signedFieldNames = String(response.signed_field_names || "");
    const providedSignature = String(response.signature || "");
    if (!signedFieldNames || !providedSignature)
        return false;
    const fields = signedFieldNames.split(",");
    const message = fields.map((field) => `${field}=${String(response[field] ?? "")}`).join(",");
    const expectedSignature = createSignature(message);
    try {
        return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(providedSignature));
    }
    catch {
        return false;
    }
}
export async function checkEsewaStatus(transactionUuid, amount) {
    const config = getEsewaConfig();
    const url = new URL(config.statusUrl);
    url.searchParams.set("product_code", config.productCode);
    url.searchParams.set("total_amount", String(amount));
    url.searchParams.set("transaction_uuid", transactionUuid);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Could not verify eSewa transaction status");
    }
    return (await response.json());
}
