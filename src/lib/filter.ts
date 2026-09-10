import { categoryOf } from './categories'
import type { CategoryId, LostItem } from '../types'

export function byNewestFirst(a: LostItem, b: LostItem): number {
  return new Date(b.foundAt).getTime() - new Date(a.foundAt).getTime()
}

/** Free-text match across name, pickup location and category label. */
export function filterItems(
  items: LostItem[],
  query: string,
  category: CategoryId | 'all',
): LostItem[] {
  const q = query.trim().toLowerCase()

  return items
    .filter((item) => category === 'all' || item.category === category)
    .filter((item) => {
      if (!q) return true
      const haystack = [item.name, item.location, categoryOf(item.category).label, item.description ?? '']
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
    .sort(byNewestFirst)
}
