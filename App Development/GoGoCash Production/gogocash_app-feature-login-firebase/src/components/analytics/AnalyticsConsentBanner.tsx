"use client";

import { useState } from "react";
import { analyticsConfig, getStoredConsent, setConsent } from "@/lib/analytics";

const AnalyticsConsentBanner = () => {
  const [visible, setVisible] = useState(
    () => analyticsConfig.enabled && !getStoredConsent(),
  );

  if (!analyticsConfig.enabled || !visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1200] border-t border-[#D9ECDC] bg-white/95 p-4 shadow-[0_-16px_32px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-[#004A21]">
            Cookie and tracking preferences
          </p>
          <p className="text-sm text-[#4B5563]">
            Necessary cookies keep the app working. Marketing consent enables
            Meta Pixel and Conversions API for ad measurement and retargeting.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-[#C7D8C8] bg-white px-4 py-2 text-sm font-semibold text-[#004A21]"
            onClick={() => {
              setConsent({ marketing: false });
              setVisible(false);
            }}
          >
            Necessary only
          </button>
          <button
            type="button"
            className="rounded-full bg-[#00B14F] px-4 py-2 text-sm font-semibold text-white"
            onClick={() => {
              setConsent({ marketing: true });
              setVisible(false);
            }}
          >
            Allow marketing
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsConsentBanner;
