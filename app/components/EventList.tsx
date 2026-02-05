"use client";

import { Event } from "../types/event";
import EventCard from "./EventCard";

interface Props {
  events: Event[];
  onSelectEvent: (event: Event) => void;
  selectedEventId?: string | null;
  loading?: boolean;
  error?: string | null;
}

export default function EventList({
  events,
  onSelectEvent,
  selectedEventId,
  loading,
  error,
}: Props) {
  if (loading) return <p>Chargement des evenements...</p>;
  if (error) return <p>Erreur: {error}</p>;
  if (!events.length) return <p>Aucun evenement trouve.</p>;

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onSelect={onSelectEvent}
          isActive={selectedEventId === event.id}
        />
      ))}
    </div>
  );
}
