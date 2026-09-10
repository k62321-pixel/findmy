import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { ClaimDialog } from '../components/ClaimDialog'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { ItemThumb } from '../components/ItemThumb'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { StatusChip } from '../components/StatusChip'
import { categoryOf } from '../lib/categories'
import { formatFoundDate } from '../lib/format'
import { useAuth } from '../store/AuthProvider'
import { useItems } from '../store/ItemsProvider'

export function ItemDetailPage() {
  const { id = '' } = useParams()
  const { getItem, markReturned, status: itemsStatus } = useItems()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [claiming, setClaiming] = useState(false)
  const [claimSubmitting, setClaimSubmitting] = useState(false)
  const [claimError, setClaimError] = useState('')
  const item = getItem(id)

  if (!item) {
    if (itemsStatus === 'loading') {
      return (
        <AppShell title="Item Details" back headerActions={false} nav={false}>
          <LoadingSpinner className="h-[60vh]" />
        </AppShell>
      )
    }
    return (
      <AppShell title="Item Details" back nav={false}>
        <div className="px-margin-mobile py-12">
          <EmptyState
            icon="help"
            title="존재하지 않는 습득물입니다"
            description="이미 반환되었거나 삭제된 항목일 수 있습니다."
            action={
              <Link to="/browse" className="font-label-md text-label-md text-primary hover:underline">
                목록으로 돌아가기
              </Link>
            }
          />
        </div>
      </AppShell>
    )
  }

  const returned = item.status === 'returned'

  function handleClaimClick() {
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }
    setClaimError('')
    setClaiming(true)
  }

  async function handleConfirmClaim() {
    if (!item) return
    setClaimSubmitting(true)
    setClaimError('')
    try {
      await markReturned(item.id)
      setClaiming(false)
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : '수령 신청에 실패했습니다.')
    } finally {
      setClaimSubmitting(false)
    }
  }

  return (
    <AppShell title="Item Details" back headerActions={false} nav={false}>
      <div className="relative flex w-full flex-col">
        <div className="relative h-[320px] w-full sm:h-[400px]">
          <ItemThumb
            src={item.imageUrl}
            alt={item.name}
            category={item.category}
            className={`h-full w-full ${returned ? 'grayscale' : ''}`}
            glyphSize={96}
          />
          <div className="absolute bottom-margin-mobile left-margin-mobile flex gap-2">
            <StatusChip status={item.status} size="md" />
            <span className="rounded-full bg-surface-container-highest px-3 py-1 font-label-md text-label-md text-on-surface shadow-sm">
              {categoryOf(item.category).label}
            </span>
          </div>
        </div>

        <div className="relative z-10 -mt-6 flex flex-col gap-6 rounded-t-xl bg-surface px-margin-mobile pb-40 pt-6 shadow-[0_-4px_24px_rgba(0,0,0,0.05)] md:px-margin-desktop">
          <div className="flex flex-col gap-1">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{item.name}</h2>
            {item.description ? (
              <p className="font-body-md text-body-md text-on-surface-variant">{item.description}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Fact icon="calendar_today" label="습득일" value={formatFoundDate(item.foundAt)} />
            <Fact icon="location_on" label="습득 장소" value={item.location} />
          </div>

          <div className="flex items-start gap-4 rounded-md bg-surface-container p-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <Icon name="account_balance" size={24} filled />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="font-label-md text-label-md text-on-surface">현재 보관 장소</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">{item.storage}</p>
              <p className="mt-1 font-label-sm text-label-sm text-outline">운영 시간: 평일 09:00 - 17:00</p>
            </div>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 bg-surface/90 p-4 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.05)] backdrop-blur-md">
          <div className="mx-auto max-w-container">
            <button
              type="button"
              disabled={returned}
              onClick={handleClaimClick}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-4 font-label-md text-label-md text-on-primary shadow-level1 transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-surface-container-highest disabled:text-on-surface-variant disabled:shadow-none"
            >
              <Icon name={returned ? 'check_circle' : 'handshake'} />
              {returned ? '이미 반환된 물건입니다' : user ? '내 물건 찾기' : '로그인하고 내 물건 찾기'}
            </button>
          </div>
        </div>
      </div>

      {claiming ? (
        <ClaimDialog
          item={item}
          onClose={() => setClaiming(false)}
          onConfirm={handleConfirmClaim}
          submitting={claimSubmitting}
          error={claimError}
        />
      ) : null}
    </AppShell>
  )
}

function Fact({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-md bg-surface-container-low p-4">
      <div className="flex items-center gap-2 text-primary">
        <Icon name={icon} size={20} filled />
        <span className="font-label-md text-label-md">{label}</span>
      </div>
      <p className="font-body-md text-body-md text-on-surface">{value}</p>
    </div>
  )
}
