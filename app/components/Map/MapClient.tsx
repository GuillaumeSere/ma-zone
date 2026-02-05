"use client";

import dynamic from "next/dynamic";
import { Event } from "../../types/event";

const Map = dynamic(() => import("./Map"), { ssr: false });

interface SelectedEvent {
  lat: number;
  lng: number;
  id: string;
}

export default function MapClient({
  selectedEvent,
  events,
}: {
  selectedEvent: SelectedEvent | null;
  events: Event[];
}) {
  return <Map selectedEvent={selectedEvent} events={events} />;
}
