import { env } from '@app/config'
import { getAuthToken } from '@app/providers'
import { isDemoMode } from '@/mocks/demoMode'
import { MockApiClient } from '@/mocks/mockApi'

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  params?: Record<string, string | number | boolean | undefined>
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { body, params, headers: customHeaders, ...rest } = options

    let url = `${this.baseUrl}${endpoint}`
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }

    const token = getAuthToken()
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...customHeaders,
    }

    if (token) {
      ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }

    // Add workspace header for multi-tenancy support
    const storedUser = localStorage.getItem('flexdesk_user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        if (userData.workspaceId) {
          ;(headers as Record<string, string>)['X-Workspace-Id'] = userData.workspaceId
        }
      } catch {
        // Ignore parse errors
      }
    }

    const response = await fetch(url, {
      ...rest,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new ApiError(error.message || 'Request failed', response.status, error)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body })
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body })
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body })
  }

  delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Create mock API client instance for demo mode
const mockApi = new MockApiClient()

// Export api that uses mock in demo mode, real API otherwise
export const api = isDemoMode() ? mockApi : new ApiClient(env.API_URL)
