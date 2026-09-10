import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { CategoryId, LostItem } from '../types'
import { apiUrl } from '../lib/api'
import { useAuth } from './AuthProvider'

export interface NewItemDraft {
  name: string
  category: CategoryId
  location: string
  description?: string
  /** The actual file to upload — not a preview blob URL. */
  photo?: File
}

type ItemsStatus = 'loading' | 'ready'

interface ItemsContextValue {
  items: LostItem[]
  status: ItemsStatus
  getItem: (id: string) => LostItem | undefined
  addItem: (draft: NewItemDraft) => Promise<LostItem>
  markReturned: (id: string) => Promise<LostItem>
}

const ItemsContext = createContext<ItemsContextValue | null>(null)

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json()
    return typeof data?.error === 'string' ? data.error : fallback
  } catch {
    return fallback
  }
}

export function ItemsProvider({ children }: { children: ReactNode }) {
  const { status: authStatus } = useAuth()
  const [items, setItems] = useState<LostItem[]>([])
  const [status, setStatus] = useState<ItemsStatus>('loading')

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/items'), { credentials: 'include' })
      if (!res.ok) return
      const data: { items: LostItem[] } = await res.json()
      setItems(data.items)
    } finally {
      setStatus('ready')
    }
  }, [])

  // Re-fetch whenever sign-in state settles or changes — "reportedByMe" is
  // computed server-side from the session, so it flips with the account.
  useEffect(() => {
    if (authStatus === 'loading') return
    refresh()
  }, [authStatus, refresh])

  const getItem = useCallback((id: string) => items.find((it) => it.id === id), [items])

  const addItem = useCallback(async (draft: NewItemDraft) => {
    const form = new FormData()
    form.set('name', draft.name)
    form.set('category', draft.category)
    form.set('location', draft.location)
    if (draft.description) form.set('description', draft.description)
    if (draft.photo) form.set('photo', draft.photo)

    const res = await fetch(apiUrl('/api/items'), { method: 'POST', credentials: 'include', body: form })
    if (!res.ok) throw new Error(await parseError(res, '신고 등록에 실패했습니다.'))

    const data: { item: LostItem } = await res.json()
    setItems((prev) => [data.item, ...prev])
    return data.item
  }, [])

  const markReturned = useCallback(async (id: string) => {
    const res = await fetch(apiUrl(`/api/items/${id}/claim`), { method: 'POST', credentials: 'include' })
    if (!res.ok) throw new Error(await parseError(res, '수령 신청에 실패했습니다.'))

    const data: { item: LostItem } = await res.json()
    setItems((prev) => prev.map((it) => (it.id === id ? data.item : it)))
    return data.item
  }, [])

  const value = useMemo(
    () => ({ items, status, getItem, addItem, markReturned }),
    [items, status, getItem, addItem, markReturned],
  )

  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>
}

export function useItems(): ItemsContextValue {
  const ctx = useContext(ItemsContext)
  if (!ctx) throw new Error('useItems must be used inside <ItemsProvider>')
  return ctx
}
