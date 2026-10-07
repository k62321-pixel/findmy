import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { CategoryId, LostItem } from '../types'
import { apiUrl, responseError } from '../lib/api'
import { useAuth } from './AuthProvider'

export interface NewItemDraft {
  name: string
  category: CategoryId
  location: string
  description?: string
  /** The actual file to upload — not a preview blob URL. */
  photo?: File
}

type ItemsStatus = 'loading' | 'ready' | 'error'

interface ItemsContextValue {
  items: LostItem[]
  status: ItemsStatus
  refresh: () => Promise<void>
  getItem: (id: string) => LostItem | undefined
  addItem: (draft: NewItemDraft) => Promise<LostItem>
  /** Signed-in user asks to pick the item up → 'requested'. */
  requestClaim: (id: string) => Promise<LostItem>
  cancelClaim: (id: string) => Promise<LostItem>
  /** Admin only: confirm a handover ('returned') or reject/undo it ('stored'). */
  setItemStatus: (id: string, status: 'stored' | 'returned') => Promise<LostItem>
  /** Admin only. */
  deleteItem: (id: string) => Promise<void>
}

const ItemsContext = createContext<ItemsContextValue | null>(null)

/** The server sends `/api/uploads/...`; resolve it against the API base like every other call. */
function normalize(item: LostItem): LostItem {
  return item.imageUrl ? { ...item, imageUrl: apiUrl(item.imageUrl) } : item
}

export function ItemsProvider({ children }: { children: ReactNode }) {
  const { status: authStatus, user } = useAuth()
  const [items, setItems] = useState<LostItem[]>([])
  const [status, setStatus] = useState<ItemsStatus>('loading')

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/items'), { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: { items: LostItem[] } = await res.json()
      setItems(data.items.map(normalize))
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])

  // Re-fetch whenever sign-in state settles or the account changes — "reportedByMe",
  // "claimedByMe" and admin details are computed server-side from the session.
  useEffect(() => {
    if (authStatus === 'loading') return
    refresh()
  }, [authStatus, user?.sub, refresh])

  const getItem = useCallback((id: string) => items.find((it) => it.id === id), [items])

  const replaceItem = useCallback((item: LostItem) => {
    const next = normalize(item)
    setItems((prev) => prev.map((it) => (it.id === next.id ? next : it)))
    return next
  }, [])

  /** POSTs to an item action endpoint and swaps the updated item into the list. */
  const itemAction = useCallback(
    async (path: string, fallback: string, body?: unknown) => {
      const res = await fetch(apiUrl(path), {
        method: 'POST',
        credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!res.ok) {
        const err = await responseError(res, fallback)
        // Someone else may have changed it meanwhile — show the current state.
        if (res.status === 409) refresh()
        throw err
      }
      const data: { item: LostItem } = await res.json()
      return replaceItem(data.item)
    },
    [refresh, replaceItem],
  )

  const addItem = useCallback(async (draft: NewItemDraft) => {
    const form = new FormData()
    form.set('name', draft.name)
    form.set('category', draft.category)
    form.set('location', draft.location)
    if (draft.description) form.set('description', draft.description)
    if (draft.photo) form.set('photo', draft.photo)

    const res = await fetch(apiUrl('/api/items'), { method: 'POST', credentials: 'include', body: form })
    if (!res.ok) throw await responseError(res, '신고 등록에 실패했습니다. 다시 시도해 주세요.')

    const data: { item: LostItem } = await res.json()
    const item = normalize(data.item)
    setItems((prev) => [item, ...prev])
    return item
  }, [])

  const requestClaim = useCallback(
    (id: string) => itemAction(`/api/items/${id}/claim`, '수령 신청에 실패했습니다.'),
    [itemAction],
  )

  const cancelClaim = useCallback(
    (id: string) => itemAction(`/api/items/${id}/claim/cancel`, '신청 취소에 실패했습니다.'),
    [itemAction],
  )

  const setItemStatus = useCallback(
    (id: string, next: 'stored' | 'returned') =>
      itemAction(`/api/items/${id}/status`, '상태 변경에 실패했습니다.', { status: next }),
    [itemAction],
  )

  const deleteItem = useCallback(async (id: string) => {
    const res = await fetch(apiUrl(`/api/items/${id}`), { method: 'DELETE', credentials: 'include' })
    if (!res.ok) throw await responseError(res, '삭제에 실패했습니다.')
    setItems((prev) => prev.filter((it) => it.id !== id))
  }, [])

  const value = useMemo(
    () => ({ items, status, refresh, getItem, addItem, requestClaim, cancelClaim, setItemStatus, deleteItem }),
    [items, status, refresh, getItem, addItem, requestClaim, cancelClaim, setItemStatus, deleteItem],
  )

  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>
}

export function useItems(): ItemsContextValue {
  const ctx = useContext(ItemsContext)
  if (!ctx) throw new Error('useItems must be used inside <ItemsProvider>')
  return ctx
}
