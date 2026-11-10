import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { apiRequest, ApiError } from '../lib/api'

type AppointmentSlot = {
  id: string
  provider: string
  start: string
  end: string
  available: boolean
}

type Confirmation = {
  id: string
  name: string
  email: string
  date: string
  slot: AppointmentSlot
}

type SlotsResponse = { slots: AppointmentSlot[] }
type BookingResponse = { id: string; slot_id: string; name: string; email: string; status: string; created_at: string }

const currentYear = new Date().getFullYear()

function formatSelectedDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function getLocalDate(value: string) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getSlotDates(slots: AppointmentSlot[], now: number) {
  const today = getLocalDate(new Date(now).toISOString())
  return [...new Set(slots
    .filter((slot) => new Date(slot.start).getTime() > now)
    .map((slot) => getLocalDate(slot.start)))]
    .sort()
    .map((value) => {
      const date = new Date(`${value}T00:00:00`)
      return {
        value,
        weekday: date.toLocaleDateString('en', { weekday: 'short' }),
        day: date.toLocaleDateString('en', { day: '2-digit' }),
        month: date.toLocaleDateString('en', { month: 'short' }),
        isToday: value === today,
        hasAvailability: slots.some(
          (slot) => slot.available && new Date(slot.start).getTime() > now && getLocalDate(slot.start) === value,
        ),
      }
    })
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })
}

function getInitials(value: string) {
  return value.split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase()
}

