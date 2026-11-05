import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { ItemThumb } from '../components/ItemThumb'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { StatusChip } from '../components/StatusChip'
import { getChat, sendChatMessage, usePolling } from '../lib/chat'
import { formatFoundAt } from '../lib/format'
import type { ChatMessage, ChatSummary } from '../types'

const MAX_LENGTH = 500
const POLL_MS = 4_000

export function ChatRoomPage() {
  const { id = '' } = useParams()
  const [chat, setChat] = useState<ChatSummary | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadError, setLoadError] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)

  const load = useCallback(() => {
    getChat(id)
      .then((data) => {
        setChat(data.chat)
        setMessages(data.messages)
        setLoadError('')
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : '채팅을 불러오지 못했습니다.'))
  }, [id])

  usePolling(load, POLL_MS)

  // Follow new messages only if the reader is already at the bottom — don't yank
  // someone who scrolled up to reread something.
  useEffect(() => {
    const onScroll = () => {
      const { scrollTop, clientHeight, scrollHeight } = document.documentElement
      stickToBottom.current = scrollHeight - scrollTop - clientHeight < 120
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useLayoutEffect(() => {
    if (stickToBottom.current) bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const content = draft.trim()
    if (!content || sending) return
    setSending(true)
    setSendError('')
    try {
      const message = await sendChatMessage(id, content)
      stickToBottom.current = true
      setMessages((prev) => [...prev, message])
      setDraft('')
    } catch (err) {
      setSendError(err instanceof Error ? err.message : '메시지를 보내지 못했습니다.')
    } finally {
      setSending(false)
    }
  }

  if (!chat) {
    return (
      <AppShell title="채팅" back headerActions={false} nav={false}>
        <div className="px-margin-mobile py-12">
          {loadError ? (
            <EmptyState
              icon="forum"
              title={loadError}
              action={
                <Link to="/chats" className="font-label-md text-label-md text-primary hover:underline">
                  채팅 목록으로
                </Link>
              }
            />
          ) : (
            <LoadingSpinner className="h-[60vh]" />
          )}
        </div>
      </AppShell>
    )
  }

  const canSend = chat.myRole !== 'observer' && !chat.closed

  return (
    <AppShell title="채팅방" back headerActions={false} nav={false}>
      <div className="flex flex-col gap-4 px-margin-mobile pb-40 pt-4 md:px-margin-desktop">
        <Link
          to={`/items/${chat.itemId}`}
          className="flex items-center gap-3 rounded-lg bg-surface-container-low p-3 transition-colors hover:bg-surface-container"
        >
          <ItemThumb
            src={chat.itemImageUrl ?? undefined}
            alt={chat.itemName}
            category={chat.itemCategory}
            className="h-12 w-12 shrink-0 rounded"
            glyphSize={22}
          />
          <span className="min-w-0 flex-1 truncate font-label-md text-label-md text-on-surface">{chat.itemName}</span>
          <StatusChip status={chat.itemStatus} />
          <Icon name="chevron_right" className="text-outline" />
        </Link>

        <p className="rounded-md bg-surface-container p-3 text-center font-label-sm text-label-sm text-on-surface-variant">
          {chat.myRole === 'observer'
            ? '관리자 열람 모드입니다. 메시지를 보낼 수 없습니다.'
            : '물건의 특징을 확인한 뒤 1층 교무실에서 받으세요. 비밀번호·주소 등 개인정보는 보내지 마세요.'}
        </p>

        {messages.length === 0 ? (
          <p className="py-10 text-center font-body-md text-body-md text-outline">
            {chat.myRole === 'asker'
              ? '습득자에게 첫 메시지를 보내 보세요. 예: "혹시 케이스 뒷면에 스티커가 있나요?"'
              : '아직 메시지가 없습니다.'}
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {messages.map((m, i) => {
              const prev = messages[i - 1]
              const next = messages[i + 1]
              return (
                <MessageBubble
                  key={m.id}
                  message={m}
                  observer={chat.myRole === 'observer'}
                  senderName={m.senderRole === 'reporter' ? chat.reporterName : chat.askerName}
                  // Profile once at the start of each run of messages from the same person.
                  showProfile={!prev || prev.senderRole !== m.senderRole}
                  showTime={!next || next.senderRole !== m.senderRole}
                />
              )
            })}
          </ol>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-surface/90 p-3 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.05)] backdrop-blur-md">
        <div className="mx-auto flex max-w-container flex-col gap-2">
          {sendError ? (
            <p role="alert" className="flex items-center gap-1 font-label-sm text-label-sm text-error">
              <Icon name="error" size={14} />
              {sendError}
            </p>
          ) : null}
          {canSend ? (
            <form onSubmit={handleSend} className="flex items-end gap-2">
              <textarea
                rows={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  // Enter sends, Shift+Enter breaks the line; skip while a Korean IME is composing.
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    e.currentTarget.form?.requestSubmit()
                  }
                }}
                maxLength={MAX_LENGTH}
                placeholder="메시지 입력"
                aria-label="메시지 입력"
                className="max-h-32 min-h-[48px] flex-1 resize-none rounded-md bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface shadow-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                aria-label="보내기"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary text-on-primary shadow-level1 transition-transform active:scale-95 disabled:opacity-50"
              >
                <Icon name="send" filled />
              </button>
            </form>
          ) : (
            <p className="flex items-center justify-center gap-2 py-3 font-label-md text-label-md text-on-surface-variant">
              <Icon name={chat.closed ? 'check_circle' : 'visibility'} />
              {chat.closed ? '반환이 완료되어 대화가 종료되었습니다' : '읽기 전용'}
            </p>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function MessageBubble({
  message,
  observer,
  senderName,
  showProfile,
  showTime,
}: {
  message: ChatMessage
  observer: boolean
  senderName: string
  showProfile: boolean
  showTime: boolean
}) {
  // Admins see the conversation from the finder's side; both sides get a profile then.
  const right = observer ? message.senderRole === 'reporter' : message.mine
  const withProfile = observer || !message.mine
  const role = message.senderRole === 'reporter' ? '습득자' : '문의자'

  return (
    <li className={`flex gap-2 ${right ? 'flex-row-reverse' : 'flex-row'} ${showProfile ? 'mt-2' : ''}`}>
      {withProfile ? (
        showProfile ? (
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container font-label-sm text-label-sm text-on-primary-container"
          >
            {senderName.slice(0, 1)}
          </span>
        ) : (
          <span aria-hidden="true" className="w-8 shrink-0" />
        )
      ) : null}
      <div className={`flex min-w-0 max-w-[80%] flex-col gap-1 ${right ? 'items-end' : 'items-start'}`}>
        {withProfile && showProfile ? (
          <span className="font-label-sm text-[11px] leading-none text-on-surface-variant">
            {senderName} <span className="text-outline">· {role}</span>
          </span>
        ) : null}
        <p
          className={`whitespace-pre-wrap break-words rounded-lg px-4 py-2 font-body-md text-body-md ${
            right
              ? 'rounded-br-sm bg-primary text-on-primary'
              : 'rounded-bl-sm bg-surface-container-high text-on-surface'
          }`}
        >
          {message.content}
        </p>
        {showTime ? (
          <span className="font-label-sm text-label-sm text-outline">{formatFoundAt(message.createdAt)}</span>
        ) : null}
      </div>
    </li>
  )
}
