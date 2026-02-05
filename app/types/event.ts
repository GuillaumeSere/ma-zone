export interface Event {
  id: string
  title: string
  description: string
  image: string
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
