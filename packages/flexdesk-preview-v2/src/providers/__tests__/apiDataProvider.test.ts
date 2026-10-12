import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Provide browser globals that don't exist in Node
// ---------------------------------------------------------------------------

const localStorageStore: Record<string, string> = {}
const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { localStorageStore[key] = value }),
  removeItem: vi.fn((key: string) => { delete localStorageStore[key] }),
  clear: vi.fn(() => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]) }),
  length: 0,
  key: vi.fn(() => null),
}
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
})

// Provide a minimal `window` object for code that uses `window.location`
if (typeof globalThis.window === 'undefined') {
  ;(globalThis as any).window = { location: { href: '' } }
}

// ---------------------------------------------------------------------------
// Mocks — must be set up BEFORE importing the module under test
// ---------------------------------------------------------------------------

const mockBaseProvider = {
  getList: vi.fn(),
  getOne: vi.fn(),
  getMany: vi.fn(),
  getManyReference: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
}

vi.mock('@service-flex/core/data-provider', () => ({
  createDataProvider: () => mockBaseProvider,
}))

vi.mock('@app/config/env', () => ({
  env: { API_URL: 'http://localhost:3001/api/v1' },
}))

const toastMock = {
  error: vi.fn(),
  success: vi.fn(),
  info: vi.fn(),
}
vi.mock('@/atlantis', () => ({ toast: toastMock }))

