"use client";

import { useEffect, useMemo, useState } from "react";
import MapClient from "./components/Map/MapClient";
import EventList from "./components/EventList";
import { Event } from "./types/event";

const COUNTRY_OPTIONS = [
  { code: "FR", label: "France" },
  { code: "BE", label: "Belgique" },
  { code: "CH", label: "Suisse" },
  { code: "DE", label: "Allemagne" },
  { code: "ES", label: "Espagne" },
  { code: "IT", label: "Italie" },
  { code: "GB", label: "Royaume-Uni" },
  { code: "US", label: "Etats-Unis" },
  { code: "ALL", label: "Monde (ALL)" },
];

function pickBestImage(item: any): string {
  const images = item?.images;
  if (!Array.isArray(images) || images.length === 0) return "";

  const preferred = images
    .filter((img: any) => img?.url)
    .sort((a: any, b: any) => (b?.width || 0) - (a?.width || 0));

  return preferred[0]?.url || "";
}

export default function Home() {
  const [selectedEvent, setSelectedEvent] = useState<{
    lat: number;
    lng: number;
    id: string;
  } | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("FR");
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/events?countryCode=${countryCode}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "API error");
        }

        const items = data?._embedded?.events || [];
        const mapped: Event[] = items.map((item: any) => ({
          id: item.id,
          title: item.name,
          description: item.info || "",
          image: pickBestImage(item),
          date: item.dates?.start?.localDate || "",
          time: item.dates?.start?.localTime || "",
          locationName: item._embedded?.venues?.[0]?.name || "",
          address: item._embedded?.venues?.[0]?.address?.line1 || "",
          city: item._embedded?.venues?.[0]?.city?.name || "",
          latitude:
            parseFloat(item._embedded?.venues?.[0]?.location?.latitude) || 0,
          longitude:
            parseFloat(item._embedded?.venues?.[0]?.location?.longitude) || 0,
          price: null,
          category: item.classifications?.[0]?.segment?.name || "",
        }));

        if (!cancelled) setEvents(mapped);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Erreur inconnue");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  const categories = useMemo(() => {
    const values = Array.from(
      new Set(events.map((e) => e.category).filter(Boolean))
    );
    return ["ALL", ...values.sort()];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (q) {
        const hay = [
          e.title,
          e.locationName,
          e.city,
          e.category,
          e.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (category !== "ALL" && e.category !== category) return false;

      if (freeOnly && e.price !== null && e.price !== 0) return false;

      if (dateFrom && e.date && e.date < dateFrom) return false;
      if (dateTo && e.date && e.date > dateTo) return false;

      return true;
    });
  }, [events, query, category, freeOnly, dateFrom, dateTo]);

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent({
      id: event.id,
      lat: event.latitude,
      lng: event.longitude,
    });

    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        document.getElementById("map-section")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    }
  };

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-linear-to-r from-rose-500 via-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/30">
        <div className="mx-auto max-w-6xl px-6 py-2 flex gap-4 md:flex-row md:items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-3xl bg-black/65 ring-1 ring-white/30 backdrop-blur" />
            <div className="leading-tight">
              <h1 className="text-2xl font-black tracking-tight">MaZone</h1>
              <p className="text-xs text-white/80">Evenements pres de vous</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/30">
              Decouverte locale
            </span>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-gray-900 shadow-md shadow-black/20 transition hover:-translate-y-0.5"
            >
              Filtres
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 pb-4">
          <div
            className={[
              "grid gap-3 rounded-2xl bg-white/95 p-4 text-gray-900 ring-1 ring-black/10 shadow-sm",
              showFilters ? "grid-cols-1 md:grid-cols-3 lg:grid-cols-5" : "hidden",
            ].join(" ")}
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">
                Recherche
              </label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Concert, festival..."
                className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Pays</label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                {COUNTRY_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">
                Categorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "ALL" ? "Toutes" : c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">
                Du
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">
                Au
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={freeOnly}
                onChange={(e) => setFreeOnly(e.target.checked)}
                className="h-4 w-4 rounded border-black/20"
              />
              Gratuit uniquement
            </label>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-6 space-y-10">
        <div className="rounded-3xl bg-linear-to-br from-orange-50 via-rose-50 to-amber-50 p-6 ring-1 ring-black/5">
          <h2 className="text-3xl font-black text-gray-900">
            Evenements autour de moi
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Trouvez les meilleures sorties, concerts et festivals en un clic.
          </p>
        </div>

      <div id="map-section">
        <MapClient selectedEvent={selectedEvent} events={filteredEvents} />
      </div>

        <EventList
          onSelectEvent={handleSelectEvent}
          selectedEventId={selectedEvent?.id ?? null}
          events={filteredEvents}
          loading={loading}
          error={error}
        />
      </div>
    </main>
  );
}
