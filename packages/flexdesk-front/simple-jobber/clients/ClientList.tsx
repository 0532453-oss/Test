import { useMemo, useState, useRef, useCallback } from 'react';
import { useListContext, useListFilterContext, useDeleteMany, useUpdate, useRefresh, useNotify } from 'ra-core';
import { useNavigate } from 'react-router';
import {
  List,
  CreateButton,
  ExportButton,
} from '@/components/admin';
import {
  Button as AtlantisButton,
  Text,
  InputText,
  StatusLabel,
  DataTable,
  createColumnHelper,
  Popover,
  Page,
  Tabs,
  Tab,
  useBool,
  FormatEmail,
  toast,
  ConfirmationModal,
  Modal,
  Select,
  type ColumnDef,
  type CellContext,
} from '../components/atlantis';
import { LocationCell } from '../components/atlantis/table-cells';
import { type Client, clientStatusToSemantic, formatStatusLabel } from '../types';
import { SortDropdown, clientSortOptions, EmptyClientList, NoFilterResults, ClientListSkeleton } from '../components';
import { ClientActionBar } from './ClientActionBar';

// Status tab configuration
const statusTabs = [
  { id: 'all', label: 'All Clients', filter: undefined },
  { id: 'lead', label: 'Leads', filter: 'LEAD' },
  { id: 'active', label: 'Active', filter: 'ACTIVE' },
  { id: 'inactive', label: 'Inactive', filter: 'INACTIVE' },
] as const;

// Create column helper for type-safe column definitions
const columnHelper = createColumnHelper<Client>();