export function BookingPage() {
  const [selectedDate, setSelectedDate] = useState('')
  const [slots, setSlots] = useState<AppointmentSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [idempotencyKey, setIdempotencyKey] = useState('')
  const [pageLoadedAt] = useState(() => Date.now())

  useEffect(() => {
    const controller = new AbortController()
    apiRequest<SlotsResponse>('/slots', { signal: controller.signal })
      .then(({ slots: responseSlots }) => {
        setSlots(responseSlots)
        const upcomingDates = getSlotDates(responseSlots, pageLoadedAt)
        const firstAvailableDate = upcomingDates.find((date) => date.hasAvailability)
        setSelectedDate(firstAvailableDate?.value ?? upcomingDates[0]?.value ?? '')
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setLoadError(requestError instanceof Error ? requestError.message : 'Unable to load appointment times.')
      })
      .finally(() => setIsLoading(false))
    return () => controller.abort()
  }, [pageLoadedAt])

  const dateSlots = slots.filter((slot) => {
    const startsAt = new Date(slot.start).getTime()
    return slot.available && startsAt > pageLoadedAt && getLocalDate(slot.start) === selectedDate
  })
  const dateOptions = getSlotDates(slots, pageLoadedAt)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedSlot) {
      setError('Choose an appointment time before continuing.')
      return
    }

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim().toLowerCase()

    if (!name || !email) {
      setError('Enter your name and email address to continue.')
      return
    }

    setError('')
    setIsSubmitting(true)
    const requestKey = idempotencyKey || crypto.randomUUID()
    setIdempotencyKey(requestKey)

    try {
      const booking = await apiRequest<BookingResponse>('/bookings', {
        method: 'POST',
        headers: { 'Idempotency-Key': requestKey },
        body: JSON.stringify({ slot_id: selectedSlot.id, name, email }),
      })
      setSlots((current) => current.map((slot) => slot.id === booking.slot_id ? { ...slot, available: false } : slot))
      setConfirmation({
        id: booking.id,
        name: booking.name,
        email: booking.email,
        date: selectedDate,
        slot: selectedSlot,
      })
      setIdempotencyKey('')
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.status === 429 && requestError.retryAfter
          ? `${requestError.message}. Please try again in ${requestError.retryAfter} seconds.`
          : requestError.message)
        setIdempotencyKey('')
        if (requestError.status === 409) {
          setSlots((current) => current.map((slot) => slot.id === selectedSlot.id ? { ...slot, available: false } : slot))
          setSelectedSlot(null)
        }
      } else {
        setError(requestError instanceof Error ? requestError.message : 'Unable to submit your appointment. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (confirmation) {
    return (
      <div className="mx-auto max-w-[1500px] px-5 py-8 md:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl">
          <section className="rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-[0_8px_32px_rgba(27,45,72,0.07)] sm:p-10">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
              <svg aria-hidden="true" className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" /></svg>
            </span>
            <p className="mt-5 text-xs font-bold tracking-[0.16em] text-emerald-700">APPOINTMENT REQUESTED</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">You&apos;re on the schedule, {confirmation.name.split(' ')[0]}.</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Your appointment details are below. The booking is associated with {confirmation.email}.</p>

            <div className="mt-7 rounded-2xl bg-[#f7f9fc] p-5 text-left">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <span className="text-xs text-slate-500">Confirmation number</span>
                <strong className="text-xs font-semibold text-[#294878]">{confirmation.id}</strong>
              </div>
              <dl className="mt-4 space-y-4">
                <div><dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Date and time</dt><dd className="mt-1 text-sm font-medium text-slate-800">{formatSelectedDate(confirmation.date)} · {formatTime(confirmation.slot.start)}</dd></div>
                <div><dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Provider</dt><dd className="mt-1 text-sm font-medium text-slate-800">{confirmation.slot.provider}</dd></div>
              </dl>
            </div>
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2.5 text-left text-xs leading-5 text-emerald-800">Your appointment has been saved. Keep your confirmation number for your records.</p>
            <button className="mt-6 rounded-xl bg-[#294878] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#203b63]" onClick={() => { setConfirmation(null); setSelectedSlot(null); setIdempotencyKey('') }}>Book another appointment</button>
          </section>
          <p className="mt-6 text-center text-xs text-slate-400"><Link className="font-medium text-[#294878] hover:underline" to="/dashboard">Back to clinic dashboard</Link></p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 md:px-8 lg:px-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-bold tracking-[0.16em] text-[#294878]">WORKSPACE · BOOKING</p>
          <h1 className="text-[26px] font-semibold tracking-tight text-slate-900 sm:text-[30px]">Book an appointment</h1>
          <p className="mt-1.5 text-sm text-slate-500">Choose an available clinic time and enter the patient details.</p>
        </div>
        <Link className="text-xs font-semibold text-[#294878] transition hover:text-[#203b63]" to="/appointments">View schedule <span aria-hidden="true">›</span></Link>
      </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.8fr)] lg:gap-8">
          <section>
            <section aria-labelledby="date-heading" className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_8px_rgba(27,45,72,0.04)] sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="text-sm font-semibold text-slate-900" id="date-heading">Choose a date</h2><p className="mt-1 text-xs text-slate-500">Dates with future appointments</p></div>
                <Icon name="calendar" size={19} />
              </div>
              {dateOptions.length > 0 ? (
                <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                  {dateOptions.map((date) => (
                  <button
                    aria-pressed={selectedDate === date.value}
                    className={`flex flex-col items-center rounded-xl border px-2 py-3 transition disabled:cursor-not-allowed disabled:opacity-45 ${selectedDate === date.value ? 'border-[#294878] bg-[#294878] text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-[#829bbd] hover:bg-[#f7f9fc]'}`}
                    key={date.value}
                    onClick={() => { setSelectedDate(date.value); setSelectedSlot(null); setError(''); setIdempotencyKey('') }}
                    disabled={isLoading || !date.hasAvailability}
                    type="button"
                  >
                    <span className={`text-[10px] font-medium ${selectedDate === date.value ? 'text-white/75' : 'text-slate-400'}`}>{date.isToday ? 'Today' : date.weekday}</span>
                    <span className="mt-1 text-lg font-semibold">{date.day}</span>
                    <span className={`text-[10px] ${selectedDate === date.value ? 'text-white/75' : 'text-slate-400'}`}>{date.month}</span>
                  </button>
                ))}
                </div>
              ) : !isLoading && !loadError ? (
                <p className="mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-500" role="status">
                  No future appointment slots are scheduled yet.
                </p>
              ) : null}
            </section>

            <section aria-labelledby="slot-heading" className="mt-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_8px_rgba(27,45,72,0.04)] sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="text-sm font-semibold text-slate-900" id="slot-heading">Available times</h2><p className="mt-1 text-xs text-slate-500">{formatSelectedDate(selectedDate)}</p></div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">{dateSlots.length} {dateSlots.length === 1 ? 'time' : 'times'}</span>
              </div>
              {loadError ? (
                <p className="mt-5 rounded-xl bg-rose-50 p-4 text-xs leading-5 text-rose-700" role="alert">{loadError}</p>
              ) : isLoading ? (
                <p className="mt-5 rounded-xl bg-slate-50 p-5 text-center text-xs text-slate-500" role="status">Loading available appointments…</p>
              ) : dateSlots.length > 0 ? (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {dateSlots.map((slot) => {
                    const selected = selectedSlot?.id === slot.id
                    return (
                      <button
                        aria-pressed={selected}
                        className={`rounded-xl border p-3 text-left transition ${selected ? 'border-[#294878] bg-[#f1f5fa] ring-1 ring-[#294878]' : 'border-slate-200 hover:border-[#829bbd] hover:bg-[#f9fbfd]'}`}
                        key={slot.id}
                        onClick={() => { setSelectedSlot(slot); setError(''); setIdempotencyKey('') }}
                        type="button"
                      >
                        <span className={`text-sm font-semibold ${selected ? 'text-[#294878]' : 'text-slate-800'}`}>{formatTime(slot.start)}</span>
                        <span className="mt-2 flex items-center gap-2">
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#eaf0f7] text-[9px] font-semibold text-[#294878]">{getInitials(slot.provider)}</span>
                          <span className="min-w-0"><span className="block truncate text-[10px] font-medium text-slate-700">{slot.provider}</span></span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-500">No appointment times are available on this date. Please choose another day.</p>
              )}
            </section>
          </section>

          <aside className="lg:sticky lg:top-6">
            <form className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_8px_rgba(27,45,72,0.04)] sm:p-6" onSubmit={handleSubmit}>
              <h2 className="text-sm font-semibold text-slate-900">Your details</h2>
              <p className="mt-1 text-xs text-slate-500">We&apos;ll use these to confirm your appointment.</p>

              {selectedSlot ? (
                <div className="mt-5 rounded-xl bg-[#f1f5fa] p-4">
                  <p className="text-[9px] font-bold tracking-[0.12em] text-[#294878]">SELECTED APPOINTMENT</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{formatTime(selectedSlot.start)}</p>
                  <p className="mt-1 text-xs text-slate-600">{formatSelectedDate(selectedDate)}</p>
                  <p className="mt-2 text-xs text-slate-600">{selectedSlot.provider}</p>
                </div>
              ) : (
                <p className="mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-xs text-slate-500">Select an available time to continue.</p>
              )}

              <label className="mt-5 block">
                <span className="mb-1.5 block text-xs font-medium text-slate-700">Full name</span>
                <input autoComplete="name" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#829bbd] focus:ring-2 focus:ring-[#294878]/10" name="name" onChange={() => setIdempotencyKey('')} placeholder="Your full name" required />
              </label>
              <label className="mt-4 block">
                <span className="mb-1.5 block text-xs font-medium text-slate-700">Email address</span>
                <input autoComplete="email" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#829bbd] focus:ring-2 focus:ring-[#294878]/10" name="email" onChange={() => setIdempotencyKey('')} placeholder="you@example.com" required type="email" />
              </label>

              {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2.5 text-xs text-rose-700" role="alert">{error}</p>}

              <button className="mt-5 w-full rounded-xl bg-[#294878] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#203b63] focus:outline-none focus:ring-2 focus:ring-[#8ba6c8] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!selectedSlot || isSubmitting} type="submit">{isSubmitting ? 'Booking appointment…' : 'Confirm appointment'}</button>
              <p className="mt-3 text-center text-[10px] leading-5 text-slate-400">By continuing, you agree to be contacted about your appointment.</p>
            </form>

            <div className="mt-4 flex gap-3 rounded-2xl border border-slate-100 bg-white p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#eaf0f7] text-[#294878]"><Icon name="help" size={18} /></span>
              <p className="text-[11px] leading-5 text-slate-500"><strong className="font-semibold text-slate-700">Need help booking?</strong><br />Contact the clinic and we&apos;ll be happy to help.</p>
            </div>
          </aside>
        </div>

      <footer className="mt-10 border-t border-slate-200 py-5 text-center text-[10px] text-slate-400">© {currentYear} Wellnest Clinic · Your health, well cared for.</footer>
    </div>
  )
}
