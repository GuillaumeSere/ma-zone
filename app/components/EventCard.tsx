import { Event } from "../types/event";

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

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(event)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(event);
        }
      }}
      className={[
        "group w-full h-full text-left bg-white rounded-2xl overflow-hidden transition flex flex-col",
        "shadow-sm hover:shadow-xl hover:-translate-y-0.5",
        "ring-1 ring-black/5",
        isActive ? "ring-2 ring-black/20 shadow-xl" : "",
      ].join(" ")}
    >
      <div className="relative">
      {hasImage ? (
        <img
          src={event.image}
          alt={event.title}
          className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
      ) : (
        <div className="h-44 w-full bg-linear-to-br from-orange-100 via-rose-100 to-amber-100" />
      )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(event);
          }}
          className={[
            "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full",
            "text-lg shadow-lg ring-1 transition",
            isFavorite
              ? "bg-black/90 text-white ring-black/20"
              : "bg-white/90 text-gray-900 ring-black/10",
          ].join(" ")}
          aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <span className="leading-none">{isFavorite ? "★" : "☆"}</span>
        </button>
      </div>

      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <h3 className="font-bold text-lg text-gray-900 leading-snug min-h-12">
          {event.title}
        </h3>

        <p className="text-sm text-gray-600">
          {event.date} a {event.time}
        </p>

        <p className="text-sm text-gray-500">{event.locationName}</p>
        <p className="text-sm text-gray-500">
          {[event.address, event.city].filter(Boolean).join(", ")}
        </p>

        <p className="text-sm text-gray-600 font-semibold mt-auto">
          {event.price ? `${event.price} EUR` : "Gratuit"}
        </p>
      </div>
    </div>
  );
}
