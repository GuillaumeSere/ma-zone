import { getGoogleMapsDirectionsUrl } from "../lib/googleMaps";

type DirectionsLinkProps = {
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  address?: string | null;
  city?: string | null;
  className?: string;
};

export default function DirectionsLink({
  latitude,
  longitude,
  locationName,
  address,
  city,
  className = "",
}: DirectionsLinkProps) {
  const href = getGoogleMapsDirectionsUrl({
    latitude,
    longitude,
    locationName,
    address,
    city,
  });

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      aria-label={`Calculer l'itinéraire vers ${locationName || city || "cet événement"} avec Google Maps`}
      className={className}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 18l6-6-6-6" />
        <path d="M15 12H4" />
        <path d="M15 5h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3" />
      </svg>
      Itinéraire
    </a>
  );
}
