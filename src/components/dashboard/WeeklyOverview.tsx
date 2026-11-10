const week = [
  { day: 'Mon', count: 18 },
  { day: 'Tue', count: 25 },
  { day: 'Wed', count: 20 },
  { day: 'Thu', count: 31 },
  { day: 'Fri', count: 23 },
  { day: 'Sat', count: 12 },
  { day: 'Sun', count: 7 },
]

export function WeeklyOverview() {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_8px_rgba(27,20,45,0.04)] sm:p-6">
      <div className="flex items-start justify-between">
        <div><h2 className="text-sm font-semibold text-slate-900">Weekly overview</h2><p className="mt-1 text-xs text-slate-500">Appointment volume this week</p></div>
        <button className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-medium text-slate-600">This week <span aria-hidden="true">⌄</span></button>
      </div>
      <div className="mt-6 flex items-end gap-2"><strong className="text-[27px] font-semibold tracking-tight text-slate-900">136</strong><span className="pb-1 text-[11px] text-slate-500">total appointments</span><span className="mb-1 ml-auto text-[10px] font-semibold text-emerald-600">↗ 9.3%</span></div>
      <div className="relative mt-5 flex h-[174px] gap-2 pl-7">
        <div className="absolute inset-0 flex flex-col justify-between pb-7 text-[9px] text-slate-400">
          {[30, 20, 10, 0].map((value) => <div className="flex items-center gap-2" key={value}><span className="w-5 text-right">{value}</span><i className="flex-1 border-t border-dashed border-slate-200" /></div>)}
        </div>
        <div className="relative z-10 ml-7 flex flex-1 items-end justify-around">
          {week.map((day) => (
            <div className="flex h-full flex-1 flex-col items-center justify-end gap-2" key={day.day}>
              <div className="flex h-[calc(100%-24px)] w-full items-end justify-center"><span title={`${day.count} appointments`} className={`w-[min(26px,65%)] rounded-t-md transition-colors ${day.day === 'Tue' ? 'bg-[#294878]' : 'bg-[#c6d4e5] hover:bg-[#9eb3ce]'}`} style={{ height: `${(day.count / 32) * 100}%` }} /></div>
              <span className={`text-[9px] ${day.day === 'Tue' ? 'font-semibold text-[#294878]' : 'text-slate-400'}`}>{day.day}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-500"><i className="size-2 rounded-sm bg-[#294878]" /> Appointments</div>
    </article>
  )
}
