import Script from "next/script";

interface GoogleAdsenseProps {
  pId: string;
}

/**
 * Loads the Google AdSense script globally.
 * Only renders in production — dev mode skips it entirely to avoid
 * "no_div" errors and prevent accidental ad impressions.
 */
export function GoogleAdsense({ pId }: GoogleAdsenseProps) {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  return (
    <Script
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
