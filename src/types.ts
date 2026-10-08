export type CategoryId =
  | 'electronics'
  | 'stationery'
  | 'books'
  | 'clothing'
  | 'wallet'
  | 'bottle'
  | 'umbrella'
  | 'bag'
  | 'accessory'
  | 'etc'

/**
 * 보관중 = at the lost & found desk, 수령 신청됨 = someone asked to pick it up,
 * 반환완료 = an admin confirmed the handover.
 */
export type ItemStatus = 'stored' | 'requested' | 'returned'

/** Only present when the signed-in user is an admin (ADMIN_EMAILS on the server). */
export interface ItemAdminInfo {
  reporterName: string
  reporterEmail: string
  claimantName: string | null
  claimantEmail: string | null
  claimedAt: string | null
  resolvedBy: string | null
  resolvedAt: string | null
}

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
  /** True when the signed-in user is the one who requested pickup. */
  claimedByMe?: boolean
  admin?: ItemAdminInfo
}

export interface Category {
  id: CategoryId
  label: string
  icon: string
}

/** A user-submitted inquiry (문의사항). Only admins can list them. */
export interface Inquiry {
  id: string
  content: string
  authorName: string
  authorEmail: string
  createdAt: string
}
