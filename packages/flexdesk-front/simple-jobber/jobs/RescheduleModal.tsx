import { useState } from 'react';
import { useUpdate, useRefresh, useNotify } from 'ra-core';
import { Modal, DatePicker, Text, FormatDate, InlineBanner, InputTime, Grid } from '../components/atlantis';
import { type Job } from '../types';

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
  const originalDate = jobs[0]?.scheduledStartAt
    ? new Date(jobs[0].scheduledStartAt as string)
    : undefined;
  const validOriginalDate =
    originalDate && !isNaN(originalDate.getTime()) ? originalDate : undefined;

  // Get original times
  const originalStartTime = validOriginalDate
    ? `${String(validOriginalDate.getHours()).padStart(2, '0')}:${String(validOriginalDate.getMinutes()).padStart(2, '0')}`
    : '';
  const originalEndDate = jobs[0]?.scheduledEndAt
    ? new Date(jobs[0].scheduledEndAt as string)
    : undefined;
  const originalEndTime = originalEndDate && !isNaN(originalEndDate.getTime())
    ? `${String(originalEndDate.getHours()).padStart(2, '0')}:${String(originalEndDate.getMinutes()).padStart(2, '0')}`
    : '';

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
      // Update each selected job's scheduledStartAt (and shift scheduledEndAt by the same offset)
      for (const job of jobs) {
        // Use provided start time or preserve existing time
        let hours = 0;
        let minutes = 0;
        if (startTime) {
          const [h, m] = startTime.split(':').map(Number);
          hours = h;
          minutes = m;
        } else {
          const existingStart = job.scheduledStartAt
            ? new Date(job.scheduledStartAt as string)
            : null;
          if (existingStart && !isNaN(existingStart.getTime())) {
            hours = existingStart.getHours();
            minutes = existingStart.getMinutes();
          }
        }

        const newStartDate = new Date(
          newDate.getFullYear(),
          newDate.getMonth(),
          newDate.getDate(),
          hours,
          minutes,
        );

        // Calculate end time
        const updateData: Record<string, string> = {
          scheduledStartAt: newStartDate.toISOString(),
        };

        if (endTime) {
          // Use provided end time
          const [endH, endM] = endTime.split(':').map(Number);
          const newEndDate = new Date(
            newDate.getFullYear(),
            newDate.getMonth(),
            newDate.getDate(),
            endH,
            endM,
          );
          updateData.scheduledEndAt = newEndDate.toISOString();
        } else {
          // Preserve existing duration
          const existingStart = job.scheduledStartAt
            ? new Date(job.scheduledStartAt as string)
            : null;
          if (existingStart && !isNaN(existingStart.getTime()) && job.scheduledEndAt) {
            const existingEnd = new Date(job.scheduledEndAt as string);
            if (!isNaN(existingEnd.getTime())) {
              const durationMs = existingEnd.getTime() - existingStart.getTime();
              const newEndDate = new Date(newStartDate.getTime() + durationMs);
              updateData.scheduledEndAt = newEndDate.toISOString();
            }
          }
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
