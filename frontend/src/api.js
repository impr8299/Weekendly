// Backend base URL. Empty = same origin (relative "/api", proxied by Vite or nginx).
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

// Small fetch wrapper. Returns { ok, status, data } so callers can handle 400/409 without try/catch.
export async function apiRequest(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    credentials: 'include', // send the team session cookie, also cross-origin (CORS allows it)
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    // non-JSON response (e.g. proxy error)
  }
  return { ok: res.ok, status: res.status, data }
}

// Full URL for plain links (e.g. the CSV download).
export const apiUrl = (path) => `${API_URL}/api${path}`
