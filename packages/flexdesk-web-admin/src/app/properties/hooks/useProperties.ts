import { useState, useEffect, useCallback } from 'react';
import type {
  Property,
  PropertyWithRelations,
  CreatePropertyInput,
  UpdatePropertyInput,
} from '../types/Property';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getAuthToken(): string | null {
  return localStorage.getItem('access_token');
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed: ${response.status}`);
  }

  return response;
}

// Fetch all properties in workspace
export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/properties`);
      const data: Property[] = await response.json();
      setProperties(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { properties, loading, error, refetch: fetchData };
}

// Fetch single property by ID
export function useProperty(propertyId: string | null) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!propertyId) {
      setLoading(false);
      setError(new Error('No property ID provided'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}`);
      const data: Property = await response.json();
      setProperty(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { property, loading, error, refetch: fetchData };
}

// Fetch property with full relations (customer, jobs)
export function usePropertyWithRelations(propertyId: string | null) {
  const [property, setProperty] = useState<PropertyWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!propertyId) {
      setLoading(false);
      setError(new Error('No property ID provided'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/properties/${propertyId}/with-relations`,
      );
      const data: PropertyWithRelations = await response.json();
      setProperty(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { property, loading, error, refetch: fetchData };
}

// Fetch properties by customer
export function usePropertiesByCustomer(customerId: string | null) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!customerId) {
      setLoading(false);
      setError(new Error('No customer ID provided'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/properties/by-customer/${customerId}`,
      );
      const data: Property[] = await response.json();
      setProperties(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { properties, loading, error, refetch: fetchData };
}

// Get primary property for a customer
export function usePrimaryProperty(customerId: string | null) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!customerId) {
      setLoading(false);
      setError(new Error('No customer ID provided'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/properties/by-customer/${customerId}/primary`,
      );
      const data: Property | null = await response.json();
      setProperty(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { property, loading, error, refetch: fetchData };
}

// Search properties by name or address
export function useSearchProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProperties([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/properties/search?q=${encodeURIComponent(query)}`,
      );
      const data: Property[] = await response.json();
      setProperties(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  return { properties, loading, error, search };
}

// Create property hook
export function useCreateProperty() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createProperty = useCallback(async (input: CreatePropertyInput) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/properties`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      const data: Property = await response.json();
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create property');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createProperty, loading, error };
}

// Update property hook
export function useUpdateProperty() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateProperty = useCallback(
    async (propertyId: string, input: UpdatePropertyInput) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}`, {
          method: 'PATCH',
          body: JSON.stringify(input),
        });
        const data: Property = await response.json();
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update property');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { updateProperty, loading, error };
}

// Set property as primary hook
export function useSetPrimaryProperty() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setPrimary = useCallback(async (propertyId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/properties/${propertyId}/set-primary`,
        {
          method: 'POST',
        },
      );
      const data: Property = await response.json();
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to set primary property');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { setPrimary, loading, error };
}

// Delete property hook
export function useDeleteProperty() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteProperty = useCallback(async (propertyId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/properties/${propertyId}`, {
        method: 'DELETE',
      });
      const data: Property = await response.json();
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete property');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteProperty, loading, error };
}

// Migrate customer legacy address to property
export function useMigrateCustomerAddress() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const migrateAddress = useCallback(
    async (customerId: string, propertyName: string = 'Primary') => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchWithAuth(
          `${API_BASE_URL}/properties/migrate/${customerId}?name=${encodeURIComponent(propertyName)}`,
          {
            method: 'POST',
          },
        );
        const data: Property | null = await response.json();
        return data;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to migrate customer address');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { migrateAddress, loading, error };
}
