"use client";

import { Event } from "../types/event";
import EventCard from "./EventCard";

interface Props {
  events: Event[];
  onSelectEvent: (event: Event) => void;
  selectedEventId?: string | null;
  loading?: boolean;
  error?: string | null;
  favoriteIds?: Set<string>;
  onToggleFavorite?: (event: Event) => void;
}

export default function EventList({
  events,
  onSelectEvent,
  selectedEventId,
  loading,
  error,
  favoriteIds,
  onToggleFavorite,
}: Props) {
  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-label="Chargement des événements">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
            <div className="h-48 animate-pulse bg-zinc-200" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-20 animate-pulse rounded-full bg-orange-100" />
              <div className="h-6 w-4/5 animate-pulse rounded bg-zinc-200" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
              <div className="h-10 animate-pulse rounded-xl bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-100 text-xl">!</div>
        <h3 className="mt-4 font-black text-zinc-950">Impossible de charger les événements</h3>
        <p className="mt-2 text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="rounded-3xl border border-dashed border-zinc-300 bg-white/70 p-10 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-100 text-2xl">⌕</div>
        <h3 className="mt-4 text-lg font-black text-zinc-950">Aucun événement trouvé</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">Essayez d’élargir vos dates, de changer de catégorie ou d’effacer votre recherche.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onSelect={onSelectEvent}
          isActive={selectedEventId === event.id}
          isFavorite={favoriteIds?.has(event.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
