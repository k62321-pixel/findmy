import { useEffect, useState } from 'react'
import type { ChatMessage, ChatSummary } from '../types'
import { apiUrl, responseError } from './api'

/** The server sends `/api/uploads/...`; resolve it against the API base like items do. */
function normalize(chat: ChatSummary): ChatSummary {
  return chat.itemImageUrl ? { ...chat, itemImageUrl: apiUrl(chat.itemImageUrl) } : chat
}

async function request<T>(path: string, fallback: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), { credentials: 'include', ...init })
  if (!res.ok) throw await responseError(res, fallback)
  return res.json()
}

/** Gets (or creates) the signed-in user's room for this item. */
export async function openChat(itemId: string): Promise<ChatSummary> {
  const data = await request<{ chat: ChatSummary }>(`/api/items/${itemId}/chat`, '채팅방을 열지 못했습니다.', {
    method: 'POST',
  })
  return normalize(data.chat)
}

export async function listChats(all = false): Promise<ChatSummary[]> {
  const data = await request<{ chats: ChatSummary[] }>(
    all ? '/api/chats?all=1' : '/api/chats',
    '채팅 목록을 불러오지 못했습니다.',
  )
  return data.chats.map(normalize)
}

export async function getChat(id: string): Promise<{ chat: ChatSummary; messages: ChatMessage[] }> {
  const data = await request<{ chat: ChatSummary; messages: ChatMessage[] }>(
    `/api/chats/${id}`,
    '채팅을 불러오지 못했습니다.',
  )
  return { chat: normalize(data.chat), messages: data.messages }
}

export async function sendChatMessage(id: string, content: string): Promise<ChatMessage> {
  const data = await request<{ message: ChatMessage }>(`/api/chats/${id}/messages`, '메시지를 보내지 못했습니다.', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  return data.message
}

/**
 * Runs `tick` now and then every `ms` while the tab is visible — serverless hosting has
 * no websockets, so chats are kept fresh by polling, and a hidden tab shouldn't poll.
 */
export function usePolling(tick: () => void, ms: number, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    tick()
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') tick()
    }, ms)
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [tick, ms, enabled])
}

/** Number of rooms with a message the user hasn't read yet (for the tab-bar badge). */
export function useUnreadChatCount(signedIn: boolean): number {
  const [count, setCount] = useState(0)
  const [tick] = useState(() => () => {
    request<{ count: number }>('/api/chats/unread', '')
      .then((data) => setCount(data.count))
      .catch(() => {})
  })
  usePolling(tick, 30_000, signedIn)
  return signedIn ? count : 0
}
