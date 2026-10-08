import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Icon } from '../components/Icon'
import { SearchField } from '../components/SearchField'
import { SITE_TITLE } from '../lib/site'

export function HomePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate(query.trim() ? `/browse?q=${encodeURIComponent(query.trim())}` : '/browse')
  }

  return (
    <AppShell title={SITE_TITLE}>
      {/* Fills the space between the fixed header (4rem) and tab bar (6rem) so the content sits mid-screen. */}
      <section className="flex min-h-[calc(100dvh-10rem)] flex-col items-center justify-center px-margin-mobile py-8 md:px-margin-desktop">
        <div className="flex w-full max-w-xl flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="break-keep px-4 text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:text-headline-lg">
              분실물을 신고하거나 찾아보세요!
            </h2>
            <p className="break-keep px-2 text-center font-body-md text-body-md text-on-surface-variant">
              경북일고 학생들을 위한 분실물 찾기 사이트 입니다. 학교에서 분실된 물건을 신고하거나 분실한 물건을
              찾아보세요!
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
        </div>
      </section>
    </AppShell>
  )
}
