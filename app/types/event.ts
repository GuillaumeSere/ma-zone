export interface Event {
  id: string
  source: "ticketmaster" | "eventbrite"
  sourceId: string
  title: string
  description: string
  image: string
  url?: string
  date: string
  time: string
  locationName: string
  address: string
  city: string
  latitude: number
  longitude: number
  price: number | null
  category: string
}
