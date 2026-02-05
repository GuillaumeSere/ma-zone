import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const apiKey = process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing Ticketmaster API key" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get("countryCode") || "FR";
  const latlong = searchParams.get("latlong") || "48.8566,2.3522";
  const radius = searchParams.get("radius") || "200";
  const size = searchParams.get("size") || "200";
  const locale = searchParams.get("locale") || "fr-fr";

  const params = new URLSearchParams({
    apikey: apiKey,
    latlong,
    radius,
    size,
    locale,
  });

  if (countryCode && countryCode !== "ALL") {
    params.set("countryCode", countryCode);
  }

  const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "Ticketmaster API error", status: res.status, details: text },
      { status: res.status }
    );
  }

  const data = await res.json();

  return NextResponse.json(data);
}
