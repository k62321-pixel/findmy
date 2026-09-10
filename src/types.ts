export type CategoryId = 'electronics' | 'clothing' | 'wallet' | 'books' | 'etc'

/** 보관중 = still at the lost & found desk, 반환완료 = handed back to its owner. */
export type ItemStatus = 'stored' | 'returned'

export interface LostItem {
  id: string
  name: string
  category: CategoryId
  status: ItemStatus
  /** Where the item was picked up. */
  location: string
  /** Where it is being kept until claimed. */
  storage: string
  /** ISO timestamp of when it was found. */
  foundAt: string
  description?: string
  imageUrl?: string
  /** True for items the signed-in user reported themselves. */
  reportedByMe?: boolean
}

export interface Category {
  id: CategoryId
  label: string
  icon: string
}
