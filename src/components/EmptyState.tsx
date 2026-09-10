import { Icon } from './Icon'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon = 'search_off', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg bg-surface-container-low px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-high text-outline">
        <Icon name={icon} size={28} />
      </span>
      <p className="font-label-md text-label-md text-on-surface">{title}</p>
      {description ? (
        <p className="max-w-sm font-body-md text-body-md text-on-surface-variant">{description}</p>
      ) : null}
      {action}
    </div>
  )
}
