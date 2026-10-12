import { useState } from 'react';
import { useGetList, useUpdate, useRefresh, useNotify } from 'ra-core';
import { Modal, Select, Text, InlineBanner } from '@/atlantis';
import { type Job, type TeamMember } from '@/types';

interface AssignTechnicianModalProps {
  open: boolean;
  onClose: () => void;
  jobs: Job[];
}

export const AssignTechnicianModal = ({ open, onClose, jobs }: AssignTechnicianModalProps) => {
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
  const [update, { isLoading }] = useUpdate();
  const refresh = useRefresh();
  const notify = useNotify();

  const { data: technicians } = useGetList<TeamMember>('teamMembers', {
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'name', order: 'ASC' },
  });

  const jobCount = jobs.length;
  const isBatch = jobCount > 1;

  const technicianOptions = (technicians || [])
    .filter((t) => t.isActive)
    .map((t) => ({ value: t.id, label: t.name }));

  const selectedTechnician = technicians?.find((t) => t.id === selectedTechnicianId);

  const handleConfirm = async () => {
    if (!selectedTechnicianId || jobs.length === 0) return;

    try {
      for (const job of jobs) {
        await update(
          'jobs',
          { id: job.id, data: { technicianId: selectedTechnicianId }, previousData: job },
          { mutationMode: 'pessimistic' },
        );
      }

      const techName = selectedTechnician?.name || 'technician';
      notify(
        isBatch
          ? `${jobCount} jobs assigned to ${techName}`
          : `Job assigned to ${techName}`,
        { type: 'success' },
      );
      refresh();
      handleClose();
    } catch {
      notify('Failed to assign technician. Please try again.', { type: 'error' });
    }
  };

  const handleClose = () => {
    setSelectedTechnicianId('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onRequestClose={handleClose}
      title={isBatch ? `Assign Technician to ${jobCount} Jobs` : 'Assign Technician'}
      size="small"
      primaryAction={{
        label: 'Assign',
        onClick: handleConfirm,
        disabled: !selectedTechnicianId,
        loading: isLoading,
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: handleClose,
      }}
    >
      <div className="flex flex-col gap-4">
        {isBatch && (
          <InlineBanner variant="warning">
            You are assigning {jobCount} jobs at once. All selected jobs will be assigned to the chosen technician.
          </InlineBanner>
        )}

        <Text variation="subdued">
          Select a technician to assign to the selected {isBatch ? 'jobs' : 'job'}.
        </Text>

        <Select
          value={selectedTechnicianId}
          onChange={(value) => setSelectedTechnicianId(String(value ?? ''))}
          placeholder="Select technician"
          options={technicianOptions}
        />
      </div>
    </Modal>
  );
};
