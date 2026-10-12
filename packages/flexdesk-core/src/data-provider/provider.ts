/**
 * React Admin Data Provider
 *
 * Provides a React Admin compatible data provider that connects to the Service Flex API.
 * Supports pagination, filtering, sorting, and all standard CRUD operations.
 */

import { ApiClient, createApiClient } from '../api/client';

// React Admin types (compatible with ra-core)
export interface GetListParams {
  pagination: { page: number; perPage: number };
  sort: { field: string; order: 'ASC' | 'DESC' };
  filter: Record<string, unknown>;
}

export interface GetListResult<T = unknown> {
  data: T[];
  total: number;
  pageInfo?: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface GetOneParams {
  id: string | number;
}

export interface GetOneResult<T = unknown> {
  data: T;
}

export interface GetManyParams {
  ids: Array<string | number>;
}

export interface GetManyResult<T = unknown> {
  data: T[];
}

export interface GetManyReferenceParams {
  target: string;
  id: string | number;
  pagination: { page: number; perPage: number };
  sort: { field: string; order: 'ASC' | 'DESC' };
  filter: Record<string, unknown>;
}

export interface GetManyReferenceResult<T = unknown> {
  data: T[];
  total: number;
}

export interface CreateParams<T = unknown> {
  data: T;
}

export interface CreateResult<T = unknown> {
  data: T;
}

export interface UpdateParams<T = unknown> {
  id: string | number;
  data: T;
  previousData?: T;
}

export interface UpdateResult<T = unknown> {
  data: T;
}

export interface UpdateManyParams<T = unknown> {
  ids: Array<string | number>;
  data: T;
}

export interface UpdateManyResult {
  data: Array<string | number>;
}

export interface DeleteParams<T = unknown> {
  id: string | number;
  previousData?: T;
}

export interface DeleteResult<T = unknown> {
  data: T;
}

export interface DeleteManyParams {
  ids: Array<string | number>;
}

export interface DeleteManyResult {
  data: Array<string | number>;
}

export interface DataProvider {
  getList: <T = unknown>(resource: string, params: GetListParams) => Promise<GetListResult<T>>;
  getOne: <T = unknown>(resource: string, params: GetOneParams) => Promise<GetOneResult<T>>;
  getMany: <T = unknown>(resource: string, params: GetManyParams) => Promise<GetManyResult<T>>;
  getManyReference: <T = unknown>(resource: string, params: GetManyReferenceParams) => Promise<GetManyReferenceResult<T>>;
  create: <T = unknown>(resource: string, params: CreateParams<T>) => Promise<CreateResult<T>>;
  update: <T = unknown>(resource: string, params: UpdateParams<T>) => Promise<UpdateResult<T>>;
  updateMany: <T = unknown>(resource: string, params: UpdateManyParams<T>) => Promise<UpdateManyResult>;
  delete: <T = unknown>(resource: string, params: DeleteParams<T>) => Promise<DeleteResult<T>>;
  deleteMany: (resource: string, params: DeleteManyParams) => Promise<DeleteManyResult>;
}

export interface DataProviderConfig {
  apiUrl: string;
  httpClient?: ApiClient;
}

/**
 * Build query string from filter object
 */
function buildFilterQuery(filter: Record<string, unknown>): string {
  const params = new URLSearchParams();

  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, String(v)));
      } else {
        params.append(key, String(value));
      }
    }
  });

  return params.toString();
}

/**
 * Create a React Admin compatible data provider
 */
