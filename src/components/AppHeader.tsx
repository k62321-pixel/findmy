import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from './Icon'
import { InquiryDialog } from './InquiryDialog'
import { useAuth } from '../store/AuthProvider'

interface AppHeaderProps {
  title: string
  /** Shows a back arrow instead of the brand mark. */
  back?: boolean
  /** Inquiry button + account area on the right. */
  actions?: boolean
}

/** Bold wordmark with only slightly tightened spacing so Hangul doesn't look cramped. */
const TITLE =
  'truncate font-body-md text-[18px] font-extrabold leading-none tracking-[-0.02em] text-on-surface sm:text-[21px]'

/** Plain bordered box with bold dark text — the marketplace-style header button. */
const HEADER_BUTTON =
  'flex h-9 shrink-0 items-center whitespace-nowrap rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-[13px] font-bold text-on-surface transition-colors hover:bg-surface-container-low sm:h-11 sm:px-5 sm:text-[15px]'

export function AppHeader({ title, back = false, actions = true }: AppHeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [inquiring, setInquiring] = useState(false)

  function openInquiry() {
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }
    setInquiring(true)
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-surface/80 pt-safe shadow-bar backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-container items-center justify-between px-margin-mobile">
        <div className="flex min-w-0 items-center gap-unit">
          {back ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="뒤로 가기"
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-variant"
            >
              <Icon name="arrow_back" />
            </button>
          ) : null}
          {back ? (
            <h1 className={TITLE}>{title}</h1>
          ) : (
            // Crest + name act as the home button: back to a fresh browse screen.
            <Link
              to="/browse"
              state={{ home: Date.now() }}
              aria-label="처음 화면으로"
              className="flex min-w-0 items-center gap-unit"
            >
              <BrandMark />
              <h1 className={TITLE}>{title}</h1>
            </Link>
          )}
        </div>

        {actions ? (
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Icon-only on phones so the school name keeps its room. */}
            <button type="button" onClick={openInquiry} aria-label="문의사항" className={`${HEADER_BUTTON} max-sm:w-9 max-sm:justify-center max-sm:px-0`}>
              <Icon name="support_agent" size={20} className="sm:hidden" />
              <span className="hidden sm:inline">문의사항</span>
            </button>

            {user ? (
              <ProfileMenu name={user.name} email={user.email} picture={user.picture} onLogout={logout} />
            ) : (
              <button type="button" onClick={() => navigate('/login')} className={HEADER_BUTTON}>
                <span className="sm:hidden">로그인</span>
                <span className="hidden sm:inline">로그인/회원가입</span>
              </button>
            )}
          </div>
        ) : null}
      </div>
      {/* Portaled: the header's backdrop-filter would otherwise confine the fixed overlay. */}
      {inquiring ? createPortal(<InquiryDialog onClose={() => setInquiring(false)} />, document.body) : null}
    </header>
  )
}

/**
 * Signed-in account: one avatar button at the far right that opens a small menu,
 * instead of an avatar wedged between the header buttons.
 */
function ProfileMenu({
  name,
  email,
  picture,
  onLogout,
}: {
  name: string
  email: string
  picture?: string
  onLogout: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const avatar = picture ? (
    <img src={picture} alt="" referrerPolicy="no-referrer" className="h-full w-full rounded-full object-cover" />
  ) : (
    <span className="flex h-full w-full items-center justify-center rounded-full bg-on-surface text-[14px] font-bold text-white">
      {name.slice(0, 1)}
    </span>
  )

  const item = 'flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[14px] text-on-surface hover:bg-surface-container-low'

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="내 계정 메뉴"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant p-0.5 transition-colors hover:border-outline sm:h-11 sm:w-11"
      >
        {avatar}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-md border border-outline-variant bg-surface-container-lowest py-1 shadow-level2">
          <div className="flex items-center gap-3 border-b border-outline-variant px-4 py-3">
            <span className="h-10 w-10 shrink-0">{avatar}</span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[15px] font-bold text-on-surface">{name}</span>
              <span className="truncate text-[12px] text-outline">{email}</span>
            </div>
          </div>
          <Link to="/my-items" onClick={() => setOpen(false)} className={item}>
            <Icon name="inventory_2" size={20} className="text-outline" />내 물건
          </Link>
          <Link to="/saved" onClick={() => setOpen(false)} className={item}>
            <Icon name="favorite" size={20} className="text-outline" />찜한 물건
          </Link>
          <Link to="/chats" onClick={() => setOpen(false)} className={item}>
            <Icon name="forum" size={20} className="text-outline" />채팅
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              void onLogout()
            }}
            className={`${item} border-t border-outline-variant`}
          >
            <Icon name="logout" size={20} className="text-outline" />로그아웃
          </button>
        </div>
      ) : null}
    </div>
  )
}

/** School crest; absolute path so it resolves on nested routes like /items/:id. */
function BrandMark() {
  return (
    <img
      src="/image-removebg-preview(2).png"
      alt=""
      aria-hidden="true"
      className="h-9 w-9 shrink-0 object-contain"
    />
  )
}
