import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import { isToday, matchKeywords } from '../lib/matching'
import { useAlertsSeenAt, useKeywords, useRecentlyViewed, useSavedItems } from '../lib/recent'
import { useItems } from '../store/ItemsProvider'

const TILE_BOX =
  'relative flex aspect-square w-full max-w-[96px] items-center justify-center rounded-[22%] bg-surface-container-low transition-colors group-hover:bg-surface-container'
const TILE_LABEL = 'w-full truncate text-center text-[13px] leading-4 text-on-surface md:text-[14px] md:leading-5'
const TILE = 'group flex w-full min-w-0 flex-col items-center gap-2'

/** Shortcut row under the banner — each tile opens one of the finder tools. */
export function ShortcutTiles() {
  const { items } = useItems()
  const saved = useSavedItems()
  const recent = useRecentlyViewed()
  const keywords = useKeywords()
  const seenAt = useAlertsSeenAt()
  const [deskOpen, setDeskOpen] = useState(false)

  // Keyword matches that appeared since the alerts page was last opened.
  const newMatches = matchKeywords(items, keywords).filter(
    (it) => !seenAt || new Date(it.foundAt) > new Date(seenAt),
  ).length
  const todayCount = items.filter((it) => isToday(it.foundAt)).length

  // `short` is what fits under a tile on a phone (six tiles share ~360px there).
  const tiles = [
    { label: '찜한 물건', short: '찜', icon: 'favorite', color: '#e8384f', to: '/saved', badge: 0, note: saved.length },
    { label: '최근 본 물건', short: '최근 본', icon: 'history', color: '#3b82f6', to: '/recent', badge: 0, note: recent.length },
    { label: '키워드 알림', short: '키워드', icon: 'notifications_active', color: '#f59e0b', to: '/alerts', badge: newMatches, note: 0 },
    { label: '오늘 들어온', short: '오늘', icon: 'today', color: '#16a34a', to: '/today', badge: 0, note: todayCount },
    { label: '장소별 찾기', short: '장소별', icon: 'location_on', color: '#8b5cf6', to: '/places', badge: 0, note: 0 },
  ]

  return (
    <>
      <ul className="mx-auto grid w-full max-w-[720px] grid-cols-6 gap-x-2 md:gap-x-6">
        {tiles.map((tile) => (
          <li key={tile.label} style={{ color: tile.color }}>
            <Link to={tile.to} className={TILE}>
              <span className={TILE_BOX}>
                <Icon name={tile.icon} size={30} filled className="md:!text-[38px]" />
                {tile.badge > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-on-primary">
                    {tile.badge > 9 ? '9+' : tile.badge}
                  </span>
                ) : null}
              </span>
              <span className={TILE_LABEL}>
                <span className="md:hidden">{tile.short}</span>
                <span className="hidden md:inline">{tile.label}</span>
                {tile.note > 0 ? <span className="ml-0.5 hidden text-outline md:inline">{tile.note}</span> : null}
              </span>
            </Link>
          </li>
        ))}
        <li style={{ color: '#0ea5a4' }}>
          <button type="button" onClick={() => setDeskOpen(true)} className={TILE}>
            <span className={TILE_BOX}>
              <Icon name="meeting_room" size={30} filled className="md:!text-[38px]" />
            </span>
            <span className={TILE_LABEL}>
              <span className="md:hidden">교무실</span>
              <span className="hidden md:inline">교무실 안내</span>
            </span>
          </button>
        </li>
      </ul>

      {deskOpen ? createPortal(<DeskDialog onClose={() => setDeskOpen(false)} />, document.body) : null}
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
        <button type="button" onClick={onClose} className="h-12 rounded bg-primary text-[15px] font-bold text-on-primary">
          확인
        </button>
      </div>
    </div>
  )
}
