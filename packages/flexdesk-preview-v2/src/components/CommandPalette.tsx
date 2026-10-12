import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useGetList } from 'ra-core'
import { Modal, Text, Icon, InputText } from '@/atlantis'
import type { IconNames } from '@/atlantis'

interface CommandPaletteProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface CommandItemData {
  id: string
  label: string
  icon: string
  description?: string
  group: string
  onSelect: () => void
}

export function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const isOpen = controlledOpen !== undefined ? controlledOpen : open
  const setIsOpen = onOpenChange || setOpen

  // Fetch data for search
  const { data: clients } = useGetList('clients', {
    pagination: { page: 1, perPage: 5 },
    filter: search ? { q: search } : {},
  })

  const { data: jobs } = useGetList('jobs', {
    pagination: { page: 1, perPage: 5 },
    filter: search ? { q: search } : {},
  })

  const { data: requests } = useGetList('requests', {
    pagination: { page: 1, perPage: 5 },
    filter: search ? { q: search } : {},
  })

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen(!isOpen)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [isOpen, setIsOpen])

  const runCommand = useCallback(
    (command: () => void) => {
      setIsOpen(false)
      setSearch('')
      command()
    },
    [setIsOpen]
  )

  // Build items list
  const items = useMemo(() => {
    const result: CommandItemData[] = []

    // Quick Actions
    result.push({
      id: 'new-job',
      label: 'New Job',
      icon: 'add',
      description: 'Create',
      group: 'Quick Actions',
      onSelect: () => runCommand(() => navigate('/jobs/create')),
    })
    result.push({
      id: 'new-client',
      label: 'New Client',
      icon: 'add',
      description: 'Create',
      group: 'Quick Actions',
      onSelect: () => runCommand(() => navigate('/clients/create')),
    })

    // Navigation
    result.push(
      { id: 'nav-dashboard', label: 'Dashboard', icon: 'home', group: 'Navigation', onSelect: () => runCommand(() => navigate('/')) },
      { id: 'nav-clients', label: 'Clients', icon: 'clients', group: 'Navigation', onSelect: () => runCommand(() => navigate('/clients')) },
      { id: 'nav-jobs', label: 'Jobs', icon: 'work', group: 'Navigation', onSelect: () => runCommand(() => navigate('/jobs')) },
      { id: 'nav-requests', label: 'Requests', icon: 'inbox', group: 'Navigation', onSelect: () => runCommand(() => navigate('/requests')) },
      { id: 'nav-schedule', label: 'Schedule', icon: 'calendar', group: 'Navigation', onSelect: () => runCommand(() => navigate('/schedule')) },
    )

    // Search results
    if (search) {
      clients?.forEach((client) => {
        result.push({
          id: `client-${client.id}`,
          label: client.name,
          icon: 'clients',
          description: client.email || undefined,
          group: 'Clients',
          onSelect: () => runCommand(() => navigate(`/clients/${client.id}/show`)),
        })
      })

      jobs?.forEach((job) => {
        result.push({
          id: `job-${job.id}`,
          label: job.title,
          icon: 'work',
          description: job.status,
          group: 'Jobs',
          onSelect: () => runCommand(() => navigate(`/jobs/${job.id}/show`)),
        })
      })

      requests?.forEach((request) => {
        result.push({
          id: `request-${request.id}`,
          label: request.title,
          icon: 'inbox',
          description: request.status,
          group: 'Requests',
          onSelect: () => runCommand(() => navigate(`/requests/${request.id}/show`)),
        })
      })
    }

    return result
  }, [search, clients, jobs, requests, navigate, runCommand])

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!search) return items
    const lower = search.toLowerCase()
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        item.description?.toLowerCase().includes(lower) ||
        item.group.toLowerCase().includes(lower)
    )
  }, [items, search])

  // Group items
  const groupedItems = useMemo(() => {
    const groups: Record<string, CommandItemData[]> = {}
    for (const item of filteredItems) {
      if (!groups[item.group]) groups[item.group] = []
      groups[item.group].push(item)
    }
    return groups
  }, [filteredItems])

  return (
    <Modal
      open={isOpen}
      onRequestClose={() => {
        setIsOpen(false)
        setSearch('')
      }}
      title="Command Palette"
      size="small"
    >
      <div className="flex flex-col gap-3">
        <InputText
          autoFocus
          placeholder="Search clients, jobs, requests..."
          value={search}
          onChange={setSearch}
          prefix="search"
          size="small"
        />

        <div className="max-h-80 overflow-y-auto">
          {filteredItems.length === 0 && (
            <div className="py-6 text-center">
              <Text variation="subdued" size="small">No results found.</Text>
            </div>
          )}

          {Object.entries(groupedItems).map(([group, groupItems]) => (
            <div key={group} className="mb-2">
              <div className="px-2 py-1.5">
                <Text element="span" variation="subdued" size="small" className="font-medium text-xs uppercase tracking-wider">
                  {group}
                </Text>
              </div>
              {groupItems.map((item) => (
                <button
                  key={item.id}
                  onClick={item.onSelect}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-[var(--color-surface--hover)] transition-colors"
                >
                  <Icon name={item.icon as IconNames} size="small" className="text-[var(--color-text--secondary)]" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.description && (
                    <Text element="span" variation="subdued" size="small">
                      {item.description}
                    </Text>
                  )}
                  <Icon name="arrowRight" size="small" className="text-[var(--color-text--secondary)]" />
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="border-t pt-2 flex items-center justify-between">
          <Text element="span" variation="subdued" size="small">
            Tip: Press <kbd className="rounded border px-1.5 py-0.5 text-xs font-mono">Ctrl+K</kbd> to toggle
          </Text>
        </div>
      </div>
    </Modal>
  )
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  const toggle = useCallback(() => setOpen((prev) => !prev), [])
  const openPalette = useCallback(() => setOpen(true), [])
  const closePalette = useCallback(() => setOpen(false), [])

  return {
    open,
    setOpen,
    toggle,
    openPalette,
    closePalette,
  }
}
