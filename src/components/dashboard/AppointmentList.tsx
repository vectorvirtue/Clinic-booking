import { useNavigate } from 'react-router-dom'

const appointments = [
  { initials: 'AM', name: 'Amara Mensah', type: 'General consultation', provider: 'Dr. Ade Okafor', time: '09:00 AM', color: 'bg-rose-100 text-rose-700', status: 'Confirmed' },
  { initials: 'KO', name: 'Kelechi Okoro', type: 'Follow-up visit', provider: 'Dr. Chidi Nwosu', time: '09:30 AM', color: 'bg-sky-100 text-sky-700', status: 'Confirmed' },
  { initials: 'ZI', name: 'Zara Ibrahim', type: 'Dental cleaning', provider: 'Dr. Adaeze Bello', time: '10:15 AM', color: 'bg-amber-100 text-amber-700', status: 'Pending' },
  { initials: 'TO', name: 'Tomiwa Ojo', type: 'General consultation', provider: 'Dr. Ade Okafor', time: '11:00 AM', color: 'bg-emerald-100 text-emerald-700', status: 'Confirmed' },
]

export function AppointmentList() {
  const navigate = useNavigate()

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_2px_8px_rgba(27,20,45,0.04)]">
      <div className="flex items-center justify-between gap-3 px-5 py-5 sm:px-6">
        <div><h2 className="text-sm font-semibold text-slate-900">Today&apos;s appointments</h2><p className="mt-1 text-xs text-slate-500">Your clinic schedule at a glance</p></div>
        <button className="inline-flex items-center gap-1 text-xs font-semibold text-[#294878] hover:text-[#203b63]" onClick={() => navigate('/appointments')}>View all <span aria-hidden="true">›</span></button>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[670px]">
          <div className="grid grid-cols-[1.5fr_1.15fr_0.7fr_0.75fr] border-y border-slate-100 bg-slate-50/60 px-6 py-3 text-[9px] font-bold tracking-[0.12em] text-slate-400"><span>PATIENT</span><span>PROVIDER</span><span>TIME</span><span>STATUS</span></div>
          {appointments.map((appointment) => (
            <div className="grid grid-cols-[1.5fr_1.15fr_0.7fr_0.75fr] items-center border-b border-slate-100 px-6 py-3.5 last:border-0" key={appointment.name}>
              <div className="flex items-center gap-3">
                <span className={`grid size-9 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${appointment.color}`}>{appointment.initials}</span>
                <span className="flex min-w-0 flex-col"><strong className="truncate text-xs font-semibold text-slate-800">{appointment.name}</strong><small className="mt-0.5 truncate text-[10px] text-slate-400">{appointment.type}</small></span>
              </div>
              <span className="truncate pr-2 text-[11px] text-slate-600">{appointment.provider}</span>
              <span className="text-[11px] font-medium text-slate-700">{appointment.time}</span>
              <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${appointment.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}><i className={`size-1.5 rounded-full ${appointment.status === 'Confirmed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />{appointment.status}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}
