import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { ItemThumb } from '../components/ItemThumb'
import { LoadError } from '../components/LoadError'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { byNewestFirst } from '../lib/filter'
import { formatRelative } from '../lib/format'
import { useAuth } from '../store/AuthProvider'
import { useItems } from '../store/ItemsProvider'
import type { ItemStatus, LostItem } from '../types'

type Tab = 'reported' | 'claimed' | 'saved'
type StatusFilter = 'all' | ItemStatus

const STATUS_TEXT: Record<ItemStatus, { label: string; className: string }> = {
  stored: { label: '보관중', className: 'text-on-surface' },
  requested: { label: '수령 신청중', className: 'text-primary' },
  returned: { label: '반환완료', className: 'text-outline' },
}

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'stored', label: '보관중' },
  { id: 'requested', label: '신청중' },
  { id: 'returned', label: '반환완료' },
]

/** "내 상점"-style page: profile, underline tabs, status chips, then a row list. */
export function MyItemsPage() {
  const { user } = useAuth()
  const { items, status } = useItems()
  const [tab, setTab] = useState<Tab>('reported')
  const [filter, setFilter] = useState<StatusFilter>('all')

  const reported = items.filter((it) => it.reportedByMe).sort(byNewestFirst)
  const claimed = items.filter((it) => it.claimedByMe).sort(byNewestFirst)
  const saved = items.filter((it) => it.savedByMe).sort(byNewestFirst)
  const inTab = tab === 'reported' ? reported : tab === 'claimed' ? claimed : saved
  const visible = filter === 'all' ? inTab : inTab.filter((it) => it.status === filter)
  const returnedCount = reported.filter((it) => it.status === 'returned').length

  function switchTab(next: Tab) {
    setTab(next)
    setFilter('all')
  }

  return (
    <AppShell title="내 물건">
      <div className="mx-auto w-full max-w-[760px]">
        {/* Profile */}
        <section className="flex items-center gap-4 px-margin-mobile pb-5 pt-6">
          {user?.picture ? (
            <img
              src={user.picture}
              alt=""
              referrerPolicy="no-referrer"
              className="h-16 w-16 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-on-surface text-[24px] font-bold text-white">
              {user?.name.slice(0, 1)}
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[20px] font-bold text-on-surface">{user?.name}</span>
            <span className="truncate text-[13px] text-outline">{user?.email}</span>
          </div>
        </section>

        {/* Small numbers row */}
        <dl className="mx-margin-mobile grid grid-cols-3 rounded-lg bg-surface-container-low py-3 text-center">
          <Stat label="신고한 물건" value={reported.length} />
          <Stat label="주인 찾아줌" value={returnedCount} />
          <Stat label="수령 신청" value={claimed.length} />
        </dl>

        {/* Underline tabs */}
        <div role="tablist" className="mt-6 flex border-b border-outline-variant">
          <TabButton active={tab === 'reported'} onClick={() => switchTab('reported')}>
            신고한 물건 <span className="ml-1 font-normal">{reported.length}</span>
          </TabButton>
          <TabButton active={tab === 'claimed'} onClick={() => switchTab('claimed')}>
            수령 신청 <span className="ml-1 font-normal">{claimed.length}</span>
          </TabButton>
          <TabButton active={tab === 'saved'} onClick={() => switchTab('saved')}>
            저장 <span className="ml-1 font-normal">{saved.length}</span>
          </TabButton>
        </div>

        {/* Status chips */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-margin-mobile py-3">
          {FILTERS.map((f) => {
            const active = filter === f.id
            const count = f.id === 'all' ? inTab.length : inTab.filter((it) => it.status === f.id).length
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.id)}
                className={`flex h-8 shrink-0 items-center rounded-full border px-3 text-[13px] transition-colors ${
                  active
                    ? 'border-on-surface bg-on-surface font-semibold text-white'
                    : 'border-outline-variant text-on-surface-variant hover:border-outline'
                }`}
              >
                {f.label} {count}
              </button>
            )
          })}
        </div>

        <div className="px-margin-mobile pb-10">
          {status === 'loading' ? (
            <LoadingSpinner />
          ) : status === 'error' ? (
            <LoadError />
          ) : visible.length > 0 ? (
            <ul className="flex flex-col">
              {visible.map((item) => (
                <MyItemRow key={item.id} item={item} mine={tab} />
              ))}
            </ul>
          ) : (
            <div className="pt-4">
              <EmptyState
                icon={tab === 'reported' ? 'inventory_2' : tab === 'claimed' ? 'handshake' : 'bookmark'}
                title={
                  filter !== 'all'
                    ? '해당 상태의 물건이 없습니다'
                    : tab === 'reported'
                      ? '신고한 습득물이 없습니다'
                      : tab === 'claimed'
                        ? '수령 신청한 물건이 없습니다'
                        : '저장한 물건이 없습니다'
                }
                description={
                  filter !== 'all'
                    ? undefined
                    : tab === 'reported'
                      ? '학교에서 물건을 주우셨다면 신고해 주세요. 주인을 찾는 가장 빠른 방법입니다.'
                      : tab === 'claimed'
                        ? '잃어버린 물건을 목록에서 찾아 "내 물건 찾기"로 수령을 신청하세요.'
                        : '내 것 같은 물건은 상세 화면의 "저장" 버튼으로 모아 두세요. 다른 기기에서도 보입니다.'
                }
                action={
                  filter === 'all' ? (
                    <Link
                      to={tab === 'reported' ? '/report' : '/browse'}
                      className="mt-2 rounded bg-primary px-6 py-3 text-[14px] font-bold text-on-primary"
                    >
                      {tab === 'reported' ? '습득물 신고하기' : '습득물 둘러보기'}
                    </Link>
                  ) : undefined
                }
              />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

/** What the user should do next about this item, if anything. */
function nextStep(item: LostItem, mine: Tab): string | null {
  if (mine === 'saved') {
    if (item.status === 'stored') return '내 것이 맞다면 상세 화면에서 "내 물건 찾기"를 눌러 주세요.'
    if (item.status === 'requested' && !item.claimedByMe) return '다른 사람이 수령을 신청한 물건이에요.'
    return null
  }
  if (mine === 'reported') {
    if (item.status === 'requested') return '주인이 수령을 신청했어요. 교무실에서 확인 중이에요.'
    if (item.status === 'stored') return '아직 교무실에 맡기지 않았다면 가져다주세요.'
    return null
  }
  if (item.status === 'requested') return `${item.storage}에서 학생증을 보여주고 받아 가세요.`
  if (item.status === 'returned') return '돌려받은 물건이에요.'
  return null
}

function MyItemRow({ item, mine }: { item: LostItem; mine: Tab }) {
  const status = STATUS_TEXT[item.status] ?? STATUS_TEXT.stored
  const step = nextStep(item, mine)
  const returned = item.status === 'returned'

  return (
    <li>
      <Link
        to={`/items/${item.id}`}
        className="flex gap-4 border-b border-outline-variant py-4 transition-colors hover:bg-surface-container-low"
      >
        <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-md bg-surface-container">
          <ItemThumb src={item.imageUrl} alt={item.name} category={item.category} className="h-full w-full" glyphSize={30} />
          {returned ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-[12px] font-bold text-white">
              반환완료
            </div>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className={`truncate text-[15px] ${returned ? 'text-outline' : 'text-on-surface'}`}>{item.name}</span>
          <span className={`mt-0.5 text-[16px] font-bold ${status.className}`}>{status.label}</span>
          <span className="mt-0.5 truncate text-[12px] text-outline">
            {item.location} · {formatRelative(item.foundAt)}
          </span>
          {step ? (
            <span className="mt-2 flex items-start gap-1 text-[12px] leading-4 text-on-surface-variant">
              <Icon name="info" size={14} className="mt-px shrink-0 text-outline" />
              <span className="break-keep">{step}</span>
            </span>
          ) : null}
        </div>
        <Icon name="chevron_right" className="self-center text-outline" />
      </Link>
    </li>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5 border-r border-outline-variant last:border-r-0">
      <dd className="text-[18px] font-bold text-on-surface">{value}</dd>
      <dt className="order-first text-[12px] text-on-surface-variant">{label}</dt>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative h-12 flex-1 text-[15px] font-bold transition-colors ${
        active ? 'text-on-surface' : 'text-outline hover:text-on-surface-variant'
      }`}
    >
      {children}
      {active ? <span className="absolute inset-x-0 -bottom-px h-[2px] bg-on-surface" /> : null}
    </button>
  )
}
