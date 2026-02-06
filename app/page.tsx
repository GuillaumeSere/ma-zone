"use client";

import { useEffect, useMemo, useState } from "react";
import MapClient from "./components/Map/MapClient";
import EventList from "./components/EventList";
import { Event } from "./types/event";
import { formatFrenchDateTime } from "./lib/date";

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
    const [eventbriteOrgId, setEventbriteOrgId] = useState<string | null>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [countryCode, setCountryCode] = useState("FR");
    const [showFilters, setShowFilters] = useState(false);
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("ALL");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [freeOnly, setFreeOnly] = useState(false);
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
    const [latlong, setLatlong] = useState<string | null>(null);
    const [geoError, setGeoError] = useState<string | null>(null);

    const FAVORITES_KEY = "ma-zone:favorites";

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = window.localStorage.getItem(FAVORITES_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    setFavoriteIds(new Set(parsed.filter((v) => typeof v === "string")));
                }
            }
        } catch {
            setFavoriteIds(new Set());
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const onStorage = (e: StorageEvent) => {
            if (e.key !== FAVORITES_KEY) return;
            try {
                const parsed = e.newValue ? JSON.parse(e.newValue) : [];
                if (Array.isArray(parsed)) {
                    setFavoriteIds(new Set(parsed.filter((v) => typeof v === "string")));
                }
            } catch {
                setFavoriteIds(new Set());
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const persistFavorites = (next: Set<string>) => {
        if (typeof window === "undefined") return;
        const arr = Array.from(next);
        window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(arr));
    };

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const params = new URLSearchParams({ countryCode });
                if (latlong) {
                    params.set("latlong", latlong);
                    params.set("radius", "200");
                }
                const res = await fetch(`/api/events?${params.toString()}`);
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data?.error || "API error");
                }

                if (Array.isArray(data?.events)) {
                    if (!cancelled) {
                        setEvents(data.events as Event[]);
                        setEventbriteOrgId(data?.eventbriteOrgId || null);
                    }
                    return;
                }

                const items = data?._embedded?.events || [];
                const mapped: Event[] = items.map((item: any) => ({
                    id: `tm_${item.id}`,
                    source: "ticketmaster",
                    sourceId: item.id,
                    title: item.name,
                    description: item.info || "",
                    image: pickBestImage(item),
                    date: item.dates?.start?.localDate || "",
                    time: item.dates?.start?.localTime || "",
                    url: item?.url || "",
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

                if (!cancelled) {
                    setEvents(mapped);
                }
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
    }, [countryCode, latlong]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!("geolocation" in navigator)) {
            setGeoError("Geolocation non supportee par votre navigateur.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const next = `${pos.coords.latitude},${pos.coords.longitude}`;
                setLatlong(next);
                setGeoError(null);
            },
            (err) => {
                setGeoError(err?.message || "Geolocation indisponible.");
            },
            {
                enableHighAccuracy: false,
                timeout: 8000,
                maximumAge: 300000,
            }
        );
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!events.length) return;

        try {
            for (const event of events) {
                const cacheKey = `ma-zone:event:${event.source}:${event.sourceId}`;
                window.localStorage.setItem(cacheKey, JSON.stringify(event));
            }
        } catch {
            // ignore storage failures
        }
    }, [events]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const onScroll = () => {
            setShowScrollTop(window.scrollY > 120);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

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

    const favoriteEvents = useMemo(() => {
        if (!favoriteIds.size) return [];
        return events.filter((e) => favoriteIds.has(e.id));
    }, [events, favoriteIds]);

    const handleToggleFavorite = (event: Event) => {
        setFavoriteIds((prev) => {
            const next = new Set(prev);
            if (next.has(event.id)) {
                next.delete(event.id);
            } else {
                next.add(event.id);
            }
            persistFavorites(next);
            return next;
        });
    };

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
            <div className="mx-auto max-w-6xl p-6 space-y-10">
                <div className="rounded-3xl bg-linear-to-br from-orange-50 via-rose-50 to-amber-50 p-6 ring-1 ring-black/5">
                    <h2 className="text-xl md:text-3xl font-black text-gray-900">
                        Evenements autour de moi
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Trouvez les meilleures sorties, concerts et festivals en un clic.
                    </p>
                </div>
                <div className="rounded-2xl bg-white/95 p-4 text-gray-900 ring-1 ring-black/10 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setShowFilters((v) => !v)}
                            className="h-10 rounded-xl bg-black/90 px-4 text-sm font-semibold text-white shadow-md shadow-black/20 transition hover:-translate-y-0.5"
                        >
                            Filtres
                        </button>
                        {eventbriteOrgId ? (
                            <span className="rounded-full bg-black/10 px-3 py-1 text-xs font-semibold text-gray-700">
                                Eventbrite org: {eventbriteOrgId}
                            </span>
                        ) : null}
                    </div>
                    {geoError ? (
                        <div className="mt-3 rounded-xl border border-black/10 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                            {geoError} Les evenements affiches ne sont pas filtres par
                            proximite.
                        </div>
                    ) : null}

                    <div
                        className={[
                            "mt-4 grid gap-3",
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
                            <label className="text-xs font-semibold text-gray-600">Du</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-600">Au</label>
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
                <div id="map-section">
                    <MapClient selectedEvent={selectedEvent} events={filteredEvents} />
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_clamp(220px,24vw,280px)]">
                    <section className="lg:hidden rounded-2xl bg-white/90 p-4 shadow-lg shadow-black/10 ring-1 ring-black/5 backdrop-blur">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">
                                Favoris
                            </h3>
                            <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-semibold text-gray-800">
                                {favoriteEvents.length}
                            </span>
                        </div>

                        {favoriteEvents.length === 0 ? (
                            <p className="mt-4 text-xs text-gray-500">
                                Ajoute une etoile pour retrouver tes evenements ici.
                            </p>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {favoriteEvents.map((event) => (
                                    <button
                                        key={event.id}
                                        type="button"
                                        onClick={() => handleSelectEvent(event)}
                                        className="w-full min-w-0 overflow-hidden rounded-xl border border-black/5 bg-linear-to-br from-white via-rose-50 to-amber-50 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="h-12 w-12 flex-none overflow-hidden rounded-lg bg-black/5">
                                                {event.image ? (
                                                    <img
                                                        src={event.image}
                                                        alt={event.title}
                                                        className="h-full w-full object-cover"
                                                        loading="lazy"
                                                    />
                                                ) : null}
                                            </div>
                                            <div className="min-w-0">
                                                <p
                                                    className="text-sm font-semibold text-gray-900"
                                                    style={{
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: "vertical",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    {event.title}
                                                </p>
                                                <p className="mt-1 truncate text-xs text-gray-500">
                                                    Le {formatFrenchDateTime(event.date, event.time)}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    <div>
                        <EventList
                            onSelectEvent={handleSelectEvent}
                            selectedEventId={selectedEvent?.id ?? null}
                            events={filteredEvents}
                            loading={loading}
                            error={error}
                            favoriteIds={favoriteIds}
                            onToggleFavorite={handleToggleFavorite}
                        />
                    </div>

                    <aside className="hidden lg:block w-full min-w-0">
                        <div className="sticky top-24 rounded-2xl bg-white/90 p-4 shadow-lg shadow-black/10 ring-1 ring-black/5 backdrop-blur">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">
                                    Favoris
                                </h3>
                                <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-semibold text-gray-800">
                                    {favoriteEvents.length}
                                </span>
                            </div>

                            {favoriteEvents.length === 0 ? (
                                <p className="mt-4 text-xs text-gray-500">
                                    Ajoute une etoile pour retrouver tes evenements ici.
                                </p>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    {favoriteEvents.map((event) => (
                                        <button
                                            key={event.id}
                                            type="button"
                                            onClick={() => handleSelectEvent(event)}
                                            className="w-full min-w-0 overflow-hidden rounded-xl border border-black/5 bg-linear-to-br from-white via-rose-50 to-amber-50 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="h-12 w-12 flex-none overflow-hidden rounded-lg bg-black/5">
                                                    {event.image ? (
                                                        <img
                                                            src={event.image}
                                                            alt={event.title}
                                                            className="h-full w-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    ) : null}
                                                </div>
                                                <div className="min-w-0">
                                                    <p
                                                        className="text-sm font-semibold text-gray-900"
                                                        style={{
                                                            display: "-webkit-box",
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: "vertical",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        {event.title}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Le {formatFrenchDateTime(event.date, event.time)}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>

            {showScrollTop ? (
                <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-black/80 text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5"
                    aria-label="Remonter en haut"
                >
                    <span className="text-lg leading-none">↑</span>
                </button>
            ) : null}
        </main>
    );
}
