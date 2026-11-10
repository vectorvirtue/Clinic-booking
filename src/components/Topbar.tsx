import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Icon } from './Icon'
import { ProfileAvatar } from './ProfileAvatar'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/appointments': 'Appointments',
  '/availability': 'Availability',
  '/patients': 'Patients',
  '/providers': 'Providers',
  '/reports': 'Reports',
  '/settings': 'Settings',
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { pathname } = useLocation()
  const title = pageTitles[pathname] ?? 'Page not found'
  const [today] = useState(() => new Date().toLocaleDateString('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }))

  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-slate-100 bg-white/95 px-5 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <button className="grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden" aria-label="Open navigation" onClick={onMenuClick}><Icon name="menu" size={22} /></button>
        <div className="flex items-center gap-2 text-sm"><span className="hidden text-slate-400 sm:inline">Workspace</span><Icon name="chevron" size={14} /><strong className="font-semibold text-slate-800">{title}</strong></div>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden text-xs text-slate-500 lg:inline">{today}</span>
        <ProfileAvatar className="size-9 text-[11px]" name="Amara Okafor" initials="AO" />
      </div>
    </header>
  )
}