// Status options for changing client status
const clientStatusOptions = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const ClientListContent = () => {
  const { data, filterValues, total, isLoading } = useListContext<Client>();
  const { setFilters } = useListFilterContext();
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const showSearch = useBool(false);
  const [selectedRows, setSelectedRows] = useState<Client[]>([]);
  const displayPopover = useBool(false);
  const displayButtonRef = useRef<HTMLButtonElement>(null);

  // Modal and action states
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [clientsToDelete, setClientsToDelete] = useState<Client[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [clientsToUpdate, setClientsToUpdate] = useState<Client[]>([]);

  // React Admin hooks
  const [deleteMany] = useDeleteMany();
  const [update] = useUpdate();
  const refresh = useRefresh();
  const notify = useNotify();
  const navigate = useNavigate();

  const hasFilters = Object.keys(filterValues || {}).some((key) => filterValues[key]);
  const showNoFilterResults = data && data.length === 0 && hasFilters;

  // Handle status tab change
  const handleTabChange = useCallback((tabIndex: number) => {
    setActiveTabIndex(tabIndex);
    const tab = statusTabs[tabIndex];
    setFilters({
      ...filterValues,
      status: tab?.filter,
    }, undefined);
  }, [filterValues, setFilters]);

  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setFilters({
      ...filterValues,
      q: value || undefined,
    }, undefined);
  }, [filterValues, setFilters]);

  // Clear row selection
  const handleClearSelection = () => {
    setSelectedRows([]);
  };

  // Handle send email action
  const handleSendEmail = (clients: Client[]) => {
    const emails = clients.map(c => c.email).filter(Boolean).join(',');
    if (emails) {
      window.location.href = `mailto:${emails}`;
    }
  };

  // Handle add tag action
  const handleAddTag = (clients: Client[]) => {
    // TODO: Implement tag modal
    toast.info('Tag feature coming soon');
  };

  // Handle change status action
  const handleChangeStatus = (clients: Client[]) => {
    setClientsToUpdate(clients);
    setNewStatus('');
    setShowStatusModal(true);
  };

  const handleStatusConfirm = async () => {
    if (!newStatus || clientsToUpdate.length === 0) return;

    try {
      for (const client of clientsToUpdate) {
        await update(
          'clients',
          { id: client.id, data: { status: newStatus }, previousData: client },
          { mutationMode: 'pessimistic' }
        );
      }

      toast.success(
        clientsToUpdate.length === 1
          ? `Client status updated to ${formatStatusLabel(newStatus)}`
          : `${clientsToUpdate.length} clients updated to ${formatStatusLabel(newStatus)}`
      );
      refresh();
      setSelectedRows([]);
    } catch (error) {
      notify('Failed to update status. Please try again.', { type: 'error' });
    } finally {
      setShowStatusModal(false);
      setClientsToUpdate([]);
      setNewStatus('');
    }
  };

  // Handle create job action
  const handleCreateJob = (clients: Client[]) => {
    if (clients.length === 1) {
      navigate(`/jobs/create?clientId=${clients[0].id}`);
    } else {
      toast.info('Please select a single client to create a job');
    }
  };

  // Handle delete action
  const handleDelete = (clients: Client[]) => {
    setClientsToDelete(clients);
    setConfirmDelete(true);
  };

  const handleDeleteConfirm = async () => {
    if (clientsToDelete.length === 0) return;

    try {
      await deleteMany(
        'clients',
        { ids: clientsToDelete.map((c) => c.id) },
        { mutationMode: 'pessimistic' }
      );

      const clientText = clientsToDelete.length === 1 ? 'Client' : `${clientsToDelete.length} clients`;
      toast.success(`${clientText} deleted`, {
        action: {
          label: 'Undo',
          onClick: () => {
            notify('Undo is not available for this action', { type: 'info' });
          },
        },
        duration: 5000,
      });

      refresh();
      setSelectedRows([]);
    } catch (error) {
      notify('Failed to delete. Please try again.', { type: 'error' });
    } finally {
      setConfirmDelete(false);
      setClientsToDelete([]);
    }
  };

  // Column definitions using Atlantis DataTable pattern
  const columns = useMemo<ColumnDef<Client, unknown>[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        size: 200,
        minSize: 200,
        cell: (info: CellContext<Client, string>) => (
          <Text element="span">{info.getValue()}</Text>
        ),
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        size: 200,
        minSize: 200,
        cell: (info: CellContext<Client, string | null | undefined>) => {
          const email = info.getValue();
          return email ? <FormatEmail email={email} /> : null;
        },
      }),
      columnHelper.accessor('phone', {
        header: 'Phone',
        size: 140,
        minSize: 140,
        cell: (info: CellContext<Client, string | null | undefined>) => (
          <Text element="span" variation="subdued">{info.getValue() ?? ''}</Text>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        size: 120,
        minSize: 120,
        cell: (info: CellContext<Client, string>) => {
          const status = info.getValue();
          return (
            <StatusLabel
              label={formatStatusLabel(status)}
              status={clientStatusToSemantic[status as keyof typeof clientStatusToSemantic] || 'inactive'}
            />
          );
        },
      }),
      columnHelper.display({
        id: 'location',
        header: 'Location',
        size: 150,
        minSize: 150,
        cell: (info: CellContext<Client, unknown>) => {
          const client = info.row.original;
          return (
            <LocationCell
              city={client.city ?? undefined}
              state={client.state ?? undefined}
            />
          );
        },
      }),
    ],
    []
  );

  // Show skeleton while loading
  if (isLoading) {
    return <ClientListSkeleton />;
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
            <AtlantisButton
              type="tertiary"
              variation="subtle"
              size="small"
              icon="cross"
              ariaLabel="Close search"
              onClick={() => {
                showSearch.setFalse();
                handleSearch('');
              }}
            />
          </div>
        ) : (
          <AtlantisButton
            type="tertiary"
            variation="subtle"
            size="small"
            icon="search"
            onClick={showSearch.setTrue}
          >
            Search
          </AtlantisButton>
        )}

        {/* Sort Dropdown */}
        <SortDropdown options={clientSortOptions} defaultField="createdAt" />

        {/* Display Options */}
        <AtlantisButton
          ref={displayButtonRef}
          type="tertiary"
          variation="subtle"
          size="small"
          icon="sliders"
          onClick={displayPopover.toggle}
        >
          Display
        </AtlantisButton>
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

      {/* Data Table */}
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
  );

  return (
    <Page
      title={false}
      primaryAction={{
        label: 'Add Client',
        icon: 'add',
        onClick: () => {
          // CreateButton handles this via React Admin, but we can add direct navigation if needed
        },
      }}
    >
      {/* Header Actions - Override with admin buttons */}
      <div className="flex items-center justify-between -mt-2 mb-4">
        {/* Status Tabs */}
        <Tabs activeTab={activeTabIndex} onTabChange={handleTabChange}>
          {statusTabs.map((tab) => (
            <Tab key={tab.id} label={tab.label}>
              {/* Content is rendered below, outside the Tabs */}
            </Tab>
          ))}
        </Tabs>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <CreateButton label="Add Client" />
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
          setConfirmDelete(false);
          setClientsToDelete([]);
        }}
        onRequestClose={() => {
          setConfirmDelete(false);
          setClientsToDelete([]);
        }}
      />

      {/* Change Status Modal */}
      <Modal
        open={showStatusModal}
        onRequestClose={() => {
          setShowStatusModal(false);
          setClientsToUpdate([]);
          setNewStatus('');
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
            setShowStatusModal(false);
            setClientsToUpdate([]);
            setNewStatus('');
          },
        }}
      >
        <div className="space-y-4">
          <Text variation="subdued">
            Select a new status for the selected {clientsToUpdate.length === 1 ? 'client' : 'clients'}.
          </Text>
          <Select
            value={newStatus}
            onChange={(value) => setNewStatus(value)}
            placeholder="Select status"
          >
            {clientStatusOptions.map((option) => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        </div>
      </Modal>
    </Page>
  );
};

export const ClientList = () => {
  return (
    <List
      perPage={25}
      sort={{ field: 'createdAt', order: 'DESC' }}
      pagination={false}
      actions={false}
      empty={<EmptyClientList />}
    >
      <ClientListContent />
    </List>
  );
};
