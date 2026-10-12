import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useGetList } from 'ra-core';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Text, Icon } from './atlantis';

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const isOpen = controlledOpen !== undefined ? controlledOpen : open;
  const setIsOpen = onOpenChange || setOpen;

  // Fetch data for search
  const { data: clients } = useGetList('clients', {
    pagination: { page: 1, perPage: 5 },
    filter: search ? { q: search } : {},
  });

  const { data: jobs } = useGetList('jobs', {
    pagination: { page: 1, perPage: 5 },
    filter: search ? { q: search } : {},
  });

  const { data: requests } = useGetList('requests', {
    pagination: { page: 1, perPage: 5 },
    filter: search ? { q: search } : {},
  });

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, setIsOpen]);

  const runCommand = useCallback(
    (command: () => void) => {
      setIsOpen(false);
      setSearch('');
      command();
    },
    [setIsOpen]
  );

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput
        placeholder="Search clients, jobs, requests..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => navigate('/jobs/create'))}>
            <Icon name="add" size="small" className="mr-2" />
            <span>New Job</span>
            <CommandShortcut>Create</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/clients/create'))}>
            <Icon name="add" size="small" className="mr-2" />
            <span>New Client</span>
            <CommandShortcut>Create</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
            <Icon name="home" size="small" className="mr-2" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/clients'))}>
            <Icon name="clients" size="small" className="mr-2" />
            <span>Clients</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/jobs'))}>
            <Icon name="work" size="small" className="mr-2" />
            <span>Jobs</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/requests'))}>
            <Icon name="inbox" size="small" className="mr-2" />
            <span>Requests</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/schedule'))}>
            <Icon name="calendar" size="small" className="mr-2" />
            <span>Schedule</span>
          </CommandItem>
        </CommandGroup>

        {/* Search Results */}
        {search && (
          <>
            {clients && clients.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Clients">
                  {clients.map((client) => (
                    <CommandItem
                      key={client.id}
                      onSelect={() =>
                        runCommand(() => navigate(`/clients/${client.id}/show`))
                      }
                    >
                      <Icon name="clients" size="small" className="mr-2 text-[--color-text--secondary]" />
                      <span>{client.name}</span>
                      {client.email && (
                        <Text element="span" variation="subdued" size="small" className="ml-2">
                          {client.email}
                        </Text>
                      )}
                      <Icon name="arrowRight" size="small" className="ml-auto text-[--color-text--secondary]" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {jobs && jobs.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Jobs">
                  {jobs.map((job) => (
                    <CommandItem
                      key={job.id}
                      onSelect={() =>
                        runCommand(() => navigate(`/jobs/${job.id}/show`))
                      }
                    >
                      <Icon name="work" size="small" className="mr-2 text-[--color-text--secondary]" />
                      <span>{job.title}</span>
                      <Text element="span" variation="subdued" size="small" className="ml-2">
                        {job.status}
                      </Text>
                      <Icon name="arrowRight" size="small" className="ml-auto text-[--color-text--secondary]" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {requests && requests.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Requests">
                  {requests.map((request) => (
                    <CommandItem
                      key={request.id}
                      onSelect={() =>
                        runCommand(() => navigate(`/requests/${request.id}/show`))
                      }
                    >
                      <Icon name="inbox" size="small" className="mr-2 text-[--color-text--secondary]" />
                      <span>{request.title}</span>
                      <Text element="span" variation="subdued" size="small" className="ml-2">
                        {request.status}
                      </Text>
                      <Icon name="arrowRight" size="small" className="ml-auto text-[--color-text--secondary]" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

// Hook to use the command palette anywhere
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  const openPalette = useCallback(() => setOpen(true), []);
  const closePalette = useCallback(() => setOpen(false), []);

  return {
    open,
    setOpen,
    toggle,
    openPalette,
    closePalette,
  };
}
