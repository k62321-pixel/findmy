import type { LostItem } from '../types'

/** Items still waiting for an owner whose name/description/location contain any keyword. */
export function matchKeywords(items: LostItem[], keywords: string[]): LostItem[] {
  const words = keywords.map((k) => k.trim().toLowerCase()).filter(Boolean)
  if (words.length === 0) return []
  return items.filter((it) => {
    if (it.status === 'returned') return false
    const hay = `${it.name} ${it.description ?? ''} ${it.location}`.toLowerCase()
    return words.some((w) => hay.includes(w))
  })
}

/** Found since local midnight. */
export function isToday(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

/**
 * Groups items by the first word of where they were found ("체육관 입구" → "체육관"),
 * which is usually the building or room. Busiest places first.
 */
export function groupByPlace(items: LostItem[]): { place: string; items: LostItem[] }[] {
  const groups = new Map<string, LostItem[]>()
  for (const it of items) {
    if (it.status === 'returned') continue
    const place = it.location.trim().split(/\s+/)[0] || '기타'
    groups.set(place, [...(groups.get(place) ?? []), it])
  }
  return [...groups.entries()]
    .map(([place, list]) => ({ place, items: list }))
    .sort((a, b) => b.items.length - a.items.length || a.place.localeCompare(b.place, 'ko'))
}
