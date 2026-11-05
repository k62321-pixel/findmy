import { Link } from 'react-router-dom'
import { ItemThumb } from './ItemThumb'
import { formatRelative } from '../lib/format'
import type { ItemStatus, LostItem } from '../types'

const STATUS_TEXT: Record<ItemStatus, { label: string; className: string }> = {
  stored: { label: '보관중', className: 'text-on-surface' },
  requested: { label: '수령 신청중', className: 'text-primary' },
  returned: { label: '반환완료', className: 'text-outline' },
}

/**
 * Marketplace grid tile: square photo, one-line name, bold status where a price would
 * go, then "place · time" in grey. Returned items get a dimmed "반환완료" photo overlay.
 */
export function ItemCard({ item }: { item: LostItem }) {
  const status = STATUS_TEXT[item.status] ?? STATUS_TEXT.stored
  const returned = item.status === 'returned'

  return (
    <Link
      to={`/items/${item.id}`}
      className="group flex min-w-0 flex-col gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded bg-surface-container">
        <ItemThumb
          src={item.imageUrl}
          alt={item.name}
          category={item.category}
          className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
          glyphSize={44}
        />
        {returned ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/45 text-white">
            <span className="font-label-md text-label-md">반환완료</span>
          </div>
        ) : item.status === 'requested' ? (
          <span className="absolute left-1.5 top-1.5 rounded-sm bg-primary px-1.5 py-0.5 text-[11px] font-semibold leading-tight text-on-primary">
            신청중
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-0.5 px-0.5">
        <span className="truncate text-[14px] leading-5 text-on-surface">{item.name}</span>
        <span className={`text-[15px] font-bold leading-5 ${status.className}`}>{status.label}</span>
        <span className="truncate text-[12px] leading-4 text-outline">
          {item.location} · {formatRelative(item.foundAt)}
        </span>
      </div>
    </Link>
  )
}
