import { AppointmentList } from '../components/dashboard/AppointmentList'
import { NewAppointmentDialog } from '../components/dashboard/NewAppointmentDialog'
import { ProviderAvailability } from '../components/dashboard/ProviderAvailability'
import { ReminderCard } from '../components/dashboard/ReminderCard'
import { StatCard } from '../components/dashboard/StatCard'
import { WeeklyOverview } from '../components/dashboard/WeeklyOverview'

export function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 md:px-8 lg:px-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-bold tracking-[0.16em] text-[#294878]">TUESDAY, OCTOBER 14, 2025</p>
          <h1 className="text-[26px] font-semibold tracking-tight text-slate-900 sm:text-[30px]">Good morning, Amara </h1>
          <p className="mt-1.5 text-sm text-slate-500">Here's what's happening at your clinic today.</p>
        </div>
        <NewAppointmentDialog />
      </div>

      <section aria-label="Clinic overview" className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <StatCard title="Appointments today" value="24" unit="appointments" icon="calendar" tone="navy" trend="12.5%" note="16 confirmed · 8 pending" />
        <StatCard title="Total patients" value="1,284" unit="patients" icon="users" tone="green" trend="8.2%" note="36 new this month" />
        <StatCard title="Available slots" value="38" unit="open slots" icon="clock" tone="orange" note="Across 5 providers" />
        <StatCard title="Completion rate" value="94.8" unit="%" icon="chart" tone="blue" trend="4.6%" note="Up 2.4% from last month" />
      </section>

      <section className="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,1fr)]">
        <AppointmentList />
        <WeeklyOverview />
      </section>

      <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <ProviderAvailability />
        <ReminderCard />
      </section>
    </div>
  )
}
