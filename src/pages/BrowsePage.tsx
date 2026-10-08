import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { CategoryFilter } from '../components/CategoryFilter'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { ItemRow } from '../components/ItemRow'
import { LoadError } from '../components/LoadError'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { SearchField } from '../components/SearchField'
import { filterItems } from '../lib/filter'
import { useItems } from '../store/ItemsProvider'
import { SITE_TITLE } from '../lib/site'
import type { CategoryId } from '../types'

export function BrowsePage() {
  const { items, status } = useItems()
  const [searchParams, setSearchParams] = useSearchParams()
  const [category, setCategory] = useState<CategoryId | 'all'>('all')

  const query = searchParams.get('q') ?? ''
  const setQuery = (next: string) => {
    setSearchParams(next ? { q: next } : {}, { replace: true })
  }

  const results = useMemo(() => filterItems(items, query, category), [items, query, category])

  return (
    <AppShell title={SITE_TITLE}>
      <section className="sticky top-16 z-20 flex flex-col gap-4 bg-surface-container-lowest px-margin-mobile pb-6 pt-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] md:px-margin-desktop">
        <div className="flex items-start gap-3 rounded-md bg-surface-container-low p-3">
          <Icon name="info" size={20} className="mt-0.5 shrink-0 text-primary" />
          <p className="font-body-md text-body-md text-on-surface-variant">
            신고된 물건 중 자신의 물건이 있다면 해당 게시물을 클릭하여 '내 물건 찾기'를 누르고, 1층 교무실로 물건을
            찾으러 가세요.
          </p>
        </div>

        <SearchField value={query} onChange={setQuery} />

        <Link
          to="/report"
          className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-md bg-primary font-label-md text-label-md text-on-primary shadow-[0_4px_12px_rgba(0,40,142,0.2)] transition-all hover:shadow-[0_6px_16px_rgba(0,40,142,0.3)] active:translate-y-px"
        >
          <span className="absolute inset-0 translate-y-full bg-white/20 transition-transform duration-300 ease-out group-hover:translate-y-0" />
          <Icon name="add_circle" size={20} className="relative z-10" />
          <span className="relative z-10">습득물 신고하기</span>
        </Link>

        <CategoryFilter value={category} onChange={setCategory} />
      </section>

      <section className="flex flex-col gap-4 px-margin-mobile py-6 md:px-margin-desktop">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            {query || category !== 'all' ? '검색 결과' : '최근 등록된 습득물'}
          </h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant">{results.length}건</span>
        </div>

        {status === 'loading' ? (
          <LoadingSpinner />
        ) : status === 'error' ? (
          <LoadError />
        ) : results.length > 0 ? (
          results.map((item) => <ItemRow key={item.id} item={item} />)
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
