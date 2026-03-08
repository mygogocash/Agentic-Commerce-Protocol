import { AttributionState, ConsentState, PendingAuthIntent } from "./types";
import { extractUtmValues } from "./utils";

const CONSENT_KEY = "gogocash_meta_consent_v1";
const ATTRIBUTION_KEY = "gogocash_meta_attribution_v1";
const SESSION_ID_KEY = "gogocash_meta_session_id_v1";
const PENDING_AUTH_KEY = "gogocash_meta_pending_auth_v1";
const AUTH_EVENT_KEY = "gogocash_meta_auth_event_v1";
const CONVERSION_SNAPSHOT_KEY = "gogocash_meta_conversion_snapshot_v1";
const META_CONSENT_COOKIE = "gogocash_marketing_consent";
const FBP_COOKIE = "_fbp";
const FBC_COOKIE = "_fbc";

function isBrowser() {
  return typeof window !== "undefined";
}

function readStorage<T>(key: string): T | null {
  if (!isBrowser()) return null;

  try {
    const value =
      window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: unknown) {
  if (!isBrowser()) return;

  window.localStorage.setItem(key, JSON.stringify(value));
}

function writeSessionStorage(key: string, value: unknown) {
  if (!isBrowser()) return;

  window.sessionStorage.setItem(key, JSON.stringify(value));
}

function removeSessionStorage(key: string) {
  if (!isBrowser()) return;

  window.sessionStorage.removeItem(key);
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;

  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";

  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")
      .slice(1)
      .join("=") || ""
  );
}

function createFbpValue() {
  const random = Math.floor(Math.random() * 1_000_000_0000);
  return `fb.1.${Date.now()}.${random}`;
}

function createFbcValue(fbclid: string) {
  return `fb.1.${Date.now()}.${fbclid}`;
}

function getFbclid(search: string) {
  return new URLSearchParams(search).get("fbclid") || "";
}

export function getStoredConsent() {
  return readStorage<ConsentState>(CONSENT_KEY);
}

export function persistConsent(consent: ConsentState) {
  writeLocalStorage(CONSENT_KEY, consent);
  writeCookie(META_CONSENT_COOKIE, consent.marketing ? "1" : "0", 60 * 60 * 24 * 180);
}

export function getOrCreateSessionId() {
  if (!isBrowser()) return "server_session";

  const existing = window.sessionStorage.getItem(SESSION_ID_KEY);
  if (existing) return existing;

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  window.sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  return sessionId;
}

export function captureAttribution(search: string, referrerDomain: string) {
  if (!isBrowser()) return;

  const current = extractUtmValues(search);
  const hasUtm = Object.keys(current).length > 0;
  const existing = readStorage<AttributionState>(ATTRIBUTION_KEY) || {
    current: {},
    first: {},
  };

  const nextCurrent = hasUtm
    ? { ...current, referrer_domain: referrerDomain }
    : existing.current;
  const nextFirst =
    hasUtm && Object.keys(existing.first).length === 0
      ? { ...current, referrer_domain: referrerDomain }
      : existing.first;

  writeLocalStorage(ATTRIBUTION_KEY, {
    current: nextCurrent,
    first: nextFirst,
  });
}

export function getAttribution() {
  return (
    readStorage<AttributionState>(ATTRIBUTION_KEY) || {
      current: {},
      first: {},
    }
  );
}

export function setPendingAuthIntent(intent: PendingAuthIntent) {
  writeSessionStorage(PENDING_AUTH_KEY, intent);
}

export function consumePendingAuthIntent() {
  const intent = readStorage<PendingAuthIntent>(PENDING_AUTH_KEY);
  removeSessionStorage(PENDING_AUTH_KEY);
  return intent;
}

export function getLastAuthEventKey() {
  if (!isBrowser()) return "";
  return window.sessionStorage.getItem(AUTH_EVENT_KEY) || "";
}

export function setLastAuthEventKey(key: string) {
  if (!isBrowser()) return;
  window.sessionStorage.setItem(AUTH_EVENT_KEY, key);
}

export function clearSessionAnalyticsState() {
  removeSessionStorage(PENDING_AUTH_KEY);
  removeSessionStorage(AUTH_EVENT_KEY);
}

export function getConversionSnapshot() {
  return readStorage<Record<string, string>>(CONVERSION_SNAPSHOT_KEY) || {};
}

export function setConversionSnapshot(snapshot: Record<string, string>) {
  writeLocalStorage(CONVERSION_SNAPSHOT_KEY, snapshot);
}

export function getOrCreateFbp() {
  const existing = readCookie(FBP_COOKIE);
  if (existing) return existing;

  const nextValue = createFbpValue();
  writeCookie(FBP_COOKIE, nextValue, 60 * 60 * 24 * 90);
  return nextValue;
}

export function getOrCreateFbc(search: string) {
  const existing = readCookie(FBC_COOKIE);
  if (existing) return existing;

  const fbclid = getFbclid(search);
  if (!fbclid) return "";

  const nextValue = createFbcValue(fbclid);
  writeCookie(FBC_COOKIE, nextValue, 60 * 60 * 24 * 90);
  return nextValue;
}
