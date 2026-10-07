import { useState } from 'react'
import { AppShell } from '../components/AppShell'
import { EmptyState } from '../components/EmptyState'
import { ItemRow } from '../components/ItemRow'
import { LoadError } from '../components/LoadError'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { byNewestFirst } from '../lib/filter'
import { useItems } from '../store/ItemsProvider'
import type { ItemStatus, LostItem } from '../types'

const TABS: { id: ItemStatus; label: string; empty: string }[] = [
  { id: 'requested', label: '수령 신청', empty: '처리할 수령 신청이 없습니다' },
  { id: 'stored', label: '보관중', empty: '보관중인 습득물이 없습니다' },
  { id: 'returned', label: '반환완료', empty: '반환완료된 습득물이 없습니다' },
]

function noteFor(item: LostItem): string | undefined {
  const info = item.admin
  if (!info) return undefined
  if (item.status === 'stored') return `신고: ${info.reporterName}`
  return info.claimantName ? `신청: ${info.claimantName} (${info.claimantEmail})` : undefined
}

/** Staff dashboard. Route is admin-gated in the UI; the server enforces it on every write. */
export function AdminPage() {
  const { items, status } = useItems()
  const [tab, setTab] = useState<ItemStatus>('requested')

  const visible = items.filter((it) => it.status === tab).sort(byNewestFirst)

  return (
    <AppShell title="Admin">
      <section className="flex flex-col gap-6 px-margin-mobile py-8 md:px-margin-desktop">
        <div className="flex flex-col gap-2">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">분실물 관리</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            수령 신청자가 방문하면 본인 확인 후 항목을 열어 반환완료로 처리하세요.
          </p>
        </div>

        <div className="flex gap-2 rounded-full bg-surface-container p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-full px-3 py-2 font-label-md text-label-md transition-all ${
                tab === t.id
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t.label} {items.filter((it) => it.status === t.id).length}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {status === 'loading' ? (
            <LoadingSpinner />
          ) : status === 'error' ? (
            <LoadError />
          ) : visible.length > 0 ? (
            visible.map((item) => <ItemRow key={item.id} item={item} note={noteFor(item)} />)
          ) : (
            <EmptyState icon="inventory_2" title={TABS.find((t) => t.id === tab)!.empty} />
          )}
        </div>
      </section>
    </AppShell>
  )
}
