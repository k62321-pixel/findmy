import { NavLink } from 'react-router-dom'
import { Icon } from './Icon'
import { useAuth } from '../store/AuthProvider'

const TABS = [
  { to: '/', label: '홈', icon: 'home', end: true },
  { to: '/report', label: '신고하기', icon: 'add_circle', end: false },
  { to: '/browse', label: '찾기', icon: 'search', end: false },
  { to: '/my-items', label: '내 물건', icon: 'inventory_2', end: false },
]

const ADMIN_TAB = { to: '/admin', label: '관리자', icon: 'admin_panel_settings', end: false }

export function BottomNav() {
  const { user } = useAuth()
  const tabs = user?.isAdmin ? [...TABS, ADMIN_TAB] : TABS

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 bg-surface/90 pb-safe shadow-bar-top backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-container items-center justify-around px-margin-mobile">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex h-14 w-16 flex-col items-center justify-center gap-0.5 rounded-md transition-colors ${
                isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${
                    isActive ? 'bg-primary-fixed' : ''
                  }`}
                >
                  <Icon name={tab.icon} filled={isActive} />
                </span>
                <span className="font-label-sm text-label-sm">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
