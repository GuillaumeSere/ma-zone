import { NextResponse } from "next/server";
import type { Event } from "../../types/event";

export async function GET(request: Request) {
    const apiKey = process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY;
    const eventbriteToken = process.env.EVENTBRITE_API_TOKEN;

    const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get("countryCode") || "FR";
  const latlong = searchParams.get("latlong") || "48.8566,2.3522";
  const radius = searchParams.get("radius") || "200";
  const size = searchParams.get("size") || "200";
  const locale = searchParams.get("locale") || "fr-fr";
  const eventbritePages = Number(searchParams.get("eventbritePages") || "10");

    const [lat, lng] = latlong.split(",").map((v) => Number(v.trim()));

    const mapTicketmaster = (item: any): Event => ({
        id: item.id,
        title: item.name,
        description: item.info || "",
        image:
            item?.images
                ?.filter((img: any) => img?.url)
                ?.sort((a: any, b: any) => (b?.width || 0) - (a?.width || 0))?.[0]
                ?.url || "",
        date: item.dates?.start?.localDate || "",
        time: item.dates?.start?.localTime || "",
        locationName: item._embedded?.venues?.[0]?.name || "",
        address: item._embedded?.venues?.[0]?.address?.line1 || "",
        city: item._embedded?.venues?.[0]?.city?.name || "",
        latitude: parseFloat(item._embedded?.venues?.[0]?.location?.latitude) || 0,
        longitude: parseFloat(item._embedded?.venues?.[0]?.location?.longitude) || 0,
        price: null,
        category: item.classifications?.[0]?.segment?.name || "",
    });

    const mapEventbrite = (item: any): Event => ({
        id: `eb_${item.id}`,
        title: item?.name?.text || "",
        description: item?.description?.text || "",
        image: item?.logo?.url || "",
        date: (item?.start?.local || "").split("T")[0] || "",
        time: (item?.start?.local || "").split("T")[1]?.slice(0, 5) || "",
        locationName: item?.venue?.name || "",
        address: item?.venue?.address?.address_1 || "",
        city: item?.venue?.address?.city || "",
        latitude: Number(item?.venue?.latitude) || 0,
        longitude: Number(item?.venue?.longitude) || 0,
        price: item?.is_free
            ? 0
            : item?.ticket_classes?.[0]?.cost
                ? item.ticket_classes[0].cost.value / 100
                : null,
        category: item?.category?.name || "",
    });

  const [ticketmasterRes, eventbriteOrgsRes] = await Promise.all([
    apiKey
      ? fetch(
                `https://app.ticketmaster.com/discovery/v2/events.json?${new URLSearchParams(
                    {
                        apikey: apiKey,
                        latlong,
                        radius,
                        size,
                        locale,
                        ...(countryCode && countryCode !== "ALL"
                            ? { countryCode }
                            : {}),
                    }
                ).toString()}`,
                { cache: "no-store" }
            )
            : null,
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
            const data = await ticketmasterRes.json();
            const items = data?._embedded?.events || [];
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
      const data = await eventbriteOrgsRes.json();
      eventbriteOrgId = data?.organizations?.[0]?.id || null;

      if (eventbriteOrgId) {
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= eventbritePages) {
          const orgEventsRes = await fetch(
            `https://www.eventbriteapi.com/v3/organizations/${eventbriteOrgId}/events/?${new URLSearchParams(
              {
                expand: "venue,category",
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
            const orgData = await orgEventsRes.json();
            const items = orgData?.events || [];
            eventbriteEvents = eventbriteEvents.concat(items.map(mapEventbrite));
            hasMore = Boolean(orgData?.pagination?.has_more);
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

  const events = [...ticketmasterEvents, ...eventbriteEvents];

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
