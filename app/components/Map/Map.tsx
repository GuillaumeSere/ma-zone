"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { Event } from "../../types/event";
import "leaflet/dist/leaflet.css";

// Fix icones Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

interface SelectedEvent {
  lat: number;
  lng: number;
  id: string;
}

const activeIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const defaultIcon = new L.Icon.Default();

function MapFocus({
  selectedEvent,
  markerRefs,
}: {
  selectedEvent: SelectedEvent | null;
  markerRefs: React.MutableRefObject<Record<string, L.Marker>>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedEvent) return;
    map.flyTo([selectedEvent.lat, selectedEvent.lng], 15, {
      duration: 0.9,
      easeLinearity: 0.25,
    });

    const marker = markerRefs.current[selectedEvent.id];
    if (marker) {
      marker.openPopup();
    }
  }, [map, selectedEvent]);

  return null;
}

export default function Map({
  selectedEvent,
  events,
}: {
  selectedEvent: SelectedEvent | null;
  events: Event[];
}) {
  const [isClient, setIsClient] = useState(false);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fallback: [number, number] = [48.8584, 2.2945]; // Paris fallback

    const resolvePosition = (coords: [number, number]) => {
      if (!cancelled) setPosition(coords);
    };

    if (!navigator?.geolocation) {
      resolvePosition(fallback);
      return () => {
        cancelled = true;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolvePosition([pos.coords.latitude, pos.coords.longitude]),
      () => resolvePosition(fallback),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isClient || !position) return <p>Localisation en cours...</p>;

  return (
    <div className="h-[60vh] min-h-90 w-full rounded-2xl overflow-hidden">
      <MapContainer center={position} zoom={13} scrollWheelZoom className="h-full z-0 w-full">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapFocus selectedEvent={selectedEvent} markerRefs={markerRefs} />

        {events
          .filter((event) => event.latitude && event.longitude)
          .map((event) => {
            const resolvedSource =
              event.source ||
              (event.id?.startsWith("tm_")
                ? "ticketmaster"
                : event.id?.startsWith("eb_")
                ? "eventbrite"
                : "ticketmaster");
            const resolvedSourceId =
              event.sourceId || event.id?.replace(/^tm_|^eb_/, "");
            const detailCacheKey = `ma-zone:event:${resolvedSource}:${resolvedSourceId}`;

            return (
              <Marker
                key={event.id}
                position={[event.latitude, event.longitude]}
                icon={selectedEvent?.id === event.id ? activeIcon : defaultIcon}
                ref={(ref) => {
                  if (ref) markerRefs.current[event.id] = ref;
                }}
              >
                <Popup>
                  <div className="space-y-2">
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={event.title}
                        className="h-28 w-full rounded-lg object-cover"
                        loading="lazy"
                      />
                    ) : null}
                    <h3 className="font-bold">{event.title}</h3>
                    <p className="text-sm">
                      {event.date} a {event.time}
                    </p>
                    <p className="text-xs text-gray-500">{event.locationName}</p>
                    <p className="text-xs text-gray-500">
                      {[event.address, event.city].filter(Boolean).join(", ")}
                    </p>
                    <div className="pt-1">
                      <Link
                        href={`/event/${resolvedSource}/${resolvedSourceId}`}
                        onClick={() => {
                          try {
                            if (typeof window !== "undefined") {
                              window.sessionStorage.setItem(
                                detailCacheKey,
                                JSON.stringify(event)
                              );
                            }
                          } catch {
                            // ignore storage failures
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-black/90 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
                      >
                        Voir plus
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
