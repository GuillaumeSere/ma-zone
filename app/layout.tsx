import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";

const SITE_URL = "https://ma-zone-evenement.netlify.app";

const geistSans = Geist({
variable: "--font-geist-sans",
subsets: ["latin"],
display: "swap",
});

const geistMono = Geist_Mono({
variable: "--font-geist-mono",
subsets: ["latin"],
display: "swap",
});

/* =========================
VIEWPORT
========================= */

export const viewport: Viewport = {
width: "device-width",
initialScale: 1,
themeColor: "#111827",
};

/* =========================
SEO PRINCIPAL
========================= */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default:
      "Événements près de moi : concerts, sorties et activités | Ma Zone",
    template: "%s | Ma Zone",
  },

  description:
    "Trouvez les événements près de chez vous : concerts, festivals, spectacles, expositions, activités et sorties à faire aujourd'hui ou ce week-end. Localisez les événements autour de vous, consultez l'itinéraire et réservez vos billets.",

  applicationName: "Ma Zone",

  authors: [
    {
      name: "Guillaume SERE",
      url: "https://guillaume-sere.netlify.app/",
    },
  ],

  creator: "Guillaume SERE",
  publisher: "Ma Zone",

  category: "events",

  keywords: [
    "événements près de moi",
    "événements autour de moi",
    "événements à proximité",
    "événements aujourd'hui",
    "événements ce soir",
    "événements ce week-end",

    "concerts près de moi",
    "concerts autour de moi",
    "concerts aujourd'hui",
    "concerts ce soir",
    "concerts ce week-end",

    "sorties près de moi",
    "sorties autour de moi",
    "sorties aujourd'hui",
    "sorties ce soir",
    "sorties ce week-end",

    "que faire près de moi",
    "que faire autour de moi",
    "que faire aujourd'hui",
    "que faire ce soir",
    "que faire ce week-end",

    "activité près de moi",
    "activités près de moi",
    "activités autour de moi",

    "agenda des événements",
    "agenda des sorties",
    "agenda culturel",
    "agenda local",
    "agenda événementiel",

    "festivals",
    "festivals près de moi",
    "expositions",
    "expositions près de moi",
    "spectacles",
    "spectacles près de moi",
    "théâtre",
    "événements sportifs",
    "événements gratuits",
    "événements familiaux",
    "sorties en famille",

    "réserver des billets",
    "billets concerts",
    "billets spectacles",
    "billetterie événements",

    "itinéraire événement",
    "lieux événements",
    "événements en France",
    "sorties en France",
  ],

  robots: {
    index: true,
    follow: true,
    nocache: false,

    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "Ma Zone",

    title:
      "Événements près de moi : concerts, sorties et activités | Ma Zone",

    description:
      "Découvrez les concerts, festivals, spectacles, expositions et sorties autour de vous. Trouvez quoi faire aujourd'hui ou ce week-end, obtenez l'itinéraire et réservez vos billets.",

    images: [
      {
        url: "/og2-image.png",
        width: 1200,
        height: 630,
        alt:
          "Ma Zone - Événements, concerts et sorties près de chez vous",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title:
      "Événements près de moi : concerts, sorties et activités | Ma Zone",

    description:
      "Trouvez les événements, concerts, spectacles et sorties autour de vous.",

    images: ["/og2-image.png"],
  },

  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
    ],

    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },

  alternates: {
    canonical: SITE_URL,

    languages: {
      "fr-FR": SITE_URL,
    },
  },

  verification: {
    google:
      "hGMCr1W6D99RGbRgZ1WGKJuTdw_Mmqq7rlSObwX_1Ic",
  },
};

/* =========================
LAYOUT
========================= */

export default function RootLayout({
children,
}: Readonly<{
children: React.ReactNode;
}>) {
return ( <html lang="fr">
<body
className={`${geistSans.variable} ${geistMono.variable} antialiased`}
> <SiteHeader />

    <main>{children}</main>

    <SiteFooter />
  </body>
</html>


);
}
