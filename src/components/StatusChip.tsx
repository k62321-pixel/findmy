import type { ItemStatus } from '../types'

const STYLES: Record<ItemStatus, { label: string; className: string }> = {
  // Secondary (Academy Green) resolves a "found" item; neutral tones retire a returned one.
  stored: { label: '보관중', className: 'bg-secondary text-on-secondary' },
  returned: { label: '반환완료', className: 'bg-surface-container-highest text-on-surface-variant' },
}

interface StatusChipProps {
  status: ItemStatus
  size?: 'sm' | 'md'
  className?: string
}

export function StatusChip({ status, size = 'sm', className = '' }: StatusChipProps) {
  const { label, className: tone } = STYLES[status]
  const scale = size === 'md' ? 'px-3 py-1 text-label-md font-label-md' : 'px-2 py-0.5 text-label-sm font-label-sm'
  return <span className={`inline-block rounded-full shadow-sm ${scale} ${tone} ${className}`}>{label}</span>
}
