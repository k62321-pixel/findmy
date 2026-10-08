import { useCallback, useEffect, useState } from 'react'
import { AppShell } from '../components/AppShell'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { ItemRow } from '../components/ItemRow'
import { LoadError } from '../components/LoadError'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { apiUrl, responseError } from '../lib/api'
import { byNewestFirst } from '../lib/filter'
import { formatFoundAt } from '../lib/format'
import { useItems } from '../store/ItemsProvider'
import type { Inquiry, ItemStatus, LostItem } from '../types'

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
  const [tab, setTab] = useState<ItemStatus | 'inquiries'>('requested')
  const inquiries = useInquiries()

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
          <button
            type="button"
            aria-pressed={tab === 'inquiries'}
            onClick={() => setTab('inquiries')}
            className={`flex-1 rounded-full px-3 py-2 font-label-md text-label-md transition-all ${
              tab === 'inquiries'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            문의사항 {inquiries.list.length}
          </button>
        </div>

        {tab === 'inquiries' ? (
          <InquiryList {...inquiries} />
        ) : (

        <div className="flex flex-col gap-4">
          {status === 'loading' ? (
            <LoadingSpinner />
          ) : status === 'error' ? (
            <LoadError />
          ) : visible.length > 0 ? (
            visible.map((item) => <ItemRow key={item.id} item={item} note={noteFor(item)} />)
          ) : (
            <EmptyState imageSrc="image-removebg-preview(2).png" title={TABS.find((t) => t.id === tab)!.empty}/>
          )}
        </div>
        )}
      </section>
    </AppShell>
  )
}

type LoadStatus = 'loading' | 'ready' | 'error'

function useInquiries() {
  const [list, setList] = useState<Inquiry[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/inquiries'), { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: { inquiries: Inquiry[] } = await res.json()
      setList(data.inquiries)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const remove = useCallback(async (id: string) => {
    const res = await fetch(apiUrl(`/api/inquiries/${id}`), { method: 'DELETE', credentials: 'include' })
    if (!res.ok) throw await responseError(res, '삭제에 실패했습니다.')
    setList((prev) => prev.filter((q) => q.id !== id))
  }, [])

  return { list, status, remove }
}

function InquiryList({
  list,
  status,
  remove,
}: {
  list: Inquiry[]
  status: LoadStatus
  remove: (id: string) => Promise<void>
}) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleDelete(id: string) {
    setBusyId(id)
    setError('')
    try {
      await remove(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  if (status === 'loading') return <LoadingSpinner />
  if (status === 'error') return <LoadError />
  if (list.length === 0) return <EmptyState icon="inbox" title="접수된 문의사항이 없습니다" />

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p role="alert" className="flex items-center gap-1 font-label-sm text-label-sm text-error">
          <Icon name="error" size={14} />
          {error}
        </p>
      ) : null}
      {list.map((q) => (
        <article key={q.id} className="flex flex-col gap-2 rounded-md bg-surface-container-lowest p-4 shadow-level1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="break-all font-label-md text-label-md text-on-surface">
              {q.authorName} <span className="text-on-surface-variant">({q.authorEmail})</span>
            </span>
            <span className="font-label-sm text-label-sm text-outline">{formatFoundAt(q.createdAt)}</span>
          </div>
          <p className="whitespace-pre-line break-words font-body-md text-body-md text-on-surface">{q.content}</p>
          <button
            type="button"
            disabled={busyId === q.id}
            onClick={() => handleDelete(q.id)}
            className="w-fit font-label-sm text-label-sm text-error hover:underline disabled:opacity-60"
          >
            삭제
          </button>
        </article>
      ))}
    </div>
  )
}
