import type { DataProvider } from "ra-core";
import { getAccessToken } from "@/lib/authProvider";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/+$/, "");

const API_BASE = `${API_URL}/api/v1`;

/**
 * Decode workspace ID from a JWT access token.
 * Returns null if the token is missing or malformed.
 */
function getWorkspaceIdFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.workspaceId ?? null;
  } catch {
    return null;
  }
}

/**
 * Build request headers with Authorization and workspace context.
 */
async function getHeaders(): Promise<Headers> {
  const headers = new Headers({ "Content-Type": "application/json" });
  const token = await getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
    const workspaceId = getWorkspaceIdFromToken(token);
    if (workspaceId) {
      headers.set("x-workspace-id", workspaceId);
    }
  }
  return headers;
}

/**
 * Wrapper around fetch that attaches auth headers and handles errors.
 */
async function httpClient(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = await getHeaders();

  // Merge any extra headers from options
  if (options.headers) {
    const extra =
      options.headers instanceof Headers
        ? options.headers
        : new Headers(options.headers as Record<string, string>);
    extra.forEach((value, key) => headers.set(key, value));
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `HTTP ${response.status}: ${response.statusText}${body ? ` — ${body}` : ""}`,
    );
  }

  return response;
}

/**
 * React Admin data provider for the FlexDesk NestJS backend.
 *
 * The backend returns:
 * - GET /resource       → array of records (or { data, total } for paginated endpoints)
 * - GET /resource/:id   → single record
 * - POST /resource      → created record
 * - PUT /resource/:id   → updated record
 * - DELETE /resource/:id → deleted record
 */
export const dataProvider: DataProvider = {
  async getList(resource, params) {
    const page = params.pagination?.page ?? 1;
    const perPage = params.pagination?.perPage ?? 25;
    const field = params.sort?.field ?? "id";
    const order = params.sort?.order ?? "ASC";

    const query = new URLSearchParams();
    query.set("page", String(page));
    query.set("perPage", String(perPage));
    query.set("sort", field);
    query.set("order", order);

    // Flatten filter params into query string
    if (params.filter) {
      Object.entries(params.filter as Record<string, unknown>).forEach(
        ([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            query.set(key, String(value));
          }
        },
      );
    }

    const url = `${API_BASE}/${resource}?${query.toString()}`;
    const response = await httpClient(url);
    const json = await response.json();

    // Handle both { data, total } and plain array responses
    if (Array.isArray(json)) {
      return { data: json, total: json.length };
    }
    return {
      data: json.data ?? json,
      total: json.total ?? (json.data?.length || 0),
    };
  },

  async getOne(resource, params) {
    const url = `${API_BASE}/${resource}/${params.id}`;
    const response = await httpClient(url);
    const json = await response.json();
    return { data: json };
  },

  async getMany(resource, params) {
    const query = new URLSearchParams();
    query.set("ids", params.ids.join(","));

    const url = `${API_BASE}/${resource}?${query.toString()}`;
    const response = await httpClient(url);
    const json = await response.json();

    const data = Array.isArray(json) ? json : json.data ?? [];
    return { data };
  },

  async getManyReference(resource, params) {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;

    const query = new URLSearchParams();
    query.set(params.target, String(params.id));
    query.set("page", String(page));
    query.set("perPage", String(perPage));
    query.set("sort", field);
    query.set("order", order);

    if (params.filter) {
      Object.entries(params.filter as Record<string, unknown>).forEach(
        ([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            query.set(key, String(value));
          }
        },
      );
    }

    const url = `${API_BASE}/${resource}?${query.toString()}`;
    const response = await httpClient(url);
    const json = await response.json();

    if (Array.isArray(json)) {
      return { data: json, total: json.length };
    }
    return {
      data: json.data ?? json,
      total: json.total ?? (json.data?.length || 0),
    };
  },

  async create(resource, params) {
    const url = `${API_BASE}/${resource}`;
    const response = await httpClient(url, {
      method: "POST",
      body: JSON.stringify(params.data),
    });
    const json = await response.json();
    return { data: json };
  },

  async update(resource, params) {
    const url = `${API_BASE}/${resource}/${params.id}`;
    const response = await httpClient(url, {
      method: "PUT",
      body: JSON.stringify(params.data),
    });
    const json = await response.json();
    return { data: json };
  },

  async updateMany(resource, params) {
    const results = await Promise.all(
      params.ids.map(async (id) => {
        const url = `${API_BASE}/${resource}/${id}`;
        await httpClient(url, {
          method: "PUT",
          body: JSON.stringify(params.data),
        });
        return id;
      }),
    );
    return { data: results };
  },

  async delete(resource, params) {
    const url = `${API_BASE}/${resource}/${params.id}`;
    await httpClient(url, { method: "DELETE" });
    return {
      data: (params.previousData ?? { id: params.id }) as any,
    };
  },

  async deleteMany(resource, params) {
    await Promise.all(
      params.ids.map(async (id) => {
        const url = `${API_BASE}/${resource}/${id}`;
        await httpClient(url, { method: "DELETE" });
      }),
    );
    return { data: params.ids };
  },
};
