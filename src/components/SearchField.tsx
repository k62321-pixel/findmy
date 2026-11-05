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
    <div className="group relative flex h-11 w-full items-center overflow-hidden rounded border border-transparent bg-surface-container transition-colors focus-within:border-primary focus-within:bg-surface-container-lowest">
      <Icon
        name="search"
        className="absolute left-3 text-outline transition-colors group-focus-within:text-primary"
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
        className="h-full w-full bg-transparent pl-10 pr-10 text-[15px] text-on-surface outline-none placeholder:text-outline"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="검색어 지우기"
          className="absolute right-2 flex h-6 w-6 items-center justify-center rounded-full bg-outline text-white transition-colors hover:bg-on-surface-variant"
        >
          <Icon name="close" size={16} />
        </button>
      ) : null}
    </div>
  )
}
