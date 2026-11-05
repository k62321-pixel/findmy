import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { CATEGORIES } from '../lib/categories'
import type { CategoryId } from '../types'

interface CategoryFilterProps {
  value: CategoryId | 'all'
  onChange: (value: CategoryId | 'all') => void
}

/** Everything, for the "☰ 카테고리" dropdown. */
const TABS: { id: CategoryId | 'all'; label: string }[] = [
  { id: 'all', label: '전체' },
  ...CATEGORIES.map((c) => ({ id: c.id, label: c.label.split('/')[0] })),
]

/** The few things students lose most — the only ones shown in the bar itself. */
const FEATURED: { id: CategoryId; label: string }[] = [
  { id: 'electronics', label: '이어폰' },
  { id: 'stationery', label: '필기구' },
  { id: 'wallet', label: '지갑' },
  { id: 'clothing', label: '체육복' },
]

/**
 * Marketplace-style text menu: "☰ 카테고리" opens the full list, followed by bold
 * category tabs that scroll sideways on narrow screens.
 */
export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function pick(id: CategoryId | 'all') {
    onChange(id)
    setOpen(false)
  }

  // A category picked from the dropdown that isn't featured still shows in the bar while active.
  const bar =
    value !== 'all' && !FEATURED.some((f) => f.id === value)
      ? [...FEATURED, TABS.find((t) => t.id === value)!]
      : FEATURED

  return (
    <div ref={rootRef} className="relative">
      <div role="group" aria-label="카테고리 필터" className="flex items-center gap-1">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-12 shrink-0 items-center gap-1.5 pr-3 text-[16px] font-bold text-on-surface md:text-[18px]"
        >
          <Icon name={open ? 'close' : 'menu'} size={22} />
          카테고리
        </button>

        <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-5 overflow-x-auto md:gap-8">
          {bar.map((tab) => {
            const active = value === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={active}
                // Tapping the active tab again clears the filter (there is no "전체" tab in the bar).
                onClick={() => pick(active ? 'all' : tab.id)}
                className={`relative flex h-12 shrink-0 items-center whitespace-nowrap text-[16px] font-bold transition-colors md:text-[18px] ${
                  active ? 'text-primary' : 'text-on-surface hover:text-on-surface-variant'
                }`}
              >
                {tab.label}
                {active ? <span className="absolute inset-x-0 bottom-0 h-[2px] bg-primary" /> : null}
              </button>
            )
          })}
        </div>
      </div>

      {open ? (
        <div className="absolute left-0 top-full z-40 w-full max-w-sm rounded-b-md bg-surface-container-lowest py-2 shadow-level2 outline outline-1 outline-outline-variant">
          {TABS.map((tab) => {
            const full = tab.id === 'all' ? '전체' : CATEGORIES.find((c) => c.id === tab.id)!.label
            const active = value === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => pick(tab.id)}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[15px] transition-colors hover:bg-surface-container-low ${
                  active ? 'font-bold text-primary' : 'text-on-surface'
                }`}
              >
                {full}
                {active ? <Icon name="check" size={18} /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
