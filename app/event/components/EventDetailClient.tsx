"use client";

import { useEffect, useMemo, useState } from "react";
import type { Event } from "../../types/event";
import { formatFrenchDateTime } from "../../lib/date";

type DetailResponse = {
  source: "ticketmaster" | "eventbrite";
  detail: {
    source: string;
    sourceId: string;
    title: string;
    description: string;
    url?: string;
    images?: string[];
    date?: string;
    time?: string;
    status?: string;
    timezone?: string;
    venue?: any;
    organizer?: any;
    category?: any;
    priceRanges?: any[];
    ticketAvailability?: any;
    ticketLimit?: any;
    ageRestrictions?: any;
    classifications?: any[];
    capacity?: number | null;
    isFree?: boolean | null;
  };
  raw?: any;
  error?: string;
  details?: string;
};

export default function EventDetailClient({
  source,
  id,
}: {
  source: "ticketmaster" | "eventbrite";
  id: string;
}) {
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `ma-zone:event:${source}:${id}`;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        let cached: Event | null = null;
        try {
          const raw = window.sessionStorage.getItem(cacheKey);
          if (raw) cached = JSON.parse(raw) as Event;
        } catch {
          cached = null;
        }

        if (cached && !cancelled) {
          setData({
            source,
            detail: {
              source: cached.source,
              sourceId: cached.sourceId,
              title: cached.title,
              description: cached.description,
              url: cached.url,
              images: cached.image ? [cached.image] : [],
              date: cached.date,
              time: cached.time,
              status: "",
              timezone: "",
              venue: {
                name: cached.locationName,
                address: cached.address,
                city: cached.city,
                latitude: cached.latitude,
                longitude: cached.longitude,
              },
            },
            raw: cached,
          });
          // show cached data immediately, but continue to fetch fresh details
          setLoading(false);
        }

        const res = await fetch(
          `/api/events/${encodeURIComponent(source)}/${encodeURIComponent(id)}`,
          { cache: "no-store" }
        );
        const json = (await res.json()) as DetailResponse;

        if (!res.ok || json?.error) {
          throw new Error(json?.error || "Impossible de charger les details.");
        }

        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Erreur inconnue");
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [cacheKey, id, source]);

  const detail = data?.detail;
  const d = useMemo(() => detail, [detail]);

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-4xl p-6">
          <div className="rounded-2xl bg-white p-6 ring-1 ring-black/10 shadow-sm">
            <p className="text-sm text-gray-600">Chargement...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !d) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-4xl p-6">
          <div className="rounded-2xl bg-white p-6 ring-1 ring-black/10 shadow-sm">
            <h1 className="text-2xl font-black text-gray-900">Erreur de chargement</h1>
            <p className="mt-2 text-sm text-gray-600">{error || "Impossible de charger les details."}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl p-6 space-y-6">
        <div className="rounded-3xl bg-white p-6 ring-1 ring-black/10 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="w-full lg:w-90">
              {d?.images?.[0] ? (
                <img src={d.images[0]} alt={d.title} className="h-64 w-full rounded-2xl object-cover" />
              ) : (
                <div className="h-64 w-full rounded-2xl bg-linear-to-br from-orange-100 via-rose-100 to-amber-100" />
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-600">
                <span className="rounded-full bg-black/10 px-3 py-1">{data?.source}</span>
                {d?.status ? <span className="rounded-full bg-black/10 px-3 py-1">{d.status}</span> : null}
                {d?.isFree ? <span className="rounded-full bg-black/10 px-3 py-1">Gratuit</span> : null}
              </div>

              <h1 className="text-3xl font-black text-gray-900">{d.title}</h1>
              <p className="text-sm text-gray-600">
                {formatFrenchDateTime(d.date, d.time)} {d.timezone ? `(${d.timezone})` : ""}
              </p>

              {d.url ? (
                <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5">
                  Billetterie / Lien officiel
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-6">
            <div className="rounded-2xl bg-white p-6 ring-1 ring-black/10 shadow-sm">
              <h2 className="text-lg font-black text-gray-900">Description</h2>
              <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{d.description || "Aucune description disponible."}</p>
            </div>

            <div className="rounded-2xl bg-white p-6 ring-1 ring-black/10 shadow-sm">
              <h2 className="text-lg font-black text-gray-900">Details</h2>
              <div className="mt-4 grid gap-3 text-sm text-gray-700">
                {d.capacity != null ? (
                  <p>
                    <span className="font-semibold">Capacite:</span> {d.capacity}
                  </p>
                ) : null}
                {d.ticketLimit ? (
                  <p>
                    <span className="font-semibold">Limite billets:</span> {JSON.stringify(d.ticketLimit)}
                  </p>
                ) : null}
                {d.ageRestrictions ? (
                  <p>
                    <span className="font-semibold">Restriction age:</span> {JSON.stringify(d.ageRestrictions)}
                  </p>
                ) : null}
                {Array.isArray(d.priceRanges) && d.priceRanges.length ? (
                  <p>
                    <span className="font-semibold">Prix:</span> {JSON.stringify(d.priceRanges)}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 ring-1 ring-black/10 shadow-sm">
              <h2 className="text-lg font-black text-gray-900">Donnees brutes</h2>
              <pre className="mt-4 max-h-105 overflow-auto rounded-xl bg-black/90 p-4 text-xs text-white">{JSON.stringify(data?.raw || {}, null, 2)}</pre>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl bg-white p-6 ring-1 ring-black/10 shadow-sm">
              <h2 className="text-lg font-black text-gray-900">Lieu</h2>
              <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-black/5 p-3 text-xs text-gray-800">{JSON.stringify(d.venue || {}, null, 2)}</pre>
            </div>

            {d.organizer ? (
              <div className="rounded-2xl bg-white p-6 ring-1 ring-black/10 shadow-sm">
                <h2 className="text-lg font-black text-gray-900">Organisateur</h2>
                <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-black/5 p-3 text-xs text-gray-800">{JSON.stringify(d.organizer, null, 2)}</pre>
              </div>
            ) : null}

            {d.category ? (
              <div className="rounded-2xl bg-white p-6 ring-1 ring-black/10 shadow-sm">
                <h2 className="text-lg font-black text-gray-900">Categorie</h2>
                <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-black/5 p-3 text-xs text-gray-800">{JSON.stringify(d.category, null, 2)}</pre>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
