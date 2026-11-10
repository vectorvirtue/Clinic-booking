import { NavLink } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import { ProfileAvatar } from './ProfileAvatar'

const modules: { label: string; to: string; icon: IconName; group: 'Workspace' | 'Manage' }[] = [
  { label: 'Dashboard', to: '/dashboard', icon: 'dashboard', group: 'Workspace' },
  { label: 'Appointments', to: '/appointments', icon: 'calendar', group: 'Workspace' },
  { label: 'Availability', to: '/availability', icon: 'clock', group: 'Workspace' },
  { label: 'Patients', to: '/patients', icon: 'users', group: 'Manage' },
  { label: 'Providers', to: '/providers', icon: 'stethoscope', group: 'Manage' },
  { label: 'Reports', to: '/reports', icon: 'chart', group: 'Manage' },
  { label: 'Settings', to: '/settings', icon: 'settings', group: 'Manage' },
]

type SidebarProps = {
  open: boolean
  onNavigate: () => void
}

export function Sidebar({ open, onNavigate }: SidebarProps) {
  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-slate-100 bg-white px-5 transition-transform duration-200 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <NavLink
        className="flex h-[88px] shrink-0 items-center gap-3 border-b border-slate-100 px-2 no-underline"
        to="/dashboard"
        onClick={onNavigate}
      >
        <img className="size-10 rounded-[14px]" src="/favicon.svg" alt="" />
        <span className="flex flex-col leading-tight">
          <strong className="text-[21px] font-bold tracking-tight text-slate-900">Wellnest</strong>
          <small className="mt-1 text-[9px] font-bold tracking-[0.2em] text-slate-400">CLINIC ADMIN</small>
        </span>
      </NavLink>

    
      <nav className="mt-8 flex-1" aria-label="Main navigation">
        {(['Workspace', 'Manage'] as const).map((group) => (
          <div className={group === 'Manage' ? 'mt-8' : ''} key={group}>
            <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.14em] text-slate-400">{group.toUpperCase()}</p>
            <div className="space-y-1">
              {modules.filter((module) => module.group === group).map((module) => (
                <NavLink
                  className={({ isActive }) => `flex w-full items-center gap-3 rounded-xl px-3 py-[11px] text-[13px] font-medium transition-colors ${isActive ? 'bg-[#eaf0f7] text-[#294878]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                  end
                  key={module.label}
                  onClick={onNavigate}
                  to={module.to}
                >
                  {() => (
                    <>
                      <Icon name={module.icon} size={19} />
                      <span className="flex-1 text-left">{module.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto pb-4">
        <button className="mb-4 flex w-full items-center gap-3 rounded-xl bg-[#f1f5fa] p-3 text-left transition hover:bg-[#eaf0f7]">
          <span className="grid size-9 place-items-center rounded-lg bg-white text-[#294878] shadow-sm"><Icon name="help" size={18} /></span>
          <span className="flex-1"><strong className="block text-xs font-semibold text-slate-700">Need a hand?</strong><small className="text-[11px] text-slate-500">Visit our help center</small></span>
          <Icon name="arrow" size={15} />
        </button>
        <button className="flex w-full items-center gap-3 border-t border-slate-100 px-1 pt-4 text-left">
          <ProfileAvatar className="size-10 text-xs" name="Amara Okafor" initials="AO" />
          <span className="flex min-w-0 flex-1 flex-col"><strong className="truncate text-xs font-semibold text-slate-800">Amara Okafor</strong><small className="mt-0.5 text-[11px] text-slate-400">Clinic administrator</small></span>
          <Icon name="chevron" size={16} />
        </button>
      </div>
    </aside>
  )
}
