import { Icon, type IconName } from '../Icon'

type StatCardProps = {
  title: string
  value: string
  unit: string
  icon: IconName
  tone: 'navy' | 'green' | 'orange' | 'blue'
  trend?: string
  note: string
}

const toneStyles = {
  navy: { icon: 'bg-[#eaf0f7] text-[#294878]', dot: 'bg-[#294878]' },
  green: { icon: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  orange: { icon: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  blue: { icon: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
}

export function StatCard({ title, value, unit, icon, tone, trend, note }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_8px_rgba(27,20,45,0.04)]">
      <div className="flex items-center justify-between">
        <span className={`grid size-10 place-items-center rounded-xl ${toneStyles[tone].icon}`}><Icon name={icon} size={19} /></span>
        {trend ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">↗ {trend}</span> : <span className="text-[10px] font-medium text-slate-400">This week</span>}
      </div>
      <p className="mt-4 text-xs font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-[25px] font-semibold tracking-tight text-slate-900">{value}<span className="ml-1 text-xs font-normal tracking-normal text-slate-400">{unit}</span></p>
      <p className="mt-3 flex items-center gap-2 text-[10px] text-slate-500"><i className={`size-1.5 rounded-full ${toneStyles[tone].dot}`} />{note}</p>
    </article>
  )
}
