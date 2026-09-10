import { Icon } from './Icon'

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onFocus?: () => void
  readOnly?: boolean
  autoFocus?: boolean
}

export function SearchField({
  value,
  onChange,
  placeholder = '분실물 검색...',
  onFocus,
  readOnly = false,
  autoFocus = false,
}: SearchFieldProps) {
  return (
    <div className="group relative flex h-12 w-full items-center overflow-hidden rounded-full border border-outline-variant/30 bg-surface-container-lowest shadow-level1 transition-shadow focus-within:shadow-level1-hover">
      <Icon
        name="search"
        className="absolute left-4 text-outline transition-colors group-focus-within:text-primary"
      />
      <input
        type="search"
        value={value}
        readOnly={readOnly}
        autoFocus={autoFocus}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="분실물 검색"
        className="h-full w-full bg-transparent pl-12 pr-12 font-body-md text-body-md text-on-surface outline-none placeholder:text-outline/70"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="검색어 지우기"
          className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-variant"
        >
          <Icon name="close" size={20} />
        </button>
      ) : null}
    </div>
  )
}
