// Simple Jobber Data Provider - Preview Mode (Mock Data Only)
import type { DataProvider } from 'ra-core';
import { simpleJobberData } from './data';

// Create a simple mock data provider for preview
function createMockDataProvider(): DataProvider {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper to filter data based on filter params
  const applyFilters = (data: any[], filter: Record<string, any> = {}) => {
    return data.filter((item) => {
      for (const [key, value] of Object.entries(filter)) {
        if (value === undefined || value === null || value === '') continue;

        // Handle 'q' as a general search across common text fields
        if (key === 'q') {
          const searchValue = String(value).toLowerCase();
          const searchableFields = ['id', 'name', 'title', 'description', 'email', 'invoiceNumber', 'estimateNumber', 'notes'];
          const matches = searchableFields.some((field) => {
            const fieldValue = item[field];
            return fieldValue && String(fieldValue).toLowerCase().includes(searchValue);
          });
          // Also search in nested address object for jobs
          const addressMatch = item.address && (
            (item.address.street && String(item.address.street).toLowerCase().includes(searchValue)) ||
            (item.address.city && String(item.address.city).toLowerCase().includes(searchValue)) ||
            (item.address.state && String(item.address.state).toLowerCase().includes(searchValue)) ||
            (item.address.zipCode && String(item.address.zipCode).toLowerCase().includes(searchValue))
          );
          // Search by client name if clientId or customerId exists (for jobs, invoices, estimates)
          let clientNameMatch = false;
          const clientRefId = item.clientId || item.customerId;
          if (clientRefId) {
            const client = simpleJobberData.clients?.find((c: any) => String(c.id) === String(clientRefId));
            if (client && client.name) {
              clientNameMatch = String(client.name).toLowerCase().includes(searchValue);
            }
          }
          if (!matches && !addressMatch && !clientNameMatch) return false;
          continue;
        }

        // Handle range filters (_gte, _lte, _gt, _lt suffixes)
        if (key.endsWith('_gte')) {
          const fieldName = key.slice(0, -4);
          const itemValue = item[fieldName];
          if (itemValue == null) return false;
          // Compare as dates if both are date strings, otherwise as strings
          const itemDate = new Date(itemValue).getTime();
          const filterDate = new Date(value).getTime();
          if (!isNaN(itemDate) && !isNaN(filterDate)) {
            if (itemDate < filterDate) return false;
          } else if (String(itemValue) < String(value)) {
            return false;
          }
          continue;
        }

        if (key.endsWith('_lte')) {
          const fieldName = key.slice(0, -4);
          const itemValue = item[fieldName];
          if (itemValue == null) return false;
          const itemDate = new Date(itemValue).getTime();
          const filterDate = new Date(value).getTime();
          if (!isNaN(itemDate) && !isNaN(filterDate)) {
            if (itemDate > filterDate) return false;
          } else if (String(itemValue) > String(value)) {
            return false;
          }
          continue;
        }

        if (key.endsWith('_gt')) {
          const fieldName = key.slice(0, -3);
          const itemValue = item[fieldName];
          if (itemValue == null) return false;
          const itemDate = new Date(itemValue).getTime();
          const filterDate = new Date(value).getTime();
          if (!isNaN(itemDate) && !isNaN(filterDate)) {
            if (itemDate <= filterDate) return false;
          } else if (String(itemValue) <= String(value)) {
            return false;
          }
          continue;
        }

        if (key.endsWith('_lt')) {
          const fieldName = key.slice(0, -3);
          const itemValue = item[fieldName];
          if (itemValue == null) return false;
          const itemDate = new Date(itemValue).getTime();
          const filterDate = new Date(value).getTime();
          if (!isNaN(itemDate) && !isNaN(filterDate)) {
            if (itemDate >= filterDate) return false;
          } else if (String(itemValue) >= String(value)) {
            return false;
          }
          continue;
        }

        // Handle not equal filter (_ne suffix)
        if (key.endsWith('_ne')) {
          const fieldName = key.slice(0, -3);
          const itemValue = item[fieldName];
          // Filter out items where the field value equals the filter value
          if (itemValue === value) return false;
          continue;
        }

        // Direct field match
        if (item[key] !== value) return false;
      }
      return true;
    });
  };

  // Helper to sort data
  const applySort = (data: any[], sort: { field: string; order: string } = { field: 'id', order: 'ASC' }) => {
    const { field, order } = sort;
    return [...data].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return order === 'ASC' ? 1 : -1;
      if (bVal == null) return order === 'ASC' ? -1 : 1;

      // Handle dates
      if (field.includes('At') || field.includes('Date') || field === 'dueDate') {
        const aDate = new Date(aVal).getTime();
        const bDate = new Date(bVal).getTime();
        return order === 'ASC' ? aDate - bDate : bDate - aDate;
      }

      // Handle numbers
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return order === 'ASC' ? aVal - bVal : bVal - aVal;
      }

      // Handle strings
      const comparison = String(aVal).localeCompare(String(bVal));
      return order === 'ASC' ? comparison : -comparison;
    });
  };

  // Helper to paginate data
  const applyPagination = (data: any[], pagination: { page: number; perPage: number } = { page: 1, perPage: 25 }) => {
    const { page, perPage } = pagination;
    const start = (page - 1) * perPage;
    return data.slice(start, start + perPage);
  };

  return {
    getList: async (resource: string, params: any = {}) => {
      await delay(300);
      let data = simpleJobberData[resource as keyof typeof simpleJobberData] || [];
      if (!Array.isArray(data)) return { data: [], total: 0 };

      // Apply filters
      data = applyFilters(data, params.filter);
      const total = data.length;

      // Apply sorting
      data = applySort(data, params.sort);

      // Apply pagination
      data = applyPagination(data, params.pagination);

      return { data, total } as any;
    },
    getOne: async (resource: string, params: any) => {
      await delay(200);
      const data = simpleJobberData[resource as keyof typeof simpleJobberData] || [];
      const item = Array.isArray(data) ? data.find((item: any) => String(item.id) === String(params.id)) : null;
      if (!item) throw new Error('Not found');
      return { data: item } as any;
    },
    getMany: async (resource: string, params: any) => {
      await delay(200);
      const data = simpleJobberData[resource as keyof typeof simpleJobberData] || [];
      const items = Array.isArray(data)
        ? data.filter((item: any) => params.ids.map(String).includes(String(item.id)))
        : [];
      return { data: items } as any;
    },
    getManyReference: async (resource: string, params: any) => {
      await delay(300);
      let data: any[] = simpleJobberData[resource as keyof typeof simpleJobberData] || [];
      if (!Array.isArray(data)) return { data: [], total: 0 };

      // Filter by the reference field
      data = data.filter((item: any) => String(item[params.target]) === String(params.id));

      // Apply additional filters
      data = applyFilters(data, params.filter);
      const total = data.length;

      // Apply sorting
      data = applySort(data, params.sort);

      // Apply pagination
      data = applyPagination(data, params.pagination);

      return { data, total } as any;
    },
    create: async (resource: string, params: any) => {
      await delay(300);
      return { data: { ...params.data, id: Date.now().toString() } } as any;
    },
    update: async (resource: string, params: any) => {
      await delay(300);
      const data = simpleJobberData[resource as keyof typeof simpleJobberData];
      if (Array.isArray(data)) {
        const index = data.findIndex((item: any) => String(item.id) === String(params.id));
        if (index !== -1) {
          // Merge the existing item with the new data
          data[index] = { ...data[index], ...params.data, id: params.id };
          return { data: data[index] } as any;
        }
      }
      return { data: { ...params.data, id: params.id } } as any;
    },
    updateMany: async (resource: string, params: any) => {
      await delay(300);
      return { data: params.ids } as any;
    },
    delete: async (resource: string, params: any) => {
      await delay(300);
      return { data: { id: params.id } } as any;
    },
    deleteMany: async (resource: string, params: any) => {
      await delay(300);
      return { data: params.ids } as any;
    },
  };
}

// Export the mock data provider for preview mode
export const dataProvider = createMockDataProvider();
