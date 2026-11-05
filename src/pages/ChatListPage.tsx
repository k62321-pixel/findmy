import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { ItemThumb } from '../components/ItemThumb'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { listChats, usePolling } from '../lib/chat'
import { formatFoundAt } from '../lib/format'
import { useAuth } from '../store/AuthProvider'
import type { ChatSummary } from '../types'

export function ChatListPage() {
  const { user } = useAuth()
  const [showAll, setShowAll] = useState(false)
  const [chats, setChats] = useState<ChatSummary[] | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    listChats(showAll)
      .then((list) => {
        setChats(list)
        setError('')
      })
      .catch((err) => setError(err instanceof Error ? err.message : '채팅 목록을 불러오지 못했습니다.'))
  }, [showAll])

  usePolling(load, 15_000)

  function switchScope(all: boolean) {
    if (all === showAll) return
    setChats(null)
    setShowAll(all)
  }

  return (
    <AppShell title="채팅">
      <section className="flex flex-col gap-6 px-margin-mobile py-8 md:px-margin-desktop">
        <div className="flex flex-col gap-2">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">채팅</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            물건을 주운 사람과 주인이 직접 이야기할 수 있습니다. 비밀번호·주소 같은 개인정보는 보내지 마세요.
          </p>
        </div>

        {user?.isAdmin ? (
          <div className="flex gap-2 rounded-full bg-surface-container p-1">
            <ScopeButton active={!showAll} onClick={() => switchScope(false)}>
              내 채팅
            </ScopeButton>
            <ScopeButton active={showAll} onClick={() => switchScope(true)}>
              전체 채팅 (관리자)
            </ScopeButton>
          </div>
        ) : null}

        {error && !chats ? (
          <p role="alert" className="flex items-center gap-1 font-label-sm text-label-sm text-error">
            <Icon name="error" size={14} />
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          {!chats ? (
            error ? null : <LoadingSpinner />
          ) : chats.length > 0 ? (
            chats.map((chat) => <ChatRow key={chat.id} chat={chat} />)
          ) : (
            <EmptyState
              icon="forum"
              title="아직 채팅이 없습니다"
              description='습득물 상세 화면에서 "습득자와 채팅"을 누르면 물건을 주운 사람과 대화할 수 있습니다.'
              action={
                <Link
                  to="/browse"
                  className="mt-2 rounded-md bg-primary px-6 py-3 font-label-md text-label-md text-on-primary shadow-level1"
                >
                  습득물 둘러보기
                </Link>
              }
            />
          )}
        </div>
      </section>
    </AppShell>
  )
}

/** "습득자 홍길동" for the asker, "문의자 김철수" for the finder, both names for an admin. */
export function chatCounterpart(chat: ChatSummary): string {
  if (chat.myRole === 'asker') return `습득자 ${chat.reporterName}`
  if (chat.myRole === 'reporter') return `문의자 ${chat.askerName}`
  return `${chat.askerName} ↔ ${chat.reporterName}`
}

function ChatRow({ chat }: { chat: ChatSummary }) {
  return (
    <Link
      to={`/chats/${chat.id}`}
      className="flex items-center gap-4 rounded-lg bg-surface-container-lowest p-3 shadow-level1 transition-shadow hover:shadow-level1-hover"
    >
      <ItemThumb
        src={chat.itemImageUrl ?? undefined}
        alt={chat.itemName}
        category={chat.itemCategory}
        className="h-14 w-14 shrink-0 rounded"
        glyphSize={24}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate font-label-md text-label-md text-on-surface">{chat.itemName}</span>
          {chat.closed ? (
            <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
              반환완료
            </span>
          ) : null}
        </div>
        <span className="truncate font-label-sm text-label-sm text-outline">{chatCounterpart(chat)}</span>
        <span
          className={`truncate font-body-md text-body-md ${
            chat.unread ? 'font-semibold text-on-surface' : 'text-on-surface-variant'
          }`}
        >
          {chat.lastMessage ?? '아직 메시지가 없습니다'}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        {chat.lastMessageAt ? (
          <span className="font-label-sm text-label-sm text-outline">{formatFoundAt(chat.lastMessageAt)}</span>
        ) : null}
        {chat.unread ? <span aria-label="읽지 않은 메시지" className="h-2.5 w-2.5 rounded-full bg-error" /> : null}
      </div>
    </Link>
  )
}

function ScopeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex-1 rounded-full px-4 py-2 font-label-md text-label-md transition-all ${
        active ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
      }`}
    >
      {children}
    </button>
  )
}
