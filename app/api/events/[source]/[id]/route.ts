import { NextResponse } from "next/server";

type Source = "ticketmaster" | "eventbrite";

function normalizeTicketmaster(item: any) {
  const images = Array.isArray(item?.images)
    ? item.images
        .filter((img: any) => img?.url)
        .sort((a: any, b: any) => (b?.width || 0) - (a?.width || 0))
    : [];

  return {
    source: "ticketmaster",
    sourceId: item?.id || "",
    title: item?.name || "",
    description: item?.info || item?.pleaseNote || "",
    url: item?.url || "",
    images: images.map((img: any) => img.url),
    date: item?.dates?.start?.localDate || "",
    time: item?.dates?.start?.localTime || "",
    status: item?.dates?.status?.code || "",
    timezone: item?.dates?.timezone || "",
    priceRanges: item?.priceRanges || [],
    ticketLimit: item?.ticketLimit || null,
    ageRestrictions: item?.ageRestrictions || null,
    classifications: item?.classifications || [],
    venue: item?._embedded?.venues?.[0] || null,
    promoter: item?.promoter || null,
    seatmap: item?.seatmap || null,
    accessibility: item?.accessibility || null,
  };
}

function normalizeEventbrite(item: any) {
  return {
    source: "eventbrite",
    sourceId: item?.id || "",
    title: item?.name?.text || "",
    description: item?.description?.text || "",
    url: item?.url || "",
    images: item?.logo?.url ? [item.logo.url] : [],
    date: (item?.start?.local || "").split("T")[0] || "",
    time: (item?.start?.local || "").split("T")[1]?.slice(0, 5) || "",
    status: item?.status || "",
    timezone: item?.start?.timezone || "",
    isFree: item?.is_free ?? null,
    capacity: item?.capacity ?? null,
    category: item?.category || null,
    organizer: item?.organizer || null,
    venue: item?.venue || null,
    ticketAvailability: item?.ticket_availability || null,
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

    const data = await res.json();
    return NextResponse.json({
      source,
      detail: normalizeTicketmaster(data),
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

  const data = await res.json();
  return NextResponse.json({
    source,
    detail: normalizeEventbrite(data),
    raw: data,
  });
}
