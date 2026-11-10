import { useState } from 'react'
import { AppointmentList } from '../components/dashboard/AppointmentList'
import { NewAppointmentDialog } from '../components/dashboard/NewAppointmentDialog'
import { ProviderAvailability } from '../components/dashboard/ProviderAvailability'
import { ReminderCard } from '../components/dashboard/ReminderCard'
import { StatCard } from '../components/dashboard/StatCard'
import { WeeklyOverview } from '../components/dashboard/WeeklyOverview'
import { useClinicSlots } from '../hooks/useClinicSlots'
import { getLocalDate } from '../lib/clinic'

export function DashboardPage() {
  const { slots, isLoading, error, refresh } = useClinicSlots()
  const [now, setNow] = useState(() => new Date())
  const today = getLocalDate(now.toISOString())
  const todaysSlots = slots.filter((slot) => getLocalDate(slot.start) === today)
  const todaysBooked = todaysSlots.filter((slot) => !slot.available).length
  const todaysOpen = todaysSlots.filter(
    (slot) => slot.available && new Date(slot.start).getTime() >= now.getTime(),
  ).length
  const upcomingOpen = slots.filter(
    (slot) => slot.available && new Date(slot.start).getTime() >= now.getTime(),
  ).length
  const bookedCount = slots.filter((slot) => !slot.available).length
  const providerCount = new Set(slots.map((slot) => slot.provider)).size

  function refreshDashboard() {
    setNow(new Date())
    refresh()
  }

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 md:px-8 lg:px-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-bold tracking-[0.16em] text-[#294878]">
            {now.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
          </p>
          <h1 className="text-[26px] font-semibold tracking-tight text-slate-900">Clinic dashboard</h1>
          <p className="mt-1.5 text-sm text-slate-500">A live view of bookings and appointment availability.</p>
        </div>
        <NewAppointmentDialog onBookingCreated={refreshDashboard} />
      </div>

      {error && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          <span>Could not load clinic data: {error}</span>
          <button className="font-semibold underline" onClick={refreshDashboard} type="button">Try again</button>
        </div>
      )}

      <section aria-label="Clinic overview" className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <StatCard title="Booked today" value={isLoading || error ? '—' : String(todaysBooked)} unit="appointments" icon="calendar" tone="navy" note={`${todaysOpen} future open today`} />
        <StatCard title="Available slots" value={isLoading || error ? '—' : String(upcomingOpen)} unit="upcoming" icon="clock" tone="orange" note="Future times patients can book" />
        <StatCard title="Confirmed bookings" value={isLoading || error ? '—' : String(bookedCount)} unit="total" icon="users" tone="green" note="Based on currently booked slots" />
        <StatCard title="Providers" value={isLoading || error ? '—' : String(providerCount)} unit="on schedule" icon="stethoscope" tone="blue" note="Providers represented in the slot schedule" />
      </section>

      <section className="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,1fr)]">
        <AppointmentList slots={slots} now={now} isLoading={isLoading} />
        <WeeklyOverview slots={slots} now={now} isLoading={isLoading} />
      </section>

      <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <ProviderAvailability slots={slots} now={now} isLoading={isLoading} />
        <ReminderCard openSlots={upcomingOpen} />
      </section>
    </div>
  )
}
