import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AuthProvider from "@/components/auth-provider";
import WishlistProvider from "@/components/wishlist-provider";
import PwaRegister from "@/components/pwa-register";
import Shell from "@/components/shell";
import GoogleAuthProvider from "@/components/google-auth-provider";
import SiteConfigProvider from "@/components/site-config-provider";
import { fetchSiteConfig } from "@/lib/site-config";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"

const GA_ID = "G-5RNE9D5BN6";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://flixworld.xyz"),
  title: {
    default: "FlixWorld - Stream Movies & TV Shows",
    template: "%s - FlixWorld",
  },
  description:
    "Discover the latest movies and TV shows. Stream trending, top-rated, and upcoming titles on FlixWorld.",
  keywords: ["movies", "TV shows", "streaming", "watch online", "free streaming", "FlixWorld"],
  authors: [{ name: "FlixWorld", url: "https://flixworld.xyz" }],
  creator: "FlixWorld",
  publisher: "FlixWorld",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Flixworld",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    siteName: "FlixWorld",
    title: "FlixWorld - Stream Movies & TV Shows",
    description:
      "Discover the latest movies and TV shows. Stream trending, top-rated, and upcoming titles on FlixWorld.",
    url: "https://flixworld.xyz",
    images: [{ url: "/icons/icon-512x512.png", width: 512, height: 512, alt: "FlixWorld" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@flixworldxyz",
    title: "FlixWorld - Stream Movies & TV Shows",
    description:
      "Discover the latest movies and TV shows. Stream trending, top-rated, and upcoming titles on FlixWorld.",
    images: ["/icons/icon-512x512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/assets/images/favicon.png",
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteConfig = await fetchSiteConfig();

  return (
    <html lang="en" className={`${geistSans.variable} dark`}>
      <head>
        {/* Google AdSense — must be a plain <script> in <head> with no extra
            attributes. Next.js <Script> adds data-nscript which AdSense rejects. */}
        {siteConfig.adsenseSrc ? (
          // eslint-disable-next-line @next/next/no-sync-scripts
          <script
            async
            src={siteConfig.adsenseSrc}
            crossOrigin="anonymous"
          />
        ) : siteConfig.adsenseCode ? (
          <script
            dangerouslySetInnerHTML={{ __html: siteConfig.adsenseCode }}
          />
        ) : null}
      </head>
      <body className="min-h-screen bg-black text-white antialiased">
        <PwaRegister />
        <GoogleAuthProvider>
          <AuthProvider>
            <WishlistProvider>
              <SiteConfigProvider initialConfig={siteConfig}>
                <Shell>
                  {children}
                </Shell>
              </SiteConfigProvider>
            </WishlistProvider>
          </AuthProvider>
        </GoogleAuthProvider>
        <Analytics />
        <SpeedInsights/>

        {/* Analytics — injected from admin settings (overrides hardcoded GA if set) */}
        {siteConfig.analyticsSrc ? (
          <Script
            id="analytics-script"
            src={siteConfig.analyticsSrc}
            strategy="afterInteractive"
          />
        ) : siteConfig.analyticsCode ? (
          <Script
            id="analytics-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: siteConfig.analyticsCode }}
          />
        ) : (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
