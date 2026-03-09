import type { Metadata } from "next";
import "./globals.css";
import ProviderDefault from "@/providers/ProviderDefault";
import { METADATA } from "@/constants/Metadata";
import { dmSans } from "@/lib/utils";
import {
  GoogleTagManagerHead,
  GoogleTagManagerNoScript,
} from "@/components/analytics/GoogleTagManager";
import MetaPixel from "@/components/analytics/MetaPixel";
import CookieConsent from "@/components/consent/CookieConsent";

export const metadata: Metadata = {
  title: METADATA.title,
  description: METADATA.description,
  applicationName: "GoGoCash",
  manifest: "/site.webmanifest",
  icons: {
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    title: METADATA.title,
    description: METADATA.description,
    images: [
      {
        url: METADATA.banner,
        width: 800,
        height: 600,
      },
      {
        url: METADATA.banner,
        width: 1800,
        height: 1600,
        alt: "Og Image Alt",
      },
    ],
    siteName: "GoGoCash",
  },
  twitter: {
    card: "summary_large_image",
    title: METADATA.title,
    description: METADATA.description,
    images: [METADATA.banner],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const messages = await getMessages();

  return (
    <html lang={"en"}>
      <head>
        <meta
          name="facebook-domain-verification"
          content="4tqyqamr33ektym9ra9hs4iivsjfy2"
        />
        <GoogleTagManagerHead />
        <MetaPixel />
      </head>
      <body className={`${dmSans.variable} ${dmSans.className} antialiased`}>
        <GoogleTagManagerNoScript />
        <ProviderDefault>{children}</ProviderDefault>
        <CookieConsent />
      </body>
    </html>
  );
}
