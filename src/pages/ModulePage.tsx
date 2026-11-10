import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { NewAppointmentDialog } from '../components/dashboard/NewAppointmentDialog'
import { useClinicSlots } from '../hooks/useClinicSlots'
import { ApiError, apiRequest } from '../lib/api'
import {
  formatDate,
  formatTime,
  getLocalDate,
  getWeekStart,
  type AppointmentSlot,
  type Booking,
  type BookingsResponse,
} from '../lib/clinic'
import { Icon, type IconName } from '../components/Icon'

const moduleIcons: Record<string, IconName> = {
  Appointments: 'calendar',
  Availability: 'clock',
  Patients: 'users',
  Providers: 'stethoscope',
  Reports: 'chart',
  Settings: 'settings',
}

function PageShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string
  subtitle: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 md:px-8 lg:px-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-[#294878]">
            <Icon name={moduleIcons[title] ?? 'dashboard'} size={14} /> CLINIC WORKSPACE
          </p>
          <h1 className="text-[26px] font-semibold tracking-tight text-slate-900 sm:text-[30px]">{title}</h1>
          <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function DataState({
  isLoading,
  error,
  onRetry,
}: {
  isLoading: boolean
  error: string
  onRetry: () => void
}) {
  if (error) {
    return (
      <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
        <span>Could not load clinic data: {error}</span>
        <button className="ml-3 font-semibold underline" onClick={onRetry} type="button">Try again</button>
      </div>
    )
  }
  if (isLoading) return <p className="rounded-xl bg-white px-5 py-8 text-center text-sm text-slate-500" role="status">Loading clinic data…</p>
  return null
}

function SlotsTable({ slots, emptyMessage }: { slots: AppointmentSlot[]; emptyMessage: string }) {
  if (slots.length === 0) return <p className="rounded-xl border border-slate-100 bg-white px-5 py-10 text-center text-sm text-slate-500">{emptyMessage}</p>

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-[0_2px_8px_rgba(27,20,45,0.04)]">
      <table className="w-full min-w-[680px] text-left">
        <thead className="bg-slate-50/70 text-[10px] font-bold tracking-[0.12em] text-slate-400">
          <tr><th className="px-5 py-3">DATE</th><th className="px-5 py-3">TIME</th><th className="px-5 py-3">PROVIDER</th><th className="px-5 py-3">SLOT ID</th><th className="px-5 py-3">STATUS</th></tr>
        </thead>
        <tbody>
          {slots.map((slot) => (
            <tr className="border-t border-slate-100 text-xs" key={slot.id}>
              <td className="whitespace-nowrap px-5 py-4 text-slate-700">{formatDate(slot.start)}</td>
              <td className="whitespace-nowrap px-5 py-4 text-slate-700">{formatTime(slot.start)} – {formatTime(slot.end)}</td>
              <td className="px-5 py-4 font-medium text-slate-800">{slot.provider}</td>
              <td className="px-5 py-4 font-mono text-[11px] text-slate-500">{slot.id}</td>
              <td className="px-5 py-4">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${slot.available ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {slot.available ? 'Available' : 'Booked'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AppointmentsModule() {
  const { slots, isLoading, error, refresh } = useClinicSlots()
  const sortedSlots = [...slots].sort((a, b) => a.start.localeCompare(b.start))

  return (
    <PageShell
      title="Appointments"
      subtitle="Clinic schedule from the booking API. Booked patient details are looked up by email in Patients."
      action={<NewAppointmentDialog onBookingCreated={refresh} />}
    >
      <DataState error={error} isLoading={isLoading} onRetry={refresh} />
      {!error && !isLoading && <SlotsTable slots={sortedSlots} emptyMessage="No appointment slots are in the schedule yet." />}
    </PageShell>
  )
}

function AvailabilityModule() {
  const { slots, isLoading, error, refresh } = useClinicSlots()
  const [now] = useState(() => Date.now())
  const availableSlots = slots
    .filter((slot) => slot.available && new Date(slot.start).getTime() >= now)
    .sort((a, b) => a.start.localeCompare(b.start))
  const providers = [...new Set(availableSlots.map((slot) => slot.provider))]

  return (
    <PageShell title="Availability" subtitle="Upcoming open appointment times patients can book.">
      <DataState error={error} isLoading={isLoading} onRetry={refresh} />
      {!error && !isLoading && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dbe5f1] bg-[#f4f7fb] px-4 py-3 text-xs text-[#294878]">
            <span>{availableSlots.length} open times across {providers.length} providers.</span>
            <span>Slot changes aren&apos;t available in this API. Its reset endpoint replaces all slots and deletes bookings.</span>
          </div>
          <SlotsTable slots={availableSlots} emptyMessage="No future open appointment times are available." />
        </>
      )}
    </PageShell>
  )
}

function ProvidersModule() {
  const { slots, isLoading, error, refresh } = useClinicSlots()
  const [now] = useState(() => Date.now())
  const upcoming = slots.filter((slot) => new Date(slot.start).getTime() >= now)
  const providers = [...new Set(slots.map((slot) => slot.provider))].sort((a, b) => a.localeCompare(b))

  return (
    <PageShell title="Providers" subtitle="Provider list and slot load, derived from the clinic schedule.">
      <DataState error={error} isLoading={isLoading} onRetry={refresh} />
      {!error && !isLoading && (providers.length === 0 ? (
        <p className="rounded-xl border border-slate-100 bg-white px-5 py-10 text-center text-sm text-slate-500">No providers are represented in the slot schedule.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {providers.map((provider) => {
            const providerSlots = upcoming.filter((slot) => slot.provider === provider)
            const booked = providerSlots.filter((slot) => !slot.available).length
            const open = providerSlots.length - booked
            return (
              <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_8px_rgba(27,20,45,0.04)]" key={provider}>
                <span className="grid size-10 place-items-center rounded-xl bg-[#eaf0f7] text-[#294878]"><Icon name="stethoscope" size={19} /></span>
                <h2 className="mt-4 text-sm font-semibold text-slate-900">{provider}</h2>
                <p className="mt-1 text-xs text-slate-500">Provider name as configured in the slot schedule</p>
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
                  <div><strong className="block text-lg text-slate-900">{providerSlots.length}</strong><span className="text-[10px] text-slate-500">upcoming</span></div>
                  <div><strong className="block text-lg text-sky-700">{open}</strong><span className="text-[10px] text-slate-500">open</span></div>
                  <div><strong className="block text-lg text-emerald-700">{booked}</strong><span className="text-[10px] text-slate-500">booked</span></div>
                </div>
              </article>
            )
          })}
        </div>
      ))}
    </PageShell>
  )
}

function ReportsModule() {
  const { slots, isLoading, error, refresh } = useClinicSlots()
  const [now] = useState(() => new Date())
  const weekStart = getWeekStart(now)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const thisWeekBooked = slots.filter((slot) => {
    const time = new Date(slot.start).getTime()
    return !slot.available && time >= weekStart.getTime() && time < weekEnd.getTime()
  })
  const today = getLocalDate(now.toISOString())
  const todayBooked = slots.filter((slot) => !slot.available && getLocalDate(slot.start) === today).length
  const upcomingOpen = slots.filter((slot) => slot.available && new Date(slot.start).getTime() >= now.getTime()).length
  const providers = [...new Set(slots.map((slot) => slot.provider))].sort((a, b) => a.localeCompare(b))

  return (
    <PageShell title="Reports" subtitle="Schedule and confirmed-booking counts based on the appointment slots API.">
      <DataState error={error} isLoading={isLoading} onRetry={refresh} />
      {!error && !isLoading && (
        <>
          <div className="mb-5 grid gap-4 sm:grid-cols-3">
            <SummaryCard title="Booked this week" value={thisWeekBooked.length} icon="calendar" />
            <SummaryCard title="Booked today" value={todayBooked} icon="calendar" />
            <SummaryCard title="Future open slots" value={upcomingOpen} icon="clock" />
          </div>
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Bookings by provider this week</h2>
              <p className="mt-1 text-xs text-slate-500">A slot with available=false has a confirmed booking.</p>
            </div>
            {providers.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">No provider schedule data yet.</p>
            ) : providers.map((provider) => {
              const count = thisWeekBooked.filter((slot) => slot.provider === provider).length
              return (
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 last:border-0" key={provider}>
                  <span className="text-xs font-medium text-slate-700">{provider}</span>
                  <span className="rounded-full bg-[#eaf0f7] px-3 py-1 text-[10px] font-semibold text-[#294878]">{count} booked</span>
                </div>
              )
            })}
          </section>
          <p className="mt-4 text-[11px] text-slate-500">The API does not provide completion outcomes or historical trend data, so those metrics are not shown.</p>
        </>
      )}
    </PageShell>
  )
}

function SummaryCard({ title, value, icon }: { title: string; value: number; icon: IconName }) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5">
      <span className="grid size-9 place-items-center rounded-lg bg-[#eaf0f7] text-[#294878]"><Icon name={icon} size={18} /></span>
      <p className="mt-4 text-xs text-slate-500">{title}</p>
      <strong className="mt-1 block text-2xl text-slate-900">{value}</strong>
    </article>
  )
}

function PatientsModule() {
  const { slots, error: slotsError, refresh: refreshSlots } = useClinicSlots()
  const [email, setEmail] = useState('')
  const [searchedEmail, setSearchedEmail] = useState('')
  const [page, setPage] = useState<BookingsResponse | null>(null)
  const [cursorHistory, setCursorHistory] = useState<string[]>([''])
  const [pageIndex, setPageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [cancelingId, setCancelingId] = useState('')
  const [error, setError] = useState('')

  async function loadBookings(searchEmail: string, cursor: string) {
    setError('')
    setIsLoading(true)
    const query = new URLSearchParams({ email: searchEmail, limit: '10' })
    if (cursor) query.set('cursor', cursor)
    try {
      const response = await apiRequest<BookingsResponse>(`/bookings?${query.toString()}`)
      setPage(response)
    } catch (requestError) {
      setPage(null)
      setError(requestError instanceof Error ? requestError.message : 'Unable to load this patient’s bookings.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setError('Enter an email address to search for a patient.')
      return
    }
    setSearchedEmail(normalizedEmail)
    setCursorHistory([''])
    setPageIndex(0)
    void loadBookings(normalizedEmail, '')
  }

  function handleNextPage() {
    if (!page?.next_cursor) return
    const nextHistory = [...cursorHistory.slice(0, pageIndex + 1), page.next_cursor]
    setCursorHistory(nextHistory)
    setPageIndex(nextHistory.length - 1)
    void loadBookings(searchedEmail, page.next_cursor)
  }

  function handlePreviousPage() {
    if (pageIndex === 0) return
    const previousIndex = pageIndex - 1
    setPageIndex(previousIndex)
    void loadBookings(searchedEmail, cursorHistory[previousIndex])
  }

  async function cancelBooking(booking: Booking) {
    if (booking.status === 'cancelled' || !window.confirm(`Cancel this appointment for ${booking.name}?`)) return
    setError('')
    setCancelingId(booking.id)
    try {
      const cancelled = await apiRequest<Booking>(`/bookings/${encodeURIComponent(booking.id)}`, { method: 'DELETE' })
      setPage((current) => current
        ? { ...current, bookings: current.bookings.map((item) => item.id === cancelled.id ? cancelled : item) }
        : current)
      refreshSlots()
    } catch (requestError) {
      setError(requestError instanceof ApiError && requestError.status === 409
        ? 'This appointment has already been cancelled.'
        : requestError instanceof Error ? requestError.message : 'Unable to cancel this appointment.')
    } finally {
      setCancelingId('')
    }
  }

  return (
    <PageShell title="Patients" subtitle="Look up a patient by email and review or cancel their bookings.">
      <form className="mb-5 flex flex-wrap gap-3 rounded-2xl border border-slate-100 bg-white p-4" onSubmit={handleSearch}>
        <label className="min-w-[220px] flex-1">
          <span className="sr-only">Patient email address</span>
          <input
            autoComplete="email"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#829bbd] focus:ring-2 focus:ring-[#294878]/10"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Search by patient email"
            required
            type="email"
            value={email}
          />
        </label>
        <button className="rounded-lg bg-[#294878] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50" disabled={isLoading} type="submit">
          {isLoading ? 'Searching…' : 'Search patient'}
        </button>
      </form>

      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}
      {slotsError && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800" role="status">Could not load slot details: {slotsError}</p>}
      {!searchedEmail ? (
        <p className="rounded-xl border border-slate-100 bg-white px-5 py-10 text-center text-sm text-slate-500">Enter a patient&apos;s email address to find their bookings.</p>
      ) : isLoading ? (
        <p className="rounded-xl border border-slate-100 bg-white px-5 py-10 text-center text-sm text-slate-500" role="status">Loading patient bookings…</p>
      ) : page && page.bookings.length === 0 ? (
        <p className="rounded-xl border border-slate-100 bg-white px-5 py-10 text-center text-sm text-slate-500">No bookings found for {searchedEmail}.</p>
      ) : page ? (
        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Bookings for {searchedEmail}</h2>
            <p className="mt-1 text-xs text-slate-500">Page {pageIndex + 1}. Email matching ignores capitalization.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {page.bookings.map((booking) => {
              const slot = slots.find((item) => item.id === booking.slot_id)
              return (
                <article className="flex flex-wrap items-center justify-between gap-4 px-5 py-4" key={booking.id}>
                  <div className="min-w-[200px] flex-1">
                    <h3 className="text-xs font-semibold text-slate-800">{booking.name}</h3>
                    <p className="mt-1 text-[11px] text-slate-500">{booking.email}</p>
                    <p className="mt-2 text-[11px] text-slate-600">
                      {slot ? `${slot.provider} · ${formatDate(slot.start)} · ${formatTime(slot.start)}` : `Slot ${booking.slot_id}`}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-slate-400">Booking ID: {booking.id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{booking.status}</span>
                    {booking.status === 'confirmed' && (
                      <button
                        className="rounded-lg border border-rose-200 px-3 py-2 text-[10px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                        disabled={cancelingId === booking.id}
                        onClick={() => void cancelBooking(booking)}
                        type="button"
                      >
                        {cancelingId === booking.id ? 'Cancelling…' : 'Cancel booking'}
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <button className="text-xs font-semibold text-[#294878] disabled:text-slate-300" disabled={pageIndex === 0 || isLoading} onClick={handlePreviousPage} type="button">Previous</button>
            <button className="text-xs font-semibold text-[#294878] disabled:text-slate-300" disabled={!page.next_cursor || isLoading} onClick={handleNextPage} type="button">Next</button>
          </div>
        </section>
      ) : null}
    </PageShell>
  )
}

function SettingsModule() {
  const { slots, isLoading, error, refresh } = useClinicSlots()
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || window.location.origin
  const hasApiKey = Boolean(import.meta.env.VITE_API_KEY)

  return (
    <PageShell title="Settings" subtitle="API connection status and configuration used by this clinic app.">
      <DataState error={error} isLoading={isLoading} onRetry={refresh} />
      {!isLoading && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-100 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Booking API connection</h2>
            <p className="mt-1 text-xs text-slate-500">Connection is checked by loading the clinic slot list.</p>
            <div className="mt-5 space-y-3 text-xs">
              <SettingRow label="Connection" value={error ? 'Error' : 'Connected'} error={Boolean(error)} />
              <SettingRow label="API base URL" value={baseUrl} />
              <SettingRow label="API key configuration" value={hasApiKey ? 'Configured' : 'Missing'} error={!hasApiKey} />
              {!error && <SettingRow label="Slots returned" value={String(slots.length)} />}
            </div>
            <button className="mt-5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={refresh} type="button">Test connection</button>
          </section>
          <section className="rounded-2xl border border-slate-100 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Current API capabilities</h2>
            <ul className="mt-4 space-y-3 text-xs leading-5 text-slate-600">
              <li>Slots and bookings are stored by the booking API.</li>
              <li>Bookings can be searched by patient email, paged, and cancelled.</li>
              <li>Provider names come from slots; provider profiles and clinic preferences are not part of this API.</li>
              <li>Replacing the slot schedule uses the reset endpoint, which also deletes bookings, so this dashboard does not expose it as a casual settings action.</li>
            </ul>
          </section>
        </div>
      )}
    </PageShell>
  )
}

function SettingRow({ label, value, error = false }: { label: string; value: string; error?: boolean }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className={`max-w-full break-all font-medium ${error ? 'text-rose-700' : 'text-slate-800'}`}>{value}</span>
    </div>
  )
}

function NotFoundModule() {
  return (
    <PageShell title="Page not found" subtitle="That clinic workspace page does not exist.">
      <Link className="text-sm font-semibold text-[#294878] underline" to="/dashboard">Back to dashboard</Link>
    </PageShell>
  )
}

export function ModulePage({ title }: { title: string }) {
  switch (title) {
    case 'Appointments': return <AppointmentsModule />
    case 'Availability': return <AvailabilityModule />
    case 'Patients': return <PatientsModule />
    case 'Providers': return <ProvidersModule />
    case 'Reports': return <ReportsModule />
    case 'Settings': return <SettingsModule />
    default: return <NotFoundModule />
  }
}
