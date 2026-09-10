import { Icon } from './Icon'
import { CATEGORIES } from '../lib/categories'
import type { CategoryId } from '../types'

interface CategoryFilterProps {
  value: CategoryId | 'all'
  onChange: (value: CategoryId | 'all') => void
}

/** Horizontally scrollable pill row — one-tap filtering (DESIGN.md › Search & Filter). */
export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <div
      role="group"
      aria-label="카테고리 필터"
      className="no-scrollbar -mx-margin-mobile w-[calc(100%+32px)] overflow-x-auto px-margin-mobile pb-2"
    >
      <div className="flex w-max gap-2">
        <Pill active={value === 'all'} onClick={() => onChange('all')}>
          전체
        </Pill>
        {CATEGORIES.map((c) => (
          <Pill key={c.id} active={value === c.id} onClick={() => onChange(c.id)}>
            <Icon name={c.icon} size={16} />
            {c.label}
          </Pill>
        ))}
      </div>
    </div>
  )
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex items-center gap-1 whitespace-nowrap rounded-full px-4 py-2 font-label-sm text-label-sm transition-all ${
        active
          ? 'bg-primary text-on-primary shadow-sm'
          : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
      }`}
    >
      {children}
    </button>
  )
}
