import { Event } from "../types/event";

export const mockEvents: Event[] = [
  {
    id: "1",
    title: "Concert Pop Live",
    description: "Un super concert en plein air",
    image: "https://picsum.photos/600/400",
    date: "2026-03-12",
    time: "20:00",
    locationName: "Parc Central",
    address: "1 rue de la musique",
    city: "Paris",
    latitude: 48.8606,
    longitude: 2.3376,
    price: 25,
    category: "Music",
  },
  {
    id: "2",
    title: "Festival Food Truck",
    description: "Cuisine du monde entier",
    image: "https://picsum.photos/600/400",
    date: "2026-03-15",
    time: "12:00",
    locationName: "Place de la République",
    address: "Place de la République",
    city: "Paris",
    latitude: 48.867,
    longitude: 2.363,
    price: null,
    category: "Food",
  },
];
