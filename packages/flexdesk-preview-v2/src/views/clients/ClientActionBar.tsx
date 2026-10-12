import { createPortal } from 'react-dom'
import { Button, Icon, Menu } from '@/atlantis'
import type { Client } from '@/types'

interface ClientActionBarProps {
  selectedClients: Client[]
  onClearSelection: () => void
  onSendEmail?: (clients: Client[]) => void
  onViewClient?: (client: Client) => void
  onEditClient?: (client: Client) => void
  onAddTag?: (clients: Client[]) => void
  onChangeStatus?: (clients: Client[]) => void
  onCreateJob?: (clients: Client[]) => void
  onDelete?: (clients: Client[]) => void
}

export const ClientActionBar = ({
  selectedClients,
  onClearSelection,
  onSendEmail,
  onViewClient,
  onEditClient,
  onAddTag,
  onChangeStatus,
  onCreateJob,
  onDelete,
}: ClientActionBarProps) => {
  if (selectedClients.length === 0) return null

  const clientCount = selectedClients.length
  const clientText = clientCount === 1 ? 'client' : 'clients'

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
            {clientCount} {clientText} selected
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

        {/* Primary action - Send Email */}
        <Button
          type="primary"
          variation="work"
          size="small"
          icon="email"
          onClick={() => onSendEmail?.(selectedClients)}
        >
          Send Email
        </Button>

        {/* More Options Menu */}
        <Menu placement="bottom-end">
          <Menu.Trigger>
            <Button type="secondary" variation="subtle" size="small" icon="more" className="gap-2">
              More Options
            </Button>
          </Menu.Trigger>
          <Menu.Content width={192}>
            {clientCount === 1 && (
              <>
                <Menu.Item icon="eye" onClick={() => onViewClient?.(selectedClients[0])}>
                  View Client
                </Menu.Item>
                <Menu.Item icon="edit" onClick={() => onEditClient?.(selectedClients[0])}>
                  Edit Client
                </Menu.Item>
                <Menu.Separator />
              </>
            )}
            <Menu.Item icon="tag" onClick={() => onAddTag?.(selectedClients)}>
              Add Tag
            </Menu.Item>
            <Menu.Item icon="userSettings" onClick={() => onChangeStatus?.(selectedClients)}>
              Change Status
            </Menu.Item>
            <Menu.Item icon="add" onClick={() => onCreateJob?.(selectedClients)}>
              Create Job
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item
              icon="trash"
              onClick={() => onDelete?.(selectedClients)}
              destructive
            >
              Delete {clientText}
            </Menu.Item>
          </Menu.Content>
        </Menu>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
