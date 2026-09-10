import { Icon } from './Icon'

export function LoadingSpinner({ className = 'h-40' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Icon name="progress_activity" size={28} className="animate-spin text-outline" />
    </div>
  )
}
