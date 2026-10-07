import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { ItemCard } from '../components/ItemCard'
import { LoadError } from '../components/LoadError'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { SearchField } from '../components/SearchField'
import { useItems } from '../store/ItemsProvider'
import { byNewestFirst } from '../lib/filter'

export function HomePage() {
  const { items, status } = useItems()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const recent = [...items].sort(byNewestFirst).slice(0, 4)

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate(query.trim() ? `/browse?q=${encodeURIComponent(query.trim())}` : '/browse')
  }

  return (
    <AppShell title="Home">
      <section className="flex flex-col gap-6 px-margin-mobile py-8 md:px-margin-desktop">
        <div className="flex flex-col gap-2">
          <h2 className="px-4 text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:text-headline-lg">
            분실물을 찾아 드립니다
          </h2>
          <p className="px-2 text-center font-body-md text-body-md text-on-surface-variant">
            잃어버린 소중한 물건, 학교 분실물 센터에서 쉽게 찾고 등록하세요. 우리는 당신의 일상을 응원합니다.
          </p>
        </div>

        <div className="flex w-full gap-4">
          <Link
            to="/report"
            className="flex flex-1 flex-col items-center justify-center gap-2 rounded-md bg-primary p-4 text-on-primary shadow-level1 transition-transform active:scale-[0.98]"
          >
            <Icon name="add_circle" size={32} />
            <span className="font-label-md text-label-md">분실물 등록하기</span>
          </Link>
          <Link
            to="/browse"
            className="flex flex-1 flex-col items-center justify-center gap-2 rounded-md bg-surface-container-low p-4 text-primary shadow-level1 outline outline-1 outline-outline-variant transition-colors active:bg-surface-variant"
          >
            <Icon name="search" size={32} />
            <span className="font-label-md text-label-md">분실물 찾기</span>
          </Link>
        </div>

        <form onSubmit={submitSearch}>
          <SearchField value={query} onChange={setQuery} placeholder="물품명, 습득 장소 검색" />
        </form>
      </section>

      <section className="mt-4 flex flex-col gap-4 px-margin-mobile pb-8 md:px-margin-desktop">
        <div className="flex items-end justify-between">
          <h2 className="font-headline-md text-headline-md text-on-surface">최근 등록된 습득물</h2>
          {recent.length > 0 ? (
            <Link
              to="/browse"
              className="flex items-center gap-1 font-label-sm text-label-sm text-primary transition-opacity active:opacity-70"
            >
              모두 보기 <Icon name="chevron_right" size={16} />
            </Link>
          ) : null}
        </div>

        {status === 'loading' ? (
          <LoadingSpinner />
        ) : status === 'error' ? (
          <LoadError />
        ) : recent.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {recent.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="inventory_2"
            title="아직 등록된 습득물이 없습니다"
            description="캠퍼스에서 물건을 주우셨다면 가장 먼저 신고해 주세요."
            action={
              <Link
                to="/report"
                className="mt-2 rounded-md bg-primary px-6 py-3 font-label-md text-label-md text-on-primary shadow-level1"
              >
                분실물 등록하기
              </Link>
            }
          />
        )}
      </section>
    </AppShell>
  )
}
