/**
 * Resolves an `/api/...` path against the backend origin.
 *
 * Locally, VITE_API_BASE_URL is unset and Vite's dev proxy forwards `/api`
 * to Flask, so a relative path is enough. In production netlify.toml proxies
 * `/api/*` to the backend, so it stays empty there too. Only a deployment
 * without that proxy needs VITE_API_BASE_URL (every call then becomes an
 * absolute cross-origin request, still with `credentials: 'include'`).
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}

/** Server error codes → messages shown to the user. */
const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: '로그인이 필요합니다. 다시 로그인해 주세요.',
  forbidden: '권한이 없습니다.',
  forbidden_origin: '허용되지 않은 요청입니다. 페이지를 새로고침해 주세요.',
  domain_not_allowed: '학교 계정으로만 로그인할 수 있습니다.',
  unverified_email: '이메일 인증이 완료된 구글 계정만 사용할 수 있습니다.',
  invalid_token: '구글 로그인 정보를 확인하지 못했습니다. 다시 시도해 주세요.',
  missing_fields: '필수 항목을 모두 입력해 주세요.',
  field_too_long: '입력한 내용이 너무 깁니다.',
  invalid_category: '카테고리를 다시 선택해 주세요.',
  invalid_file_type: 'JPG, PNG, GIF, WEBP 이미지만 첨부할 수 있습니다.',
  file_too_large: '사진 용량이 너무 큽니다. 3MB 이하로 올려 주세요.',
  rate_limited: '신고는 1시간에 10건까지 할 수 있습니다. 잠시 후 다시 시도해 주세요.',
  too_many_claims: '수령 신청은 동시에 3건까지 할 수 있습니다. 분실물 센터를 방문해 먼저 처리해 주세요.',
  not_found: '존재하지 않는 습득물입니다.',
  own_item: '내가 신고한 물건은 수령 신청할 수 없습니다.',
  already_requested: '이미 다른 사람이 수령 신청한 물건입니다.',
  already_returned: '이미 반환된 물건입니다.',
  not_claimant: '내가 신청한 건만 취소할 수 있습니다.',
  invalid_status: '잘못된 상태 값입니다.',
}

export function errorMessage(code: string | undefined, fallback: string): string {
  return (code && ERROR_MESSAGES[code]) || fallback
}

/** Reads `{ error: code }` from a failed response and turns it into a user-facing message. */
export async function responseError(res: Response, fallback: string): Promise<Error> {
  let code: string | undefined
  try {
    const data = await res.json()
    if (typeof data?.error === 'string') code = data.error
  } catch {
    // Non-JSON body (e.g. a proxy's 502 page while the server wakes up).
  }
  return new Error(errorMessage(code, fallback))
}
