import { useState, useCallback } from 'react';
import { indexedDBClient } from '@/modules/api/storage/IndexedDBClient';
import { syncManager } from '@/modules/api/sync/SyncManager';
import { SyncOperationType } from '@/modules/api/sync/types/SyncOperation';
import type { Job } from '@/modules/job/types/Job';
import { InputFile, type FileUpload } from '../../../../../flexdesk-front/simple-jobber/components/atlantis';

interface JobCompletionFormProps {
  job: Job;
  onCompleted?: () => void;
}

interface LocalAttachment {
  id: string;
  jobId: string;
  mimeType: string;
  size: number;
  createdAt: number;
  data: string; // Base64 payload
  status: 'PENDING_UPLOAD' | 'UPLOADED';
}

export function JobCompletionForm({ job, onCompleted }: JobCompletionFormProps) {
  const [note, setNote] = useState('');
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setError(null);

    const newAttachments: LocalAttachment[] = [];

    for (const file of files) {
      const base64 = await fileToBase64(file);

      const attachment: LocalAttachment = {
        id: `${job.id}_${Date.now()}_${file.name}`,
        jobId: job.id,
        mimeType: file.type,
        size: file.size,
        createdAt: Date.now(),
        data: base64,
        status: 'PENDING_UPLOAD',
      };

      newAttachments.push(attachment);
    }

    try {
      await indexedDBClient.init();

      for (const attachment of newAttachments) {
        await indexedDBClient.put('job_attachments', attachment);

        // Queue background upload via SyncManager (Manner B)
        await syncManager.queueOperation({
          type: SyncOperationType.CREATE,
          entityType: 'JobAttachment',
          entityId: attachment.id,
          endpoint: `/jobs/${job.id}/attachments`,
          method: 'POST',
          data: {
            id: attachment.id,
            jobId: attachment.jobId,
            mimeType: attachment.mimeType,
            size: attachment.size,
            createdAt: attachment.createdAt,
            data: attachment.data,
          },
        });
      }

      setAttachments((prev) => [...prev, ...newAttachments]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save attachments locally';
      setError(message);
    }
  }, [job.id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // Notes and status changes can be wired to existing APIs later.
      // For now, this form mainly enqueues proof-of-work attachments locally.
      if (onCompleted) {
        onCompleted();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to complete job';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const queuedCount = attachments.filter(
    (a) => a.status === 'PENDING_UPLOAD',
  ).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Proof of work</h3>
        <p className="mt-1 text-xs text-gray-500">
          Capture photos and notes for this job. Photos are stored locally and
          uploaded in the background.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-700">
          Photos
        </label>
        <InputFile
          variation="button"
          buttonLabel="Choose Photos"
          allowedTypes="images"
          allowMultiple
          size="small"
          onFilesSelected={handleFilesSelected}
          description="Capture or select photos for proof of work"
        />
        {queuedCount > 0 && (
          <p className="text-[11px] text-gray-500">
            {queuedCount} photo{queuedCount > 1 ? 's' : ''} queued for upload.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-700">
          Completion notes
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Add a brief description of the work performed…"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-gray-500">
          You can move to the next job while uploads continue in the background.
        </p>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-300"
        >
          {isSaving ? 'Saving…' : 'Save proof'}
        </button>
      </div>
    </form>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Unexpected file reader result'));
      }
    };
    reader.onerror = () => {
      reject(reader.error || new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

