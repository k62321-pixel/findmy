import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Icon } from '../components/Icon'
import { SearchField } from '../components/SearchField'
import { SITE_TITLE } from '../lib/site'

const STEPS = [
  { icon: 'edit_note', title: '신고하기', body: '주운 물건의 사진과 장소를 등록해요.' },
  { icon: 'meeting_room', title: '교무실에 맡기기', body: '물건을 1층 교무실로 가져다주세요.' },
  { icon: 'handshake', title: '주인 찾기', body: '주인은 ‘내 물건 찾기’ 후 교무실에서 받아요.' },
]

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
          <div className="flex flex-col items-center gap-3 text-center">
            <img src="/image-removebg-preview(2).png" alt="경북일고 교표" className="h-20 w-20 object-contain md:h-24 md:w-24" />
            <h2 className="break-keep font-display text-[26px] font-bold leading-tight tracking-tight text-on-surface md:text-[40px]">
              분실물을 신고하거나 찾아보세요!
            </h2>
            <p className="max-w-md break-keep font-body-md text-body-md text-on-surface-variant">
              경북일고 학생들을 위한 분실물 찾기 사이트 입니다. 학교에서 분실된 물건을 신고하거나 분실한 물건을
              찾아보세요!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ActionCard
              to="/report"
              icon="add_circle"
              title="분실물 등록하기"
              hint="물건을 주웠어요"
              className="bg-primary text-on-primary"
              hintClassName="text-on-primary/75"
            />
            <ActionCard
              to="/browse"
              icon="search"
              title="분실물 찾기"
              hint="물건을 잃어버렸어요"
              className="bg-surface-container-lowest text-primary outline outline-1 outline-outline-variant/60"
              hintClassName="text-on-surface-variant"
            />
          </div>

          <form onSubmit={submitSearch}>
            <SearchField value={query} onChange={setQuery} placeholder="물품명, 습득 장소 검색" />
          </form>

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
        </div>
      </section>
    </AppShell>
  )
}

function ActionCard({
  to,
  icon,
  title,
  hint,
  className,
  hintClassName,
}: {
  to: string
  icon: string
  title: string
  hint: string
  className: string
  hintClassName: string
}) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-lg px-3 py-5 shadow-level1 transition-all hover:-translate-y-0.5 hover:shadow-level1-hover active:scale-[0.98] ${className}`}
    >
      <Icon name={icon} size={32} />
      <span className="font-label-md text-label-md">{title}</span>
      <span className={`font-label-sm text-label-sm ${hintClassName}`}>{hint}</span>
    </Link>
  )
}
