import { NavLink } from 'react-router-dom'
import { Home, Inbox, FolderKanban, Search } from 'lucide-react'

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/inbox', label: 'Inbox', icon: Inbox, end: false },
  { to: '/projects', label: 'Projects', icon: FolderKanban, end: false },
  { to: '/search', label: 'Search', icon: Search, end: false },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-slate-950/90 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            <Icon size={20} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
