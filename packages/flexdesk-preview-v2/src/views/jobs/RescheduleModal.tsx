import { useState } from 'react';
import { useUpdate, useRefresh, useNotify } from 'ra-core';
import { Modal, DatePicker, Text, FormatDate, InlineBanner, InputTime } from '@/atlantis';
import { type Job } from '@/types';

interface RescheduleModalProps {
  open: boolean;
  onClose: () => void;
  jobs: Job[];
}

export const RescheduleModal = ({ open, onClose, jobs }: RescheduleModalProps) => {
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [update, { isLoading }] = useUpdate();
  const refresh = useRefresh();
  const notify = useNotify();

  const jobCount = jobs.length;
  const isBatch = jobCount > 1;

  // Get original date and time from the first job for reference
  const job0 = jobs[0];
  const originalDate = job0?.scheduledDate
    ? new Date(`${job0.scheduledDate}T${job0.scheduledStartTime || '00:00'}:00`)
    : undefined;
  const validOriginalDate =
    originalDate && !isNaN(originalDate.getTime()) ? originalDate : undefined;

  const originalStartTime = job0?.scheduledStartTime || '';
  const originalEndTime = job0?.scheduledEndTime || '';

  const handleDateChange = (date: Date) => {
    setNewDate(date);
    // Set default times if not already set
    if (!startTime && originalStartTime) {
      setStartTime(originalStartTime);
    }
    if (!endTime && originalEndTime) {
      setEndTime(originalEndTime);
    }
  };

  const handleConfirm = async () => {
    if (!newDate) return;

    try {
      const scheduledDate = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;

      for (const job of jobs) {
        const resolvedStartTime = startTime || job.scheduledStartTime || '';
        const resolvedEndTime = endTime || job.scheduledEndTime || '';

        const updateData: Record<string, string> = {
          scheduledDate,
        };

        if (resolvedStartTime) {
          updateData.scheduledStartTime = resolvedStartTime;
        }
        if (resolvedEndTime) {
          updateData.scheduledEndTime = resolvedEndTime;
        }

        await update(
          'jobs',
          { id: job.id, data: updateData, previousData: job },
          { mutationMode: 'pessimistic' },
        );
      }

      notify(
        isBatch
          ? `${jobCount} jobs rescheduled successfully`
          : 'Job rescheduled successfully',
        { type: 'success' },
      );
      refresh();
      handleClose();
    } catch {
      notify('Failed to reschedule. Please try again.', { type: 'error' });
    }
  };

  const handleClose = () => {
    setNewDate(undefined);
    setStartTime('');
    setEndTime('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onRequestClose={handleClose}
      title={isBatch ? `Reschedule ${jobCount} Jobs` : 'Reschedule Job'}
      size="small"
      primaryAction={{
        label: 'Reschedule',
        onClick: handleConfirm,
        disabled: !newDate,
        loading: isLoading,
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: handleClose,
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Original date reference */}
        {!isBatch && validOriginalDate && (
          <div className="flex items-center gap-2">
            <Text element="span" size="small" variation="subdued">
              Current schedule:
            </Text>
            <Text element="span" size="small">
              <FormatDate date={validOriginalDate} useRelative />
              {originalStartTime && ` at ${originalStartTime}`}
              {originalEndTime && ` - ${originalEndTime}`}
            </Text>
          </div>
        )}

        {isBatch && (
          <InlineBanner variant="warning">
            You are rescheduling {jobCount} jobs at once. All selected jobs will be moved to the new date and time.
          </InlineBanner>
        )}

        {/* New date selection */}
        <div>
          <Text element="span" size="small" variation="subdued">
            New date
          </Text>
          <div className="mt-2">
            <DatePicker
              selected={newDate}
              onChange={handleDateChange}
              fullWidth
            />
          </div>
        </div>

        {/* Time selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Text element="span" size="small" variation="subdued">
              Start time
            </Text>
            <div className="mt-2">
              <InputTime
                value={startTime || originalStartTime}
                onChange={(value) => setStartTime(value)}
                placeholder="Select time"
              />
            </div>
          </div>
          <div>
            <Text element="span" size="small" variation="subdued">
              End time
            </Text>
            <div className="mt-2">
              <InputTime
                value={endTime || originalEndTime}
                onChange={(value) => setEndTime(value)}
                placeholder="Select time"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
