import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Icon } from '../components/Icon'
import { CATEGORIES, categoryOf } from '../lib/categories'
import { compressImage } from '../lib/image'
import { useItems } from '../store/ItemsProvider'
import type { CategoryId, LostItem } from '../types'

// Listing concrete types (not image/*) makes iOS convert HEIC photos to JPEG on upload.
const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/gif,image/webp'
// Server's per-photo cap (after compressImage, photos are usually far below it).
const MAX_PHOTO_BYTES = 3 * 1024 * 1024
const MAX_DETAILS = 1000

interface FormErrors {
  name?: string
  category?: string
  location?: string
}

export function ReportPage() {
  const { addItem } = useItems()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [category, setCategory] = useState<CategoryId | null>(null)
  const [location, setLocation] = useState('')
  const [details, setDetails] = useState('')
  const [photo, setPhoto] = useState<{ file: File; previewUrl: string } | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [processingPhoto, setProcessingPhoto] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [reported, setReported] = useState<LostItem | null>(null)
  const [pickingCategory, setPickingCategory] = useState(false)

  function validate(): FormErrors {
    const next: FormErrors = {}
    if (!name.trim()) next.name = '물품명을 입력해 주세요.'
    if (!category) next.category = '카테고리를 선택해 주세요.'
    if (!location.trim()) next.location = '습득 장소를 입력해 주세요.'
    return next
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    setSubmitError('')
    try {
      const item = await addItem({
        name,
        category: category as CategoryId,
        location,
        description: details,
        photo: photo?.file,
      })
      setReported(item)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '신고 등록에 실패했습니다. 다시 시도해 주세요.')
      setSubmitting(false)
    }
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target
    const original = input.files?.[0]
    if (!original) return
    // Some Android cameras report an empty type — let the server's byte check decide then.
    if (original.type && !ACCEPTED_IMAGE_TYPES.split(',').includes(original.type)) {
      setSubmitError('JPG, PNG, GIF, WEBP 이미지만 첨부할 수 있습니다.')
      input.value = ''
      return
    }

    setProcessingPhoto(true)
    const file = await compressImage(original)
    setProcessingPhoto(false)

    if (file.size > MAX_PHOTO_BYTES) {
      setSubmitError('사진 용량이 너무 큽니다. 3MB 이하로 올려 주세요.')
      input.value = ''
      return
    }
    setSubmitError('')
    if (photo) URL.revokeObjectURL(photo.previewUrl)
    setPhoto({ file, previewUrl: URL.createObjectURL(file) })
  }

  return (
    <AppShell title="습득물 신고">
      {/* Marketplace "new listing" form: underlined fields, grey description box, red submit. */}
      <form onSubmit={handleSubmit} noValidate className="mx-auto flex w-full max-w-[640px] flex-col">
        <section className="flex flex-col px-margin-mobile pb-6 pt-6">
          <h2 className="text-[20px] font-bold leading-7 text-on-surface">습득물 정보</h2>

          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            capture="environment"
            onChange={handlePhoto}
            className="hidden"
          />
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={processingPhoto}
              aria-label={photo ? '사진 바꾸기' : '사진 추가'}
              className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-md bg-surface-container text-outline transition-colors hover:bg-surface-container-high"
            >
              <Icon
                name={processingPhoto ? 'progress_activity' : 'photo_camera'}
                size={26}
                filled={!processingPhoto}
                className={processingPhoto ? 'animate-spin' : ''}
              />
              <span className="text-[12px] leading-4">{processingPhoto ? '처리 중' : `사진 ${photo ? 1 : 0}/1`}</span>
            </button>
            {photo ? (
              <div className="relative h-20 w-20 shrink-0">
                <img src={photo.previewUrl} alt="첨부한 사진 미리보기" className="h-full w-full rounded-md object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(photo.previewUrl)
                    setPhoto(null)
                    if (fileRef.current) fileRef.current.value = ''
                  }}
                  aria-label="사진 삭제"
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-inverse-surface text-white"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            ) : null}
          </div>

          <UnderlineField error={errors.name}>
            <input
              id="itemName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="물품명 (예: 검은색 에어팟 케이스)"
              aria-label="물품명"
              className={UNDERLINE_INPUT}
            />
          </UnderlineField>

          <UnderlineField error={errors.category}>
            <button
              type="button"
              onClick={() => setPickingCategory(true)}
              className="flex h-14 w-full items-center justify-between text-left text-[16px]"
            >
              <span className={category ? 'text-on-surface' : 'text-outline'}>
                {category ? categoryOf(category).label : '카테고리'}
              </span>
              <Icon name="chevron_right" className="text-outline" />
            </button>
          </UnderlineField>

          <UnderlineField error={errors.location}>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={200}
              placeholder="습득 장소 (예: 본관 3층 2-4반 앞 복도)"
              aria-label="습득 장소"
              className={UNDERLINE_INPUT}
            />
          </UnderlineField>

          <div className="mt-6 flex flex-col gap-3">
            <label htmlFor="details" className="text-[16px] font-bold text-on-surface">
              설명
            </label>
            <div className="flex flex-col rounded-md bg-surface-container-low p-4 focus-within:ring-1 focus-within:ring-outline">
              <textarea
                id="details"
                rows={6}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={MAX_DETAILS}
                placeholder={
                  '- 색상, 브랜드, 이름표, 케이스 등 물건의 특징을 자세히 적어주세요.\n- 주인만 알 수 있는 특징(안쪽 이름, 스티커 등)은 적지 않는 게 좋아요.\n- 전화번호 등 개인정보는 입력하지 마세요.'
                }
                className="w-full resize-none bg-transparent text-[16px] leading-6 text-on-surface placeholder:text-outline focus:outline-none"
              />
              <span className="self-end text-[12px] text-outline">
                {details.length}/{MAX_DETAILS}
              </span>
            </div>
          </div>
        </section>

        <div className="h-2 bg-surface-container-low" />

        <section className="flex flex-col gap-3 px-margin-mobile pb-8 pt-6">
          <h2 className="text-[16px] font-bold text-on-surface">맡기는 곳</h2>
          <p className="flex items-center gap-1.5 text-[15px] text-on-surface">
            <Icon name="location_on" size={18} className="text-outline" />
            1층 교무실
            <span className="text-[13px] text-outline">(평일 09:00 - 17:00)</span>
          </p>
          <p className="break-keep text-[13px] leading-5 text-on-surface-variant">
            등록을 마친 뒤 물건을 교무실에 가져다주세요. 주인은 교무실에서 본인 확인 후 받아 갑니다.
          </p>

          {submitError ? (
            <p role="alert" className="mt-2 flex items-center gap-1 text-[13px] text-error">
              <Icon name="error" size={14} />
              {submitError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || processingPhoto}
            className="mt-4 flex h-14 w-full items-center justify-center rounded bg-primary text-[16px] font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? '등록 중...' : '등록 완료'}
          </button>
        </section>
      </form>

      {pickingCategory ? (
        <CategorySheet
          value={category}
          onPick={(id) => {
            setCategory(id)
            setErrors((prev) => ({ ...prev, category: undefined }))
            setPickingCategory(false)
          }}
          onClose={() => setPickingCategory(false)}
        />
      ) : null}

      {reported ? (
        <ReportedDialog
          storage={reported.storage}
          onClose={() => navigate(`/items/${reported.id}`, { replace: true })}
        />
      ) : null}
    </AppShell>
  )
}

const UNDERLINE_INPUT =
  'h-14 w-full bg-transparent text-[16px] text-on-surface placeholder:text-outline focus:outline-none'

/** A row separated only by a bottom hairline, which turns red with an error message. */
function UnderlineField({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <div
        className={`border-b transition-colors focus-within:border-on-surface ${
          error ? 'border-error' : 'border-outline-variant'
        }`}
      >
        {children}
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 flex items-center gap-1 text-[13px] text-error">
          <Icon name="error" size={14} />
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** Bottom sheet (dialog on wide screens) listing every category. */
function CategorySheet({
  value,
  onPick,
  onClose,
}: {
  value: CategoryId | null
  onPick: (id: CategoryId) => void
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="카테고리 선택"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-t-xl bg-surface-container-lowest pb-safe sm:rounded-xl"
      >
        <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
          <h2 className="text-[17px] font-bold text-on-surface">카테고리</h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="flex h-8 w-8 items-center justify-center">
            <Icon name="close" />
          </button>
        </div>
        <ul className="overflow-y-auto py-1">
          {CATEGORIES.map((c) => {
            const active = value === c.id
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onPick(c.id)}
                  className={`flex w-full items-center gap-3 px-5 py-3.5 text-left text-[15px] transition-colors hover:bg-surface-container-low ${
                    active ? 'font-bold text-primary' : 'text-on-surface'
                  }`}
                >
                  <Icon name={c.icon} size={20} className={active ? 'text-primary' : 'text-outline'} />
                  <span className="flex-1">{c.label}</span>
                  {active ? <Icon name="check" size={20} /> : null}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

/** Shown once the report is saved: the finder still has to hand the item in. */
function ReportedDialog({ storage, onClose }: { storage: string; onClose: () => void }) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    confirmRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reported-title"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-level2"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
          <Icon name="check_circle" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 id="reported-title" className="font-headline-md text-headline-md text-on-surface">
            신고가 접수되었습니다
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            해당 물품을 <strong className="text-on-surface">{storage}</strong>로 가져다주세요.
          </p>
        </div>
        <button
          ref={confirmRef}
          type="button"
          onClick={onClose}
          className="mt-2 h-12 w-full rounded-md bg-primary font-label-md text-label-md text-on-primary shadow-level1 transition-transform active:scale-[0.98]"
        >
          확인
        </button>
      </div>
    </div>
  )
}
