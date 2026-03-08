export type ConsentState = {
  marketing: boolean;
};

export type MetaEventName =
  | "page_viewed"
  | "merchant_detail_viewed"
  | "sign_up_completed"
  | "login_completed"
  | "merchant_link_clicked"
  | "cashback_claim_confirmed"
  | "quest_started"
  | "quest_completed"
  | "wallet_connected"
  | "onboarding_step_completed";

export type AnalyticsPayloadPrimitive = string | number | boolean;

export type AnalyticsPayloadValue =
  | AnalyticsPayloadPrimitive
  | AnalyticsPayloadPrimitive[]
  | null
  | undefined;

export type AnalyticsPayload = Record<string, AnalyticsPayloadValue>;

export type MetaIdentity = {
  external_id_hash?: string;
  email_hash?: string;
  phone_hash?: string;
  auth_provider?: string;
  region?: string;
};

export type PendingAuthIntent = {
  type: "sign_up_completed" | "login_completed";
  method?: string;
};

export type AttributionState = {
  current: Record<string, string>;
  first: Record<string, string>;
};

export type PageContext = {
  pathname: string;
  search: string;
  route_name: string;
  page_type: string;
  locale: string;
  session_id: string;
  event_source_url: string;
  referrer_domain: string;
  site_env: string;
  internal_traffic: boolean;
};

export type DataLayerEvent = Record<string, unknown> & {
  event: string;
  event_name?: string;
};
