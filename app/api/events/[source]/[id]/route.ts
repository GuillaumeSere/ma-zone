import { NextResponse } from "next/server";
import type { Event } from "../../../../types/event";

type Source = "ticketmaster" | "eventbrite";

type TicketmasterImage = {
  url?: string;
  width?: number;
};

type TicketmasterDetail = {
  id?: string;
  name?: string;
  info?: string;
  pleaseNote?: string;
  url?: string;
  images?: TicketmasterImage[];
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
    };
    status?: {
      code?: string;
    };
    timezone?: string;
  };
  priceRanges?: unknown[];
  ticketLimit?: unknown;
  ageRestrictions?: unknown;
  classifications?: unknown[];
  promoter?: unknown;
  seatmap?: unknown;
  accessibility?: unknown;
  _embedded?: {
    attractions?: Array<{ name?: string }>;
    venues?: unknown[];
  };
};

type EventbriteDetail = {
  id?: string;
  name?: { text?: string };
  description?: { text?: string };
  url?: string;
  logo?: { url?: string };
  start?: { local?: string; timezone?: string };
  status?: string;
  is_free?: boolean | null;
  capacity?: number | null;
  category?: unknown;
  organizer?: unknown;
  venue?: unknown;
  ticket_availability?: unknown;
};

type ArtistInfo = {
  name: string;
  extract: string;
  url: string;
  image?: string;
  source: "Wikipédia";
} | null;

async function findArtistInfo(query: string): Promise<ArtistInfo> {
  const normalizedQuery = query.replace(/\s+/g, " ").trim();
  if (!normalizedQuery) return null;

  try {
    const searchResponse = await fetch(
      `https://fr.wikipedia.org/w/api.php?${new URLSearchParams({
        action: "query",
        list: "search",
        srsearch: normalizedQuery,
        srlimit: "1",
        format: "json",
        origin: "*",
      }).toString()}`,
      {
        cache: "no-store",
        headers: { "User-Agent": "ma-zone-events/1.0 (event discovery)" },
      }
    );
    if (!searchResponse.ok) return null;

    const searchData = (await searchResponse.json()) as {
      query?: { search?: Array<{ title?: string }> };
    };
    const title = searchData.query?.search?.[0]?.title;
    if (!title) return null;

    const summaryResponse = await fetch(
      `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      {
        cache: "no-store",
        headers: { "User-Agent": "ma-zone-events/1.0 (event discovery)" },
      }
    );
    if (!summaryResponse.ok) return null;

    const summary = (await summaryResponse.json()) as {
      title?: string;
      extract?: string;
      thumbnail?: { source?: string };
      content_urls?: { desktop?: { page?: string } };
    };
    if (!summary.extract) return null;

    return {
      name: summary.title || title,
      extract: summary.extract,
      url:
        summary.content_urls?.desktop?.page ||
        `https://fr.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      image: summary.thumbnail?.source,
      source: "Wikipédia",
    };
  } catch {
    return null;
  }
}

function normalizeTicketmaster(item: TicketmasterDetail) {
  const images = Array.isArray(item.images)
    ? item.images
        .filter((img): img is TicketmasterImage & { url: string } => typeof img.url === "string" && img.url.length > 0)
        .sort((a, b) => (b.width || 0) - (a.width || 0))
    : [];

  return {
    source: "ticketmaster",
    sourceId: item.id || "",
    title: item.name || "",
    description: item.info || item.pleaseNote || "",
    url: item.url || "",
    images: images.map((img) => img.url),
    date: item.dates?.start?.localDate || "",
    time: item.dates?.start?.localTime || "",
    status: item.dates?.status?.code || "",
    timezone: item.dates?.timezone || "",
    priceRanges: item.priceRanges || [],
    ticketLimit: item.ticketLimit || null,
    ageRestrictions: item.ageRestrictions || null,
    classifications: item.classifications || [],
    venue: item._embedded?.venues?.[0] || null,
    promoter: item.promoter || null,
    seatmap: item.seatmap || null,
    accessibility: item.accessibility || null,
    artistNames: (item._embedded?.attractions || [])
      .map((attraction) => attraction.name || "")
      .filter(Boolean),
  };
}

