import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@shared/hooks'
import type { Job, JobFilters, CreateJobInput, UpdateJobInput } from '../types'

const JOBS_KEY = ['jobs'] as const

export function useJobs(filters: JobFilters = {}) {
  return useQuery({
    queryKey: [...JOBS_KEY, filters],
    queryFn: () => api.get<Job[]>('/jobs', { params: filters as Record<string, string> }),
  })
}

export function useJob(id: string) {
  return useQuery({
    queryKey: [...JOBS_KEY, id],
    queryFn: () => api.get<Job>(`/jobs/${id}`),
    enabled: !!id,
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateJobInput) => api.post<Job>('/jobs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_KEY })
    },
  })
}

export function useUpdateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateJobInput & { id: string }) =>
      api.put<Job>(`/jobs/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: JOBS_KEY })
      queryClient.invalidateQueries({ queryKey: [...JOBS_KEY, id] })
    },
  })
}

export function useDeleteJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/jobs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_KEY })
    },
  })
}
