import { useNavigate } from 'react-router-dom'
import { Icon } from '../Icon'
import type { AppointmentSlot } from '../../lib/clinic'

type ProviderAvailabilityProps = {
  slots: AppointmentSlot[]
  now: Date
  isLoading: boolean
}

export function ProviderAvailability({ slots, now, isLoading }: ProviderAvailabilityProps) {
  const navigate = useNavigate()
  const upcoming = slots.filter((slot) => new Date(slot.start).getTime() >= now.getTime())
  const providers = [...new Set(upcoming.map((slot) => slot.provider))].map((name) => {
    const providerSlots = upcoming.filter((slot) => slot.provider === name)
    const booked = providerSlots.filter((slot) => !slot.available).length
    return {
      name,
      total: providerSlots.length,
      open: providerSlots.length - booked,
      booked,
      progress: providerSlots.length === 0 ? 0 : (booked / providerSlots.length) * 100,
    }
  })

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_8px_rgba(27,20,45,0.04)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-sm font-semibold text-slate-900">Provider availability</h2><p className="mt-1 text-xs text-slate-500">Upcoming scheduled slots</p></div>
        <button className="inline-flex items-center gap-1 text-xs font-semibold text-[#294878] hover:text-[#203b63]" onClick={() => navigate('/availability')} type="button">
          Manage <span aria-hidden="true">›</span>
        </button>
      </div>
      {isLoading ? (
        <p className="mt-6 text-center text-xs text-slate-500" role="status">Loading providers…</p>
      ) : providers.length === 0 ? (
        <p className="mt-6 text-center text-xs text-slate-500" role="status">No providers have future slots.</p>
      ) : (
        <div className="mt-5 space-y-4">
          {providers.slice(0, 5).map((provider) => (
            <div className="flex items-center gap-3" key={provider.name}>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eaf0f7] text-[#294878]">
                <Icon name="stethoscope" size={16} />
              </span>
              <span className="flex min-w-[125px] flex-1 flex-col">
                <strong className="truncate text-xs font-semibold text-slate-800">{provider.name}</strong>
                <small className="mt-0.5 text-[10px] text-slate-400">{provider.open} open · {provider.booked} booked</small>
              </span>
              <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 sm:block">
                <i className="block h-full rounded-full bg-[#829bbd]" style={{ width: `${provider.progress}%` }} />
              </div>
              <span className="w-[66px] text-right text-[10px] font-medium text-slate-500">{provider.total} slots</span>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
