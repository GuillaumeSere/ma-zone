"use client";

import Image from "next/image";
import { use, useEffect, useState } from "react";
import type { Event } from "../../../types/event";
import { formatFrenchDateTime } from "../../../lib/date";
import MapClient from "../../../components/Map/MapClient";
import DirectionsLink from "../../../components/DirectionsLink";

type ArtistInfo = {
  name: string;
  extract: string;
  url: string;
  image?: string;
  source: string;
} | null;

type EventDetailResponse = {
  event?: Event;
  artistNames?: string[];
  artistInfo?: ArtistInfo;
};

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ source: "ticketmaster" | "eventbrite"; id: string }>;
}) {
  const { source, id } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [artistNames, setArtistNames] = useState<string[]>([]);
  const [artistInfo, setArtistInfo] = useState<ArtistInfo>(null);
  const [mapCoordinates, setMapCoordinates] = useState<[number, number] | null>(null);

  const cacheKey = `ma-zone:event:${source}:${id}`;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
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
        }

        const response = await fetch(
          `/api/events/${encodeURIComponent(source)}/${encodeURIComponent(id)}`,
          { cache: "no-store" }
        );
        const data = (await response.json()) as EventDetailResponse & { error?: string };

        if (!response.ok || data.error) {
          if (cached && !cancelled) {
            setLoading(false);
            return;
          }
          throw new Error(data.error || "Impossible de charger les details.");
        }

        if (!cancelled) {
          if (data.event) setEvent(data.event);
          setArtistNames(data.artistNames || []);
          setArtistInfo(data.artistInfo || null);
          setLoading(false);
        }
        if (!cached && !data.event && !cancelled) {
          setError("Impossible de charger les details (aucune donnee en cache).");
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erreur inconnue");
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [cacheKey, id, source]);

  const d = event;

  useEffect(() => {
    if (!d) {
      setMapCoordinates(null);
      return;
    }

    if (
      Number.isFinite(d.latitude) &&
      Number.isFinite(d.longitude) &&
      d.latitude !== 0 &&
      d.longitude !== 0
    ) {
      setMapCoordinates([d.latitude, d.longitude]);
      return;
    }

    const query = [d.locationName, d.address, d.city].filter(Boolean).join(", ");
    if (!query) {
      setMapCoordinates(null);
      return;
    }

    let cancelled = false;
    setMapCoordinates(null);

    fetch(`/api/geocode?q=${encodeURIComponent(query)}`)
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { latitude?: number; longitude?: number };
      })
      .then((coordinates) => {
        if (
          !cancelled &&
          coordinates &&
          Number.isFinite(coordinates.latitude) &&
          Number.isFinite(coordinates.longitude)
        ) {
          setMapCoordinates([coordinates.latitude!, coordinates.longitude!]);
        }
      })
      .catch(() => {
        if (!cancelled) setMapCoordinates(null);
      });

    return () => {
      cancelled = true;
    };
  }, [d]);

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
    <main className="premium-surface min-h-screen">
      <div className="relative overflow-hidden bg-linear-to-br from-zinc-950 via-zinc-900 to-orange-950 text-white">
        <div className="absolute inset-0 bg-linear-to-r from-orange-500/10 via-transparent to-rose-500/20" />
        <div className="relative mx-auto max-w-6xl px-6 pb-10 pt-8 sm:pb-14 sm:pt-12">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Ma Zone · événement</p>
          <div className="mt-5 flex items-center gap-3 text-sm text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_14px_rgba(251,146,60,0.9)]" />
            Découvrez les informations et le lieu de votre sortie
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8 sm:py-10">
        <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-xl shadow-orange-950/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="relative w-full overflow-hidden bg-linear-to-br from-orange-200 via-rose-100 to-amber-100 lg:w-105">
              {d?.image ? (
                <Image
                  src={d.image}
                  alt={d.title}
                  width={720}
                  height={256}
                  unoptimized
                  className="h-72 w-full object-cover lg:h-80"
                />
              ) : (
                <div className="h-72 w-full lg:h-80" />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-white/10" />
            </div>

            <div className="flex-1 space-y-4 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="rounded-full bg-zinc-950 px-3 py-1.5 text-white">
                  {d.source}
                </span>
                {d.price == null ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800">
                    Renseignement au pres de la billetterie
                  </span>
                ) : d.price === 0 ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-800">
                    Gratuit
                  </span>
                ) : null}
                {d.category ? (
                  <span className="rounded-full bg-orange-100 px-3 py-1.5 text-orange-800">
                    {d.category}
                  </span>
                ) : null}
              </div>

              <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight text-zinc-950 sm:text-4xl">{d.title}</h1>
              <p className="inline-flex rounded-xl bg-orange-50 px-3 py-2 text-sm font-bold text-orange-700">
               Le {formatFrenchDateTime(d.date, d.time)}
              </p>

              <div className="flex flex-wrap gap-3">
                {d.url ? (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:-translate-y-0.5 hover:bg-orange-600"
                  >
                    Billetterie / Lien officiel
                  </a>
                ) : null}
                <DirectionsLink
                  latitude={d.latitude}
                  longitude={d.longitude}
                  locationName={d.locationName}
                  address={d.address}
                  city={d.city}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
                />
              </div>
            </div>
          </div>
        </div>

        <section className="rounded-3xl border border-violet-100 bg-linear-to-br from-violet-50 via-white to-orange-50 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">À propos</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-violet-950">Les artistes de cet événement</h2>
            </div>
            <span className="w-fit rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700">
              Recherche enrichie
            </span>
          </div>

          {artistNames.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {artistNames.map((name) => (
                <span key={name} className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-sm font-bold text-violet-900">
                  {name}
                </span>
              ))}
            </div>
          ) : null}

          {artistInfo ? (
            <div className="mt-5 overflow-hidden rounded-2xl border border-white/80 bg-white/80">
              <div className="flex flex-col sm:flex-row">
                {artistInfo.image ? (
                  <div className="relative h-64 w-full shrink-0 bg-linear-to-br from-violet-100 via-white to-orange-100 sm:h-64 sm:w-56">
                    <Image
                      src={artistInfo.image}
                      alt={`Portrait ou illustration de ${artistInfo.name}`}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, 224px"
                      className="object-contain p-3"
                    />
                  </div>
                ) : null}
                <div className="p-5">
                  <h3 className="text-lg font-black text-zinc-950">{artistInfo.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-zinc-700">{artistInfo.extract}</p>
                  <a
                    href={artistInfo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-violet-700 transition hover:text-orange-600"
                  >
                    En savoir plus sur {artistInfo.source} <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-5 rounded-2xl bg-white/75 p-5 text-sm leading-6 text-zinc-600">
              Nous n&apos;avons pas trouvé de biographie fiable pour cet événement. Consultez le lien officiel pour découvrir les artistes et les informations publiées par l&apos;organisateur.
            </p>
          )}
        </section>

        <div className="rounded-3xl border border-sky-100 bg-sky-50/70 p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-black text-sky-950">Carte du lieu</h2>
          <p className="mt-2 text-sm text-sky-800/70">
            Retrouvez l&apos;evenement sur la carte.
          </p>
          {mapCoordinates ? (
            <div className="mt-4">
              <MapClient
                selectedEvent={{ id: d.id, lat: mapCoordinates[0], lng: mapCoordinates[1] }}
                events={[{ ...d, latitude: mapCoordinates[0], longitude: mapCoordinates[1] }]}
              />
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-white/80 p-4 text-sm text-sky-900">
              Coordonnees indisponibles pour cet evenement.
            </p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-rose-100 bg-rose-50/65 p-6 shadow-sm">
              <h2 className="text-lg font-black text-rose-950">Description</h2>
              <p className="mt-3 text-sm leading-7 text-rose-950/75 whitespace-pre-wrap">
                {d.description ||
                  "Les informations détaillées de cet événement sont publiées progressivement. Consultez le lien officiel pour découvrir la programmation, les artistes et les conditions d’accès."}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-6 shadow-sm">
              <h2 className="text-lg font-black text-amber-950">Détails pratiques</h2>
              <div className="mt-4 grid gap-3 text-sm text-amber-950/75">
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
                {d.url ? (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex w-fit items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-600"
                  >
                    Réserver mes billets
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <p className="rounded-xl bg-white/70 p-3 text-sm text-amber-950/65">
                    Le lien de réservation n&apos;est pas disponible pour cet événement.
                  </p>
                )}
              </div>
            </div>

          </section>

          <aside className="space-y-6">

            {d.category ? (
              <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-6 shadow-sm">
                <h2 className="text-lg font-black text-orange-950">Catégorie</h2>
                <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white/80 p-3 text-xs text-orange-950/75">
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
