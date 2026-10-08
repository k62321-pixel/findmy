import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
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
          ) : (
            <BrandMark />
          )}
          <h1 className="line-clamp-2 break-keep font-headline-md text-[15px] leading-tight text-primary sm:text-headline-md">{title}</h1>
        </div>

        {actions ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={openInquiry}
              className="flex h-9 shrink-0 items-center gap-1 rounded-full px-3 font-label-sm text-label-sm text-on-surface-variant outline outline-1 outline-outline-variant transition-colors hover:bg-surface-variant"
            >
              <Icon name="support_agent" size={18} />
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
                <button
                  type="button"
                  onClick={() => logout()}
                  className="font-label-sm text-label-sm text-on-surface-variant transition-colors hover:text-on-surface"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-full bg-primary px-4 py-2 font-label-sm text-label-sm text-on-primary shadow-sm transition-transform active:scale-95"
              >
                로그인
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

function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary text-on-primary"
    >
      <Icon name="school" size={20} filled />
    </span>
  )
}
