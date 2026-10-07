import { EmptyState } from './EmptyState'
import { useItems } from '../store/ItemsProvider'

/** Shown instead of an empty list when the server couldn't be reached. */
export function LoadError() {
  const { refresh } = useItems()
  return (
    <EmptyState
      icon="cloud_off"
      title="습득물 목록을 불러오지 못했습니다"
      description="서버가 잠시 깨어나는 중일 수 있습니다. 잠시 후 다시 시도해 주세요."
      action={
        <button
          type="button"
          onClick={() => refresh()}
          className="mt-2 rounded-md bg-primary px-6 py-3 font-label-md text-label-md text-on-primary shadow-level1"
        >
          다시 시도
        </button>
      }
    />
  )
}
