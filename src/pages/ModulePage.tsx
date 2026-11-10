import { useNavigate } from 'react-router-dom'
import { Icon, type IconName } from '../components/Icon'

const moduleIcons: Record<string, IconName> = {
  Appointments: 'calendar',
  Availability: 'clock',
  Patients: 'users',
  Providers: 'stethoscope',
  Reports: 'chart',
  Settings: 'settings',
}

export function ModulePage({ title }: { title: string }) {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-[calc(100vh-68px)] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-[#eaf0f7] text-[#294878]"><Icon name={moduleIcons[title] ?? 'dashboard'} size={28} /></span>
      <p className="mt-6 text-[10px] font-bold tracking-[0.16em] text-[#294878]">CLINIC WORKSPACE</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">Your {title.toLowerCase()} workspace is ready. This module will connect to your clinic booking API.</p>
      <button className="mt-6 rounded-xl bg-[#294878] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#203b63]" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
    </div>
  )
}
