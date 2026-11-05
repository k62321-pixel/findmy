import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import type { CredentialResponse } from '@react-oauth/google'
import { useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { useAuth } from '../store/AuthProvider'

interface LocationState {
  from?: { pathname: string; search?: string }
}

export function LoginPage() {
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')

  const from = (location.state as LocationState | null)?.from
  // Only same-app paths: never bounce to /login again or to anything off-site.
  const redirectTo = from?.pathname?.startsWith('/') && from.pathname !== '/login' ? `${from.pathname}${from.search ?? ''}` : '/browse'

  async function handleSuccess(credentialResponse: CredentialResponse) {
    if (!credentialResponse.credential) {
      setError('로그인에 실패했습니다. 다시 시도해 주세요.')
      return
    }
    try {
      await loginWithGoogle(credentialResponse.credential)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다. 다시 시도해 주세요.')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-container-lowest px-6 py-16">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <img src="/image-removebg-preview(2).png" alt="경북일고 교표" className="h-24 w-24 object-contain" />

        <div className="flex flex-col gap-2">
          <span className="text-[18px] font-black tracking-[-0.045em] text-on-surface">경북일고 분실물</span>
          <h1 className="text-[28px] font-bold leading-9 text-on-surface">로그인/회원가입</h1>
          <p className="break-keep font-body-md text-body-md text-on-surface-variant">
            학교 계정(Google)으로 로그인하면 분실물을 신고하고 수령을 신청할 수 있습니다.
          </p>
        </div>

        <div className="mt-2">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => setError('로그인에 실패했습니다. 다시 시도해 주세요.')}
            locale="ko"
            // Google draws this button itself; outline + rectangular is the closest
            // option to the header's white, grey-bordered buttons.
            shape="rectangular"
            theme="outline"
            size="large"
            text="continue_with"
            width="320"
          />
        </div>

        {error ? (
          <p role="alert" className="flex items-center gap-1 font-label-sm text-label-sm text-error">
            <Icon name="error" size={14} />
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
