// Thin fetch wrapper that handles JSON + Rails CSRF token for same-origin requests.

let currentToken = null

function csrfToken() {
  if (currentToken) return currentToken
  const el = document.querySelector('meta[name="csrf-token"]')
  return el ? el.getAttribute('content') : ''
}

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-CSRF-Token': csrfToken(),
    },
    credentials: 'same-origin',
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  // Rails rotates the CSRF token on login/logout; keep our copy current.
  const freshToken = res.headers.get('X-CSRF-Token')
  if (freshToken) currentToken = freshToken

  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!res.ok) {
    const message =
      (data && (data.error || (data.errors && data.errors.join(', ')))) ||
      `Request failed (${res.status})`
    const error = new Error(message)
    error.status = res.status
    error.data = data
    throw error
  }

  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
}
