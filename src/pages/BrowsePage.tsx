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

const STEPS = [
  { icon: 'edit_note', title: '신고하기', body: '주운 물건의 사진과 장소를 등록해요.' },
  { icon: 'meeting_room', title: '교무실에 맡기기', body: '물건을 1층 교무실로 가져다주세요.' },
  { icon: 'handshake', title: '주인 찾기', body: '주인은 ‘내 물건 찾기’ 후 교무실에서 받아요.' },
]

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
      <section className="flex flex-col gap-4 px-margin-mobile pb-2 pt-4 md:px-margin-desktop">
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="flex items-start gap-3 rounded-lg bg-surface-container-low p-4 sm:flex-col sm:items-center sm:text-center"
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
                <Icon name={step.icon} size={22} />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary font-label-sm text-[11px] text-on-primary">
                  {i + 1}
                </span>
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-label-md text-label-md text-on-surface">{step.title}</span>
                <span className="break-keep font-label-sm text-label-sm text-on-surface-variant">{step.body}</span>
              </div>
            </li>
          ))}
        </ol>

        <SearchField value={query} onChange={setQuery} />

        <Link
          to="/report"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-surface-container-lowest font-label-md text-label-md text-primary outline outline-1 outline-outline-variant/60 transition-colors hover:bg-surface-container-low active:scale-[0.99]"
        >
          <Icon name="add_circle" size={20} />
          물건을 주웠다면? 습득물 신고하기
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {results.map((item) => (
              <ItemRow key={item.id} item={item} />
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
