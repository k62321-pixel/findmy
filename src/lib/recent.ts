import { useEffect, useState } from 'react'

/**
 * Small per-browser lists kept in localStorage — 최근 본 물건, 키워드 알림.
 * They're personal conveniences, so nothing goes to the server; every access is
 * wrapped because storage can be blocked (private mode, site-data settings).
 */
const EVENT = 'local-list-change'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage blocked — the feature just won't remember anything.
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }))
}

/** Re-reads `key` whenever this tab or another one changes it. */
function useStored<T>(key: string, fallback: T, sanitize: (v: unknown) => T): T {
  const [value, setValue] = useState(() => sanitize(readJson<unknown>(key, fallback)))
  useEffect(() => {
    const sync = () => setValue(sanitize(readJson<unknown>(key, fallback)))
    const onLocal = (e: Event) => {
      if ((e as CustomEvent).detail === key) sync()
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) sync()
    }
    window.addEventListener(EVENT, onLocal)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(EVENT, onLocal)
      window.removeEventListener('storage', onStorage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return value
}

const stringList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []

// --- 최근 본 물건 -----------------------------------------------------------

const RECENT_KEY = 'recently-viewed-items'

export function addRecentlyViewed(id: string) {
  const prev = stringList(readJson(RECENT_KEY, []))
  writeJson(RECENT_KEY, [id, ...prev.filter((v) => v !== id)].slice(0, 30))
}

export function useRecentlyViewed(): string[] {
  return useStored(RECENT_KEY, [], stringList)
}

// --- 키워드 알림 --------------------------------------------------------------

const KEYWORDS_KEY = 'alert-keywords'
const ALERTS_SEEN_KEY = 'alert-keywords-seen-at'
export const MAX_KEYWORDS = 10

export function setKeywords(words: string[]) {
  writeJson(KEYWORDS_KEY, words.slice(0, MAX_KEYWORDS))
}

export function useKeywords(): string[] {
  return useStored(KEYWORDS_KEY, [], stringList)
}

/** When the alerts page was last opened — matches newer than this count as "new". */
export function markAlertsSeen() {
  writeJson(ALERTS_SEEN_KEY, new Date().toISOString())
}

export function useAlertsSeenAt(): string | null {
  return useStored<string | null>(ALERTS_SEEN_KEY, null, (v) => (typeof v === 'string' ? v : null))
}
