import Script from "next/script";
import { analyticsConfig } from "@/lib/analytics/config";

const AnalyticsBootstrap = () => {
  if (!analyticsConfig.enabled) return null;

  const { gaMeasurementId } = analyticsConfig;

  return (
    <>
      <script
        id="gogocash-meta-bootstrap"
        dangerouslySetInnerHTML={{
          __html: "window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments)}",
        }}
      />
      {gaMeasurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="gogocash-gtag-config" strategy="afterInteractive">
            {`gtag('js', new Date());gtag('config', '${gaMeasurementId}');`}
          </Script>
        </>
      )}
    </>
  );
};

export default AnalyticsBootstrap;
