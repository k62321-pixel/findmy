import { NavLink } from 'react-router-dom'
import { Icon } from './Icon'
import { useAuth } from '../store/AuthProvider'
import { useUnreadChatCount } from '../lib/chat'

const TABS = [
  { to: '/browse', label: '찾기', icon: 'search', end: false },
  { to: '/report', label: '신고하기', icon: 'add_circle', end: false },
  { to: '/chats', label: '채팅', icon: 'forum', end: false },
  { to: '/my-items', label: '내 물건', icon: 'inventory_2', end: false },
]

const ADMIN_TAB = { to: '/admin', label: '관리자', icon: 'admin_panel_settings', end: false }

export function BottomNav() {
  const { user } = useAuth()
  const unread = useUnreadChatCount(!!user)
  const tabs = user?.isAdmin ? [...TABS, ADMIN_TAB] : TABS

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 bg-surface-container-lowest pb-safe shadow-bar-top">
      <div className="mx-auto flex h-16 max-w-container items-center justify-around px-margin-mobile">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex h-14 w-16 flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? 'text-on-surface' : 'text-outline hover:text-on-surface-variant'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative flex h-7 w-14 items-center justify-center">
                  <Icon name={tab.icon} filled={isActive} />
                  {tab.to === '/chats' && unread > 0 ? (
                    <span
                      aria-label={`읽지 않은 채팅 ${unread}개`}
                      className="absolute right-2 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-none text-on-error"
                    >
                      {unread > 9 ? '9+' : unread}
                    </span>
                  ) : null}
                </span>
                <span className={`text-[11px] leading-4 ${isActive ? 'font-semibold' : ''}`}>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
