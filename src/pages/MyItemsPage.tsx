import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { EmptyState } from '../components/EmptyState'
import { ItemRow } from '../components/ItemRow'
import { LoadError } from '../components/LoadError'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { byNewestFirst } from '../lib/filter'
import { useItems } from '../store/ItemsProvider'

type Tab = 'reported' | 'claimed'

export function MyItemsPage() {
  const { items, status } = useItems()
  const [tab, setTab] = useState<Tab>('reported')

  const reported = items.filter((it) => it.reportedByMe).sort(byNewestFirst)
  const claimed = items.filter((it) => it.claimedByMe).sort(byNewestFirst)
  const visible = tab === 'reported' ? reported : claimed

  return (
    <AppShell title="My Items">
      <section className="flex flex-col gap-6 px-margin-mobile py-8 md:px-margin-desktop">
        <div className="flex flex-col gap-2">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">내 물건</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            내가 신고한 습득물과 수령 신청한 물건의 상태를 확인할 수 있습니다. 분실물 센터 담당자가 본인 확인을
            마치면 반환완료로 바뀝니다.
          </p>
        </div>

        <div className="flex gap-2 rounded-full bg-surface-container p-1">
          <TabButton active={tab === 'reported'} onClick={() => setTab('reported')}>
            신고한 물건 {reported.length}
          </TabButton>
          <TabButton active={tab === 'claimed'} onClick={() => setTab('claimed')}>
            수령 신청 {claimed.length}
          </TabButton>
        </div>

        <div className="flex flex-col gap-4">
          {status === 'loading' ? (
            <LoadingSpinner />
          ) : status === 'error' ? (
            <LoadError />
          ) : visible.length > 0 ? (
            visible.map((item) => <ItemRow key={item.id} item={item} />)
          ) : (
            <EmptyState
              imageSrc="/image-removebg-preview%20(2).png"
              title={tab === 'reported' ? '신고한 습득물이 없습니다' : '수령 신청한 물건이 없습니다'}
              description={
                tab === 'reported'
                  ? '학교에서 물건을 주우셨다면 신고해 주세요. 주인을 찾는 가장 빠른 방법입니다.'
                  : '잃어버린 물건을 목록에서 찾아 "내 물건 찾기"로 수령을 신청하세요.'
              }
              action={
                <Link
                  to={tab === 'reported' ? '/report' : '/browse'}
                  className="mt-2 rounded-md bg-primary px-6 py-3 font-label-md text-label-md text-on-primary shadow-level1"
                >
                  {tab === 'reported' ? '습득물 신고하기' : '습득물 둘러보기'}
                </Link>
              }
            />
          )}
        </div>
      </section>
    </AppShell>
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
      aria-pressed={active}
      onClick={onClick}
      className={`flex-1 rounded-full px-4 py-2 font-label-md text-label-md transition-all ${
        active ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
      }`}
    >
      {children}
    </button>
  )
}
