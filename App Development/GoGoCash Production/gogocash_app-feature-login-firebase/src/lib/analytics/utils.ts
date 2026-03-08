import { analyticsConfig } from "./config";
import { AnalyticsPayload, AnalyticsPayloadPrimitive, MetaEventName } from "./types";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
] as const;

const DISALLOWED_KEYS = new Set([
  "email",
  "phone",
  "mobile",
  "wallet",
  "wallet_address",
  "address",
  "account_name",
  "account_number",
  "bank_name",
  "full_name",
  "name",
  "username",
  "telegram_id",
  "id_telegram",
  "access_token",
  "refresh_token",
  "crossmint_jwt",
  "external_id",
  "em",
  "ph",
]);

const META_EVENT_MAP: Record<MetaEventName, string> = {
  page_viewed: "PageView",
  merchant_detail_viewed: "ViewContent",
  sign_up_completed: "CompleteRegistration",
  login_completed: "Login",
  merchant_link_clicked: "InitiateCheckout",
  cashback_claim_confirmed: "Purchase",
  quest_started: "QuestStarted",
  quest_completed: "QuestCompleted",
  wallet_connected: "WalletConnected",
  onboarding_step_completed: "OnboardingStepCompleted",
};

function isPrimitive(value: unknown): value is AnalyticsPayloadPrimitive {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function trimString(value: string) {
  return value.length > 200 ? value.slice(0, 200) : value;
}

export function getMetaEventName(eventName: MetaEventName) {
  return META_EVENT_MAP[eventName];
}

export function getLocaleFromPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0];
  return locale && locale.length <= 5 ? locale : "en";
}

export function getRouteName(pathname: string) {
  const withoutLocale =
    pathname.replace(/^\/[a-z-]{2,5}(?=\/|$)/i, "") || "/";

  if (withoutLocale === "/") return "home";
  if (withoutLocale === "/shop") return "shop_listing";
  if (withoutLocale.startsWith("/shop/")) return "shop_detail";
  if (withoutLocale === "/category") return "category_listing";
  if (withoutLocale.startsWith("/category/")) return "category_detail";
  if (withoutLocale === "/login") return "login";
  if (withoutLocale === "/register") return "register";
  if (withoutLocale === "/quest") return "quest";
  if (withoutLocale === "/wallet") return "wallet";
  if (withoutLocale === "/withdraw") return "withdraw";
  if (withoutLocale === "/profile") return "profile";
  if (withoutLocale.startsWith("/auth/callback")) return "auth_callback";

  return withoutLocale.replace(/^\//, "").replace(/\//g, "_") || "unknown";
}

export function getPageType(pathname: string) {
  const routeName = getRouteName(pathname);

  if (routeName === "home") return "landing";
  if (routeName.includes("login") || routeName.includes("register")) return "auth";
  if (routeName.startsWith("shop")) return "merchant";
  if (routeName.startsWith("category")) return "category";
  if (routeName === "quest") return "quest";
  if (routeName === "wallet" || routeName === "withdraw") return "wallet";
  if (routeName === "profile") return "profile";

  return "content";
}

export function getReferrerDomain() {
  if (typeof document === "undefined" || !document.referrer) return "";

  try {
    return new URL(document.referrer).hostname;
  } catch {
    return "";
  }
}

export function getSiteEnv(hostname?: string) {
  const value =
    hostname ||
    (typeof window !== "undefined" ? window.location.hostname : "");

  if (!value) return "unknown";
  if (value === analyticsConfig.productionHostname) return "production";
  if (value === "localhost" || value === "127.0.0.1") return "development";
  return "staging";
}

export function isInternalTraffic(hostname?: string) {
  const siteEnv = getSiteEnv(hostname);

  if (siteEnv !== "production") return true;
  if (typeof document === "undefined") return false;

  return document.cookie.includes("gogocash_internal_traffic=1");
}

export function createEventId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function sanitizePayload(payload: AnalyticsPayload = {}) {
  const sanitized: Record<
    string,
    AnalyticsPayloadPrimitive | AnalyticsPayloadPrimitive[]
  > = {};

  Object.entries(payload).forEach(([rawKey, rawValue]) => {
    const key = rawKey.toLowerCase();

    if (DISALLOWED_KEYS.has(key)) return;
    if (rawValue === undefined || rawValue === null) return;

    if (Array.isArray(rawValue)) {
      const values = rawValue.filter(isPrimitive).map((value) =>
        typeof value === "string" ? trimString(value) : value,
      );

      if (values.length > 0) {
        sanitized[rawKey] = values;
      }
      return;
    }

    if (isPrimitive(rawValue)) {
      sanitized[rawKey] =
        typeof rawValue === "string" ? trimString(rawValue) : rawValue;
    }
  });

  return sanitized;
}

export function extractUtmValues(search: string) {
  const params = new URLSearchParams(search);
  const values: Record<string, string> = {};

  UTM_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) {
      values[key] = value;
    }
  });

  return values;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

async function hashValue(value: string) {
  if (!value || typeof crypto === "undefined" || !crypto.subtle) return "";

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(digest))
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashUserId(userId: string) {
  return hashValue(`${analyticsConfig.userSalt}:${userId.trim()}`);
}

export async function hashEmail(email: string) {
  return hashValue(normalizeEmail(email));
}

export async function hashPhone(phone: string) {
  const normalized = normalizePhone(phone);
  return normalized ? hashValue(normalized) : "";
}

export function normalizeCurrencyCode(value: string) {
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : "";
}
