"use client";

import Image from "next/image";
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

type TicketmasterImage = {
    url?: string;
    width?: number;
};

type TicketmasterClassification = {
    segment?: { name?: string };
    genre?: { name?: string };
    subGenre?: { name?: string };
    type?: { name?: string };
    subType?: { name?: string };
};

type TicketmasterFallbackItem = {
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

type ApiEventsResponse = {
    events?: Event[];
    eventbriteOrgId?: string | null;
    _embedded?: {
        events?: TicketmasterFallbackItem[];
    };
    error?: string;
};

function pickBestImage(item: TicketmasterFallbackItem): string {
    const images = item.images;
    if (!Array.isArray(images) || images.length === 0) return "";

    const preferred = images
        .filter(
            (img): img is TicketmasterImage & { url: string } =>
                typeof img.url === "string" && img.url.length > 0
        )
        .sort((a, b) => (b.width || 0) - (a.width || 0));

    return preferred[0]?.url || "";
}

function getTicketmasterCategory(item: TicketmasterFallbackItem): string {
    const candidates = (item.classifications || []).flatMap((classification) => [
        classification?.genre?.name,
        classification?.subGenre?.name,
        classification?.segment?.name,
        classification?.type?.name,
        classification?.subType?.name,
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
    const [geoFallbackMessage, setGeoFallbackMessage] = useState<string | null>(null);

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

        const fetchEvents = async (useGeolocation: boolean) => {
            const params = new URLSearchParams({ countryCode });
            if (useGeolocation && latlong) {
                params.set("latlong", latlong);
                params.set("radius", "200");
            }

            const res = await fetch(`/api/events?${params.toString()}`);
            const data = (await res.json()) as ApiEventsResponse;

            if (!res.ok) {
                throw new Error(data.error || "API error");
            }

            if (Array.isArray(data.events)) {
                return {
                    events: data.events,
                    eventbriteOrgId: data.eventbriteOrgId || null,
                };
            }

            const items = data._embedded?.events || [];
            const mapped: Event[] = items.map((item) => ({
                id: `tm_${item.id}`,
                source: "ticketmaster",
                sourceId: item.id || "",
                title: item.name || "",
                description: item.info || "",
                image: pickBestImage(item),
                date: item.dates?.start?.localDate || "",
                time: item.dates?.start?.localTime || "",
                url: item.url || "",
                locationName: item._embedded?.venues?.[0]?.name || "",
                address: item._embedded?.venues?.[0]?.address?.line1 || "",
                city: item._embedded?.venues?.[0]?.city?.name || "",
                latitude:
                    parseFloat(item._embedded?.venues?.[0]?.location?.latitude || "") || 0,
                longitude:
                    parseFloat(item._embedded?.venues?.[0]?.location?.longitude || "") || 0,
                price: null,
                category: getTicketmasterCategory(item),
            }));

            return {
                events: mapped,
                eventbriteOrgId: null,
            };
        };

        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                setGeoFallbackMessage(null);

                if (!cancelled) {
                    const nearEvents = await fetchEvents(Boolean(latlong));
                    let nextEvents = nearEvents.events;
                    let nextEventbriteOrgId = nearEvents.eventbriteOrgId;
                    let nextGeoFallbackMessage: string | null = null;

                    if (latlong && nearEvents.events.length === 0) {
                        const fallbackEvents = await fetchEvents(false);
                        nextEvents = fallbackEvents.events;
                        nextEventbriteOrgId = fallbackEvents.eventbriteOrgId;
                        nextGeoFallbackMessage =
                            "Aucun evenement n'a ete trouve autour de vous. Affichage des resultats correspondant aux filtres sans contrainte de proximite.";
                    }

                    if (cancelled) return;

                    setEvents(nextEvents);
                    setEventbriteOrgId(nextEventbriteOrgId);
                    setGeoFallbackMessage(nextGeoFallbackMessage);
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Erreur inconnue";
                if (!cancelled) setError(message);
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
                setGeoError(err.message || "Geolocation indisponible.");
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

    useEffect(() => {
        if (!categories.includes(category)) {
            setCategory("ALL");
        }
    }, [categories, category]);

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

    const activeFilterCount = useMemo(
        () =>
            [
                countryCode !== "FR",
                category !== "ALL",
                Boolean(dateFrom),
                Boolean(dateTo),
                freeOnly,
            ].filter(Boolean).length,
        [category, countryCode, dateFrom, dateTo, freeOnly]
    );

    const resetFilters = () => {
        setQuery("");
        setCountryCode("FR");
        setCategory("ALL");
        setDateFrom("");
        setDateTo("");
        setFreeOnly(false);
    };

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

    const renderFavoriteItem = (event: Event) => (
        <div
            key={event.id}
            className="group relative min-w-0 overflow-hidden rounded-2xl border border-black/5 bg-white p-3 text-left shadow-sm transition hover:border-orange-200 hover:shadow-md"
        >
            <button
                type="button"
                onClick={() => handleToggleFavorite(event)}
                className="absolute right-2 top-2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-sm text-zinc-500 transition hover:bg-orange-100 hover:text-orange-600"
                aria-label={`Retirer ${event.title} des favoris`}
            >
                <span className="leading-none">×</span>
            </button>

            <button
                type="button"
                onClick={() => handleSelectEvent(event)}
                className="block w-full min-w-0 cursor-pointer pr-8"
            >
                <div className="flex items-start gap-3">
                    <div className="h-13 w-13 flex-none overflow-hidden rounded-xl bg-orange-50">
                        {event.image ? (
                            <Image
                                src={event.image}
                                alt={event.title}
                                width={48}
                                height={48}
                                unoptimized
                                className="h-full w-full object-cover"
                            />
                        ) : null}
                    </div>
                    <div className="min-w-0 text-left">
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
                        <p className="mt-1 truncate text-xs font-medium text-orange-600">
                            Le {formatFrenchDateTime(event.date, event.time)}
                        </p>
                    </div>
                </div>
            </button>
        </div>
    );

    const fieldClassName =
        "h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-100";

    return (
        <main className="min-h-screen overflow-hidden bg-[#f7f6f2]">
            <section className="relative overflow-hidden bg-zinc-950 text-white">
                <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-orange-500/25 blur-3xl" />
                <div className="absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-rose-500/15 blur-3xl" />
                <div className="relative mx-auto max-w-7xl px-5 pb-28 pt-14 sm:px-8 sm:pb-32 sm:pt-20">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs font-bold text-zinc-200 backdrop-blur">
                            <span className={`h-2 w-2 rounded-full ${latlong ? "bg-emerald-400" : "animate-pulse bg-orange-400"}`} />
                            {latlong ? "Autour de votre position" : "Localisation en cours…"}
                        </div>
                        <h1 className="mt-6 text-4xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                            Votre prochaine sortie
                            <span className="block text-orange-400">commence ici.</span>
                        </h1>
                        <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
                            Concerts, festivals, expositions et pépites locales : explorez ce qui se passe autour de vous, puis partez en un clic.
                        </p>
                    </div>

                    <div className="mt-10 flex flex-wrap gap-8 sm:gap-12">
                        <div>
                            <p className="text-2xl font-black text-white">{loading ? "—" : filteredEvents.length}</p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-zinc-500">Événements</p>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white">{favoriteEvents.length}</p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-zinc-500">Favoris</p>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white">{eventbriteOrgId ? "2" : "1"}</p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-zinc-500">Source{eventbriteOrgId ? "s" : ""}</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="relative mx-auto -mt-16 max-w-7xl space-y-12 px-5 pb-8 sm:px-8">
                <section aria-label="Recherche et filtres" className="rounded-4xl border border-black/5 bg-white p-4 shadow-2xl shadow-black/10 sm:p-6">
                    <div className="flex flex-col gap-3 lg:flex-row">
                        <div className="relative flex-1">
                            <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="11" cy="11" r="7" />
                                <path d="m20 20-4-4" />
                            </svg>
                            <label htmlFor="event-search" className="sr-only">Rechercher un événement</label>
                            <input
                                id="event-search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Artiste, événement, ville…"
                                className={`${fieldClassName} pl-12 pr-11`}
                            />
                            {query ? (
                                <button
                                    type="button"
                                    onClick={() => setQuery("")}
                                    className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-zinc-100 text-sm text-zinc-500 transition hover:bg-zinc-200"
                                    aria-label="Effacer la recherche"
                                >
                                    ×
                                </button>
                            ) : null}
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowFilters((value) => !value)}
                            aria-expanded={showFilters}
                            aria-controls="advanced-filters"
                            className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 text-sm font-bold text-white transition hover:bg-orange-600 lg:min-w-38"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M4 6h16M7 12h10M10 18h4" />
                            </svg>
                            Filtres
                            {activeFilterCount ? (
                                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-orange-400 px-1 text-[10px] text-zinc-950">{activeFilterCount}</span>
                            ) : null}
                        </button>
                        {query || activeFilterCount ? (
                            <button type="button" onClick={resetFilters} className="h-12 cursor-pointer px-3 text-sm font-bold text-zinc-500 transition hover:text-orange-600">
                                Tout effacer
                            </button>
                        ) : null}
                    </div>

                    {geoError ? (
                        <div role="status" className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                            <span aria-hidden="true">◎</span>
                            <p>{geoError} Les événements restent disponibles sans filtre de proximité.</p>
                        </div>
                    ) : null}
                    {geoFallbackMessage ? (
                        <div role="status" className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                            {geoFallbackMessage}
                        </div>
                    ) : null}

                    <div
                        id="advanced-filters"
                        className={[
                            "border-t border-black/5 pt-5",
                            showFilters ? "mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5" : "hidden",
                        ].join(" ")}
                    >
                        <div>
                            <label htmlFor="country-filter" className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">Pays</label>
                            <select id="country-filter" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className={fieldClassName}>
                                {COUNTRY_OPTIONS.map((option) => (
                                    <option key={option.code} value={option.code}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="category-filter" className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">Catégorie</label>
                            <select id="category-filter" value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClassName}>
                                {categories.map((value) => (
                                    <option key={value} value={value}>{value === "ALL" ? "Toutes" : value}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="date-from" className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">À partir du</label>
                            <input id="date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={fieldClassName} />
                        </div>
                        <div>
                            <label htmlFor="date-to" className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">Jusqu’au</label>
                            <input id="date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={fieldClassName} />
                        </div>
                        <label className="flex h-12 cursor-pointer items-center gap-3 self-end rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-bold text-zinc-700 transition hover:bg-orange-50">
                            <input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} className="h-4 w-4 accent-orange-500" />
                            Gratuit uniquement
                        </label>
                    </div>
                </section>

                <section id="map-section" className="scroll-mt-24">
                    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Explorer autour de vous</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">Tout voir sur la carte</h2>
                        </div>
                        <p className="text-sm text-zinc-500">{filteredEvents.length} lieu{filteredEvents.length > 1 ? "x" : ""} affiché{filteredEvents.length > 1 ? "s" : ""}</p>
                    </div>
                    <div className="overflow-hidden rounded-4xl border-6 border-white bg-white shadow-xl shadow-black/8">
                        <MapClient selectedEvent={selectedEvent} events={filteredEvents} />
                    </div>
                </section>

                <section id="events" className="scroll-mt-24">
                    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">La sélection <span className="text-black">Ma</span>Zone</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">Événements à découvrir</h2>
                        </div>
                        {!loading ? (
                            <span className="w-fit rounded-full bg-zinc-200/70 px-3 py-1.5 text-xs font-bold text-zinc-600">
                                {filteredEvents.length} résultat{filteredEvents.length > 1 ? "s" : ""}
                            </span>
                        ) : null}
                    </div>

                    <div id="favorites" className="grid scroll-mt-24 gap-7 lg:grid-cols-[minmax(0,1fr)_280px]">
                        <div className="lg:hidden rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-black text-zinc-950">Mes favoris</h3>
                                    <p className="mt-1 text-xs text-zinc-500">Votre sélection personnelle</p>
                                </div>
                                <span className="grid h-8 min-w-8 place-items-center rounded-full bg-orange-100 px-2 text-xs font-black text-orange-700">{favoriteEvents.length}</span>
                            </div>
                            {favoriteEvents.length === 0 ? (
                                <p className="mt-5 rounded-2xl bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-500">Touchez l’étoile d’un événement pour le retrouver ici.</p>
                            ) : (
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">{favoriteEvents.map(renderFavoriteItem)}</div>
                            )}
                        </div>

                        <EventList
                            onSelectEvent={handleSelectEvent}
                            selectedEventId={selectedEvent?.id ?? null}
                            events={filteredEvents}
                            loading={loading}
                            error={error}
                            favoriteIds={favoriteIds}
                            onToggleFavorite={handleToggleFavorite}
                        />

                        <aside className="hidden min-w-0 lg:block">
                            <div className="sticky top-24 rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-black text-zinc-950">Mes favoris</h3>
                                        <p className="mt-1 text-xs text-zinc-500">Votre sélection</p>
                                    </div>
                                    <span className="grid h-8 min-w-8 place-items-center rounded-full bg-orange-100 px-2 text-xs font-black text-orange-700">{favoriteEvents.length}</span>
                                </div>
                                {favoriteEvents.length === 0 ? (
                                    <p className="mt-5 rounded-2xl bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-500">Ajoutez une étoile pour garder vos coups de cœur à portée de main.</p>
                                ) : (
                                    <div className="mt-4 space-y-3">{favoriteEvents.map(renderFavoriteItem)}</div>
                                )}
                            </div>
                        </aside>
                    </div>
                </section>
            </div>

            {showScrollTop ? (
                <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="fixed bottom-5 right-5 z-50 grid h-12 w-12 cursor-pointer place-items-center rounded-2xl bg-zinc-950 text-white shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:bg-orange-600"
                    aria-label="Remonter en haut"
                >
                    <span className="text-lg leading-none">↑</span>
                </button>
            ) : null}
        </main>
    );
}
