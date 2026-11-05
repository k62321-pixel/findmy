import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'

interface Slide {
  title: string
  sub: string
  cta?: { label: string; to: string }
  /** Material Symbols name, drawn huge and faint, bleeding off the right edge. */
  art: string
  bg: string
  ink: string
}

/** How-to-use slides, shown like a marketplace's promo carousel. */
const SLIDES: Slide[] = [
  {
    title: '물건을 주웠나요?\n사진 한 장으로 신고하세요',
    sub: '1분이면 끝나요',
    cta: { label: '습득물 신고하기', to: '/report' },
    art: 'photo_camera',
    bg: '#ffb46e',
    ink: '#3d2200',
  },
  {
    title: '주운 물건은\n1층 교무실에 맡겨주세요',
    sub: '운영 시간 평일 09:00 - 17:00',
    art: 'meeting_room',
    bg: '#9fd8ff',
    ink: '#0b2a40',
  },
  {
    title: '잃어버렸다면\n‘내 물건 찾기’를 누르세요',
    sub: '교무실에서 학생증 확인 후 받아가요',
    cta: { label: '습득물 둘러보기', to: '#items' },
    art: 'travel_explore',
    bg: '#ffc7d6',
    ink: '#45091b',
  },
  {
    title: '내 물건이 맞는지\n주운 사람과 채팅해 보세요',
    sub: '상세 화면의 ‘습득자와 채팅’',
    cta: { label: '채팅 바로가기', to: '/chats' },
    art: 'forum',
    bg: '#b9f0c9',
    ink: '#0b3317',
  },
]

const AUTOPLAY_MS = 5000

export function UsageBanner() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchX = useRef<number | null>(null)
  const count = SLIDES.length

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count])

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') go(1)
    }, AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [paused, go, index])

  return (
    <section
      aria-roledescription="carousel"
      aria-label="이용 방법"
      className="group relative overflow-hidden rounded-xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX
        setPaused(true)
      }}
      onTouchEnd={(e) => {
        if (touchX.current !== null) {
          const dx = e.changedTouches[0].clientX - touchX.current
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
        }
        touchX.current = null
        setPaused(false)
      }}
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {SLIDES.map((slide, i) => (
          <div
            key={slide.title}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${count}`}
            aria-hidden={i !== index}
            className="relative flex h-[168px] w-full shrink-0 items-center overflow-hidden px-6 sm:h-[220px] md:h-[300px] md:px-24"
            style={{ backgroundColor: slide.bg, color: slide.ink }}
          >
            {/* Oversized single-colour glyph cropped by the edge — a graphic, not a sticker. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-10 -right-6 origin-bottom-right scale-[0.5] opacity-[0.16] sm:scale-[0.7] md:-bottom-16 md:right-16 md:scale-100"
            >
              <Icon name={slide.art} size={360} filled />
            </span>

            <div className="relative flex min-w-0 flex-col gap-1.5 md:gap-3">
              <span className="w-fit rounded-full border border-current px-2 py-px text-[11px] font-bold tracking-wider opacity-70 md:px-3 md:py-0.5 md:text-[14px]">
                STEP {i + 1}
              </span>
              <p className="whitespace-pre-line break-keep text-[19px] font-extrabold leading-[1.3] tracking-tight sm:text-[26px] md:text-[40px]">
                {slide.title}
              </p>
              <p className="text-[13px] font-semibold opacity-75 sm:text-[15px] md:text-[20px]">{slide.sub}</p>
              {slide.cta ? (
                slide.cta.to.startsWith('#') ? (
                  <a
                    href={slide.cta.to}
                    tabIndex={i === index ? 0 : -1}
                    className="mt-1 flex w-fit items-center text-[13px] font-bold sm:text-[15px] md:text-[20px]"
                  >
                    {slide.cta.label}
                    <Icon name="chevron_right" size={20} />
                  </a>
                ) : (
                  <Link
                    to={slide.cta.to}
                    tabIndex={i === index ? 0 : -1}
                    className="mt-1 flex w-fit items-center text-[13px] font-bold sm:text-[15px] md:text-[20px]"
                  >
                    {slide.cta.label}
                    <Icon name="chevron_right" size={20} />
                  </Link>
                )
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="이전 배너"
        className="absolute left-5 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white transition-colors hover:bg-black/40 md:flex"
      >
        <Icon name="chevron_left" size={28} />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="다음 배너"
        className="absolute right-5 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white transition-colors hover:bg-black/40 md:flex"
      >
        <Icon name="chevron_right" size={28} />
      </button>

      <span className="absolute bottom-3 right-3 rounded-full bg-black/35 px-2.5 py-0.5 text-[12px] font-bold text-white md:bottom-4 md:right-4 md:text-[14px]">
        {index + 1} / {count}
      </span>
    </section>
  )
}
