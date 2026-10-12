import { createPortal } from 'react-dom'
import { Button, Menu } from '@/atlantis'
import type { Job } from '@/types'

interface JobActionBarProps {
  selectedJobs: Job[]
  onClearSelection: () => void
  onAssign?: (jobs: Job[]) => void
  onChangeStatus?: (jobs: Job[]) => void
  onReschedule?: (jobs: Job[]) => void
  onDelete?: (jobs: Job[]) => void
}

export const JobActionBar = ({
  selectedJobs,
  onClearSelection,
  onAssign,
  onChangeStatus,
  onReschedule,
  onDelete,
}: JobActionBarProps) => {
  if (selectedJobs.length === 0) return null

  const jobCount = selectedJobs.length
  const jobText = jobCount === 1 ? 'job' : 'jobs'

  const content = (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
      }}
    >
      <div className="flex items-center gap-3 bg-white dark:bg-[#1a1a1a] border border-border rounded-lg shadow-lg px-4 py-3">
        {/* Selection info */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {jobCount} {jobText} selected
          </span>
          <Button
            type="tertiary"
            variation="subtle"
            size="small"
            icon="cross"
            ariaLabel="Clear selection"
            className="h-6 w-6"
            onClick={onClearSelection}
          />
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Primary action - Assign */}
        <Button
          type="primary"
          variation="work"
          size="small"
          icon="user"
          onClick={() => onAssign?.(selectedJobs)}
        >
          Assign
        </Button>

        {/* More Options Menu */}
        <Menu placement="bottom-end">
          <Menu.Trigger>
            <Button type="secondary" variation="subtle" size="small" icon="more" className="gap-2">
              More Options
            </Button>
          </Menu.Trigger>
          <Menu.Content width={192}>
            <Menu.Item icon="userSettings" onClick={() => onChangeStatus?.(selectedJobs)}>
              Change Status
            </Menu.Item>
            <Menu.Item icon="calendar" onClick={() => onReschedule?.(selectedJobs)}>
              Reschedule
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item
              icon="trash"
              onClick={() => onDelete?.(selectedJobs)}
              destructive
            >
              Delete {jobText}
            </Menu.Item>
          </Menu.Content>
        </Menu>
      </div>
    </div>
  )

  // Use portal to render at document body level, avoiding CSS transform issues
  return createPortal(content, document.body)
}
