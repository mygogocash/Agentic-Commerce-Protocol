"use client";

import { analyticsConfig } from "./config";
import {
  captureAttribution,
  clearSessionAnalyticsState,
  getAttribution,
  getOrCreateFbc,
  getOrCreateFbp,
  getStoredConsent,
  persistConsent,
} from "./storage";
import {
  createEventId,
  getMetaEventName,
  getReferrerDomain,
  sanitizePayload,
} from "./utils";
import {
  AnalyticsPayload,
  ConsentState,
  DataLayerEvent,
  MetaEventName,
  MetaIdentity,
  PageContext,
} from "./types";

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
    __gogocashGtmLoaded?: boolean;
  }
}

type QueuedEvent = {
  eventId: string;
  timestampMs: number;
  name: MetaEventName;
  payload: AnalyticsPayload;
};

type TrackerState = {
  consent: ConsentState;
  gtmLoaded: boolean;
  queue: QueuedEvent[];
  pageContext: PageContext | null;
  identity: MetaIdentity;
};

const trackerState: TrackerState = {
  consent: getStoredConsent() || { marketing: false },
  gtmLoaded: false,
  queue: [],
  pageContext: null,
  identity: {},
};

function isBrowser() {
  return typeof window !== "undefined";
}

function hasAllowedConsent() {
  return trackerState.consent.marketing;
}

function ensureDataLayer() {
  if (!isBrowser()) return [];

  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

function pushToDataLayer(event: DataLayerEvent) {
  ensureDataLayer().push(event);

  if (analyticsConfig.debug) {
    console.debug("[meta-analytics]", event.event, event);
  }
}

function loadGtmIfNeeded() {
  if (
    !isBrowser() ||
    !analyticsConfig.enabled ||
    !analyticsConfig.gtmId ||
    trackerState.gtmLoaded
  ) {
    return;
  }

  trackerState.gtmLoaded = true;
  window.__gogocashGtmLoaded = true;
  pushToDataLayer({
    event: "gtm.js",
    "gtm.start": Date.now(),
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${analyticsConfig.gtmId}`;
  script.dataset.source = "gogocash-meta";
  document.head.appendChild(script);
}

function buildDataLayerEvent(entry: QueuedEvent) {
  const attribution = getAttribution();
  const pageContext = trackerState.pageContext;
  const search = pageContext?.search || "";

  return {
    event: entry.name,
    event_name: entry.name,
    meta_event_name: getMetaEventName(entry.name),
    event_id: entry.eventId,
    eventID: entry.eventId,
    timestamp_ms: entry.timestampMs,
    route_name: pageContext?.route_name || "",
    page_type: pageContext?.page_type || "",
    locale: pageContext?.locale || "",
    session_id: pageContext?.session_id || "",
    event_source_url:
      pageContext?.event_source_url ||
      (typeof window !== "undefined" ? window.location.href : ""),
    referrer_domain:
      attribution.current.referrer_domain || pageContext?.referrer_domain || "",
    fbp: getOrCreateFbp(),
    fbc: getOrCreateFbc(search),
    site_env: pageContext?.site_env || "",
    internal_traffic: pageContext?.internal_traffic || false,
    marketing_consent: trackerState.consent.marketing,
    user_data_external_id: trackerState.identity.external_id_hash || undefined,
    user_data_em: trackerState.identity.email_hash || undefined,
    user_data_ph: trackerState.identity.phone_hash || undefined,
    auth_provider: trackerState.identity.auth_provider || undefined,
    user_region: trackerState.identity.region || undefined,
    utm_source: attribution.current.utm_source || "",
    utm_medium: attribution.current.utm_medium || "",
    utm_campaign: attribution.current.utm_campaign || "",
    utm_content: attribution.current.utm_content || "",
    utm_term: attribution.current.utm_term || "",
    utm_id: attribution.current.utm_id || "",
    first_utm_source: attribution.first.utm_source || "",
    first_utm_medium: attribution.first.utm_medium || "",
    first_utm_campaign: attribution.first.utm_campaign || "",
    first_utm_content: attribution.first.utm_content || "",
    first_utm_term: attribution.first.utm_term || "",
    first_utm_id: attribution.first.utm_id || "",
    first_referrer_domain: attribution.first.referrer_domain || "",
    ...entry.payload,
  } satisfies DataLayerEvent;
}

function flushQueue() {
  if (!hasAllowedConsent() || trackerState.queue.length === 0) return;

  loadGtmIfNeeded();
  trackerState.queue.splice(0).forEach((entry) => {
    pushToDataLayer(buildDataLayerEvent(entry));
  });
}

export function initializeAnalytics() {
  if (!analyticsConfig.enabled || !isBrowser()) return;

  ensureDataLayer();
  captureAttribution(window.location.search, getReferrerDomain());
}

export function setPageContext(pageContext: PageContext) {
  trackerState.pageContext = pageContext;
}

export function track(name: MetaEventName, payload: AnalyticsPayload = {}) {
  if (!analyticsConfig.enabled) return;

  const entry: QueuedEvent = {
    name,
    payload: sanitizePayload(payload),
    eventId: createEventId(),
    timestampMs: Date.now(),
  };

  if (!hasAllowedConsent()) {
    trackerState.queue.push(entry);
    return;
  }

  loadGtmIfNeeded();
  pushToDataLayer(buildDataLayerEvent(entry));
}

export function identify(identity: MetaIdentity) {
  trackerState.identity = identity;
}

export function setConsent(consent: ConsentState) {
  trackerState.consent = consent;
  persistConsent(consent);

  if (!hasAllowedConsent()) {
    trackerState.queue = [];
  } else {
    loadGtmIfNeeded();
  }

  const event = {
    event: "consent_update",
    marketing_consent: consent.marketing,
  } satisfies DataLayerEvent;

  if (hasAllowedConsent()) {
    pushToDataLayer(event);
    flushQueue();
  }
}

export function resetAnalyticsIdentity() {
  trackerState.identity = {};
  clearSessionAnalyticsState();
}
