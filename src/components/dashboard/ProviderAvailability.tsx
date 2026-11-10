import { useNavigate } from 'react-router-dom'

const providers = [
  { initials: 'AO', name: 'Dr. Ade Okafor', role: 'General practitioner', slots: '6 / 8 slots', color: 'bg-rose-100 text-rose-700', progress: '75%' },
  { initials: 'CN', name: 'Dr. Chidi Nwosu', role: 'Cardiologist', slots: '4 / 8 slots', color: 'bg-sky-100 text-sky-700', progress: '50%' },
  { initials: 'AB', name: 'Dr. Adaeze Bello', role: 'Dentist', slots: '7 / 8 slots', color: 'bg-amber-100 text-amber-700', progress: '88%' },
]

export function ProviderAvailability() {
  const navigate = useNavigate()

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_8px_rgba(27,20,45,0.04)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-sm font-semibold text-slate-900">Provider availability</h2><p className="mt-1 text-xs text-slate-500">Today, October 14</p></div>
        <button className="inline-flex items-center gap-1 text-xs font-semibold text-[#294878] hover:text-[#203b63]" onClick={() => navigate('/availability')}>Manage <span aria-hidden="true">›</span></button>
      </div>
      <div className="mt-5 space-y-4">
        {providers.map((provider) => (
          <div className="flex items-center gap-3" key={provider.name}>
            <span className={`grid size-9 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${provider.color}`}>{provider.initials}</span>
            <span className="flex min-w-[125px] flex-1 flex-col"><strong className="text-xs font-semibold text-slate-800">{provider.name}</strong><small className="mt-0.5 text-[10px] text-slate-400">{provider.role}</small></span>
            <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 sm:block"><i className="block h-full rounded-full bg-[#829bbd]" style={{ width: provider.progress }} /></div>
            <span className="w-[66px] text-right text-[10px] font-medium text-slate-500">{provider.slots}</span>
          </div>
        ))}
      </div>
    </article>
  )
}