export function createDataProvider(config: DataProviderConfig): DataProvider {
  const { apiUrl } = config;
  const httpClient = config.httpClient || createApiClient({ baseUrl: apiUrl });

  /**
   * Get resource endpoint (handles pluralization)
   */
  function getResourceEndpoint(resource: string): string {
    // Most resources are already plural
    return `/${resource}`;
  }

  return {
    /**
     * Get a list of records
     * GET /resource?filter={}&sort=field:order&page=1&perPage=10
     */
    async getList<T = unknown>(resource: string, params: GetListParams): Promise<GetListResult<T>> {
      const { page, perPage } = params.pagination;
      const { field, order } = params.sort;

      const query = new URLSearchParams();
      query.set('page', String(page));
      query.set('perPage', String(perPage));
      query.set('sort', field);
      query.set('order', order);

      const filterQuery = buildFilterQuery(params.filter);
      if (filterQuery) {
        query.set('filter', JSON.stringify(params.filter));
      }

      const endpoint = `${getResourceEndpoint(resource)}?${query.toString()}`;
      const response = await httpClient.get<{ data: T[]; total: number }>(endpoint);

      return {
        data: response.data.data || [],
        total: response.data.total || 0,
      };
    },

    /**
     * Get a single record
     * GET /resource/:id
     */
    async getOne<T = unknown>(resource: string, params: GetOneParams): Promise<GetOneResult<T>> {
      const endpoint = `${getResourceEndpoint(resource)}/${params.id}`;
      const response = await httpClient.get<T>(endpoint);

      return { data: response.data };
    },

    /**
     * Get multiple records by IDs
     * GET /resource?ids=1,2,3
     */
    async getMany<T = unknown>(resource: string, params: GetManyParams): Promise<GetManyResult<T>> {
      const query = new URLSearchParams();
      query.set('ids', params.ids.join(','));

      const endpoint = `${getResourceEndpoint(resource)}?${query.toString()}`;
      const response = await httpClient.get<{ data: T[] } | T[]>(endpoint);

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];

      return { data };
    },

    /**
     * Get records referencing another record
     * GET /resource?targetId=id&sort=field:order&page=1&perPage=10
     */
    async getManyReference<T = unknown>(
      resource: string,
      params: GetManyReferenceParams
    ): Promise<GetManyReferenceResult<T>> {
      const { page, perPage } = params.pagination;
      const { field, order } = params.sort;

      const query = new URLSearchParams();
      query.set(params.target, String(params.id));
      query.set('page', String(page));
      query.set('perPage', String(perPage));
      query.set('sort', field);
      query.set('order', order);

      const filterQuery = buildFilterQuery(params.filter);
      if (filterQuery) {
        query.set('filter', JSON.stringify(params.filter));
      }

      const endpoint = `${getResourceEndpoint(resource)}?${query.toString()}`;
      const response = await httpClient.get<{ data: T[]; total: number }>(endpoint);

      return {
        data: response.data.data || [],
        total: response.data.total || 0,
      };
    },

    /**
     * Create a new record
     * POST /resource
     */
    async create<T = unknown>(resource: string, params: CreateParams<T>): Promise<CreateResult<T>> {
      const endpoint = getResourceEndpoint(resource);
      const response = await httpClient.post<T>(endpoint, params.data);

      return { data: response.data };
    },

    /**
     * Update a record
     * PUT /resource/:id
     */
    async update<T = unknown>(resource: string, params: UpdateParams<T>): Promise<UpdateResult<T>> {
      const endpoint = `${getResourceEndpoint(resource)}/${params.id}`;

      const response = await httpClient.put<T>(endpoint, params.data, {
        optimistic: params.previousData
          ? {
              entityType: resource.charAt(0).toUpperCase() + resource.slice(1, -1),
              entityId: String(params.id),
              update: () => params.data as T,
              rollback: () => params.previousData,
            }
          : undefined,
      });

      return { data: response.data };
    },

    /**
     * Update multiple records
     * PUT /resource with ids in body
     */
    async updateMany<T = unknown>(resource: string, params: UpdateManyParams<T>): Promise<UpdateManyResult> {
      const endpoint = `${getResourceEndpoint(resource)}/bulk`;

      await httpClient.put(endpoint, {
        ids: params.ids,
        data: params.data,
      });

      return { data: params.ids };
    },

    /**
     * Delete a record
     * DELETE /resource/:id
     */
    async delete<T = unknown>(resource: string, params: DeleteParams<T>): Promise<DeleteResult<T>> {
      const endpoint = `${getResourceEndpoint(resource)}/${params.id}`;

      await httpClient.delete(endpoint, {
        optimistic: params.previousData
          ? {
              entityType: resource.charAt(0).toUpperCase() + resource.slice(1, -1),
              entityId: String(params.id),
              update: () => undefined,
              rollback: () => params.previousData,
            }
          : undefined,
      });

      return { data: params.previousData || ({ id: params.id } as T) };
    },

    /**
     * Delete multiple records
     * DELETE /resource with ids in body
     */
    async deleteMany(resource: string, params: DeleteManyParams): Promise<DeleteManyResult> {
      const endpoint = `${getResourceEndpoint(resource)}/bulk`;

      await httpClient.delete(endpoint, {
        body: { ids: params.ids },
      });

      return { data: params.ids };
    },
  };
}
