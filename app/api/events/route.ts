import { NextResponse } from "next/server";
import type { Event } from "../../types/event";

type NamedNode = {
  id?: string;
  name?: string;
};

type TicketmasterImage = {
  url?: string;
  width?: number;
};

type TicketmasterClassification = {
  segment?: NamedNode;
  genre?: NamedNode;
  subGenre?: NamedNode;
  type?: NamedNode;
  subType?: NamedNode;
};

type TicketmasterEventItem = {
  id?: string;
  name?: string;
  info?: string;
  url?: string;
  images?: TicketmasterImage[];
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
    };
  };
  classifications?: TicketmasterClassification[];
  _embedded?: {
    venues?: Array<{
      name?: string;
      address?: { line1?: string };
      city?: { name?: string };
      location?: { latitude?: string; longitude?: string };
    }>;
  };
};

type EventbriteCost = {
  value?: number;
};

type EventbriteTicketClass = {
  cost?: EventbriteCost;
};

type EventbriteEventItem = {
  id?: string;
  name?: { text?: string };
  description?: { text?: string };
  logo?: { url?: string };
  start?: { local?: string };
  url?: string;
  venue?: {
    name?: string;
    address?: { address_1?: string; city?: string };
    latitude?: string;
    longitude?: string;
  };
  is_free?: boolean;
  ticket_classes?: EventbriteTicketClass[];
  category?: NamedNode;
  format?: NamedNode;
  subcategory?: NamedNode;
};

type TicketmasterEventsResponse = {
  _embedded?: {
    events?: TicketmasterEventItem[];
  };
};

type EventbriteOrganizationsResponse = {
  organizations?: Array<{ id?: string }>;
};

type EventbriteOrgEventsResponse = {
  events?: EventbriteEventItem[];
  pagination?: {
    has_more?: boolean;
  };
};

const KNOWN_VENUE_COORDINATES: Array<{
  terms: string[];
  latitude: number;
  longitude: number;
}> = [
  {
    terms: ["stade de france", "saint denis"],
    latitude: 48.924459,
    longitude: 2.360164,
  },
  {
    terms: ["accor arena", "bercy"],
    latitude: 48.838643,
    longitude: 2.378626,
  },
  {
    terms: ["paris la defense arena"],
    latitude: 48.89584,
    longitude: 2.22929,
  },
];

function normalizeVenueText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function resolveVenueCoordinates(
  locationName: string,
  address: string,
  city: string,
  latitude: number,
  longitude: number
): { latitude: number; longitude: number } {
  const venueText = normalizeVenueText(`${locationName} ${address} ${city}`);
  const knownVenue = KNOWN_VENUE_COORDINATES.find(({ terms }) =>
    terms.some((term) => venueText.includes(normalizeVenueText(term)))
  );

  return knownVenue
    ? { latitude: knownVenue.latitude, longitude: knownVenue.longitude }
    : { latitude, longitude };
}

type TicketmasterClassificationTaxonomyNode = {
  id?: string;
  name?: string;
  _embedded?: {
    genres?: TicketmasterClassificationTaxonomyNode[];
    subgenres?: TicketmasterClassificationTaxonomyNode[];
    types?: TicketmasterClassificationTaxonomyNode[];
    subtypes?: TicketmasterClassificationTaxonomyNode[];
  };
};

type TicketmasterClassificationCatalogItem = {
  segment?: TicketmasterClassificationTaxonomyNode;
  genre?: TicketmasterClassificationTaxonomyNode;
  subGenre?: TicketmasterClassificationTaxonomyNode;
  type?: TicketmasterClassificationTaxonomyNode;
  subType?: TicketmasterClassificationTaxonomyNode;
};

type TicketmasterClassificationsResponse = {
  _embedded?: {
    classifications?: TicketmasterClassificationCatalogItem[];
  };
};

function addTicketmasterClassificationNodeNames(
  namesById: Map<string, string>,
  node?: TicketmasterClassificationTaxonomyNode
) {
  if (!node) return;

  if (node.id && node.name) {
    namesById.set(node.id, node.name);
  }

  node._embedded?.genres?.forEach((genre) =>
    addTicketmasterClassificationNodeNames(namesById, genre)
  );
  node._embedded?.subgenres?.forEach((subgenre) =>
    addTicketmasterClassificationNodeNames(namesById, subgenre)
  );
  node._embedded?.types?.forEach((type) =>
    addTicketmasterClassificationNodeNames(namesById, type)
  );
  node._embedded?.subtypes?.forEach((subtype) =>
    addTicketmasterClassificationNodeNames(namesById, subtype)
  );
}

