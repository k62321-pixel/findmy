import type { Category, CategoryId } from '../types'

/** Things students lose most. Old ids (electronics, books, clothing, wallet, etc) are kept so existing posts still match. */
export const CATEGORIES: Category[] = [
  { id: 'electronics', label: '이어폰/전자기기', icon: 'headphones' },
  { id: 'stationery', label: '필통/필기구', icon: 'edit' },
  { id: 'books', label: '교과서/공책', icon: 'menu_book' },
  { id: 'clothing', label: '체육복/의류', icon: 'checkroom' },
  { id: 'wallet', label: '지갑/학생증', icon: 'badge' },
  { id: 'bottle', label: '텀블러/물병', icon: 'local_drink' },
  { id: 'umbrella', label: '우산', icon: 'umbrella' },
  { id: 'bag', label: '가방/파우치', icon: 'backpack' },
  { id: 'accessory', label: '안경/액세서리', icon: 'eyeglasses' },
  { id: 'etc', label: '기타', icon: 'more_horiz' },
]

export function categoryOf(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}
