import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { ClaimDialog } from '../components/ClaimDialog'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { ItemThumb } from '../components/ItemThumb'
import { LoadError } from '../components/LoadError'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { StatusChip } from '../components/StatusChip'
import { categoryOf } from '../lib/categories'
import { formatFoundAt, formatFoundDate } from '../lib/format'
import { useAuth } from '../store/AuthProvider'
import { useItems } from '../store/ItemsProvider'
import type { LostItem } from '../types'

export function ItemDetailPage() {
  const { id = '' } = useParams()
  const { getItem, requestClaim, cancelClaim, status: itemsStatus } = useItems()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [claiming, setClaiming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [viewingPhoto, setViewingPhoto] = useState(false)
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
          {itemsStatus === 'error' ? (
            <LoadError />
          ) : (
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
          )}
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
    setError('')
    setClaiming(true)
  }

  async function run(action: () => Promise<unknown>, onDone?: () => void) {
    setSubmitting(true)
    setError('')
    try {
      await action()
      onDone?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청에 실패했습니다.')
    } finally {
      setSubmitting(false)
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
          {item.imageUrl ? (
            <button
              type="button"
              onClick={() => setViewingPhoto(true)}
              aria-label="사진 크게 보기"
              className="absolute inset-0 cursor-zoom-in"
            >
              <span className="absolute right-margin-mobile top-margin-mobile flex h-10 w-10 items-center justify-center rounded-full bg-inverse-surface/50 text-inverse-on-surface">
                <Icon name="fullscreen" />
              </span>
            </button>
          ) : null}
          <div className="absolute bottom-margin-mobile left-margin-mobile flex gap-2">
            <StatusChip status={item.status} size="md" />
            <span className="rounded-full bg-surface-container-highest px-3 py-1 font-label-md text-label-md text-on-surface shadow-sm">
              {categoryOf(item.category).label}
            </span>
          </div>
        </div>

        <div className="relative z-10 -mt-6 flex flex-col gap-6 rounded-t-xl bg-surface px-margin-mobile pb-48 pt-6 shadow-[0_-4px_24px_rgba(0,0,0,0.05)] md:px-margin-desktop">
          <div className="flex flex-col gap-1">
            <h2 className="break-words font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{item.name}</h2>
            {item.description ? (
              <p className="whitespace-pre-line break-words font-body-md text-body-md text-on-surface-variant">
                {item.description}
              </p>
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

          {item.claimedByMe && item.status === 'requested' ? (
            <div className="flex items-start gap-3 rounded-md bg-tertiary-fixed p-4 text-on-tertiary-fixed">
              <Icon name="schedule" size={20} className="mt-0.5 shrink-0" />
              <p className="font-body-md text-body-md">
                수령 신청이 접수되었습니다. {item.storage}에 학생증을 지참해 방문해 주세요. 담당자가 확인하면
                반환완료로 바뀝니다.
              </p>
            </div>
          ) : null}

          {user?.isAdmin ? <AdminPanel item={item} /> : null}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 bg-surface/90 p-4 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.05)] backdrop-blur-md">
          <div className="mx-auto flex max-w-container flex-col gap-2">
            {error && !claiming ? (
              <p role="alert" className="flex items-center gap-1 font-label-sm text-label-sm text-error">
                <Icon name="error" size={14} />
                {error}
              </p>
            ) : null}
            <PrimaryAction
              item={item}
              signedIn={!!user}
              submitting={submitting}
              onClaim={handleClaimClick}
              onCancel={() => run(() => cancelClaim(item.id))}
            />
          </div>
        </div>
      </div>

      {viewingPhoto && item.imageUrl ? (
        <PhotoViewer src={item.imageUrl} alt={item.name} onClose={() => setViewingPhoto(false)} />
      ) : null}

      {claiming ? (
        <ClaimDialog
          item={item}
          onClose={() => setClaiming(false)}
          onConfirm={() => run(() => requestClaim(item.id), () => setClaiming(false))}
          submitting={submitting}
          error={error}
        />
      ) : null}
    </AppShell>
  )
}

const BUTTON_BASE =
  'flex w-full items-center justify-center gap-2 rounded-md py-4 font-label-md text-label-md transition-transform active:scale-[0.98] disabled:cursor-not-allowed'

function PrimaryAction({
  item,
  signedIn,
  submitting,
  onClaim,
  onCancel,
}: {
  item: LostItem
  signedIn: boolean
  submitting: boolean
  onClaim: () => void
  onCancel: () => void
}) {
  if (item.status === 'requested' && item.claimedByMe) {
    return (
      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className={`${BUTTON_BASE} text-primary outline outline-1 outline-outline-variant hover:bg-surface-container disabled:opacity-60`}
      >
        <Icon name="undo" />
        {submitting ? '처리 중...' : '수령 신청 취소'}
      </button>
    )
  }

  const disabledReason =
    item.status === 'returned'
      ? { icon: 'check_circle', label: '이미 반환된 물건입니다' }
      : item.status === 'requested'
        ? { icon: 'hourglass_top', label: '다른 사람이 수령 신청한 물건입니다' }
        : item.reportedByMe
          ? { icon: 'person', label: '내가 신고한 물건입니다' }
          : null

  if (disabledReason) {
    return (
      <button type="button" disabled className={`${BUTTON_BASE} bg-surface-container-highest text-on-surface-variant`}>
        <Icon name={disabledReason.icon} />
        {disabledReason.label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClaim}
      className={`${BUTTON_BASE} bg-primary text-on-primary shadow-level1`}
    >
      <Icon name="handshake" />
      {signedIn ? '내 물건 찾기' : '로그인하고 내 물건 찾기'}
    </button>
  )
}

/** Staff-only controls. The server re-checks ADMIN_EMAILS on every one of these calls. */
function AdminPanel({ item }: { item: LostItem }) {
  const { setItemStatus, deleteItem } = useItems()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const info = item.admin

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const outline =
    'h-11 rounded-md px-4 font-label-md text-label-md text-primary outline outline-1 outline-outline-variant transition-colors hover:bg-surface-container disabled:opacity-60'
  const filled =
    'h-11 rounded-md bg-primary px-4 font-label-md text-label-md text-on-primary shadow-level1 disabled:opacity-60'

  return (
    <section className="flex flex-col gap-4 rounded-md bg-surface-container-lowest p-4 shadow-level1 outline outline-1 outline-primary/30">
      <div className="flex items-center gap-2 text-primary">
        <Icon name="admin_panel_settings" size={20} filled />
        <h3 className="font-label-md text-label-md">관리자</h3>
      </div>

      {info ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-body-md text-body-md">
          <dt className="text-on-surface-variant">신고자</dt>
          <dd className="break-all text-on-surface">
            {info.reporterName} ({info.reporterEmail})
          </dd>
          {info.claimantEmail ? (
            <>
              <dt className="text-on-surface-variant">수령 신청자</dt>
              <dd className="break-all text-on-surface">
                {info.claimantName} ({info.claimantEmail})
                {info.claimedAt ? <span className="text-outline"> · {formatFoundAt(info.claimedAt)}</span> : null}
              </dd>
            </>
          ) : null}
          {item.status === 'returned' && info.resolvedBy ? (
            <>
              <dt className="text-on-surface-variant">반환 처리</dt>
              <dd className="break-all text-on-surface">
                {info.resolvedBy}
                {info.resolvedAt ? <span className="text-outline"> · {formatFoundAt(info.resolvedAt)}</span> : null}
              </dd>
            </>
          ) : null}
        </dl>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {item.status !== 'returned' ? (
          <button type="button" disabled={busy} onClick={() => run(() => setItemStatus(item.id, 'returned'))} className={filled}>
            반환완료 처리
          </button>
        ) : null}
        {item.status === 'requested' ? (
          <button type="button" disabled={busy} onClick={() => run(() => setItemStatus(item.id, 'stored'))} className={outline}>
            신청 거절
          </button>
        ) : null}
        {item.status === 'returned' ? (
          <button type="button" disabled={busy} onClick={() => run(() => setItemStatus(item.id, 'stored'))} className={outline}>
            {/* The server keeps the pickup request when undoing a return that had one. */}
            {info?.claimantEmail ? '반환 취소 (수령 신청 상태로)' : '보관중으로 되돌리기'}
          </button>
        ) : null}
      </div>

      {confirmingDelete ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-error-container p-3 text-on-error-container">
          <span className="flex-1 font-label-sm text-label-sm">게시물과 사진을 영구 삭제할까요?</span>
          <button type="button" disabled={busy} onClick={() => setConfirmingDelete(false)} className="h-9 px-3 font-label-sm text-label-sm">
            취소
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => deleteItem(item.id).then(() => navigate('/admin', { replace: true })))}
            className="h-9 rounded-md bg-error px-3 font-label-sm text-label-sm text-on-error disabled:opacity-60"
          >
            삭제
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className="w-fit font-label-sm text-label-sm text-error hover:underline"
        >
          게시물 삭제
        </button>
      )}

      {error ? (
        <p role="alert" className="flex items-center gap-1 font-label-sm text-label-sm text-error">
          <Icon name="error" size={14} />
          {error}
        </p>
      ) : null}
    </section>
  )
}

function Fact({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-md bg-surface-container-low p-4">
      <div className="flex items-center gap-2 text-primary">
        <Icon name={icon} size={20} filled />
        <span className="font-label-md text-label-md">{label}</span>
      </div>
      <p className="break-words font-body-md text-body-md text-on-surface">{value}</p>
    </div>
  )
}

/** Full-screen photo overlay; closes on tap anywhere or Escape. */
function PhotoViewer({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} 사진`}
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-2"
    >
      <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
      >
        <Icon name="close" />
      </button>
    </div>
  )
}