// Import AFTER mocks are in place
const { apiDataProvider } = await import('../apiDataProvider')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetMocks() {
  vi.clearAllMocks()
  // Sensible defaults — each test can override
  mockBaseProvider.getList.mockResolvedValue({ data: [], total: 0 })
  mockBaseProvider.getOne.mockResolvedValue({ data: {} })
  mockBaseProvider.getMany.mockResolvedValue({ data: [] })
  mockBaseProvider.getManyReference.mockResolvedValue({ data: [], total: 0 })
  mockBaseProvider.create.mockResolvedValue({ data: {} })
  mockBaseProvider.update.mockResolvedValue({ data: {} })
  mockBaseProvider.updateMany.mockResolvedValue({ data: [] })
  mockBaseProvider.delete.mockResolvedValue({ data: {} })
  mockBaseProvider.deleteMany.mockResolvedValue({ data: [] })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(resetMocks)

describe('apiDataProvider', () => {
  // -----------------------------------------------------------------------
  // getList
  // -----------------------------------------------------------------------
  describe('getList', () => {
    it('maps resource name from frontend to backend', async () => {
      await apiDataProvider.getList('clients', {
        pagination: { page: 1, perPage: 10 },
        sort: { field: 'id', order: 'ASC' },
        filter: {},
      })
      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        'customers',
        expect.anything(),
      )
    })

    it('passes unmapped resource names through', async () => {
      await apiDataProvider.getList('jobs', {
        pagination: { page: 1, perPage: 10 },
        sort: { field: 'id', order: 'ASC' },
        filter: {},
      })
      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        'jobs',
        expect.anything(),
      )
    })

    it('maps sort field names to backend equivalents', async () => {
      await apiDataProvider.getList('jobs', {
        pagination: { page: 1, perPage: 10 },
        sort: { field: 'clientId', order: 'DESC' },
        filter: {},
      })
      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        'jobs',
        expect.objectContaining({
          sort: { field: 'customerId', order: 'DESC' },
        }),
      )
    })

    it('maps filter field names to backend equivalents', async () => {
      await apiDataProvider.getList('jobs', {
        pagination: { page: 1, perPage: 10 },
        sort: { field: 'id', order: 'ASC' },
        filter: { clientId: '123', assignedToId: '456' },
      })
      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        'jobs',
        expect.objectContaining({
          filter: { customerId: '123', technicianId: '456' },
        }),
      )
    })

    it('maps response field names back to frontend equivalents', async () => {
      mockBaseProvider.getList.mockResolvedValue({
        data: [
          { id: '1', customerId: 'c1', technicianId: 't1', title: 'Job 1' },
          { id: '2', customerId: 'c2', technicianId: 't2', title: 'Job 2' },
        ],
        total: 2,
      })

      const result = await apiDataProvider.getList('jobs', {
        pagination: { page: 1, perPage: 10 },
        sort: { field: 'id', order: 'ASC' },
        filter: {},
      })

      expect(result.data[0]).toHaveProperty('clientId', 'c1')
      expect(result.data[0]).toHaveProperty('assignedToId', 't1')
      expect(result.data[1]).toHaveProperty('clientId', 'c2')
      expect(result.data[1]).toHaveProperty('assignedToId', 't2')
      expect(result.total).toBe(2)
    })

    it('preserves pagination params', async () => {
      await apiDataProvider.getList('jobs', {
        pagination: { page: 3, perPage: 25 },
        sort: { field: 'id', order: 'ASC' },
        filter: {},
      })
      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        'jobs',
        expect.objectContaining({
          pagination: { page: 3, perPage: 25 },
        }),
      )
    })
  })

  // -----------------------------------------------------------------------
  // getOne
  // -----------------------------------------------------------------------
  describe('getOne', () => {
    it('maps resource name and response fields', async () => {
      mockBaseProvider.getOne.mockResolvedValue({
        data: { id: '1', customerId: 'c1', technicianId: 't1' },
      })

      const result = await apiDataProvider.getOne('clients', { id: '1' })

      expect(mockBaseProvider.getOne).toHaveBeenCalledWith('customers', { id: '1' })
      expect(result.data).toHaveProperty('clientId', 'c1')
      expect(result.data).toHaveProperty('assignedToId', 't1')
    })

    it('passes through fields that have no mapping', async () => {
      mockBaseProvider.getOne.mockResolvedValue({
        data: { id: '1', title: 'Fix AC', status: 'SCHEDULED' },
      })

      const result = await apiDataProvider.getOne('jobs', { id: '1' })

      expect(result.data).toMatchObject({
        id: '1',
        title: 'Fix AC',
        status: 'SCHEDULED',
      })
    })
  })

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------
  describe('create', () => {
    it('maps request data fields to backend and response back to frontend', async () => {
      mockBaseProvider.create.mockResolvedValue({
        data: { id: 'new-1', customerId: 'c1', technicianId: 't1', title: 'New Job' },
      })

      const result = await apiDataProvider.create('jobs', {
        data: { clientId: 'c1', assignedToId: 't1', title: 'New Job' },
      })

      // Request data should be mapped to backend names
      expect(mockBaseProvider.create).toHaveBeenCalledWith(
        'jobs',
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: 'c1',
            technicianId: 't1',
            title: 'New Job',
          }),
        }),
      )

      // Response should be mapped back to frontend names
      expect(result.data).toHaveProperty('clientId', 'c1')
      expect(result.data).toHaveProperty('assignedToId', 't1')
    })

    it('maps resource name for create', async () => {
      mockBaseProvider.create.mockResolvedValue({
        data: { id: 'new-1' },
      })

      await apiDataProvider.create('teamMembers', { data: { name: 'John' } })

      expect(mockBaseProvider.create).toHaveBeenCalledWith(
        'technicians',
        expect.anything(),
      )
    })
  })

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  describe('update', () => {
    it('maps request and response fields', async () => {
      mockBaseProvider.update.mockResolvedValue({
        data: { id: '1', customerId: 'c2', technicianId: 't2' },
      })

      const result = await apiDataProvider.update('jobs', {
        id: '1',
        data: { clientId: 'c2', assignedToId: 't2' },
        previousData: { id: '1', clientId: 'c1', assignedToId: 't1' },
      })

      // Request data mapped to backend names
      expect(mockBaseProvider.update).toHaveBeenCalledWith(
        'jobs',
        expect.objectContaining({
          data: expect.objectContaining({ customerId: 'c2', technicianId: 't2' }),
          previousData: expect.objectContaining({ customerId: 'c1', technicianId: 't1' }),
        }),
      )

      // Response mapped back
      expect(result.data).toHaveProperty('clientId', 'c2')
    })

    it('handles update with no previousData', async () => {
      mockBaseProvider.update.mockResolvedValue({
        data: { id: '1', customerId: 'c2' },
      })

      const result = await apiDataProvider.update('jobs', {
        id: '1',
        data: { clientId: 'c2' },
        previousData: undefined as any,
      })

      expect(result.data).toHaveProperty('clientId', 'c2')
    })
  })

  // -----------------------------------------------------------------------
  // delete
  // -----------------------------------------------------------------------
  describe('delete', () => {
    it('maps resource name and response fields', async () => {
      mockBaseProvider.delete.mockResolvedValue({
        data: { id: '1', customerId: 'c1' },
      })

      const result = await apiDataProvider.delete('clients', {
        id: '1',
        previousData: { id: '1', clientId: 'c1' },
      })

      expect(mockBaseProvider.delete).toHaveBeenCalledWith(
        'customers',
        expect.objectContaining({
          previousData: expect.objectContaining({ customerId: 'c1' }),
        }),
      )

      expect(result.data).toHaveProperty('clientId', 'c1')
    })

    it('sends DELETE request for the correct resource', async () => {
      mockBaseProvider.delete.mockResolvedValue({ data: { id: '1' } })

      await apiDataProvider.delete('jobs', { id: '1', previousData: { id: '1' } })

      expect(mockBaseProvider.delete).toHaveBeenCalledWith('jobs', expect.anything())
    })
  })

  // -----------------------------------------------------------------------
  // getManyReference
  // -----------------------------------------------------------------------
  describe('getManyReference', () => {
    it('maps the target field name', async () => {
      mockBaseProvider.getManyReference.mockResolvedValue({
        data: [{ id: '1', customerId: 'c1' }],
        total: 1,
      })

      await apiDataProvider.getManyReference('jobs', {
        target: 'clientId',
        id: 'c1',
        pagination: { page: 1, perPage: 10 },
        sort: { field: 'id', order: 'ASC' },
        filter: {},
      })

      expect(mockBaseProvider.getManyReference).toHaveBeenCalledWith(
        'jobs',
        expect.objectContaining({ target: 'customerId' }),
      )
    })
  })

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------
  describe('error handling', () => {
    it('on 401, clears tokens, shows toast, and redirects to login', async () => {
      // Reset window.location.href
      ;(globalThis as any).window.location.href = ''

      mockBaseProvider.getList.mockRejectedValue(
        new Error('Request failed with status 401'),
      )

      await expect(
        apiDataProvider.getList('jobs', {
          pagination: { page: 1, perPage: 10 },
          sort: { field: 'id', order: 'ASC' },
          filter: {},
        }),
      ).rejects.toThrow('status 401')

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('flexdesk_token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('flexdesk_user')
      expect(toastMock.error).toHaveBeenCalledWith(
        expect.stringContaining('session has expired'),
      )
      expect((globalThis as any).window.location.href).toBe('/login')
    })

    it('on 403, shows permission error toast', async () => {
      mockBaseProvider.getOne.mockRejectedValue(
        new Error('Request failed with status 403'),
      )

      await expect(
        apiDataProvider.getOne('jobs', { id: '1' }),
      ).rejects.toThrow('status 403')

      expect(toastMock.error).toHaveBeenCalledWith(
        expect.stringContaining("don't have permission"),
      )
    })

    it('on 404, shows not found toast', async () => {
      mockBaseProvider.getOne.mockRejectedValue(
        new Error('Request failed with status 404'),
      )

      await expect(
        apiDataProvider.getOne('jobs', { id: 'nonexistent' }),
      ).rejects.toThrow('status 404')

      expect(toastMock.error).toHaveBeenCalledWith(
        expect.stringContaining('not found'),
      )
    })

    it('on 500, shows generic error toast', async () => {
      mockBaseProvider.create.mockRejectedValue(
        new Error('Request failed with status 500'),
      )

      await expect(
        apiDataProvider.create('jobs', { data: { title: 'Test' } }),
      ).rejects.toThrow('status 500')

      expect(toastMock.error).toHaveBeenCalledWith(
        expect.stringContaining('Something went wrong'),
      )
    })

    it('on network error (TypeError), shows connection error toast', async () => {
      mockBaseProvider.getList.mockRejectedValue(
        new TypeError('Failed to fetch'),
      )

      await expect(
        apiDataProvider.getList('jobs', {
          pagination: { page: 1, perPage: 10 },
          sort: { field: 'id', order: 'ASC' },
          filter: {},
        }),
      ).rejects.toThrow('Failed to fetch')

      expect(toastMock.error).toHaveBeenCalledWith(
        expect.stringContaining('Unable to connect'),
      )
    })

    it('re-throws the original error after handling', async () => {
      const originalError = new Error('Request failed with status 500')
      mockBaseProvider.update.mockRejectedValue(originalError)

      await expect(
        apiDataProvider.update('jobs', {
          id: '1',
          data: { title: 'Test' },
          previousData: { id: '1' },
        }),
      ).rejects.toBe(originalError)
    })
  })
})
