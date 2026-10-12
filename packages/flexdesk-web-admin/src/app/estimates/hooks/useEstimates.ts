import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@service-flex/core';
import type {
  Estimate,
  EstimateStatus,
  CreateEstimateInput,
  UpdateEstimateInput,
  ConvertToJobInput,
} from '../types/Estimate';

// Fetch all estimates
export function useEstimates(status?: EstimateStatus) {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = status ? `?status=${status}` : '';
      const response = await apiClient.get<Estimate[]>(`/estimates${params}`);
      setEstimates(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { estimates, loading, error, refetch: fetchData };
}

// Fetch single estimate by ID
export function useEstimate(estimateId: string | null) {
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!estimateId) {
      setLoading(false);
      setError(new Error('No estimate ID provided'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<Estimate>(`/estimates/${estimateId}`);
      setEstimate(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [estimateId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { estimate, loading, error, refetch: fetchData };
}

// Fetch estimates by customer
export function useEstimatesByCustomer(customerId: string | null) {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
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
      const response = await apiClient.get<Estimate[]>(
        `/estimates/by-customer/${customerId}`,
      );
      setEstimates(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { estimates, loading, error, refetch: fetchData };
}

// Create estimate hook
export function useCreateEstimate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createEstimate = useCallback(async (input: CreateEstimateInput) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<Estimate>('/estimates', input);
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create estimate');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createEstimate, loading, error };
}

// Update estimate hook
export function useUpdateEstimate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateEstimate = useCallback(
    async (estimateId: string, input: UpdateEstimateInput) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.patch<Estimate>(`/estimates/${estimateId}`, input);
        return response.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update estimate');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { updateEstimate, loading, error };
}

// Send estimate hook
export function useSendEstimate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendEstimate = useCallback(async (estimateId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<Estimate>(`/estimates/${estimateId}/send`);
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send estimate');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { sendEstimate, loading, error };
}

// Accept estimate hook
export function useAcceptEstimate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const acceptEstimate = useCallback(async (estimateId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<Estimate>(`/estimates/${estimateId}/accept`);
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to accept estimate');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { acceptEstimate, loading, error };
}

// Reject estimate hook
export function useRejectEstimate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const rejectEstimate = useCallback(async (estimateId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<Estimate>(`/estimates/${estimateId}/reject`);
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to reject estimate');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { rejectEstimate, loading, error };
}

// Convert estimate to job hook
export function useConvertEstimateToJob() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const convertToJob = useCallback(
    async (estimateId: string, input: ConvertToJobInput = {}) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.post<Estimate>(
          `/estimates/${estimateId}/convert-to-job`,
          input,
        );
        return response.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to convert estimate to job');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { convertToJob, loading, error };
}

// Delete estimate hook
export function useDeleteEstimate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteEstimate = useCallback(async (estimateId: string) => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.delete(`/estimates/${estimateId}`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete estimate');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteEstimate, loading, error };
}