async function fetchTicketmasterClassificationNames(
  apiKey: string
): Promise<Map<string, string>> {
  const res = await fetch(
    `https://app.ticketmaster.com/discovery/v2/classifications.json?${new URLSearchParams(
      {
        apikey: apiKey,
        size: "200",
      }
    ).toString()}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return new Map();
  }

  const data = (await res.json()) as TicketmasterClassificationsResponse;
  const namesById = new Map<string, string>();

  for (const classification of data._embedded?.classifications || []) {
    addTicketmasterClassificationNodeNames(namesById, classification.segment);
    addTicketmasterClassificationNodeNames(namesById, classification.genre);
    addTicketmasterClassificationNodeNames(namesById, classification.subGenre);
    addTicketmasterClassificationNodeNames(namesById, classification.type);
    addTicketmasterClassificationNodeNames(namesById, classification.subType);
  }

  return namesById;
}

function getTicketmasterCategory(
  item: TicketmasterEventItem,
  classificationNames: Map<string, string>
): string {
  const candidates = (item.classifications || []).flatMap((classification) => [
    classification.segment?.name,
    classification.genre?.name,
    classification.subGenre?.name,
    classification.type?.name,
    classification.subType?.name,
    classification.segment?.id
      ? classificationNames.get(classification.segment.id)
      : undefined,
    classification.genre?.id
      ? classificationNames.get(classification.genre.id)
      : undefined,
    classification.subGenre?.id
      ? classificationNames.get(classification.subGenre.id)
      : undefined,
    classification.type?.id
      ? classificationNames.get(classification.type.id)
      : undefined,
    classification.subType?.id
      ? classificationNames.get(classification.subType.id)
      : undefined,
  ]);

  return (
    candidates.find(
      (value: unknown): value is string =>
        typeof value === "string" &&
        value.trim().length > 0 &&
        value.trim().toLowerCase() !== "undefined"
    ) || ""
  );
}

function getEventbriteCategory(item: EventbriteEventItem): string {
  const candidates = [
    item.category?.name,
    item.format?.name,
    item.subcategory?.name,
  ];

  return candidates.find((value: unknown): value is string => typeof value === "string" && value.trim().length > 0) || "";
}

function normalizeDuplicatePart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function getEventDuplicateKey(event: Event): string {
  const title = normalizeDuplicatePart(event.title);
  const date = normalizeDuplicatePart(event.date);
  const time = normalizeDuplicatePart(event.time).slice(0, 5);
  const place = normalizeDuplicatePart(
    event.city || event.locationName || event.address
  );

  return [title, date, time, place].join("|");
}

function eventCompleteness(event: Event): number {
  return [
    event.description,
    event.image,
    event.url,
    event.locationName,
    event.address,
    event.city,
    event.latitude !== 0 && event.longitude !== 0,
  ].filter(Boolean).length;
}

function deduplicateEvents(events: Event[]): Event[] {
  const unique = new Map<string, Event>();

  for (const event of events) {
    const key = getEventDuplicateKey(event);
    if (!key.replace(/\|/g, "")) continue;

    const current = unique.get(key);
    if (!current || eventCompleteness(event) > eventCompleteness(current)) {
      unique.set(key, event);
    }
  }

  return Array.from(unique.values());
}

export async function GET(request: Request) {
    const apiKey = process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY;
    const eventbriteToken = process.env.EVENTBRITE_API_TOKEN;

    const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get("countryCode") || "FR";
  const latlong = searchParams.get("latlong");
  const radius = searchParams.get("radius");
  const size = searchParams.get("size") || "200";
  const locale = searchParams.get("locale") || "fr-fr";
  const eventbritePages = Number(searchParams.get("eventbritePages") || "10");

  let ticketmasterClassificationNames = new Map<string, string>();

  const mapTicketmaster = (item: TicketmasterEventItem): Event => {
    const venue = item._embedded?.venues?.[0];
    const locationName = venue?.name || "";
    const address = venue?.address?.line1 || "";
    const city = venue?.city?.name || "";
    const coordinates = resolveVenueCoordinates(
      locationName,
      address,
      city,
      parseFloat(venue?.location?.latitude || "") || 0,
      parseFloat(venue?.location?.longitude || "") || 0
    );

    return {
      id: `tm_${item.id}`,
      source: "ticketmaster",
      sourceId: item.id || "",
      title: item.name || "",
      description: item.info || "",
      image:
        item.images
          ?.filter((img): img is TicketmasterImage & { url: string } => typeof img.url === "string" && img.url.length > 0)
          ?.sort((a, b) => (b.width || 0) - (a.width || 0))?.[0]
          ?.url || "",
      date: item.dates?.start?.localDate || "",
      time: item.dates?.start?.localTime || "",
      url: item.url || "",
      locationName,
      address,
      city,
      ...coordinates,
      price: null,
      category: getTicketmasterCategory(item, ticketmasterClassificationNames),
    };
  };

  const mapEventbrite = (item: EventbriteEventItem): Event => {
    const locationName = item.venue?.name || "";
    const address = item.venue?.address?.address_1 || "";
    const city = item.venue?.address?.city || "";
    const coordinates = resolveVenueCoordinates(
      locationName,
      address,
      city,
      Number(item.venue?.latitude) || 0,
      Number(item.venue?.longitude) || 0
    );

    return {
      id: `eb_${item.id}`,
      source: "eventbrite",
      sourceId: item.id || "",
      title: item.name?.text || "",
      description: item.description?.text || "",
      image: item.logo?.url || "",
      date: (item.start?.local || "").split("T")[0] || "",
      time: (item.start?.local || "").split("T")[1]?.slice(0, 5) || "",
      url: item.url || "",
      locationName,
      address,
      city,
      ...coordinates,
      price: item.is_free
        ? 0
        : item.ticket_classes?.[0]?.cost?.value
          ? item.ticket_classes[0].cost.value / 100
          : null,
      category: getEventbriteCategory(item),
    };
  };

  const [ticketmasterRes, ticketmasterClassificationsRes, eventbriteOrgsRes] = await Promise.all([
    apiKey
      ? fetch(
                `https://app.ticketmaster.com/discovery/v2/events.json?${new URLSearchParams(
                    {
                        apikey: apiKey,
                        size,
                        locale,
                        ...(countryCode && countryCode !== "ALL"
                            ? { countryCode }
                            : {}),
                        ...(latlong ? { latlong } : {}),
                        ...(latlong && radius ? { radius } : {}),
                    }
                ).toString()}`,
                { cache: "no-store" }
            )
            : null,
    apiKey ? fetchTicketmasterClassificationNames(apiKey) : null,
    eventbriteToken
      ? fetch("https://www.eventbriteapi.com/v3/users/me/organizations/", {
          cache: "no-store",
          headers: { Authorization: `Bearer ${eventbriteToken}` },
        })
      : null,
  ]);

  const errors: Record<string, unknown> = {};
  let eventbriteOrgId: string | null = null;

  let ticketmasterEvents: Event[] = [];
  if (ticketmasterRes) {
    if (ticketmasterRes.ok) {
            ticketmasterClassificationNames = ticketmasterClassificationsRes || new Map<string, string>();
            const data = (await ticketmasterRes.json()) as TicketmasterEventsResponse;
            const items = data._embedded?.events || [];
            ticketmasterEvents = items.map(mapTicketmaster);
        } else {
            errors.ticketmaster = {
                status: ticketmasterRes.status,
                details: await ticketmasterRes.text(),
            };
        }
  }

  let eventbriteEvents: Event[] = [];
  let eventbritePageFetched = 0;
  let eventbriteHasMore = false;
  if (eventbriteOrgsRes) {
    if (eventbriteOrgsRes.ok) {
      const data = (await eventbriteOrgsRes.json()) as EventbriteOrganizationsResponse;
      eventbriteOrgId = data.organizations?.[0]?.id || null;

      if (eventbriteOrgId) {
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= eventbritePages) {
          const orgEventsRes = await fetch(
            `https://www.eventbriteapi.com/v3/organizations/${eventbriteOrgId}/events/?${new URLSearchParams(
              {
                expand: "venue,category,format,subcategory",
                order_by: "start_asc",
                page_size: size,
                page: String(page),
              }
            ).toString()}`,
            {
              cache: "no-store",
              headers: { Authorization: `Bearer ${eventbriteToken}` },
            }
          );

          if (orgEventsRes.ok) {
            const orgData = (await orgEventsRes.json()) as EventbriteOrgEventsResponse;
            const items = orgData.events || [];
            eventbriteEvents = eventbriteEvents.concat(items.map(mapEventbrite));
            hasMore = Boolean(orgData.pagination?.has_more);
            eventbriteHasMore = hasMore;
            page += 1;
            eventbritePageFetched += 1;
          } else {
            errors.eventbrite = {
              status: orgEventsRes.status,
              details: await orgEventsRes.text(),
            };
            hasMore = false;
          }
        }
      } else {
        errors.eventbrite = { details: "No organization found for token" };
      }
    } else {
      errors.eventbrite = {
        status: eventbriteOrgsRes.status,
        details: await eventbriteOrgsRes.text(),
      };
    }
  }

    if (!apiKey && !eventbriteToken) {
        return NextResponse.json(
            { error: "Missing API keys", details: "Set Ticketmaster or Eventbrite" },
            { status: 500 }
        );
    }

  const events = deduplicateEvents([...ticketmasterEvents, ...eventbriteEvents]);

  return NextResponse.json({
    events,
    counts: {
      total: events.length,
      ticketmaster: ticketmasterEvents.length,
      eventbrite: eventbriteEvents.length,
    },
    sources: {
      ticketmaster: !!apiKey,
      eventbrite: !!eventbriteToken,
    },
    eventbriteOrgId: eventbriteOrgId || undefined,
    eventbriteMeta: eventbriteToken
      ? {
          pagesRequested: eventbritePages,
          pagesFetched: eventbritePageFetched,
          hasMore: eventbriteHasMore,
        }
      : undefined,
    errors: Object.keys(errors).length ? errors : undefined,
  });
}
