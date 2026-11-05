import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import { ItemThumb } from './ItemThumb'
import { useRecentlyViewed } from '../lib/recent'
import { useItems } from '../store/ItemsProvider'

const PER_PAGE = 3

/**
 * Floating "최근 본 물건" rail on the right edge: viewed items stack up as photo
 * blocks, three per page. Only on wide screens, where it sits beside the content.
 */
export function RecentlyViewed() {
  const ids = useRecentlyViewed()
  const { getItem } = useItems()
  const [page, setPage] = useState(0)

  // Deleted items drop out instead of showing a broken block.
  const items = ids.map((id) => getItem(id)).filter((it) => it !== undefined)
  const pages = Math.max(1, Math.ceil(items.length / PER_PAGE))

  // A newly viewed item lands on top, so jump back to the first page.
  useEffect(() => setPage(0), [ids[0]])
  useEffect(() => {
    if (page > pages - 1) setPage(pages - 1)
  }, [page, pages])

  if (items.length === 0) return null

  const visible = items.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE)

  return (
    <aside
      aria-label="최근 본 물건"
      className="fixed right-6 top-28 z-30 hidden w-[92px] flex-col items-center gap-3 xl:flex"
    >
      <ul className="flex flex-col gap-2.5">
        {visible.map((item) => (
          <li key={item.id}>
            <Link to={`/items/${item.id}`} title={item.name} className="group block">
              <ItemThumb
                src={item.imageUrl}
                alt={item.name}
                category={item.category}
                className={`h-[72px] w-[72px] rounded-md transition-opacity group-hover:opacity-80 ${
                  item.status === 'returned' ? 'grayscale' : ''
                }`}
                glyphSize={28}
              />
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-1 text-[12px] text-on-surface-variant">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          aria-label="이전"
          className="flex h-6 w-6 items-center justify-center disabled:opacity-30"
        >
          <Icon name="chevron_left" size={18} />
        </button>
        <span>
          {page + 1}/{pages}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
          disabled={page >= pages - 1}
          aria-label="다음"
          className="flex h-6 w-6 items-center justify-center disabled:opacity-30"
        >
          <Icon name="chevron_right" size={18} />
        </button>
      </div>
    </aside>
  )
}
