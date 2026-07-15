import Image from "next/image";
import Link from "next/link";
import { Event } from "../types/event";
import { formatFrenchDateTime } from "../lib/date";
import DirectionsLink from "./DirectionsLink";

interface Props {
  event: Event;
  onSelect?: (event: Event) => void;
  isActive?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (event: Event) => void;
}

export default function EventCard({
  event,
  onSelect,
  isActive,
  isFavorite,
  onToggleFavorite,
}: Props) {
  const hasImage = Boolean(event.image);
  const resolvedSource =
    event.source ||
    (event.id?.startsWith("tm_")
      ? "ticketmaster"
      : event.id?.startsWith("eb_")
      ? "eventbrite"
      : "ticketmaster");
  const resolvedSourceId = event.sourceId || event.id?.replace(/^tm_|^eb_/, "");
  const detailCacheKey = `ma-zone:event:${resolvedSource}:${resolvedSourceId}`;

  const cacheEvent = () => {
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(detailCacheKey, JSON.stringify(event));
      }
    } catch {
      // ignore storage failures
    }
  };

  return (
    <article
      className={[
        "group flex h-full w-full flex-col overflow-hidden rounded-3xl border bg-white text-left transition duration-300",
        "hover:-translate-y-1 hover:shadow-xl hover:shadow-black/8",
        isActive
          ? "border-orange-400 shadow-xl shadow-orange-500/10 ring-4 ring-orange-100"
          : "border-black/5 shadow-sm",
      ].join(" ")}
    >
      <div className="relative overflow-hidden">
        <button
          type="button"
          onClick={() => onSelect?.(event)}
          className="block w-full cursor-pointer text-left"
          aria-label={`Afficher ${event.title} sur la carte`}
        >
          {hasImage ? (
            <Image
              src={event.image}
              alt=""
              width={800}
              height={384}
              unoptimized
              className="h-48 w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-48 w-full place-items-center bg-linear-to-br from-orange-100 via-rose-50 to-amber-100 text-orange-300">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 7.5h16M7.5 3v4.5M16.5 3v4.5M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
                <path d="M8 12h3v3H8z" />
              </svg>
            </div>
          )}
          <span className="absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent opacity-60 transition group-hover:opacity-80" />
        </button>

        {event.category ? (
          <span className="absolute left-3 top-3 max-w-[65%] truncate rounded-full border border-white/30 bg-black/65 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md">
            {event.category}
          </span>
        ) : null}

        {isActive ? (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            Sur la carte
          </span>
        ) : null}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(event);
          }}
          className={[
            "absolute right-3 top-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full",
            "text-lg shadow-lg ring-1 transition duration-200 hover:scale-110",
            isFavorite
              ? "bg-orange-500 text-white ring-orange-400"
              : "bg-white/90 text-zinc-900 ring-white/60 backdrop-blur-md hover:bg-white",
          ].join(" ")}
          aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-pressed={isFavorite}
        >
          <span className="leading-none">{isFavorite ? "★" : "☆"}</span>
        </button>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-orange-600">
          {formatFrenchDateTime(event.date, event.time)}
        </p>

        <h3 className="mt-2 line-clamp-2 min-h-13 text-lg font-black leading-snug tracking-tight text-zinc-950">
          {event.title}
        </h3>

        <div className="mt-4 flex min-h-11 items-start gap-2 text-sm text-zinc-500">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="mt-0.5 h-4 w-4 flex-none text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <span className="line-clamp-2">
            {[event.locationName, event.city].filter(Boolean).join(" · ") || "Lieu à confirmer"}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-black/5 pt-4">
          <span className="text-sm font-black text-zinc-900">
            {event.price == null
              ? "Tarif à confirmer"
              : event.price === 0
              ? "Gratuit"
              : `${event.price} €`}
          </span>
          <button
            type="button"
            onClick={() => onSelect?.(event)}
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-zinc-500 transition hover:text-orange-600"
          >
            Voir sur la carte
            <span aria-hidden="true">↗</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={`/event/${resolvedSource}/${resolvedSourceId}`}
            onClick={cacheEvent}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-950 px-3 text-xs font-bold text-white transition hover:bg-orange-600"
          >
            Découvrir
          </Link>
          <DirectionsLink
            latitude={event.latitude}
            longitude={event.longitude}
            locationName={event.locationName}
            address={event.address}
            city={event.city}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
          />
        </div>
      </div>
    </article>
  );
}
