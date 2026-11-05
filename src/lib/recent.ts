import { useEffect, useState } from 'react'

/**
 * "최근 본 물건" — ids of item pages this browser opened, newest first.
 * Kept in localStorage: it's a per-viewer convenience, so nothing goes to the server.
 */
const KEY = 'recently-viewed-items'
const MAX = 20
const EVENT = 'recently-viewed-change'

function read(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

export function addRecentlyViewed(id: string) {
  const next = [id, ...read().filter((v) => v !== id)].slice(0, MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Private mode / storage blocked — the panel just stays empty.
  }
  window.dispatchEvent(new Event(EVENT))
}

export function useRecentlyViewed(): string[] {
  const [ids, setIds] = useState(read)
  useEffect(() => {
    const sync = () => setIds(read())
    window.addEventListener(EVENT, sync)
    // Another tab viewing an item updates this one too.
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return ids
}
