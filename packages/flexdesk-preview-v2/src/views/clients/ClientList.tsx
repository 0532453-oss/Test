import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useListContext, useListFilterContext, useDeleteMany, useUpdate, useRefresh, useNotify, useGetList } from 'ra-core'
import { useNavigate, Link } from 'react-router'
import { List, CreateButton, ExportButton } from '@/components/admin'
import {
  Button,
  Text,
  InputText,
  StatusLabel,
  DataTable,
  createColumnHelper,
  Popover,
  Tabs,
  Tab,
  useBool,
  FormatEmail,
  toast,
  ConfirmationModal,
  Modal,
  Select,
} from '@/atlantis'
import { LocationCell } from '@/atlantis/table-cells'
import { type Client, type Address, clientStatusToSemantic, formatStatusLabel } from '@/types'
import { SortDropdown, clientSortOptions } from '@/components/SortDropdown'
import { EmptyClientList, NoFilterResults } from '@/components/EmptyState'
import { ClientListSkeleton } from '@/components/skeletons'
import { ClientActionBar } from './ClientActionBar'

// =============================================================================
// INLINE EDIT POPOVERS
// =============================================================================

interface EditPhonePopoverProps {
  client: Client
  position: { top: number; left: number }
  onSave: (phone: string) => void
  onClose: () => void
}

