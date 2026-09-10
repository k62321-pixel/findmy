import type { Category, CategoryId } from '../types'

export const CATEGORIES: Category[] = [
  { id: 'electronics', label: '전자기기', icon: 'devices' },
  { id: 'books', label: '도서', icon: 'menu_book' },
  { id: 'clothing', label: '의류', icon: 'checkroom' },
  { id: 'wallet', label: '지갑/카드', icon: 'wallet' },
  { id: 'etc', label: '기타', icon: 'more_horiz' },
]

export function categoryOf(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}
