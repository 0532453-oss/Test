import { useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { useDelete, useRefresh, useNotify } from 'ra-core';
import {
  BottomSheet,
  BottomSheetOption,
  ConfirmationModal,
  toast,
  type BottomSheetRef,
} from '@/atlantis';
import type { Job } from '@/types';

/**
 * useJobQuickActions - Hook providing a BottomSheet with quick actions for a single job.
 *
 * Actions: Edit, Reschedule, Duplicate, Delete
 *
 * Usage:
 * ```tsx
 * const jobQuickActions = useJobQuickActions({ onDelete: ..., onReschedule: ... });
 * // Open for a specific job:
 * jobQuickActions.open(job);
 * // Render the sheet:
 * {jobQuickActions.sheet}
 * ```
 */
export function useJobQuickActions(options?: {
  onDelete?: (job: Job) => void;
  onReschedule?: (job: Job) => void;
}) {
  const sheetRef = useRef<BottomSheetRef>(null);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletedJob, setDeletedJob] = useState<Job | null>(null);
  const navigate = useNavigate();
  const [deleteOne] = useDelete();
  const refresh = useRefresh();
  const notify = useNotify();

  const open = useCallback((job: Job) => {
    setActiveJob(job);
    sheetRef.current?.open();
  }, []);

  const close = useCallback(() => {
    sheetRef.current?.close();
    setActiveJob(null);
  }, []);

  const handleEdit = useCallback(() => {
    if (!activeJob) return;
    close();
    navigate(`/jobs/${activeJob.id}`);
  }, [activeJob, close, navigate]);

  const handleReschedule = useCallback(() => {
    if (!activeJob) return;
    close();
    options?.onReschedule?.(activeJob);
  }, [activeJob, close, options]);

  const handleDuplicate = useCallback(() => {
    if (!activeJob) return;
    close();
    const params = new URLSearchParams();
    if (activeJob.clientId) params.set('clientId', String(activeJob.clientId));
    if (activeJob.title) params.set('title', activeJob.title);
    if (activeJob.description) params.set('description', activeJob.description);
    if (activeJob.priority) params.set('priority', activeJob.priority);
    navigate(`/jobs/create?${params.toString()}`);
  }, [activeJob, close, navigate]);

  const handleDeleteRequest = useCallback(() => {
    if (!activeJob) return;
    close();
    setConfirmDelete(true);
  }, [activeJob, close]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!activeJob) return;
    setConfirmDelete(false);
    const jobToDelete = activeJob;
    setDeletedJob(jobToDelete);
    setActiveJob(null);

    try {
      await deleteOne(
        'jobs',
        { id: jobToDelete.id, previousData: jobToDelete },
        { mutationMode: 'pessimistic' }
      );

      // Show success toast with undo option
      toast.success(`"${jobToDelete.title}" deleted`, {
        action: {
          label: 'Undo',
          onClick: async () => {
            // Note: Undo would require recreating the job
            // For now, we'll show a message that undo is not fully supported
            notify('Undo is not available for this action', { type: 'info' });
          },
        },
        duration: 5000,
      });

      refresh();
      options?.onDelete?.(jobToDelete);
    } catch (error) {
      notify('Failed to delete job. Please try again.', { type: 'error' });
      setDeletedJob(null);
    }
  }, [activeJob, deleteOne, refresh, notify, options]);

  const handleDeleteCancel = useCallback(() => {
    setConfirmDelete(false);
  }, []);

  const sheet = (
    <>
      <BottomSheet
        ref={sheetRef}
        heading={activeJob?.title || 'Job Actions'}
        showCancel
        onClose={() => setActiveJob(null)}
        closeOnBackdropClick
      >
        <BottomSheetOption
          text="Edit"
          icon="edit"
          onPress={handleEdit}
        />
        <BottomSheetOption
          text="Reschedule"
          icon="calendar"
          onPress={handleReschedule}
        />
        <BottomSheetOption
          text="Duplicate"
          icon="copy"
          onPress={handleDuplicate}
        />
        <BottomSheetOption
          text="Delete"
          icon="trash"
          destructive
          onPress={handleDeleteRequest}
        />
      </BottomSheet>

      <ConfirmationModal
        open={confirmDelete}
        title="Delete Job"
        message={`Are you sure you want to delete "${activeJob?.title || 'this job'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variation="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        onRequestClose={handleDeleteCancel}
      />
    </>
  );

  return { open, close, sheet };
}