function normalizeEventbrite(item: EventbriteDetail) {
  return {
    source: "eventbrite",
    sourceId: item.id || "",
    title: item.name?.text || "",
    description: item.description?.text || "",
    url: item.url || "",
    images: item.logo?.url ? [item.logo.url] : [],
    date: (item.start?.local || "").split("T")[0] || "",
    time: (item.start?.local || "").split("T")[1]?.slice(0, 5) || "",
    status: item.status || "",
    timezone: item.start?.timezone || "",
    isFree: item.is_free ?? null,
    capacity: item.capacity ?? null,
    category: item.category || null,
    organizer: item.organizer || null,
    venue: item.venue || null,
    ticketAvailability: item.ticket_availability || null,
  };
}

function toEvent(source: Source, detail: ReturnType<typeof normalizeTicketmaster> | ReturnType<typeof normalizeEventbrite>): Event {
  const venue = detail.venue as {
    name?: string;
    address?: { line1?: string; address_1?: string; city?: string };
    city?: { name?: string };
    location?: { latitude?: string; longitude?: string };
    latitude?: string;
    longitude?: string;
  } | null;
  const isFree = "isFree" in detail ? detail.isFree : null;
  const category = "category" in detail && typeof detail.category === "string"
    ? detail.category
    : "";

  return {
    id: `${source === "eventbrite" ? "eb" : "tm"}_${detail.sourceId}`,
    source,
    sourceId: detail.sourceId,
    title: detail.title,
    description: detail.description,
    image: detail.images?.[0] || "",
    url: detail.url,
    date: detail.date || "",
    time: detail.time || "",
    locationName: venue?.name || "",
    address: venue?.address?.line1 || venue?.address?.address_1 || "",
    city: venue?.city?.name || venue?.address?.city || "",
    latitude: Number(venue?.location?.latitude || venue?.latitude) || 0,
    longitude: Number(venue?.location?.longitude || venue?.longitude) || 0,
    price: isFree === true ? 0 : null,
    category,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ source: string; id: string }> }
) {
  const resolvedParams = await params;
  const rawSource = resolvedParams.source;
  const source =
    rawSource === "tm"
      ? "ticketmaster"
      : rawSource === "eb"
      ? "eventbrite"
      : (rawSource as Source);
  const { id } = resolvedParams;

  if (source !== "ticketmaster" && source !== "eventbrite") {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  if (source === "ticketmaster") {
    const apiKey = process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Ticketmaster API key" },
        { status: 500 }
      );
    }

    const res = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events/${id}.json?apikey=${apiKey}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: "Ticketmaster API error", status: res.status, details: text },
        { status: res.status }
      );
    }

    const data = (await res.json()) as TicketmasterDetail;
    const detail = normalizeTicketmaster(data);
    const artistQuery = detail.artistNames[0] || detail.title;
    const artistInfo = await findArtistInfo(artistQuery);
    const event = toEvent(source, detail);
    if (!event.description && artistInfo) event.description = artistInfo.extract;
    return NextResponse.json({
      source,
      detail,
      event,
      artistNames: detail.artistNames,
      artistInfo,
      raw: data,
    });
  }

  const eventbriteToken = process.env.EVENTBRITE_API_TOKEN;
  if (!eventbriteToken) {
    return NextResponse.json(
      { error: "Missing Eventbrite API token" },
      { status: 500 }
    );
  }

  const res = await fetch(
    `https://www.eventbriteapi.com/v3/events/${id}/?${new URLSearchParams({
      expand: "venue,category,organizer,ticket_availability",
    }).toString()}`,
    {
      cache: "no-store",
      headers: { Authorization: `Bearer ${eventbriteToken}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "Eventbrite API error", status: res.status, details: text },
      { status: res.status }
    );
  }

  const data = (await res.json()) as EventbriteDetail;
  const detail = normalizeEventbrite(data);
  const organizerName =
    detail.organizer && typeof detail.organizer === "object" && "name" in detail.organizer
      ? String((detail.organizer as { name?: unknown }).name || "")
      : "";
  const artistInfo = await findArtistInfo(organizerName || detail.title);
  const event = toEvent(source, detail);
  if (!event.description && artistInfo) event.description = artistInfo.extract;
  return NextResponse.json({
    source,
    detail,
    event,
    artistNames: organizerName ? [organizerName] : [],
    artistInfo,
    raw: data,
  });
}
