import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import { ItemThumb } from './ItemThumb'
import { StatusChip } from './StatusChip'
import { categoryOf } from '../lib/categories'
import { formatFoundAt } from '../lib/format'
import type { LostItem } from '../types'

/** List row — the browse/feed variant of the card. */
export function ItemRow({ item }: { item: LostItem }) {
  const returned = item.status === 'returned'

  return (
    <Link
      to={`/items/${item.id}`}
      className={`group relative flex w-full gap-4 overflow-hidden rounded-lg bg-surface-container-lowest p-3 shadow-level1 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        returned ? 'opacity-75 hover:opacity-100' : 'hover:-translate-y-1 hover:shadow-level1-hover'
      }`}
    >
      <div className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-surface-container ${returned ? 'grayscale' : ''}`}>
        <ItemThumb src={item.imageUrl} alt={item.name} category={item.category} className="h-full w-full" />
        <StatusChip status={item.status} className="absolute right-1.5 top-1.5" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <h3
          className={`mb-1 truncate font-label-md text-label-md ${
            returned ? 'text-on-surface-variant line-through' : 'text-on-surface'
          }`}
        >
          {item.name}
        </h3>
        <div className="mb-1 flex items-center gap-1.5 text-on-surface-variant">
          <Icon name="location_on" size={14} />
          <span className="truncate font-label-sm text-label-sm">{item.location}</span>
        </div>
        <div className="mb-2 flex items-center gap-1.5 text-outline">
          <Icon name="schedule" size={14} />
          <span className="font-label-sm text-label-sm">{formatFoundAt(item.foundAt)}</span>
        </div>
        <span className="mt-auto w-fit rounded-sm bg-surface-container-highest px-2 py-1 font-label-sm text-label-sm text-on-surface-variant">
          {categoryOf(item.category).label}
        </span>
      </div>
    </Link>
  )
}
