import { useState } from 'react'
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
            <button type="button" onClick={openInquiry} className={HEADER_BUTTON}>
              문의사항
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container font-label-sm text-label-sm text-on-primary-container"
                  >
                    {user.name.slice(0, 1)}
                  </div>
                )}
                <button type="button" onClick={() => logout()} className={HEADER_BUTTON}>
                  로그아웃
                </button>
              </div>
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
