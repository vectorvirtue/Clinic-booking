import { useNavigate } from 'react-router-dom'
import { getLocalDate, formatTime, type AppointmentSlot } from '../../lib/clinic'

type AppointmentListProps = {
  slots: AppointmentSlot[]
  now: Date
  isLoading: boolean
}

export function AppointmentList({ slots, now, isLoading }: AppointmentListProps) {
  const navigate = useNavigate()
  const today = getLocalDate(now.toISOString())
  const appointments = slots
    .filter((slot) => getLocalDate(slot.start) === today && new Date(slot.start).getTime() >= now.getTime())
    .slice(0, 6)

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_2px_8px_rgba(27,20,45,0.04)]">
      <div className="flex items-center justify-between gap-3 px-5 py-5 sm:px-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Today&apos;s schedule</h2>
          <p className="mt-1 text-xs text-slate-500">Upcoming slots; booked slots are confirmed</p>
        </div>
        <button className="inline-flex items-center gap-1 text-xs font-semibold text-[#294878] hover:text-[#203b63]" onClick={() => navigate('/appointments')} type="button">
          View all <span aria-hidden="true">›</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[530px]">
          <div className="grid grid-cols-[1.4fr_1fr_0.8fr] border-y border-slate-100 bg-slate-50/60 px-6 py-3 text-[9px] font-bold tracking-[0.12em] text-slate-400">
            <span>PROVIDER</span><span>TIME</span><span>STATUS</span>
          </div>
          {isLoading ? (
            <p className="px-6 py-8 text-center text-xs text-slate-500" role="status">Loading today&apos;s schedule…</p>
          ) : appointments.length === 0 ? (
            <p className="px-6 py-8 text-center text-xs text-slate-500" role="status">No upcoming appointment slots today.</p>
          ) : appointments.map((slot) => (
            <div className="grid grid-cols-[1.4fr_1fr_0.8fr] items-center border-b border-slate-100 px-6 py-3.5 last:border-0" key={slot.id}>
              <span className="truncate pr-3 text-xs font-medium text-slate-700">{slot.provider}</span>
              <span className="text-[11px] font-medium text-slate-700">{formatTime(slot.start)} – {formatTime(slot.end)}</span>
              <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${slot.available ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700'}`}>
                <i className={`size-1.5 rounded-full ${slot.available ? 'bg-sky-500' : 'bg-emerald-500'}`} />
                {slot.available ? 'Available' : 'Booked'}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="border-t border-slate-100 px-6 py-3 text-[10px] text-slate-400">Patient details are available in Patients when you search by email.</p>
    </article>
  )
}
