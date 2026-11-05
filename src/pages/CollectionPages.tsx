import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { ItemCard } from '../components/ItemCard'
import { ItemThumb } from '../components/ItemThumb'
import { LoadError } from '../components/LoadError'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { byNewestFirst } from '../lib/filter'
import { groupByPlace, isToday, matchKeywords } from '../lib/matching'
import {
  MAX_KEYWORDS,
  markAlertsSeen,
  setKeywords,
  useAlertsSeenAt,
  useKeywords,
  useRecentlyViewed,
  useSavedItems,
} from '../lib/recent'
import { useItems } from '../store/ItemsProvider'
import type { LostItem } from '../types'

/** Shared frame: back-arrow header, a title + description, then the content. */
function Frame({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <AppShell title={title} back>
      <section className="flex flex-col gap-6 px-margin-mobile pb-10 pt-6 md:px-margin-desktop">
        <div className="flex flex-col gap-1">
          <h2 className="text-[20px] font-bold leading-7 text-on-surface">{title}</h2>
          <p className="break-keep text-[14px] leading-5 text-on-surface-variant">{description}</p>
        </div>
        {children}
      </section>
    </AppShell>
  )
}

function Grid({ items, empty }: { items: LostItem[]; empty: ReactNode }) {
  const { status } = useItems()
  if (status === 'loading') return <LoadingSpinner />
  if (status === 'error') return <LoadError />
  if (items.length === 0) return <>{empty}</>
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}

const browseLink = (
  <Link to="/browse" className="mt-2 rounded bg-primary px-6 py-3 text-[14px] font-bold text-on-primary">
    습득물 둘러보기
  </Link>
)

function useItemsByIds(ids: string[]): LostItem[] {
  const { getItem } = useItems()
  return ids.map((id) => getItem(id)).filter((it): it is LostItem => it !== undefined)
}

export function SavedPage() {
  const items = useItemsByIds(useSavedItems())
  return (
    <Frame title="찜한 물건" description="내 것 같은 물건을 ♥로 모아 두세요. 이 기기에만 저장됩니다.">
      <Grid
        items={items}
        empty={
          <EmptyState icon="favorite" title="찜한 물건이 없습니다" description="상세 화면의 ♥ 버튼을 눌러 보세요." action={browseLink} />
        }
      />
    </Frame>
  )
}

export function RecentPage() {
  const items = useItemsByIds(useRecentlyViewed())
  return (
    <Frame title="최근 본 물건" description="최근에 열어 본 물건이에요. 이 기기에만 저장됩니다.">
      <Grid items={items} empty={<EmptyState icon="history" title="최근 본 물건이 없습니다" action={browseLink} />} />
    </Frame>
  )
}

export function TodayPage() {
  const { items } = useItems()
  const today = items.filter((it) => isToday(it.foundAt)).sort(byNewestFirst)
  return (
    <Frame title="오늘 들어온 물건" description="오늘 새로 신고된 습득물이에요.">
      <Grid
        items={today}
        empty={<EmptyState icon="today" title="오늘 들어온 물건이 아직 없습니다" action={browseLink} />}
      />
    </Frame>
  )
}

export function PlacesPage() {
  const { items, status } = useItems()
  const groups = groupByPlace(items)
  return (
    <Frame title="장소별 찾기" description="어디서 잃어버렸는지 기억나면 그 장소부터 찾아보세요. 아직 주인을 못 찾은 물건만 셉니다.">
      {status === 'loading' ? (
        <LoadingSpinner />
      ) : status === 'error' ? (
        <LoadError />
      ) : groups.length === 0 ? (
        <EmptyState icon="location_off" title="보관 중인 물건이 없습니다" />
      ) : (
        <ul className="flex flex-col">
          {groups.map(({ place, items: list }) => (
            <li key={place}>
              <Link
                to={`/browse?q=${encodeURIComponent(place)}`}
                className="flex items-center gap-3 border-b border-outline-variant py-3 transition-colors hover:bg-surface-container-low"
              >
                <div className="flex -space-x-3">
                  {list.slice(0, 3).map((it) => (
                    <ItemThumb
                      key={it.id}
                      src={it.imageUrl}
                      alt=""
                      category={it.category}
                      className="h-11 w-11 rounded-md border-2 border-surface-container-lowest"
                      glyphSize={18}
                    />
                  ))}
                </div>
                <span className="flex-1 text-[16px] font-semibold text-on-surface">{place}</span>
                <span className="text-[14px] text-outline">{list.length}개</span>
                <Icon name="chevron_right" className="text-outline" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Frame>
  )
}

export function AlertsPage() {
  const { items } = useItems()
  const keywords = useKeywords()
  const seenAt = useAlertsSeenAt()
  // Freeze the previous visit time so "새로" badges survive this visit's markAlertsSeen().
  const [previousSeenAt] = useState(seenAt)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    markAlertsSeen()
  }, [])

  const matches = matchKeywords(items, keywords).sort(byNewestFirst)

  function add(e: React.FormEvent) {
    e.preventDefault()
    const word = draft.trim()
    if (!word || keywords.includes(word) || keywords.length >= MAX_KEYWORDS) return
    setKeywords([...keywords, word])
    setDraft('')
  }

  return (
    <Frame
      title="키워드 알림"
      description="잃어버린 물건의 이름이나 특징을 등록해 두세요. 맞는 물건이 올라오면 첫 화면 타일에 숫자로 알려 드려요."
    >
      <form onSubmit={add} className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={20}
          placeholder="예: 에어팟, 파란 텀블러"
          aria-label="알림 키워드"
          className="h-11 min-w-0 flex-1 rounded border border-outline-variant px-3 text-[16px] focus:border-on-surface focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim() || keywords.length >= MAX_KEYWORDS}
          className="h-11 shrink-0 rounded bg-primary px-4 text-[14px] font-bold text-on-primary disabled:opacity-50"
        >
          등록
        </button>
      </form>

      {keywords.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {keywords.map((k) => (
            <li key={k}>
              <button
                type="button"
                onClick={() => setKeywords(keywords.filter((w) => w !== k))}
                aria-label={`${k} 삭제`}
                className="flex h-8 items-center gap-1 rounded-full border border-outline-variant pl-3 pr-2 text-[14px] text-on-surface hover:border-outline"
              >
                {k}
                <Icon name="close" size={16} className="text-outline" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-col gap-4">
        <h3 className="text-[16px] font-bold text-on-surface">
          키워드에 맞는 물건 <span className="font-normal text-outline">{matches.length}</span>
        </h3>
        {keywords.length === 0 ? (
          <EmptyState icon="notifications" title="등록된 키워드가 없습니다" description="위에 키워드를 입력해 보세요." />
        ) : matches.length === 0 ? (
          <EmptyState icon="search_off" title="아직 맞는 물건이 없습니다" description="새로 올라오면 첫 화면에서 알려 드릴게요." />
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {matches.map((item) => (
              <div key={item.id} className="relative">
                <ItemCard item={item} />
                {!previousSeenAt || new Date(item.foundAt) > new Date(previousSeenAt) ? (
                  <span className="absolute right-1.5 top-1.5 rounded-sm bg-primary px-1.5 py-0.5 text-[11px] font-bold text-on-primary">
                    NEW
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </Frame>
  )
}
