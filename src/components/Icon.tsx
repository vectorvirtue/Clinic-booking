export type IconName =
  | 'dashboard'
  | 'calendar'
  | 'clock'
  | 'users'
  | 'stethoscope'
  | 'chart'
  | 'settings'
  | 'help'
  | 'bell'
  | 'chevron'
  | 'menu'
  | 'plus'
  | 'arrow'

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const shared = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }

  switch (name) {
    case 'dashboard':
      return <svg {...shared}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></svg>
    case 'calendar':
      return <svg {...shared}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /><path d="m9 15 2 2 4-4" /></svg>
    case 'clock':
      return <svg {...shared}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
    case 'users':
      return <svg {...shared}><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    case 'stethoscope':
      return <svg {...shared}><path d="M6 3v5a4 4 0 0 0 8 0V3M4 3h4M12 3h4M10 12v2a6 6 0 0 0 12 0v-1" /><circle cx="20" cy="10" r="2" /><path d="M10 20H8a2 2 0 0 1-2-2v-1" /></svg>
    case 'chart':
      return <svg {...shared}><path d="M3 3v18h18M8 15l4-4 4 3 5-7" /><path d="M17 7h4v4" /></svg>
    case 'settings':
      return <svg {...shared}><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.8-.7a8 8 0 0 1-1.6.9l-.3 1.9h-2.8l-.3-1.9a8 8 0 0 1-1.6-.9l-1.8.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.9l-1.4-1.2 1.4-2.4 1.8.7a8 8 0 0 1 1.6-.9l.3-1.9h2.8l.3 1.9a8 8 0 0 1 1.6.9l1.8-.7 1.4 2.4-1.4 1.2a7 7 0 0 1-.1 1.8Z" /></svg>
    case 'help':
      return <svg {...shared}><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 1 1 4.3 1.7c-1 .9-1.9 1.3-1.9 2.8M12 17h.01" /></svg>
    case 'bell':
      return <svg {...shared}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
    case 'chevron':
      return <svg {...shared}><path d="m9 18 6-6-6-6" /></svg>
    case 'menu':
      return <svg {...shared}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
    case 'plus':
      return <svg {...shared}><path d="M12 5v14M5 12h14" /></svg>
    case 'arrow':
      return <svg {...shared}><path d="M7 17 17 7M7 7h10v10" /></svg>
  }
}
