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
default: "Ma Zone | Événements, concerts et sorties près de vous",
template: "%s | Ma Zone",
},

description:
"Trouvez facilement les événements près de chez vous : concerts, festivals, expositions, spectacles, sorties culturelles et activités. Découvrez quoi faire aujourd'hui et ce week-end.",

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

/* =========================
MOTS-CLÉS
========================== */

keywords: [
"événements",
"événements près de moi",
"événements autour de moi",
"sortir aujourd'hui",
"sortir ce soir",
"sorties ce week-end",
"que faire aujourd'hui",
"que faire ce week-end",
"concerts",
"festivals",
"expositions",
"spectacles",
"agenda événements",
"agenda local",
"sorties culturelles",
"activités",
"événements en France",
],

/* =========================
ROBOTS GOOGLE
========================== */

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

/* =========================
OPEN GRAPH
========================== */

openGraph: {
type: "website",

locale: "fr_FR",

url: SITE_URL,

siteName: "Ma Zone",

title:
  "Ma Zone | Trouvez les événements et sorties près de vous",

description:
  "Concerts, festivals, expositions, spectacles et sorties : découvrez facilement les événements autour de vous et partout en France.",

images: [
  {
    url: "/og2-image.png",
    width: 1200,
    height: 630,
    alt: "Ma Zone - Trouvez des événements près de vous",
    type: "image/png",
  },
],

},

/* =========================
TWITTER / X
========================== */

twitter: {
card: "summary_large_image",


title:
  "Ma Zone | Les événements près de vous",

description:
  "Découvrez les concerts, festivals, expositions, spectacles et sorties près de chez vous.",

images: ["/og2-image.png"],


},

/* =========================
ICÔNES
========================== */

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

/* =========================
CANONICAL
========================== */

alternates: {
canonical: SITE_URL,
languages: {
"fr-FR": SITE_URL,
},
},

/* =========================
GOOGLE SEARCH CONSOLE
========================== */

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
