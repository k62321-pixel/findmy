import { NavLink } from 'react-router-dom'
import { Icon } from './Icon'

const TABS = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/report', label: 'Report', icon: 'add_circle', end: false },
  { to: '/my-items', label: 'My Items', icon: 'inventory_2', end: false },
]

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 bg-surface/90 pb-safe shadow-bar-top backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-container items-center justify-around px-margin-mobile">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex h-14 w-20 flex-col items-center justify-center gap-1 rounded-md transition-colors ${
                isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={tab.icon} filled={isActive} />
                <span className="font-label-sm text-label-sm">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
