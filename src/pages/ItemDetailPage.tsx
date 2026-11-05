import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { ClaimDialog } from '../components/ClaimDialog'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { ItemThumb } from '../components/ItemThumb'
import { LoadError } from '../components/LoadError'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { categoryOf } from '../lib/categories'
import { openChat } from '../lib/chat'
import { addRecentlyViewed } from '../lib/recent'
import { formatFoundAt, formatFoundDate, formatRelative } from '../lib/format'
import { useAuth } from '../store/AuthProvider'
import { useItems } from '../store/ItemsProvider'
import type { LostItem } from '../types'

export function ItemDetailPage() {
  const { id = '' } = useParams()
  const { getItem, requestClaim, cancelClaim, setSaved, status: itemsStatus } = useItems()
  const [savingToggle, setSavingToggle] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [claiming, setClaiming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [viewingPhoto, setViewingPhoto] = useState(false)
  const [openingChat, setOpeningChat] = useState(false)
  const item = getItem(id)
  const found = !!item

  useEffect(() => {
    if (found) addRecentlyViewed(id)
  }, [found, id])

  if (!item) {
    if (itemsStatus === 'loading') {
      return (
        <AppShell title="물품 상세" back headerActions={false} nav={false}>
          <LoadingSpinner className="h-[60vh]" />
        </AppShell>
      )
    }
    return (
      <AppShell title="물품 상세" back nav={false}>
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

  async function handleChatClick() {
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }
    setOpeningChat(true)
    setError('')
    try {
      const chat = await openChat(item!.id)
      navigate(`/chats/${chat.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '채팅방을 열지 못했습니다.')
    } finally {
      setOpeningChat(false)
    }
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

  async function handleSaveClick() {
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }
    setSavingToggle(true)
    setError('')
    try {
      await setSaved(item!.id, !item!.savedByMe)
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setSavingToggle(false)
    }
  }

  const saved = !!item.savedByMe

  const actions = (
    <div className="flex flex-col gap-2">
      {error && !claiming ? (
        <p role="alert" className="flex items-center gap-1 font-label-sm text-label-sm text-error">
          <Icon name="error" size={14} />
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSaveClick}
          disabled={savingToggle}
          aria-pressed={saved}
          aria-label={saved ? '저장 해제' : '저장하기'}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded border border-outline-variant transition-colors hover:bg-surface-container-low disabled:opacity-60"
        >
          <Icon name="bookmark" size={26} filled={saved} className={saved ? 'text-on-surface' : 'text-outline'} />
        </button>
        {item.reportedByMe ? (
          <Link
            to="/chats"
            className="flex h-14 flex-1 items-center justify-center gap-1.5 rounded bg-inverse-surface text-[16px] font-bold text-inverse-on-surface"
          >
            <Icon name="forum" />
            <span className="sm:hidden">받은 채팅</span>
            <span className="hidden sm:inline">받은 채팅 보기</span>
          </Link>
        ) : item.status !== 'returned' ? (
          <button
            type="button"
            onClick={handleChatClick}
            disabled={openingChat}
            className="flex h-14 flex-1 items-center justify-center gap-1.5 rounded bg-inverse-surface text-[16px] font-bold text-inverse-on-surface transition-opacity disabled:opacity-60"
          >
            <Icon name="chat" />
            <span className="sm:hidden">채팅하기</span>
            <span className="hidden sm:inline">습득자와 채팅</span>
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <PrimaryAction
            item={item}
            submitting={submitting}
            onClaim={handleClaimClick}
            onCancel={() => run(() => cancelClaim(item.id))}
          />
        </div>
      </div>
    </div>
  )

  return (
    <AppShell title="물품 상세" back headerActions={false} nav={false}>
      {/* Marketplace product layout: breadcrumb, then photo left / details right on wide screens. */}
      <div className="flex flex-col gap-4 px-margin-mobile pb-40 pt-4 md:px-margin-desktop md:pb-16 md:pt-6">
        <nav aria-label="경로" className="flex items-center gap-1 text-[13px] text-outline md:text-[14px]">
          <Link to="/browse" className="hover:text-on-surface">
            습득물
          </Link>
          <Icon name="chevron_right" size={16} />
          <span className="font-semibold text-on-surface">{categoryOf(item.category).label}</span>
        </nav>

        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-12">
          <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-lg bg-surface-container md:w-[46%]">
            <ItemThumb
              src={item.imageUrl}
              alt={item.name}
              category={item.category}
              className={`h-full w-full ${returned ? 'grayscale' : ''}`}
              glyphSize={96}
            />
            {returned ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45">
                <span className="text-[22px] font-bold text-white">반환완료</span>
              </div>
            ) : null}
            {item.imageUrl ? (
              <button
                type="button"
                onClick={() => setViewingPhoto(true)}
                aria-label="사진 크게 보기"
                className="absolute inset-0 cursor-zoom-in"
              >
                <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white">
                  <Icon name="fullscreen" size={20} />
                </span>
              </button>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <h2 className="break-words text-[20px] leading-7 text-on-surface md:text-[24px] md:leading-8">{item.name}</h2>
            <p className={`mt-1 text-[26px] font-bold leading-9 md:text-[30px] ${STATUS_TONE[item.status]}`}>
              {STATUS_LABEL[item.status]}
            </p>
            <p className="mt-2 flex items-center gap-1 text-[14px] text-outline">
              <Icon name="schedule" size={16} />
              {formatRelative(item.foundAt)} 등록
            </p>

            <dl className="mt-5 grid grid-cols-[84px_1fr] gap-y-3 border-t border-outline-variant pt-5 text-[15px] md:grid-cols-[96px_1fr]">
              <dt className="text-outline">카테고리</dt>
              <dd className="text-on-surface">{categoryOf(item.category).label}</dd>
              <dt className="text-outline">습득 장소</dt>
              <dd className="break-words text-on-surface">{item.location}</dd>
              <dt className="text-outline">습득일</dt>
              <dd className="text-on-surface">{formatFoundDate(item.foundAt)}</dd>
              <dt className="text-outline">보관 장소</dt>
              <dd className="text-on-surface">
                {item.storage}
                <span className="ml-1 text-[13px] text-outline">(평일 09:00 - 17:00)</span>
              </dd>
            </dl>

            {item.description ? (
              <div className="mt-6 border-t border-outline-variant pt-5">
                <h3 className="mb-2 text-[16px] font-bold text-on-surface">물품 설명</h3>
                <p className="whitespace-pre-line break-words text-[16px] leading-7 text-on-surface">{item.description}</p>
              </div>
            ) : null}

            {item.claimedByMe && item.status === 'requested' ? (
              <div className="mt-6 flex items-start gap-3 rounded bg-primary-container p-4 text-on-surface">
                <Icon name="schedule" size={20} className="mt-0.5 shrink-0 text-primary" />
                <p className="text-[15px] leading-6">
                  수령 신청이 접수되었습니다. {item.storage}에 학생증을 지참해 방문해 주세요. 담당자가 확인하면
                  반환완료로 바뀝니다.
                </p>
              </div>
            ) : null}

            {/* Wide screens: actions sit in the details column, like a product page's buy buttons. */}
            <div className="mt-8 hidden md:block">{actions}</div>

            {user?.isAdmin ? (
              <div className="mt-8">
                <AdminPanel item={item} />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Narrow screens: the same actions pinned to the bottom. */}
      <div className="fixed inset-x-0 bottom-0 z-20 bg-surface-container-lowest p-3 pb-safe shadow-bar-top md:hidden">
        <div className="mx-auto max-w-container">{actions}</div>
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

const STATUS_LABEL: Record<LostItem['status'], string> = {
  stored: '보관중',
  requested: '수령 신청중',
  returned: '반환완료',
}

const STATUS_TONE: Record<LostItem['status'], string> = {
  stored: 'text-on-surface',
  requested: 'text-primary',
  returned: 'text-outline',
}

const BUTTON_BASE =
  'flex h-14 w-full items-center justify-center gap-1.5 rounded text-[16px] font-bold transition-transform active:scale-[0.98] disabled:cursor-not-allowed'

function PrimaryAction({
  item,
  submitting,
  onClaim,
  onCancel,
}: {
  item: LostItem
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
      ? { icon: 'check_circle', label: '반환완료' }
      : item.status === 'requested'
        ? { icon: 'hourglass_top', label: '다른 사람이 신청함' }
        : item.reportedByMe
          ? { icon: 'person', label: '내가 신고한 물건' }
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
      {/* Signed-out users are sent to /login first by onClaim. */}
      내 물건 찾기
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
