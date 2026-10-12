/**
 * API Data Provider
 *
 * Wraps @service-flex/core's createDataProvider to connect
 * the frontend to the live NestJS backend API.
 *
 * Includes a bidirectional mapping layer so the frontend can use
 * `clients` / `teamMembers` while the backend exposes
 * `customers` / `technicians`, and field names like `clientId` /
 * `assignedToId` are translated to `customerId` / `technicianId`.
 *
 * Use `VITE_USE_MOCK_DATA=true` to keep the mock provider for development.
 */

import { createDataProvider } from '@service-flex/core/data-provider'
import { env } from '@app/config/env'
import { toast } from '@/atlantis'

const baseProvider = createDataProvider({
  apiUrl: env.API_URL,
})

// ---------------------------------------------------------------------------
// Resource name mapping (frontend → backend)
// ---------------------------------------------------------------------------

const resourceMap: Record<string, string> = {
  clients: 'customers',
  teamMembers: 'technicians',
}

function toBackendResource(resource: string): string {
  return resourceMap[resource] ?? resource
}

// ---------------------------------------------------------------------------
// Field name mapping (bidirectional)
// ---------------------------------------------------------------------------

/** Frontend field → backend field */
const fieldToBackend: Record<string, string> = {
  clientId: 'customerId',
  assignedToId: 'technicianId',
}

/** Backend field → frontend field (reverse of fieldToBackend) */
const fieldToFrontend: Record<string, string> = Object.fromEntries(
  Object.entries(fieldToBackend).map(([k, v]) => [v, k]),
)

/**
 * Recursively rename object keys using the given mapping.
 * Arrays and nested objects are handled; primitives pass through unchanged.
 */
function mapFields<T>(data: T, mapping: Record<string, string>): T {
  if (data === null || data === undefined) return data
  if (Array.isArray(data)) return data.map((item) => mapFields(item, mapping)) as T
  if (typeof data === 'object') {
    const mapped: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const newKey = mapping[key] ?? key
      mapped[newKey] = typeof value === 'object' ? mapFields(value, mapping) : value
    }
    return mapped as T
  }
  return data
}

/** Map sort/filter params that reference frontend field names to backend names */
function mapParams<P extends { sort?: { field: string; order: string }; filter?: Record<string, unknown> }>(
  params: P,
): P {
  const mapped = { ...params }
  if (mapped.sort) {
    mapped.sort = {
      ...mapped.sort,
      field: fieldToBackend[mapped.sort.field] ?? mapped.sort.field,
    }
  }
  if (mapped.filter) {
    mapped.filter = mapFields(mapped.filter, fieldToBackend)
  }
  return mapped
}

// ---------------------------------------------------------------------------
// Error interceptor
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'flexdesk_token'
const USER_KEY = 'flexdesk_user'

function extractStatusCode(error: unknown): number | null {
  if (error instanceof Error) {
    const match = error.message.match(/status (\d{3})/)
    if (match) return parseInt(match[1], 10)
  }
  return null
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return msg.includes('fetch') || msg.includes('network') || msg.includes('offline')
  }
  return false
}

function handleApiError(error: unknown): never {
  const status = extractStatusCode(error)

  if (status === 401) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    toast.error('Your session has expired. Please log in again.')
    window.location.href = '/login'
  } else if (status === 403) {
    toast.error("You don't have permission to perform this action.")
  } else if (status === 404) {
    toast.error('The requested resource was not found.')
  } else if (status && status >= 500) {
    toast.error('Something went wrong. Please try again.')
  } else if (isNetworkError(error)) {
    toast.error('Unable to connect to server. Please check your connection.')
  }

  throw error
}

async function withErrorHandling<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    handleApiError(error)
  }
}

// ---------------------------------------------------------------------------
// Wrapped provider
// ---------------------------------------------------------------------------

export const apiDataProvider = {
  getList: <T = unknown>(resource: string, params: Parameters<typeof baseProvider.getList>[1]) =>
    withErrorHandling(() =>
      baseProvider.getList<T>(toBackendResource(resource), mapParams(params)).then((result) => ({
        ...result,
        data: mapFields(result.data, fieldToFrontend) as T[],
      })),
    ),

  getOne: <T = unknown>(resource: string, params: Parameters<typeof baseProvider.getOne>[1]) =>
    withErrorHandling(() =>
      baseProvider.getOne<T>(toBackendResource(resource), params).then((result) => ({
        ...result,
        data: mapFields(result.data, fieldToFrontend) as T,
      })),
    ),

  getMany: <T = unknown>(resource: string, params: Parameters<typeof baseProvider.getMany>[1]) =>
    withErrorHandling(() =>
      baseProvider.getMany<T>(toBackendResource(resource), params).then((result) => ({
        ...result,
        data: mapFields(result.data, fieldToFrontend) as T[],
      })),
    ),

  getManyReference: <T = unknown>(resource: string, params: Parameters<typeof baseProvider.getManyReference>[1]) => {
    const mappedParams = {
      ...mapParams(params),
      target: fieldToBackend[params.target] ?? params.target,
    }
    return withErrorHandling(() =>
      baseProvider.getManyReference<T>(toBackendResource(resource), mappedParams).then((result) => ({
        ...result,
        data: mapFields(result.data, fieldToFrontend) as T[],
      })),
    )
  },

  create: <T = unknown>(resource: string, params: Parameters<typeof baseProvider.create>[1]) => {
    const mappedParams = { ...params, data: mapFields(params.data, fieldToBackend) as T }
    return withErrorHandling(() =>
      baseProvider.create<T>(toBackendResource(resource), mappedParams).then((result) => ({
        ...result,
        data: mapFields(result.data, fieldToFrontend) as T,
      })),
    )
  },

  update: <T = unknown>(resource: string, params: Parameters<typeof baseProvider.update>[1]) => {
    const mappedParams = {
      ...params,
      data: mapFields(params.data, fieldToBackend) as T,
      previousData: params.previousData ? mapFields(params.previousData, fieldToBackend) as T : undefined,
    }
    return withErrorHandling(() =>
      baseProvider.update<T>(toBackendResource(resource), mappedParams).then((result) => ({
        ...result,
        data: mapFields(result.data, fieldToFrontend) as T,
      })),
    )
  },

  updateMany: <T = unknown>(resource: string, params: Parameters<typeof baseProvider.updateMany>[1]) => {
    const mappedParams = { ...params, data: mapFields(params.data, fieldToBackend) as T }
    return withErrorHandling(() =>
      baseProvider.updateMany<T>(toBackendResource(resource), mappedParams),
    )
  },

  delete: <T = unknown>(resource: string, params: Parameters<typeof baseProvider.delete>[1]) => {
    const mappedParams = {
      ...params,
      previousData: params.previousData ? mapFields(params.previousData, fieldToBackend) as T : undefined,
    }
    return withErrorHandling(() =>
      baseProvider.delete<T>(toBackendResource(resource), mappedParams).then((result) => ({
        ...result,
        data: mapFields(result.data, fieldToFrontend) as T,
      })),
    )
  },

  deleteMany: (resource: string, params: Parameters<typeof baseProvider.deleteMany>[1]) =>
    withErrorHandling(() =>
      baseProvider.deleteMany(toBackendResource(resource), params),
    ),
}
