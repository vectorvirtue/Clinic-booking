export type AppointmentSlot = {
  id: string
  provider: string
  start: string
  end: string
  available: boolean
}

export type Booking = {
  id: string
  slot_id: string
  name: string
  email: string
  status: 'confirmed' | 'cancelled'
  created_at: string
}

export type SlotsResponse = { slots: AppointmentSlot[] }
export type BookingsResponse = { bookings: Booking[]; next_cursor: string | null }

export function getLocalDate(value: string) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })
}

export function getWeekStart(reference = new Date()) {
  const date = new Date(reference)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return date
}
