/**
 * Resolves an `/api/...` path against the backend origin.
 *
 * Locally, VITE_API_BASE_URL is unset and Vite's dev proxy forwards `/api`
 * to Flask, so a relative path is enough. Once the frontend and backend are
 * deployed on different domains (e.g. Vercel + Render), there is no proxy —
 * VITE_API_BASE_URL points at the deployed backend and every call becomes
 * an absolute cross-origin request (still with `credentials: 'include'`).
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}
