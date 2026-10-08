import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { apiUrl, responseError } from '../lib/api'

const MAX_LENGTH = 1000

interface InquiryDialogProps {
  onClose: () => void
}

/** Lets a signed-in user send a free-text inquiry; admins read them on the admin page. */
export function InquiryDialog({ onClose }: InquiryDialogProps) {
  const textRef = useRef<HTMLTextAreaElement>(null)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    textRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, submitting])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) {
      setError('문의 내용을 입력해 주세요.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(apiUrl('/api/inquiries'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw await responseError(res, '문의 제출에 실패했습니다. 다시 시도해 주세요.')
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '문의 제출에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={submitting ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-title"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-level2"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
          <Icon name={sent ? 'check_circle' : 'support_agent'} />
        </span>

        {sent ? (
          <>
            <div className="flex flex-col gap-1">
              <h2 id="inquiry-title" className="font-headline-md text-headline-md text-on-surface">
                문의가 접수되었습니다
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                소중한 의견 감사합니다. 관리자가 확인 후 반영하겠습니다.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 h-12 w-full rounded-md bg-primary font-label-md text-label-md text-on-primary shadow-level1 transition-transform active:scale-[0.98]"
            >
              확인
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="inquiry-title" className="font-headline-md text-headline-md text-on-surface">
                문의사항
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                사이트를 이용하며 불편했던 점이나 궁금한 점을 적어 주세요.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <textarea
                ref={textRef}
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={MAX_LENGTH}
                placeholder="문의 내용을 입력하세요."
                aria-label="문의 내용"
                className="w-full resize-none rounded bg-surface p-4 font-body-md text-body-md text-on-surface shadow-sm transition-shadow placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="self-end font-label-sm text-label-sm text-outline">
                {content.length}/{MAX_LENGTH}
              </span>
            </div>

            {error ? (
              <p role="alert" className="flex items-center gap-1 font-label-sm text-label-sm text-error">
                <Icon name="error" size={14} />
                {error}
              </p>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="h-12 flex-1 rounded-md font-label-md text-label-md text-primary outline outline-1 outline-outline-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-12 flex-1 rounded-md bg-primary font-label-md text-label-md text-on-primary shadow-level1 transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? '제출 중...' : '제출'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
