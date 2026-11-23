import type { Metadata, Viewport } from "next";
import "./globals.css";
import Preloader from "@/components/ui/preloader";
import SmoothScroll from "@/components/ui/smooth-scroll";
import ClickSpark from "@/components/ui/click-spark";
import CookieConsent from "@/components/CookieConsent";
import AgeVerification from "@/components/AgeVerification";

export const metadata: Metadata = {
  title: {
    default: "Olympique de Beja - Official Website",
    template: "%s | Olympique de Beja",
  },
  description:
    "Official website of Olympique de Beja (OB) - El Lampik, The Storks. Founded 1929 in Beja, Tunisia. Ligue Professionnelle 1.",
  keywords: [
    "Olympique Beja",
    "OB",
    "El Lampik",
    "Storks",
    "football",
    "Tunisia",
    "Beja",
    "Ligue 1",
    "Ligue Professionnelle 1",
  ],
  authors: [{ name: "Olympique de Beja" }],
  creator: "Olympique de Beja",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://olympiquebeja.tn"
  ),
  openGraph: {
    type: "website",
    locale: "fr_TN",
    siteName: "Olympique de Beja",
    title: "Olympique de Beja - Official Website",
    description:
      "Official website of Olympique de Beja - El Lampik, The Storks. Founded 1929.",
    images: [
      {
        url: "/clubs/beja.png",
        width: 512,
        height: 512,
        alt: "Olympique de Beja Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Olympique de Beja - Official Website",
    description:
      "Official website of Olympique de Beja - El Lampik, The Storks.",
    images: ["/clubs/beja.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#C41E3A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon/beja.png" sizes="any" />
        <link rel="canonical" href="https://olympiquebeja.tn" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <Preloader />
        <SmoothScroll />
        <ClickSpark
          sparkColor="#C41E3A"
          sparkSize={10}
          sparkRadius={20}
          sparkCount={10}
          duration={500}
        >
          {children}
          <CookieConsent />
          <AgeVerification />
        </ClickSpark>
      </body>
    </html>
  );
}
