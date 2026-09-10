import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { EmptyState } from '../components/EmptyState'
import { ItemRow } from '../components/ItemRow'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { byNewestFirst } from '../lib/filter'
import { useItems } from '../store/ItemsProvider'

type Tab = 'stored' | 'returned'

export function MyItemsPage() {
  const { items, status } = useItems()
  const [tab, setTab] = useState<Tab>('stored')

  const mine = items.filter((it) => it.reportedByMe).sort(byNewestFirst)
  const visible = mine.filter((it) => it.status === tab)

  return (
    <AppShell title="My Items">
      <section className="flex flex-col gap-6 px-margin-mobile py-8 md:px-margin-desktop">
        <div className="flex flex-col gap-2">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">내가 신고한 물건</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            내가 등록한 습득물의 보관 상태를 확인할 수 있습니다. 주인을 찾으면 자동으로 반환완료로 바뀝니다.
          </p>
        </div>

        <div className="flex gap-2 rounded-full bg-surface-container p-1">
          <TabButton active={tab === 'stored'} onClick={() => setTab('stored')}>
            보관중 {mine.filter((it) => it.status === 'stored').length}
          </TabButton>
          <TabButton active={tab === 'returned'} onClick={() => setTab('returned')}>
            반환완료 {mine.filter((it) => it.status === 'returned').length}
          </TabButton>
        </div>

        <div className="flex flex-col gap-4">
          {status === 'loading' ? (
            <LoadingSpinner />
          ) : visible.length > 0 ? (
            visible.map((item) => <ItemRow key={item.id} item={item} />)
          ) : (
            <EmptyState
              icon="inventory_2"
              title={tab === 'stored' ? '보관중인 신고 내역이 없습니다' : '반환된 물건이 아직 없습니다'}
              description={
                tab === 'stored'
                  ? '캠퍼스에서 물건을 주우셨다면 신고해 주세요. 주인을 찾는 가장 빠른 방법입니다.'
                  : '신고한 물건이 주인에게 전달되면 이곳에 표시됩니다.'
              }
              action={
                tab === 'stored' ? (
                  <Link
                    to="/report"
                    className="mt-2 rounded-md bg-primary px-6 py-3 font-label-md text-label-md text-on-primary shadow-level1"
                  >
                    습득물 신고하기
                  </Link>
                ) : undefined
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
