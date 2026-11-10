type ApiErrorBody = {
  error?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly retryAfter: string | null

  constructor(
    message: string,
    status: number,
    retryAfter: string | null,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.retryAfter = retryAfter
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const apiKey = import.meta.env.VITE_API_KEY
  if (!apiKey) {
    throw new Error('VITE_API_KEY is not configured. Set it in your frontend environment.')
  }
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? ''
  const url = `${apiBaseUrl}${path}`

  const response = await fetch(url, {
    ...init,
    headers: {
      'X-API-Key': apiKey,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  })

  const responseText = await response.text()
  let body: unknown
  if (responseText) {
    try {
      body = JSON.parse(responseText)
    } catch {
      if (response.ok) {
        throw new Error('The API returned an invalid JSON response.')
      }
    }
  }

  if (!response.ok) {
    const message = typeof body === 'object' && body !== null && 'error' in body
      ? String((body as ApiErrorBody).error ?? 'Request failed')
      : `API request failed with HTTP ${response.status}${response.statusText ? ` (${response.statusText})` : ''}.`
    throw new ApiError(message, response.status, response.headers.get('Retry-After'))
  }
  return body as T
}
