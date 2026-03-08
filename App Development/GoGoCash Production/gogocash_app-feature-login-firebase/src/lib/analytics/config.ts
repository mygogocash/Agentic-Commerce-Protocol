export const analyticsConfig = {
  enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true",
  gtmId: process.env.NEXT_PUBLIC_GTM_ID || "",
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
  userSalt:
    process.env.NEXT_PUBLIC_META_USER_SALT ||
    process.env.NEXT_PUBLIC_META_PIXEL_ID ||
    "gogocash-meta-v1",
  debug:
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true",
  productionHostname: "app.gogocash.co",
  trackingDomain: "track.app.gogocash.co",
} as const;
