import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ma-zone-60.vercel.app/"), 

  title: {
    default: "Ma Zone – Événements près de vous et dans le monde",
    template: "%s | Ma Zone",
  },

  description:
    "Découvrez les concerts, festivals, expositions, sorties et événements près de vous. Ma Zone vous aide à trouver quoi faire autour de vous et partout dans le monde.",

  keywords: [
    "événements",
    "sortir ce soir",
    "concerts",
    "festivals",
    "expositions",
    "événements près de moi",
    "agenda local",
    "que faire ce week-end",
    "sorties culturelles",
  ],

  authors: [{ name: "Ma Zone" }],
  creator: "Ma Zone",
  publisher: "Ma Zone",

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: "Ma Zone – Trouvez les meilleurs événements autour de vous",
    description:
      "Concerts, festivals, expositions, food events et plus encore. Explorez les événements près de vous grâce à Ma Zone.",
    url: "https://ma-zone-60.vercel.app/",
    siteName: "Ma Zone",
    images: [
      {
        url: "/og2-image.png",
        width: 1200,
        height: 630,
        alt: "Ma Zone - Plateforme d'événements",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Ma Zone – Les événements près de vous",
    description:
      "Trouvez facilement des événements autour de vous : concerts, festivals, expos et plus.",
    images: ["/og-image.png"],
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  category: "events",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
