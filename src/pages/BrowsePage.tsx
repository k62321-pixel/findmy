import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { CategoryFilter } from '../components/CategoryFilter'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { ItemCard } from '../components/ItemCard'
import { LoadError } from '../components/LoadError'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { SearchField } from '../components/SearchField'
import { UsageBanner } from '../components/UsageBanner'
import { filterItems } from '../lib/filter'
import { useItems } from '../store/ItemsProvider'
import { SITE_TITLE } from '../lib/site'
import type { CategoryId } from '../types'

export function BrowsePage() {
  const { items, status } = useItems()
  const [searchParams, setSearchParams] = useSearchParams()
  const [category, setCategory] = useState<CategoryId | 'all'>('all')

  // The header logo links here with a fresh `home` token: reset to the untouched screen.
  const location = useLocation()
  const homeToken = (location.state as { home?: number } | null)?.home
  useEffect(() => {
    if (homeToken === undefined) return
    setCategory('all')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [homeToken])

  const query = searchParams.get('q') ?? ''
  const setQuery = (next: string) => {
    setSearchParams(next ? { q: next } : {}, { replace: true })
  }

  const results = useMemo(() => filterItems(items, query, category), [items, query, category])

  return (
    <AppShell title={SITE_TITLE}>
      <section className="flex flex-col gap-1 border-b border-outline-variant px-margin-mobile pt-3 md:px-margin-desktop">
        <SearchField value={query} onChange={setQuery} />
        <CategoryFilter value={category} onChange={setCategory} />
      </section>

      <div className="px-margin-mobile pt-5 md:px-margin-desktop">
        <UsageBanner />
      </div>

      <section id="items" className="flex scroll-mt-20 flex-col gap-4 px-margin-mobile pb-6 pt-6 md:px-margin-desktop">
        <div className="flex items-end justify-between">
          <h2 className="text-[18px] font-bold leading-6 text-on-surface">
            {query || category !== 'all' ? '검색 결과' : '최근 등록된 습득물'}
            <span className="ml-1.5 text-[14px] font-normal text-outline">{results.length}</span>
          </h2>
          <Link to="/report" className="flex items-center gap-0.5 text-[13px] font-semibold text-primary">
            <Icon name="add" size={18} />
            습득물 신고
          </Link>
        </div>

        {status === 'loading' ? (
          <LoadingSpinner />
        ) : status === 'error' ? (
          <LoadError />
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {results.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="조건에 맞는 습득물이 없습니다"
            description="검색어를 바꾸거나 카테고리를 '전체'로 되돌려 보세요. 아직 등록되지 않았다면 며칠 뒤 다시 확인해 주세요."
          />
        )}

        <div className="h-8" />
      </section>
    </AppShell>
  )
}
