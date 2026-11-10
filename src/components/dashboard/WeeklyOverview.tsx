import { getLocalDate, getWeekStart, type AppointmentSlot } from '../../lib/clinic'

type WeeklyOverviewProps = {
  slots: AppointmentSlot[]
  now: Date
  isLoading: boolean
}

export function WeeklyOverview({ slots, now, isLoading }: WeeklyOverviewProps) {
  const weekStart = getWeekStart(now)
  const today = getLocalDate(now.toISOString())
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)
    const value = getLocalDate(date.toISOString())
    return {
      value,
      day: date.toLocaleDateString('en', { weekday: 'short' }),
      count: slots.filter((slot) => !slot.available && getLocalDate(slot.start) === value).length,
    }
  })
  const maxCount = Math.max(1, ...week.map((day) => day.count))
  const total = week.reduce((sum, day) => sum + day.count, 0)

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_8px_rgba(27,20,45,0.04)] sm:p-6">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Weekly overview</h2>
        <p className="mt-1 text-xs text-slate-500">Confirmed bookings by appointment date</p>
      </div>
      <div className="mt-6 flex items-end gap-2">
        <strong className="text-[27px] font-semibold tracking-tight text-slate-900">{isLoading ? '—' : total}</strong>
        <span className="pb-1 text-[11px] text-slate-500">booked this week</span>
      </div>
      <div className="relative mt-5 flex h-[174px] gap-2 pl-7">
        <div className="absolute inset-0 flex flex-col justify-between pb-7 text-[9px] text-slate-400" aria-hidden="true">
          {[maxCount, Math.ceil(maxCount * 2 / 3), Math.ceil(maxCount / 3), 0].map((value, index) => (
            <div className="flex items-center gap-2" key={`${value}-${index}`}>
              <span className="w-5 text-right">{value}</span><i className="flex-1 border-t border-dashed border-slate-200" />
            </div>
          ))}
        </div>
        <div className="relative z-10 ml-7 flex flex-1 items-end justify-around">
          {week.map((day) => (
            <div className="flex h-full flex-1 flex-col items-center justify-end gap-2" key={day.value}>
              <div className="flex h-[calc(100%-24px)] w-full items-end justify-center">
                <span
                  title={`${day.count} confirmed bookings`}
                  className={`w-[min(26px,65%)] rounded-t-md transition-colors ${day.value === today ? 'bg-[#294878]' : 'bg-[#c6d4e5]'}`}
                  style={{ height: `${day.count === 0 ? 0 : Math.max(5, (day.count / maxCount) * 100)}%` }}
                />
              </div>
              <span className={`text-[9px] ${day.value === today ? 'font-semibold text-[#294878]' : 'text-slate-400'}`}>{day.day}</span>
            </div>
          ))}
        </div>
      </div>
      {!isLoading && total === 0 && <p className="mt-2 text-center text-[10px] text-slate-400">No confirmed bookings for this week.</p>}
      <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-500"><i className="size-2 rounded-sm bg-[#294878]" /> Confirmed bookings</div>
    </article>
  )
}
