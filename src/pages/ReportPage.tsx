import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Icon } from '../components/Icon'
import { CATEGORIES } from '../lib/categories'
import { useItems } from '../store/ItemsProvider'
import type { CategoryId } from '../types'

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
  const [submitError, setSubmitError] = useState('')

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
      navigate(`/items/${item.id}`, { replace: true })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '신고 등록에 실패했습니다. 다시 시도해 주세요.')
      setSubmitting(false)
    }
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (photo) URL.revokeObjectURL(photo.previewUrl)
    setPhoto({ file, previewUrl: URL.createObjectURL(file) })
  }

  return (
    <AppShell title="Report Item">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-section-gap px-margin-mobile pt-margin-mobile md:px-margin-desktop"
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">분실물 신고</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              물건을 찾으셨나요? 아래에 정보를 입력해 주시면 주인을 찾는 데 도움이 됩니다.
            </p>
          </div>

          <div className="flex flex-col gap-6 rounded-lg bg-surface-container-lowest p-4 shadow-level1">
            <Field label="물품명" required error={errors.name} htmlFor="itemName">
              <input
                id="itemName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 검은색 애플워치"
                className="h-12 w-full rounded bg-surface px-4 font-body-md text-body-md text-on-surface shadow-sm transition-shadow placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </Field>

            <Field label="카테고리" required error={errors.category}>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const active = category === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setCategory(c.id)}
                      className={`rounded-full px-4 py-2 font-label-md text-label-md shadow-sm transition-transform active:scale-95 ${
                        active
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-surface text-on-surface-variant hover:bg-surface-container-highest'
                      }`}
                    >
                      {c.label}
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label="습득 장소" required error={errors.location} htmlFor="location">
              <div className="flex h-12 w-full items-center rounded bg-surface shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-primary">
                <Icon name="location_on" className="ml-4 text-outline" />
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="예: 중앙도서관 2층 열람실"
                  className="h-full w-full rounded-r bg-transparent px-2 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none"
                />
              </div>
            </Field>

            <Field label="사진 첨부">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhoto}
                className="hidden"
              />
              {photo ? (
                <div className="flex items-center gap-4 rounded-md bg-surface-container p-3">
                  <img src={photo.previewUrl} alt="첨부한 사진 미리보기" className="h-20 w-20 rounded object-cover" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate font-label-md text-label-md text-on-surface">{photo.file.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(photo.previewUrl)
                        setPhoto(null)
                        if (fileRef.current) fileRef.current.value = ''
                      }}
                      className="w-fit font-label-sm text-label-sm text-error hover:underline"
                    >
                      사진 삭제
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-outline-variant bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high active:bg-surface-variant"
                >
                  <Icon name="add_a_photo" size={32} />
                  <span className="font-label-md text-label-md">탭하여 사진 찍기 또는 업로드</span>
                </button>
              )}
            </Field>

            <Field label="추가 정보 (선택)" htmlFor="details">
              <textarea
                id="details"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="특징이나 상태 등 도움이 될 만한 정보를 적어주세요."
                className="w-full resize-none rounded bg-surface p-4 font-body-md text-body-md text-on-surface shadow-sm transition-shadow placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </Field>

            {submitError ? (
              <p role="alert" className="flex items-center gap-1 font-label-sm text-label-sm text-error">
                <Icon name="error" size={14} />
                {submitError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary font-label-md text-label-md text-on-primary shadow-level1 transition-transform hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Icon name={submitting ? 'progress_activity' : 'send'} className={submitting ? 'animate-spin' : ''} />
              <span>{submitting ? '등록 중...' : '신고하기'}</span>
            </button>
          </div>

          <div className="mb-6 flex items-start gap-4 rounded-lg bg-secondary-container p-4 shadow-level1">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-on-secondary-container text-secondary-container">
              <Icon name="lightbulb" size={20} />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="font-label-md text-label-md text-on-secondary-container">신고 팁</h3>
              <p className="font-body-md text-body-md text-on-secondary-container/80">
                정확한 장소와 물건의 특징을 잘 보여주는 사진은 주인을 찾는 데 결정적인 역할을 합니다.
              </p>
            </div>
          </div>
        </div>
      </form>
    </AppShell>
  )
}

function Field({
  label,
  required = false,
  error,
  htmlFor,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="font-label-md text-label-md text-on-surface">
        {label} {required ? <span className="text-error">*</span> : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="flex items-center gap-1 font-label-sm text-label-sm text-error">
          <Icon name="error" size={14} />
          {error}
        </p>
      ) : null}
    </div>
  )
}
