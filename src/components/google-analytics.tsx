import Script from "next/script";

interface GoogleAnalyticsProps {
  gId: string;
}

/**
 * Loads the Google Analytics (gtag.js) script globally.
 * Only renders in production — dev mode skips it to avoid
 * polluting analytics data with local traffic.
 */
export function GoogleAnalytics({ gId }: GoogleAnalyticsProps) {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gId}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gId}');`}
      </Script>
    </>
  );
}
