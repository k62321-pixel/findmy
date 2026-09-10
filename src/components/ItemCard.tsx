import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import { ItemThumb } from './ItemThumb'
import { StatusChip } from './StatusChip'
import { formatFoundAt } from '../lib/format'
import type { LostItem } from '../types'

/** Grid card — 1:1 photo on top, name / location / time below (DESIGN.md › Cards). */
export function ItemCard({ item }: { item: LostItem }) {
  return (
    <Link
      to={`/items/${item.id}`}
      className="group flex flex-col gap-2 rounded-lg bg-surface-container-lowest p-3 shadow-level1 transition-all hover:-translate-y-1 hover:shadow-level1-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded bg-surface-variant">
        <ItemThumb
          src={item.imageUrl}
          alt={item.name}
          category={item.category}
          className={`h-full w-full ${item.status === 'returned' ? 'grayscale' : ''}`}
          glyphSize={48}
        />
        <StatusChip status={item.status} className="absolute right-2 top-2" />
      </div>

      <div className="flex flex-col pt-1">
        <span className="truncate font-label-md text-label-md text-on-surface">{item.name}</span>
        <span className="mt-0.5 flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
          <Icon name="location_on" size={14} />
          <span className="truncate">{item.location}</span>
        </span>
        <span className="mt-1 font-label-sm text-label-sm text-outline">{formatFoundAt(item.foundAt)}</span>
      </div>
    </Link>
  )
}
