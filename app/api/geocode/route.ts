import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  const parts = query.split(",").map((part) => part.trim()).filter(Boolean);
  const candidates = Array.from(
    new Set([
      query,
      query.replace(/\s*\/\s*/g, ", "),
      query.replace(/\s*\/\s*[^,]+$/, ""),
      parts.slice(1).join(", "),
      parts.slice(-1).join(", ").split("/")[0].trim(),
    ])
  );

  for (const candidate of candidates) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
        q: candidate,
        format: "jsonv2",
        limit: "1",
      }).toString()}`,
      {
        cache: "no-store",
        headers: { "User-Agent": "ma-zone-events/1.0" },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
    }

    const results = (await response.json()) as Array<{ lat?: string; lon?: string }>;
    const latitude = Number(results[0]?.lat);
    const longitude = Number(results[0]?.lon);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return NextResponse.json({ latitude, longitude, matchedQuery: candidate });
    }
  }

  return NextResponse.json({ error: "Address not found" }, { status: 404 });
}