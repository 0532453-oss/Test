/**
 * React Query mutation hooks for jobs, invoices, and customers.
 *
 * Each mutation invalidates related queries on success so lists
 * refetch automatically after writes.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateJobStatus, addJobNote, uploadJobAttachment } from '../api/jobs.api';
import { createInvoiceFromJob, sendInvoice, markInvoicePaid, getPaymentLink } from '../api/invoices.api';
import { createCustomer } from '../api/customers.api';
import { addJobPart, updateJobPart, removeJobPart } from '../api/parts.api';
import type {
  AddJobPartRequest,
  CreateCustomerRequest,
  Customer,
  Invoice,
  Job,
  JobAttachment,
  JobDetails,
  JobNote,
  JobPart,
  PaymentLinkResponse,
  UpdateJobPartRequest,
  UpdateJobStatusRequest,
} from '../api/types';

/** Add a note to a job with optimistic update. */
export function useAddJobNote() {
  const queryClient = useQueryClient();

  return useMutation<
    Job,
    Error,
    { jobId: string; content: string; authorName: string },
    { previous: JobDetails | undefined }
  >({
    mutationFn: ({ jobId, content }) => addJobNote(jobId, content),
    onMutate: async ({ jobId, content, authorName }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['jobs', 'details', jobId] });

      // Snapshot previous value
      const previous = queryClient.getQueryData<JobDetails>(['jobs', 'details', jobId]);

      // Optimistically add the note
      if (previous) {
        const optimisticNote: JobNote = {
          id: `temp-${Date.now()}`,
          content,
          authorName,
          createdAt: new Date().toISOString(),
        };
        queryClient.setQueryData<JobDetails>(['jobs', 'details', jobId], {
          ...previous,
          notes: [optimisticNote, ...(previous.notes ?? [])],
        });
      }

      return { previous };
    },
    onError: (_err, { jobId }, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['jobs', 'details', jobId], context.previous);
      }
    },
    onSettled: (_data, _err, { jobId }) => {
      // Refetch to get server truth
      queryClient.invalidateQueries({ queryKey: ['jobs', 'details', jobId] });
    },
  });
}

/** Transition a job to a new status (e.g., IN_PROGRESS, COMPLETED). */
export function useUpdateJobStatus() {
  const queryClient = useQueryClient();

  return useMutation<Job, Error, { id: string; req: UpdateJobStatusRequest }>({
    mutationFn: ({ id, req }) => updateJobStatus(id, req),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'details', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/** Create an invoice from a completed job. */
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation<Invoice, Error, string>({
    mutationFn: (jobId) => createInvoiceFromJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/** Create a new customer. */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation<Customer, Error, CreateCustomerRequest>({
    mutationFn: (req) => createCustomer(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/** Send an invoice to the customer via email. */
export function useSendInvoice() {
  const queryClient = useQueryClient();

  return useMutation<Invoice, Error, string>({
    mutationFn: (id) => sendInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

/** Mark an invoice as paid. */
export function useMarkInvoicePaid() {
  const queryClient = useQueryClient();

  return useMutation<Invoice, Error, string>({
    mutationFn: (id) => markInvoicePaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/** Generate a Stripe payment link for an invoice. */
export function useGetPaymentLink() {
  const queryClient = useQueryClient();

  return useMutation<PaymentLinkResponse, Error, string>({
    mutationFn: (id) => getPaymentLink(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

/** Upload a photo attachment to a job. */
export function useUploadJobPhoto() {
  const queryClient = useQueryClient();

  return useMutation<
    JobAttachment,
    Error,
    {
      jobId: string;
      file: { uri: string; fileName: string; type: string };
      onProgress?: (percent: number) => void;
    }
  >({
    mutationFn: ({ jobId, file, onProgress }) =>
      uploadJobAttachment(jobId, file, onProgress),
    onSuccess: (_data, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['jobs', 'details', jobId] });
    },
  });
}

/** Add a part to a job. */
export function useAddJobPart() {
  const queryClient = useQueryClient();

  return useMutation<JobPart, Error, { jobId: string; req: AddJobPartRequest }>({
    mutationFn: ({ jobId, req }) => addJobPart(jobId, req),
    onSuccess: (_data, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['jobs', 'details', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'parts-totals', jobId] });
    },
  });
}

/** Update quantity of a part on a job. */
export function useUpdateJobPart() {
  const queryClient = useQueryClient();

  return useMutation<
    JobPart,
    Error,
    { jobId: string; jobPartId: string; req: UpdateJobPartRequest }
  >({
    mutationFn: ({ jobId, jobPartId, req }) => updateJobPart(jobId, jobPartId, req),
    onSuccess: (_data, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['jobs', 'details', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'parts-totals', jobId] });
    },
  });
}

/** Remove a part from a job. */
export function useRemoveJobPart() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { jobId: string; jobPartId: string }>({
    mutationFn: ({ jobId, jobPartId }) => removeJobPart(jobId, jobPartId),
    onSuccess: (_data, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['jobs', 'details', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'parts-totals', jobId] });
    },
  });
}