const EditPhonePopover = ({ client, position, onSave, onClose }: EditPhonePopoverProps) => {
  const [phone, setPhone] = useState(client.phone ?? '')
  const inputRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)

  // Adjust position to keep popover within viewport
  useEffect(() => {
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const padding = 16

      let newTop = position.top
      let newLeft = position.left

      if (position.left + rect.width > viewportWidth - padding) {
        newLeft = viewportWidth - rect.width - padding
      }
      if (newLeft < padding) newLeft = padding
      if (position.top + rect.height > viewportHeight - padding) {
        newTop = viewportHeight - rect.height - padding
      }
      if (newTop < padding) newTop = padding

      setAdjustedPosition({ top: newTop, left: newLeft })
    }
  }, [position])

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter') onSave(phone)
    }
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.edit-phone-popover')) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [phone, onSave, onClose])

  return createPortal(
    <div
      ref={popoverRef}
      className="edit-phone-popover"
      style={{
        position: 'fixed',
        top: adjustedPosition.top,
        left: adjustedPosition.left,
        zIndex: 99999,
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        minWidth: '240px',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <div className="flex flex-col gap-3">
        <Text element="span" size="small" variation="subdued" className="font-medium">
          Edit Phone
        </Text>
        <InputText
          ref={inputRef}
          value={phone}
          onChange={setPhone}
          placeholder="Enter phone number..."
          size="small"
        />
        <div className="flex justify-end gap-2">
          <Button type="tertiary" size="small" onClick={onClose}>
            Cancel
          </Button>
          <Button type="primary" size="small" onClick={() => onSave(phone)}>
            Save
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

interface EditAddressPopoverProps {
  client: Client
  position: { top: number; left: number }
  onSave: (address: Partial<Address>) => void
  onClose: () => void
}

// Edit Email Popover
interface EditEmailPopoverProps {
  client: Client
  position: { top: number; left: number }
  onSave: (email: string) => void
  onClose: () => void
}

const EditEmailPopover = ({ client, position, onSave, onClose }: EditEmailPopoverProps) => {
  const [email, setEmail] = useState(client.email ?? '')
  const inputRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)

  // Adjust position to keep popover within viewport
  useEffect(() => {
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const padding = 16

      let newTop = position.top
      let newLeft = position.left

      if (position.left + rect.width > viewportWidth - padding) {
        newLeft = viewportWidth - rect.width - padding
      }
      if (newLeft < padding) newLeft = padding
      if (position.top + rect.height > viewportHeight - padding) {
        newTop = viewportHeight - rect.height - padding
      }
      if (newTop < padding) newTop = padding

      setAdjustedPosition({ top: newTop, left: newLeft })
    }
  }, [position])

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter') onSave(email)
    }
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.edit-email-popover')) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [email, onSave, onClose])

  return createPortal(
    <div
      ref={popoverRef}
      className="edit-email-popover"
      style={{
        position: 'fixed',
        top: adjustedPosition.top,
        left: adjustedPosition.left,
        zIndex: 99999,
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        minWidth: '280px',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <div className="flex flex-col gap-3">
        <Text element="span" size="small" variation="subdued" className="font-medium">
          Edit Email
        </Text>
        <InputText
          ref={inputRef}
          value={email}
          onChange={setEmail}
          placeholder="Enter email address..."
          size="small"
          type="email"
        />
        <div className="flex justify-end gap-2">
          <Button type="tertiary" size="small" onClick={onClose}>
            Cancel
          </Button>
          <Button type="primary" size="small" onClick={() => onSave(email)}>
            Save
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// Edit Status Popover
interface EditStatusPopoverProps {
  client: Client
  position: { top: number; left: number }
  onSave: (status: string) => void
  onClose: () => void
}

const EditStatusPopover = ({ client, position, onSave, onClose }: EditStatusPopoverProps) => {
  const [status, setStatus] = useState(client.status)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)

  // Adjust position to keep popover within viewport
  useEffect(() => {
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const padding = 16

      let newTop = position.top
      let newLeft = position.left

      if (position.left + rect.width > viewportWidth - padding) {
        newLeft = viewportWidth - rect.width - padding
      }
      if (newLeft < padding) newLeft = padding
      if (position.top + rect.height > viewportHeight - padding) {
        newTop = viewportHeight - rect.height - padding
      }
      if (newTop < padding) newTop = padding

      setAdjustedPosition({ top: newTop, left: newLeft })
    }
  }, [position])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.edit-status-popover')) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  const statusOptions = [
    { value: 'LEAD', label: 'Lead' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
  ]

  return createPortal(
    <div
      ref={popoverRef}
      className="edit-status-popover"
      style={{
        position: 'fixed',
        top: adjustedPosition.top,
        left: adjustedPosition.left,
        zIndex: 99999,
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        minWidth: '200px',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <div className="flex flex-col gap-3">
        <Text element="span" size="small" variation="subdued" className="font-medium">
          Edit Status
        </Text>
        <Select
          value={status}
          onChange={(value) => setStatus(String(value ?? '') as 'ACTIVE' | 'LEAD' | 'INACTIVE')}
          options={statusOptions}
        />
        <div className="flex justify-end gap-2">
          <Button type="tertiary" size="small" onClick={onClose}>
            Cancel
          </Button>
          <Button type="primary" size="small" onClick={() => onSave(status)}>
            Save
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

const EditAddressPopover = ({ client, position, onSave, onClose }: EditAddressPopoverProps) => {
  const [street, setStreet] = useState(client.address?.street ?? '')
  const [city, setCity] = useState(client.address?.city ?? '')
  const [state, setState] = useState(client.address?.state ?? '')
  const [zipCode, setZipCode] = useState(client.address?.zipCode ?? '')
  const firstInputRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)

  // Adjust position to keep popover within viewport
  useEffect(() => {
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const padding = 16

      let newTop = position.top
      let newLeft = position.left

      // Adjust horizontal position
      if (position.left + rect.width > viewportWidth - padding) {
        newLeft = viewportWidth - rect.width - padding
      }
      if (newLeft < padding) {
        newLeft = padding
      }

      // Adjust vertical position
      if (position.top + rect.height > viewportHeight - padding) {
        newTop = viewportHeight - rect.height - padding
      }
      if (newTop < padding) {
        newTop = padding
      }

      setAdjustedPosition({ top: newTop, left: newLeft })
    }
  }, [position])

  useEffect(() => {
    firstInputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.edit-address-popover')) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  const handleSave = () => {
    onSave({
      street,
      city,
      state,
      zipCode,
      country: client.address?.country ?? 'USA',
    })
  }

  return createPortal(
    <div
      ref={popoverRef}
      className="edit-address-popover"
      style={{
        position: 'fixed',
        top: adjustedPosition.top,
        left: adjustedPosition.left,
        zIndex: 99999,
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        minWidth: '320px',
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'calc(100vh - 32px)',
        overflow: 'auto',
      }}
    >
      <div className="flex flex-col gap-4">
        <Text element="span" size="small" variation="subdued" className="font-medium uppercase tracking-wider">
          Edit Address
        </Text>

        {/* Address Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '6px 8px 6px 0', width: '80px' }}>
                <Text element="span" size="small" variation="subdued">Street</Text>
              </td>
              <td style={{ padding: '6px 0' }}>
                <InputText
                  ref={firstInputRef}
                  value={street}
                  onChange={setStreet}
                  placeholder="Street address..."
                  size="small"
                />
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 8px 6px 0' }}>
                <Text element="span" size="small" variation="subdued">City</Text>
              </td>
              <td style={{ padding: '6px 0' }}>
                <InputText
                  value={city}
                  onChange={setCity}
                  placeholder="City..."
                  size="small"
                />
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 8px 6px 0' }}>
                <Text element="span" size="small" variation="subdued">State</Text>
              </td>
              <td style={{ padding: '6px 0' }}>
                <InputText
                  value={state}
                  onChange={setState}
                  placeholder="State..."
                  size="small"
                />
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 8px 6px 0' }}>
                <Text element="span" size="small" variation="subdued">Zip Code</Text>
              </td>
              <td style={{ padding: '6px 0' }}>
                <InputText
                  value={zipCode}
                  onChange={setZipCode}
                  placeholder="Zip code..."
                  size="small"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
          <Button type="tertiary" size="small" onClick={onClose}>
            Cancel
          </Button>
          <Button type="primary" size="small" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// Status tab configuration
const statusTabs = [
  { id: 'all', label: 'All Clients', filter: undefined },
  { id: 'lead', label: 'Leads', filter: 'LEAD' },
  { id: 'active', label: 'Active', filter: 'ACTIVE' },
  { id: 'inactive', label: 'Inactive', filter: 'INACTIVE' },
] as const

// Helper to get tab label with count
const getTabLabel = (tab: typeof statusTabs[number], counts: { all: number; lead: number; active: number; inactive: number }) => {
  const count = tab.id === 'all' ? counts.all : counts[tab.id as keyof typeof counts]
  return `${tab.label} (${count})`
}

// Create column helper for type-safe column definitions
const columnHelper = createColumnHelper<Client>()

// Status options for changing client status
const clientStatusOptions = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

const ClientListContent = () => {
  const { data, filterValues, total, isLoading, refetch } = useListContext<Client>()
  const { setFilters } = useListFilterContext()
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const showSearch = useBool(false)
  const [selectedRows, setSelectedRows] = useState<Client[]>([])
  const displayPopover = useBool(false)
  const displayButtonRef = useRef<HTMLButtonElement>(null)
  const [statusCounts, setStatusCounts] = useState({ all: 0, lead: 0, active: 0, inactive: 0 })

  // Modal and action states
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [clientsToDelete, setClientsToDelete] = useState<Client[]>([])
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState<string>('')
  const [clientsToUpdate, setClientsToUpdate] = useState<Client[]>([])

  // Inline edit states
  const [editingPhone, setEditingPhone] = useState<{ client: Client; position: { top: number; left: number } } | null>(null)
  const [editingAddress, setEditingAddress] = useState<{ client: Client; position: { top: number; left: number } } | null>(null)
  const [editingEmail, setEditingEmail] = useState<{ client: Client; position: { top: number; left: number } } | null>(null)
  const [editingStatus, setEditingStatus] = useState<{ client: Client; position: { top: number; left: number } } | null>(null)

  // React Admin hooks
  const [deleteMany] = useDeleteMany()
  const [update] = useUpdate()
  const refresh = useRefresh()
  const notify = useNotify()
  const navigate = useNavigate()

  // Fetch all clients to get accurate counts for tabs
  const { data: allClients } = useGetList<Client>('clients', {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: 'createdAt', order: 'DESC' },
  })

  // Calculate status counts when allClients changes
  useEffect(() => {
    if (allClients) {
      const counts = {
        all: allClients.length,
        lead: allClients.filter(c => c.status === 'LEAD').length,
        active: allClients.filter(c => c.status === 'ACTIVE').length,
        inactive: allClients.filter(c => c.status === 'INACTIVE').length,
      }
      setStatusCounts(counts)
    }
  }, [allClients])

  const hasFilters = Object.keys(filterValues || {}).some((key) => filterValues[key])
  const showNoFilterResults = data && data.length === 0 && hasFilters

  // Handle status tab change
  const handleTabChange = useCallback((tabIndex: number) => {
    setActiveTabIndex(tabIndex)
    const tab = statusTabs[tabIndex]
    setFilters({
      ...filterValues,
      status: tab?.filter,
    }, undefined)
  }, [filterValues, setFilters])

  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
    setFilters({
      ...filterValues,
      q: value || undefined,
    }, undefined)
  }, [filterValues, setFilters])

  // Clear row selection
  const handleClearSelection = () => {
    setSelectedRows([])
  }

  // Handle send email action
  const handleSendEmail = (clients: Client[]) => {
    const emails = clients.map(c => c.email).filter(Boolean).join(',')
    if (emails) {
      window.location.href = `mailto:${emails}`
    }
  }

  // Handle add tag action
  const handleAddTag = (_clients: Client[]) => {
    toast.info('Tag feature coming soon')
  }

  // Handle change status action
  const handleChangeStatus = (clients: Client[]) => {
    setClientsToUpdate(clients)
    setNewStatus('')
    setShowStatusModal(true)
  }

  const handleStatusConfirm = async () => {
    if (!newStatus || clientsToUpdate.length === 0) return

    try {
      for (const client of clientsToUpdate) {
        await update(
          'clients',
          { id: client.id, data: { status: newStatus }, previousData: client },
          { mutationMode: 'pessimistic' }
        )
      }

      toast.success(
        clientsToUpdate.length === 1
          ? `Client status updated to ${formatStatusLabel(newStatus)}`
          : `${clientsToUpdate.length} clients updated to ${formatStatusLabel(newStatus)}`
      )
      refresh()
      setSelectedRows([])
    } catch (_error) {
      notify('Failed to update status. Please try again.', { type: 'error' })
    } finally {
      setShowStatusModal(false)
      setClientsToUpdate([])
      setNewStatus('')
    }
  }

  // Handle create job action
  const handleCreateJob = (clients: Client[]) => {
    if (clients.length === 1) {
      navigate(`/jobs/create?clientId=${clients[0].id}`)
    } else {
      toast.info('Please select a single client to create a job')
    }
  }

  // Handle view client action
  const handleViewClient = (client: Client) => {
    navigate(`/clients/${client.id}`)
  }

  // Handle edit client action
  const handleEditClient = (client: Client) => {
    navigate(`/clients/${client.id}/edit`)
  }

  // Handle inline phone edit
  const handleEditPhone = useCallback((client: Client, position: { top: number; left: number }) => {
    setEditingPhone({ client, position })
  }, [])

  const handleSavePhone = async (phone: string) => {
    if (!editingPhone) return
    try {
      await update(
        'clients',
        { id: editingPhone.client.id, data: { phone: phone || null }, previousData: editingPhone.client },
        { mutationMode: 'pessimistic' }
      )
      toast.success('Phone number updated')
      refresh()
    } catch (_error) {
      notify('Failed to update phone number. Please try again.', { type: 'error' })
    } finally {
      setEditingPhone(null)
    }
  }

  // Handle inline email edit
  const handleEditEmail = useCallback((client: Client, position: { top: number; left: number }) => {
    setEditingEmail({ client, position })
  }, [])

  const handleSaveEmail = async (email: string) => {
    if (!editingEmail) return
    try {
      await update(
        'clients',
        { id: editingEmail.client.id, data: { email: email || null }, previousData: editingEmail.client },
        { mutationMode: 'pessimistic' }
      )
      toast.success('Email updated')
      refresh()
    } catch (_error) {
      notify('Failed to update email. Please try again.', { type: 'error' })
    } finally {
      setEditingEmail(null)
    }
  }

  // Handle inline status edit
  const handleEditStatus = useCallback((client: Client, position: { top: number; left: number }) => {
    setEditingStatus({ client, position })
  }, [])

  const handleSaveStatus = async (status: string) => {
    if (!editingStatus) return
    try {
      await update(
        'clients',
        { id: editingStatus.client.id, data: { status }, previousData: editingStatus.client },
        { mutationMode: 'pessimistic' }
      )
      toast.success(`Status updated to ${formatStatusLabel(status)}`)
      refresh()
    } catch (_error) {
      notify('Failed to update status. Please try again.', { type: 'error' })
    } finally {
      setEditingStatus(null)
    }
  }

  // Handle inline address edit
  const handleEditAddress = useCallback((client: Client, position: { top: number; left: number }) => {
    setEditingAddress({ client, position })
  }, [])

  const handleSaveAddress = async (address: Partial<Address>) => {
    if (!editingAddress) return
    try {
      const updatedAddress = {
        ...editingAddress.client.address,
        ...address,
      }
      await update(
        'clients',
        { id: editingAddress.client.id, data: { address: updatedAddress }, previousData: editingAddress.client },
        { mutationMode: 'pessimistic' }
      )
      toast.success('Address updated')
      refresh()
    } catch (_error) {
      notify('Failed to update address. Please try again.', { type: 'error' })
    } finally {
      setEditingAddress(null)
    }
  }

  // Handle delete action
  const handleDelete = (clients: Client[]) => {
    setClientsToDelete(clients)
    setConfirmDelete(true)
  }

  const handleDeleteConfirm = async () => {
    if (clientsToDelete.length === 0) return

    try {
      await deleteMany(
        'clients',
        { ids: clientsToDelete.map((c) => c.id) },
        { mutationMode: 'pessimistic' }
      )

      const clientText = clientsToDelete.length === 1 ? 'Client' : `${clientsToDelete.length} clients`
      toast.success(`${clientText} deleted`, {
        action: {
          label: 'Undo',
          onClick: () => {
            notify('Undo is not available for this action', { type: 'info' })
          },
        },
        duration: 5000,
      })

      refresh()
      setSelectedRows([])
    } catch (_error) {
      notify('Failed to delete. Please try again.', { type: 'error' })
    } finally {
      setConfirmDelete(false)
      setClientsToDelete([])
    }
  }

  // Column definitions using Atlantis DataTable pattern
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<any[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        size: 200,
        minSize: 200,
        cell: (info) => (
          <Link
            to={`/clients/${info.row.original.id}`}
            className="text-[var(--color-interactive)] hover:text-[var(--color-interactive--hover)] hover:underline font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        size: 200,
        minSize: 200,
        cell: (info) => {
          const email = info.getValue()
          const client = info.row.original
          return (
            <div
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                handleEditEmail(client, { top: e.clientY, left: e.clientX })
              }}
            >
              <Text element="span" variation="subdued">{email || '—'}</Text>
            </div>
          )
        },
      }),
      columnHelper.accessor('phone', {
        header: 'Phone',
        size: 140,
        minSize: 140,
        cell: (info) => {
          const client = info.row.original
          return (
            <div
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                handleEditPhone(client, { top: e.clientY, left: e.clientX })
              }}
            >
              <Text element="span" variation="subdued">{info.getValue() || '—'}</Text>
            </div>
          )
        },
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        size: 120,
        minSize: 120,
        cell: (info) => {
          const status = info.getValue()
          const client = info.row.original
          return (
            <div
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                handleEditStatus(client, { top: e.clientY, left: e.clientX })
              }}
            >
              <StatusLabel
                label={formatStatusLabel(status)}
                status={clientStatusToSemantic[status as keyof typeof clientStatusToSemantic] || 'inactive'}
              />
            </div>
          )
        },
      }),
      columnHelper.display({
        id: 'location',
        header: 'Location',
        size: 150,
        minSize: 150,
        cell: (info) => {
          const client = info.row.original
          return (
            <div
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                handleEditAddress(client, { top: e.clientY, left: e.clientX })
              }}
            >
              <LocationCell
                city={client.address?.city ?? undefined}
                state={client.address?.state ?? undefined}
              />
            </div>
          )
        },
      }),
    ],
    [handleEditEmail, handleEditPhone, handleEditStatus, handleEditAddress]
  )

  // Show skeleton while loading
  if (isLoading) {
    return <ClientListSkeleton />
  }

  // Render content for each tab (shared across all tabs)
  const renderTabContent = () => (
    <div className="flex flex-col gap-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        {/* Search - Click-to-expand */}
        {showSearch.value ? (
          <div className="flex items-center gap-2 w-80">
            <InputText
              autoFocus
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search by name, email, or phone..."
              prefix="search"
              size="small"
            />
            <Button
              type="tertiary"
              variation="subtle"
              size="small"
              icon="cross"
              ariaLabel="Close search"
              onClick={() => {
                showSearch.setFalse()
                handleSearch('')
              }}
            />
          </div>
        ) : (
          <Button
            type="tertiary"
            variation="subtle"
            size="small"
            icon="search"
            onClick={showSearch.setTrue}
          >
            Search
          </Button>
        )}

        {/* Sort Dropdown */}
        <SortDropdown options={clientSortOptions} defaultField="createdAt" />

        {/* Display Options */}
        <Button
          ref={displayButtonRef}
          type="tertiary"
          variation="subtle"
          size="small"
          icon="sliders"
          onClick={displayPopover.toggle}
        >
          Display
        </Button>
        <Popover
          open={displayPopover.value}
          onRequestClose={displayPopover.setFalse}
          attachTo={displayButtonRef}
          preferredPlacement="below-end"
          width={224}
        >
          <Popover.Content>
            <div className="space-y-2">
              <Text element="span" size="small" variation="subdued" className="font-medium uppercase tracking-wider">
                View Options
              </Text>
              <Text variation="subdued" size="small">
                Column visibility and grouping options coming soon.
              </Text>
            </div>
          </Popover.Content>
        </Popover>

        {/* Client Count - pushed to the right */}
        <div className="ml-auto">
          <Text element="span" variation="subdued" size="small">
            {total} {total === 1 ? 'client' : 'clients'}
          </Text>
        </div>
      </div>

      {/* Data Table - Right-click on Email, Phone, Status, or Location cells to edit */}
      <div className="flex-1 min-h-0">
        {showNoFilterResults ? (
          <NoFilterResults />
        ) : (
          <DataTable<Client>
            data={data || []}
            columns={columns}
            height="calc(100vh - 320px)"
            stickyHeader={true}
            rowSelection="multiple"
            onSelectionChanged={setSelectedRows}
            columnReordering
            pagination={{
              manualPagination: false,
              itemsPerPage: [25, 50, 100],
            }}
            sorting={{
              manualSorting: false,
            }}
          />
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <Tabs activeTab={activeTabIndex} onTabChange={handleTabChange}>
          {statusTabs.map((tab) => (
            <Tab key={tab.id} label={getTabLabel(tab, statusCounts)}>
              {/* Content is rendered below, outside the Tabs */}
            </Tab>
          ))}
        </Tabs>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <CreateButton label="Add Client" resource="clients" />
          <ExportButton />
        </div>
      </div>

      {/* Tab Content (shared across all tabs - filtering handled by API) */}
      {renderTabContent()}

      {/* Action Bar - appears when rows are selected */}
      <ClientActionBar
        selectedClients={selectedRows}
        onClearSelection={handleClearSelection}
        onSendEmail={handleSendEmail}
        onViewClient={handleViewClient}
        onEditClient={handleEditClient}
        onAddTag={handleAddTag}
        onChangeStatus={handleChangeStatus}
        onCreateJob={handleCreateJob}
        onDelete={handleDelete}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={confirmDelete}
        title="Delete Clients"
        message={
          clientsToDelete.length === 1
            ? `Are you sure you want to delete "${clientsToDelete[0]?.name}"? This action cannot be undone.`
            : `Are you sure you want to delete ${clientsToDelete.length} clients? This action cannot be undone.`
        }
        confirmLabel="Delete"
        variation="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setConfirmDelete(false)
          setClientsToDelete([])
        }}
        onRequestClose={() => {
          setConfirmDelete(false)
          setClientsToDelete([])
        }}
      />

      {/* Change Status Modal */}
      <Modal
        open={showStatusModal}
        onRequestClose={() => {
          setShowStatusModal(false)
          setClientsToUpdate([])
          setNewStatus('')
        }}
        title={`Change Status for ${clientsToUpdate.length} ${clientsToUpdate.length === 1 ? 'Client' : 'Clients'}`}
        size="small"
        primaryAction={{
          label: 'Update Status',
          onClick: handleStatusConfirm,
          disabled: !newStatus,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => {
            setShowStatusModal(false)
            setClientsToUpdate([])
            setNewStatus('')
          },
        }}
      >
        <div className="space-y-4">
          <Text variation="subdued">
            Select a new status for the selected {clientsToUpdate.length === 1 ? 'client' : 'clients'}.
          </Text>
          <Select
            value={newStatus}
            onChange={(value) => setNewStatus(String(value ?? ''))}
            placeholder="Select status"
            options={clientStatusOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
        </div>
      </Modal>

      {/* Inline Edit Popovers */}
      {editingPhone && (
        <EditPhonePopover
          client={editingPhone.client}
          position={editingPhone.position}
          onSave={handleSavePhone}
          onClose={() => setEditingPhone(null)}
        />
      )}

      {editingEmail && (
        <EditEmailPopover
          client={editingEmail.client}
          position={editingEmail.position}
          onSave={handleSaveEmail}
          onClose={() => setEditingEmail(null)}
        />
      )}

      {editingStatus && (
        <EditStatusPopover
          client={editingStatus.client}
          position={editingStatus.position}
          onSave={handleSaveStatus}
          onClose={() => setEditingStatus(null)}
        />
      )}

      {editingAddress && (
        <EditAddressPopover
          client={editingAddress.client}
          position={editingAddress.position}
          onSave={handleSaveAddress}
          onClose={() => setEditingAddress(null)}
        />
      )}
    </div>
  )
}

export const ClientList = () => {
  return (
    <List
      resource="clients"
      perPage={25}
      sort={{ field: 'createdAt', order: 'DESC' }}
    >
      <ClientListContent />
    </List>
  )
}
