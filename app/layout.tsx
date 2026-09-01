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
// Recherche générale
"événements",
"événements en France",
"agenda événements",
"agenda sorties",
"agenda culturel",
"agenda local",
"agenda événementiel",

// Recherche géolocalisée
"événements près de moi",
"événements autour de moi",
"événements à proximité",
"sorties près de moi",
"sorties autour de moi",
"activités près de moi",
"que faire près de moi",
"que faire autour de moi",
"événements dans ma ville",

// Intentions de recherche
"que faire aujourd'hui",
"que faire ce soir",
"que faire ce week-end",
"que faire demain",
"sortir aujourd'hui",
"sortir ce soir",
"sorties ce week-end",
"idées de sorties",
"idées sorties week-end",
"activité aujourd'hui",
"activité ce week-end",

// Événements
"concerts",
"concerts près de moi",
"concerts en France",
"festivals",
"festivals en France",
"expositions",
"expositions près de moi",
"spectacles",
"spectacles près de moi",
"théâtre",
"événements sportifs",
"événements gratuits",
"événements familiaux",
"événements culturels",
"événements musicaux",

// Sorties et loisirs
"sorties",
"sorties culturelles",
"sorties en famille",
"activités",
"activités en famille",
"loisirs",
"activités de loisirs",
"idées de sorties en famille",
"sorties entre amis",
"que faire en France",

// Découverte locale
"sortir en France",
"sorties en France",
"événements locaux",
"animations locales",
"manifestations",
"agenda culturel local",
"agenda des sorties",
"agenda des événements",
"programme sorties",
"programme événements"
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
