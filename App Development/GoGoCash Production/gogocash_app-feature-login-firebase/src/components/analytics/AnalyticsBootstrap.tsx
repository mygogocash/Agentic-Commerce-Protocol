import { analyticsConfig } from "@/lib/analytics/config";

const AnalyticsBootstrap = () => {
  if (!analyticsConfig.enabled) return null;

  const { gaMeasurementId } = analyticsConfig;

  return (
    <>
      {gaMeasurementId && (
        // eslint-disable-next-line @next/next/no-sync-scripts
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
        />
      )}
      <script
        id="gogocash-gtag-bootstrap"
        dangerouslySetInnerHTML={{
          __html: [
            "window.dataLayer=window.dataLayer||[];",
            "function gtag(){dataLayer.push(arguments)}",
            gaMeasurementId
              ? `gtag('js',new Date());gtag('config','${gaMeasurementId}');`
              : "",
          ].join(""),
        }}
      />
    </>
  );
};

export default AnalyticsBootstrap;
