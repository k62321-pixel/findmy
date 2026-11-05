import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from './Icon'
import { InquiryDialog } from './InquiryDialog'
import { useAuth } from '../store/AuthProvider'

interface Tile {
  label: string
  icon: string
  /** Icon colour — each tile gets its own so the row reads at a glance. */
  color: string
  to?: string
  action?: 'inquiry' | 'desk'
}

const TILES: Tile[] = [
  { label: '습득물 신고', icon: 'add_a_photo', color: '#e8384f', to: '/report' },
  { label: '내 물건', icon: 'inventory_2', color: '#3b82f6', to: '/my-items' },
  { label: '채팅', icon: 'forum', color: '#16a34a', to: '/chats' },
  { label: '새로 들어온', icon: 'new_releases', color: '#f59e0b', to: '#items' },
  { label: '교무실 안내', icon: 'meeting_room', color: '#8b5cf6', action: 'desk' },
  { label: '문의하기', icon: 'support_agent', color: '#0ea5a4', action: 'inquiry' },
]

const TILE_BOX =
  'flex aspect-square w-full max-w-[96px] items-center justify-center rounded-[22%] bg-surface-container-low transition-colors group-hover:bg-surface-container'
const TILE_LABEL = 'w-full truncate text-center text-[12px] leading-4 text-on-surface md:text-[14px] md:leading-5'

/** Marketplace-style shortcut row under the banner. */
export function ShortcutTiles() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [dialog, setDialog] = useState<'inquiry' | 'desk' | null>(null)

  function open(action: 'inquiry' | 'desk') {
    if (action === 'inquiry' && !user) {
      navigate('/login', { state: { from: location } })
      return
    }
    setDialog(action)
  }

  return (
    <>
      <ul className="mx-auto grid w-full max-w-[720px] grid-cols-6 gap-x-2 md:gap-x-6">
        {TILES.map((tile) => {
          const body = (
            <>
              <span className={TILE_BOX}>
                <Icon name={tile.icon} size={30} filled className="md:!text-[38px]" />
              </span>
              <span className={TILE_LABEL}>{tile.label}</span>
            </>
          )
          const cls = 'group flex min-w-0 flex-col items-center gap-2'
          return (
            <li key={tile.label} style={{ color: tile.color }}>
              {tile.action ? (
                <button type="button" onClick={() => open(tile.action!)} className={`${cls} w-full`}>
                  {body}
                </button>
              ) : tile.to!.startsWith('#') ? (
                <a href={tile.to} className={cls}>
                  {body}
                </a>
              ) : (
                <Link to={tile.to!} className={cls}>
                  {body}
                </Link>
              )}
            </li>
          )
        })}
      </ul>

      {dialog === 'inquiry'
        ? createPortal(<InquiryDialog onClose={() => setDialog(null)} />, document.body)
        : null}
      {dialog === 'desk' ? createPortal(<DeskDialog onClose={() => setDialog(null)} />, document.body) : null}
    </>
  )
}

function DeskDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="desk-title"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-surface-container-lowest p-6"
      >
        <h2 id="desk-title" className="text-[18px] font-bold text-on-surface">
          교무실 안내
        </h2>
        <dl className="grid grid-cols-[72px_1fr] gap-y-2 text-[15px]">
          <dt className="text-outline">장소</dt>
          <dd className="text-on-surface">1층 교무실</dd>
          <dt className="text-outline">운영 시간</dt>
          <dd className="text-on-surface">평일 09:00 - 17:00</dd>
          <dt className="text-outline">준비물</dt>
          <dd className="text-on-surface">학생증 (본인 확인용)</dd>
        </dl>
        <p className="break-keep text-[13px] leading-5 text-on-surface-variant">
          주운 물건은 신고 후 교무실에 맡겨 주세요. 주인은 ‘내 물건 찾기’로 신청한 뒤 교무실에서 받아 갑니다.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded bg-primary text-[15px] font-bold text-on-primary"
        >
          확인
        </button>
      </div>
    </div>
  )
}
