const DAY = 24 * 60 * 60 * 1000

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function clock(d: Date): string {
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const meridiem = h < 12 ? '오전' : '오후'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${meridiem} ${h12}:${m}`
}

/** "오늘 오전 10:30" / "어제 오후 2:15" / "10월 24일" */
export function formatFoundAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''

  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(d)) / DAY)
  if (diffDays === 0) return `오늘 ${clock(d)}`
  if (diffDays === 1) return `어제 ${clock(d)}`
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** "2023년 10월 24일" — used on the detail screen. */
export function formatFoundDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}
