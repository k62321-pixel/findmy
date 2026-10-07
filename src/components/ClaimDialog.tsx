import { useEffect, useRef } from 'react'
import { Icon } from './Icon'
import type { LostItem } from '../types'

interface ClaimDialogProps {
  item: LostItem
  onClose: () => void
  onConfirm: () => void
  submitting?: boolean
  error?: string
}

/** Level 2 surface (DESIGN.md › Elevation): confirms a pickup request (staff confirm the actual return). */
export function ClaimDialog({ item, onClose, onConfirm, submitting = false, error }: ClaimDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    confirmRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, submitting])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={submitting ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-title"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-level2"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
          <Icon name="handshake" />
        </span>

        <div className="flex flex-col gap-1">
          <h2 id="claim-title" className="font-headline-md text-headline-md text-on-surface">
            수령을 신청할까요?
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            <strong className="text-on-surface">{item.name}</strong> 수령을 신청합니다. 신청 후 {item.storage}에
            학생증을 지참해 방문하면, 담당자가 본인 확인 후 물건을 돌려드립니다.
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-md bg-surface-container-low p-3">
          <Icon name="info" size={20} className="mt-0.5 shrink-0 text-primary" />
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            허위 수령 신청은 학칙에 따라 제재를 받을 수 있습니다.
          </p>
        </div>

        {error ? (
          <p role="alert" className="flex items-center gap-1 font-label-sm text-label-sm text-error">
            <Icon name="error" size={14} />
            {error}
          </p>
        ) : null}

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-12 flex-1 rounded-md font-label-md text-label-md text-primary outline outline-1 outline-outline-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
          >
            취소
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="h-12 flex-1 rounded-md bg-primary font-label-md text-label-md text-on-primary shadow-level1 transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? '처리 중...' : '수령 신청'}
          </button>
        </div>
      </div>
    </div>
  )
}
