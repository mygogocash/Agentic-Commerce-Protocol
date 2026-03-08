"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import AnalyticsConsentBanner from "@/components/analytics/AnalyticsConsentBanner";
import {
  analyticsConfig,
  captureAttribution,
  consumePendingAuthIntent,
  getLastAuthEventKey,
  getLocaleFromPath,
  getOrCreateSessionId,
  getPageType,
  getReferrerDomain,
  getRouteName,
  getSiteEnv,
  getStoredConsent,
  hashEmail,
  hashPhone,
  hashUserId,
  identify,
  initializeAnalytics,
  isInternalTraffic,
  resetAnalyticsIdentity,
  setConsent,
  setLastAuthEventKey,
  setPageContext,
  track,
} from "@/lib/analytics";

const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const lastPageKeyRef = useRef("");

  useEffect(() => {
    initializeAnalytics();
    const storedConsent = getStoredConsent();

    if (storedConsent) {
      setConsent(storedConsent);
    }
  }, []);

  useEffect(() => {
    if (!analyticsConfig.enabled || typeof window === "undefined") return;

    const currentPath = pathname || window.location.pathname || "/";
    const currentSearch = window.location.search || "";
    captureAttribution(currentSearch, getReferrerDomain());

    setPageContext({
      pathname: currentPath,
      search: currentSearch,
      route_name: getRouteName(currentPath),
      page_type: getPageType(currentPath),
      locale: getLocaleFromPath(currentPath),
      session_id: getOrCreateSessionId(),
      event_source_url: window.location.href,
      referrer_domain: getReferrerDomain(),
      site_env: getSiteEnv(),
      internal_traffic: isInternalTraffic(),
    });

    const pageKey = `${currentPath}?${currentSearch}`;
    if (lastPageKeyRef.current === pageKey) return;

    lastPageKeyRef.current = pageKey;
    track("page_viewed");
  }, [pathname, status]);

  useEffect(() => {
    if (!analyticsConfig.enabled) return;

    if (status === "unauthenticated") {
      resetAnalyticsIdentity();
      return;
    }

    const userId = session?.user?._id || session?.user?.id;
    if (status !== "authenticated" || !userId) return;

    Promise.all([
      hashUserId(userId),
      session.user.email ? hashEmail(session.user.email) : Promise.resolve(""),
      session.user.mobile ? hashPhone(session.user.mobile) : Promise.resolve(""),
    ]).then(([externalIdHash, emailHash, phoneHash]) => {
      identify({
        external_id_hash: externalIdHash || undefined,
        email_hash: emailHash || undefined,
        phone_hash: phoneHash || undefined,
        auth_provider: session.user.auth_provider || undefined,
        region: session.user.region || undefined,
      });

      const pendingAuthIntent = consumePendingAuthIntent();
      if (!pendingAuthIntent) return;

      const authEventKey = [
        userId,
        session.user.access_token || "no_token",
        pendingAuthIntent.type,
        pendingAuthIntent.method || session.user.auth_provider || "unknown",
      ].join(":");

      if (getLastAuthEventKey() === authEventKey) return;

      setLastAuthEventKey(authEventKey);
      track(pendingAuthIntent.type, {
        auth_method:
          pendingAuthIntent.method || session.user.auth_provider || "unknown",
      });
    });
  }, [
    session?.user?._id,
    session?.user?.id,
    session?.user?.email,
    session?.user?.mobile,
    session?.user?.access_token,
    session?.user?.auth_provider,
    session?.user?.region,
    status,
  ]);

  return (
    <>
      {children}
      <AnalyticsConsentBanner />
    </>
  );
};

export default AnalyticsProvider;
