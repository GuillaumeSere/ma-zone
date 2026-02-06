"use client";

import { use, useEffect, useState } from "react";
import type { Event } from "../../../types/event";
import { formatFrenchDateTime } from "../../../lib/date";
import MapClient from "../../../components/Map/MapClient";

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ source: "ticketmaster" | "eventbrite"; id: string }>;
}) {
  const { source, id } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `ma-zone:event:${source}:${id}`;

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      try {
        setLoading(true);
        setError(null);

        let cached: Event | null = null;
        try {
          const rawSession = window.sessionStorage.getItem(cacheKey);
          if (rawSession) cached = JSON.parse(rawSession) as Event;
        } catch {
          cached = null;
        }

        if (!cached) {
          try {
            const rawLocal = window.localStorage.getItem(cacheKey);
            if (rawLocal) cached = JSON.parse(rawLocal) as Event;
          } catch {
            cached = null;
          }
        }

        if (cached && !cancelled) {
          setEvent(cached);
          setLoading(false);
          return;
        }

        if (!cancelled) {
          setError("Impossible de charger les details (aucune donnee en cache).");
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
  }, [cacheKey]);

  const d = event;

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
            <h1 className="text-2xl font-black text-gray-900">
              Erreur de chargement
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {error || "Impossible de charger les details."}
            </p>
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
              {d?.image ? (
                <img
                  src={d.image}
                  alt={d.title}
                  className="h-64 w-full rounded-2xl object-cover"
                />
              ) : (
                <div className="h-64 w-full rounded-2xl bg-linear-to-br from-orange-100 via-rose-100 to-amber-100" />
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-600">
                <span className="rounded-full bg-black/10 px-3 py-1">
                  {d.source}
                </span>
                {d.price == null ? (
                  <span className="rounded-full bg-black/10 px-3 py-1">
                    Renseignement au pres de la billetterie
                  </span>
                ) : d.price === 0 ? (
                  <span className="rounded-full bg-black/10 px-3 py-1">
                    Gratuit
                  </span>
                ) : null}
                {d.category ? (
                  <span className="rounded-full bg-black/10 px-3 py-1">
                    {d.category}
                  </span>
                ) : null}
              </div>

              <h1 className="text-3xl font-black text-gray-900">{d.title}</h1>
              <p className="text-sm text-gray-900">
               Le {formatFrenchDateTime(d.date, d.time)}
              </p>

              {d.url ? (
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5"
                >
                  Billetterie / Lien officiel
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 ring-1 ring-black/10 shadow-sm">
          <h2 className="text-lg font-black text-gray-900">Carte</h2>
          <p className="mt-2 text-sm text-gray-600">
            Retrouvez l&apos;evenement sur la carte.
          </p>
          {d.latitude && d.longitude ? (
            <div className="mt-4">
              <MapClient
                selectedEvent={{ id: d.id, lat: d.latitude, lng: d.longitude }}
                events={[d]}
              />
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              Coordonnees indisponibles pour cet evenement.
            </p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-6">
            <div className="rounded-2xl bg-white p-6 ring-1 ring-black/10 shadow-sm">
              <h2 className="text-lg font-black text-gray-900">Description</h2>
              <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">
                {d.description || "Aucune description disponible."}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 ring-1 ring-black/10 shadow-sm">
              <h2 className="text-lg font-black text-gray-900">Details</h2>
              <div className="mt-4 grid gap-3 text-sm text-gray-700">
                {d.locationName ? (
                  <p>
                    <span className="font-semibold">Lieu:</span>{" "}
                    {d.locationName}
                  </p>
                ) : null}
                {[d.address, d.city].filter(Boolean).length ? (
                  <p>
                    <span className="font-semibold">Adresse:</span>{" "}
                    {[d.address, d.city].filter(Boolean).join(", ")}
                  </p>
                ) : null}
                <p>
                  <span className="font-semibold">Prix:</span>{" "}
                  {d.price == null
                    ? "Renseignement au pres de la billetterie"
                    : d.price === 0
                    ? "Gratuit"
                    : `${d.price} EUR`}
                </p>
              </div>
            </div>

          </section>

          <aside className="space-y-6">

            {d.category ? (
              <div className="rounded-2xl bg-white p-6 ring-1 ring-black/10 shadow-sm">
                <h2 className="text-lg font-black text-gray-900">Categorie</h2>
                <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-black/5 p-3 text-xs text-gray-800">
                  {JSON.stringify(d.category, null, 2)}
                </pre>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
