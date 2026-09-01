import type { MetadataRoute } from "next";

const SITE_URL = "https://ma-zone-evenement.netlify.app";

type SitemapEvent = {
id: string;
source: "ticketmaster" | "eventbrite";
sourceId?: string;
date?: string;
};

type EventsResponse = {
events?: SitemapEvent[];
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
const lastModified = new Date();

const staticPages: MetadataRoute.Sitemap = [
{
url: SITE_URL,
lastModified,
changeFrequency: "daily",
priority: 1,
},
];

try {
const response = await fetch(`${SITE_URL}/api/events`, {
next: {
revalidate: 3600,
},
});

if (!response.ok) {
  console.error(
    `Impossible de récupérer les événements pour le sitemap: ${response.status}`
  );

  return staticPages;
}

const data = (await response.json()) as EventsResponse;

const eventUrls: MetadataRoute.Sitemap = (data.events || [])
  .filter(
    (event) =>
      event.id &&
      (event.source === "ticketmaster" ||
        event.source === "eventbrite")
  )
  .map((event) => {
    const id = event.sourceId || event.id.replace(/^(tm_|eb_)/, "");

    return {
      url: `${SITE_URL}/event/${event.source}/${id}`,
      lastModified: event.date
        ? new Date(event.date)
        : lastModified,
      changeFrequency: "daily" as const,
      priority: 0.7,
    };
  });

return [...staticPages, ...eventUrls];

} catch (error) {
console.error("Erreur lors de la génération du sitemap :", error);

return staticPages;

}
}
