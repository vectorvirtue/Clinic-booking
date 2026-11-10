import { useNavigate } from 'react-router-dom'
import { Icon } from '../Icon'

export function ReminderCard() {
  const navigate = useNavigate()

  return (
    <article className="relative overflow-hidden rounded-2xl bg-[#eaf0f7] p-6 sm:p-7">
      <span className="absolute -right-4 -top-8 text-[115px] leading-none text-[#c6d4e5]/70">✳</span>
      <p className="relative text-[9px] font-bold tracking-[0.16em] text-[#294878]">A LITTLE REMINDER</p>
      <h2 className="relative mt-4 max-w-[250px] text-xl font-semibold leading-snug tracking-tight text-slate-900">Great care starts with a great day.</h2>
      <p className="relative mt-3 max-w-[300px] text-xs leading-5 text-slate-600">You have 8 appointments waiting for confirmation. A quick review helps patients plan their visit.</p>
      <button className="relative mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#294878] hover:text-[#203b63]" onClick={() => navigate('/appointments')}>Review appointments <Icon name="arrow" size={15} /></button>
    </article>
  )
}
