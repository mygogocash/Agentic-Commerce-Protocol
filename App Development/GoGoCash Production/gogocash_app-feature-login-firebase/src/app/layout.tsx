import type { Metadata } from "next";
import "./globals.css";
import AnalyticsBootstrap from "@/components/analytics/AnalyticsBootstrap";
import ProviderDefault from "@/providers/ProviderDefault";
import { METADATA } from "@/constants/Metadata";
import { dmSans } from "@/lib/utils";

export const metadata: Metadata = {
  title: METADATA.title,
  description: METADATA.description,
  icons: {
    icon: METADATA.icon,
    apple: METADATA.icon,
    other: [
      { rel: "apple-touch-icon", url: METADATA.icon },
      { rel: "shortcut icon", url: METADATA.icon },
    ],
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
        <AnalyticsBootstrap />
        <meta
          name="facebook-domain-verification"
          content="4tqyqamr33ektym9ra9hs4iivsjfy2"
        />
      </head>
      <body className={`${dmSans.variable} ${dmSans.className} antialiased`}>
        <ProviderDefault>{children}</ProviderDefault>
      </body>
    </html>
  );
}
