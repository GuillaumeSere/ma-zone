type GoogleMapsDestination = {
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  address?: string | null;
  city?: string | null;
};

export function getGoogleMapsDirectionsUrl({
  latitude,
  longitude,
  locationName,
  address,
  city,
}: GoogleMapsDestination): string | null {
  const hasCoordinates =
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    !(latitude === 0 && longitude === 0);

  const destination = hasCoordinates
    ? `${latitude},${longitude}`
    : [locationName, address, city].filter(Boolean).join(", ");

  if (!destination) return null;

  const params = new URLSearchParams({
    api: "1",
    destination,
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
