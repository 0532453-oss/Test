import { useMemo, useState, useRef, useCallback } from 'react';
import { useListContext, useListFilterContext, useGetList, useDeleteMany, useUpdate, useRefresh, useNotify } from 'ra-core';
import {
  List,
  CreateButton,
  ExportButton,
} from '@/components/admin';
import {
  Button as AtlantisButton,
  Text,
  InputText,
  Checkbox,
  StatusLabel,
  StatusIndicator,
  DataTable,
  createColumnHelper,
  Popover,
  Page,
  Tabs,
  Tab,
  useBool,
  Heading,
  Icon,
  Modal,
  Select,
  ConfirmationModal,
  toast,
  type ColumnDef,
  type CellContext,
} from '../components/atlantis';
import { ReferenceCell, DateCell } from '../components/atlantis/table-cells';
import {
  jobStatusToSemantic,
  jobPriorityToSemantic,
  formatStatusLabel,
  type Job,
} from '../types';
import { EmptyJobList, NoFilterResults, FilteredListSkeleton } from '../components';
import { JobActionBar } from './JobActionBar';
import { RescheduleModal } from './RescheduleModal';
import { useJobQuickActions } from './JobQuickActionsSheet';
import { cn } from '@/lib/utils';

// Status tab configuration
const statusTabs = [
  { id: 'all', label: 'All Jobs', filter: undefined },
  { id: 'scheduled', label: 'Scheduled', filter: 'SCHEDULED' },
  { id: 'in_progress', label: 'In Progress', filter: 'IN_PROGRESS' },
  { id: 'completed', label: 'Completed', filter: 'COMPLETED' },
] as const;

// Priority options for filter
const priorityOptions = [
  { id: 'URGENT', label: 'Urgent' },
  { id: 'HIGH', label: 'High' },
  { id: 'MEDIUM', label: 'Medium' },
  { id: 'LOW', label: 'Low' },
];

// Job status options for changing status
const jobStatusOptions = [
  { value: 'UNSCHEDULED', label: 'Unscheduled' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'EN_ROUTE', label: 'En Route' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

// Create column helper for type-safe column definitions
const columnHelper = createColumnHelper<Job>();

export const JobList = () => {
  return (
    <List
      perPage={25}
      sort={{ field: 'scheduledStartAt', order: 'ASC' }}
      pagination={false}
      actions={false} // We'll handle actions in the content
      empty={<EmptyJobList />}
    >
      <JobListContent />
    </List>
  );
};

const JobListContent = () => {
  const { data, filterValues, total, isLoading } = useListContext<Job>();
  const { setFilters } = useListFilterContext();
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const showSearch = useBool(false);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<Job[]>([]);
  const filterPopover = useBool(false);
  const displayPopover = useBool(false);
  const rescheduleModal = useBool(false);
  const [rescheduleJobs, setRescheduleJobs] = useState<Job[]>([]);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const displayButtonRef = useRef<HTMLButtonElement>(null);

  // Status change modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [jobsToUpdate, setJobsToUpdate] = useState<Job[]>([]);

  // Delete confirmation state
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [jobsToDelete, setJobsToDelete] = useState<Job[]>([]);

  // React Admin hooks
  const [deleteMany] = useDeleteMany();
  const [update] = useUpdate();
  const refresh = useRefresh();
  const notify = useNotify();

  const jobQuickActions = useJobQuickActions({
    onReschedule: (job) => handleReschedule([job]),
  });

  // Fetch all jobs (unfiltered) for status counts
  const { data: allJobs } = useGetList<Job>('jobs', {
    sort: { field: 'scheduledStartAt', order: 'ASC' },
    pagination: { page: 1, perPage: 100 },
  });

  const jobStatusCounts = useMemo(() => {
    if (!allJobs) return { completed: 0, scheduled: 0, inProgress: 0 };
    return {
      completed: allJobs.filter((job) => job.status === 'COMPLETED').length,
      scheduled: allJobs.filter((job) => job.status === 'SCHEDULED').length,
      inProgress: allJobs.filter((job) => job.status === 'IN_PROGRESS').length,
    };
  }, [allJobs]);

  const hasFilters = Object.keys(filterValues || {}).some((key) => filterValues[key]);
  const showNoFilterResults = data && data.length === 0 && hasFilters;
  const activeFilterCount = (filterValues?.priority ? 1 : 0) + (filterValues?.q ? 1 : 0);

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

  // Handle reschedule action
  const handleReschedule = (jobs: Job[]) => {
    setRescheduleJobs(jobs);
    rescheduleModal.setTrue();
  };

  const handleRescheduleClose = () => {
    rescheduleModal.setFalse();
    setRescheduleJobs([]);
    setSelectedRows([]);
  };

  // Handle priority filter
  const handlePriorityToggle = (priorityId: string) => {
    const newPriorities = selectedPriorities.includes(priorityId)
      ? selectedPriorities.filter(p => p !== priorityId)
      : [...selectedPriorities, priorityId];

    setSelectedPriorities(newPriorities);
    setFilters({
      ...filterValues,
      priority: newPriorities.length > 0 ? newPriorities : undefined,
    }, undefined);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedPriorities([]);
    setSearchQuery('');
    setFilters({
      status: filterValues?.status, // Keep status tab
    }, undefined);
  };

  // Handle change status action
  const handleChangeStatus = (jobs: Job[]) => {
    setJobsToUpdate(jobs);
    setNewStatus('');
    setShowStatusModal(true);
  };

  const handleStatusConfirm = async () => {
    if (!newStatus || jobsToUpdate.length === 0) return;

    try {
      for (const job of jobsToUpdate) {
        await update(
          'jobs',
          { id: job.id, data: { status: newStatus }, previousData: job },
          { mutationMode: 'pessimistic' }
        );
      }

      toast.success(
        jobsToUpdate.length === 1
          ? `Job status updated to ${formatStatusLabel(newStatus)}`
          : `${jobsToUpdate.length} jobs updated to ${formatStatusLabel(newStatus)}`
      );
      refresh();
      setSelectedRows([]);
    } catch (error) {
      notify('Failed to update status. Please try again.', { type: 'error' });
    } finally {
      setShowStatusModal(false);
      setJobsToUpdate([]);
      setNewStatus('');
    }
  };

  // Handle delete action
  const handleDelete = (jobs: Job[]) => {
    setJobsToDelete(jobs);
    setConfirmDelete(true);
  };

  const handleDeleteConfirm = async () => {
    if (jobsToDelete.length === 0) return;

    try {
      await deleteMany(
        'jobs',
        { ids: jobsToDelete.map((j) => j.id) },
        { mutationMode: 'pessimistic' }
      );

      const jobText = jobsToDelete.length === 1 ? 'Job' : `${jobsToDelete.length} jobs`;
      toast.success(`${jobText} deleted`, {
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
      setJobsToDelete([]);
    }
  };

  // Column definitions using Atlantis DataTable pattern
  const columns = useMemo<ColumnDef<Job, unknown>[]>(
    () => [
      columnHelper.accessor('title', {
        header: 'Job',
        size: 200,
        minSize: 200,
        cell: (info: CellContext<Job, string>) => (
          <span className="font-medium">{info.getValue()}</span>
        ),
      }),
      columnHelper.display({
        id: 'client',
        header: 'Client',
        size: 150,
        minSize: 150,
        cell: (info: CellContext<Job, unknown>) => (
          <ReferenceCell
            id={info.row.original.clientId}
            reference="clients"
            displayField="name"
            link="show"
          />
        ),
      }),
      columnHelper.accessor('scheduledStartAt' as keyof Job, {
        header: 'Scheduled',
        size: 130,
        minSize: 130,
        cell: (info: CellContext<Job, Date | string | null | undefined>) => (
          <DateCell date={info.getValue()} showYear={false} showTime />
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        size: 130,
        minSize: 130,
        cell: (info: CellContext<Job, string>) => {
          const status = info.getValue();
          return (
            <StatusIndicator
              label={formatStatusLabel(status)}
              status={jobStatusToSemantic[status as keyof typeof jobStatusToSemantic] || 'inactive'}
            />
          );
        },
      }),
      columnHelper.accessor('priority', {
        header: 'Priority',
        size: 100,
        minSize: 100,
        cell: (info: CellContext<Job, string>) => {
          const priority = info.getValue();
          return (
            <StatusIndicator
              label={formatStatusLabel(priority)}
              status={jobPriorityToSemantic[priority as keyof typeof jobPriorityToSemantic] || 'inactive'}
            />
          );
        },
      }),
      columnHelper.display({
        id: 'assignedTo',
        header: 'Assigned To',
        size: 130,
        minSize: 130,
        cell: (info: CellContext<Job, unknown>) => (
          <ReferenceCell
            id={info.row.original.assignedToId}
            reference="teamMembers"
            displayField="name"
            link={false}
          />
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        size: 48,
        minSize: 48,
        cell: (info: CellContext<Job, unknown>) => (
          <AtlantisButton
            type="tertiary"
            variation="subtle"
            size="small"
            icon="more"
            ariaLabel={`Actions for ${info.row.original.title}`}
            onClick={() => jobQuickActions.open(info.row.original)}
          />
        ),
      }),
    ],
    [jobQuickActions]
  );

  if (isLoading) {
    return <FilteredListSkeleton rows={10} columns={6} />;
  }

  // Render content for each tab (shared across all tabs - filtering handled by API)
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
              placeholder="Search by customer, address, or job ID..."
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

        {/* Filter Button */}
        <AtlantisButton
          ref={filterButtonRef}
          type="tertiary"
          variation="subtle"
          size="small"
          icon="filter"
          className={cn(
            activeFilterCount > 0 ? 'text-[--color-interactive]' : ''
          )}
          onClick={filterPopover.toggle}
        >
          Filter
          {activeFilterCount > 0 && (
            <Text element="span" size="small" className="ml-1 rounded-full bg-[--color-interactive--subtle] px-1.5 py-0.5 font-medium text-[--color-interactive]">
              {activeFilterCount}
            </Text>
          )}
        </AtlantisButton>
        <Popover
          open={filterPopover.value}
          onRequestClose={filterPopover.setFalse}
          attachTo={filterButtonRef}
          preferredPlacement="below-start"
          width={224}
        >
          <Popover.Content>
            <div className="space-y-4">
              <div className="space-y-2">
                <Text element="span" size="small" variation="subdued" className="font-medium uppercase tracking-wider">
                  Priority
                </Text>
                <div className="space-y-2">
                  {priorityOptions.map((priority) => (
                    <Checkbox
                      key={priority.id}
                      id={priority.id}
                      checked={selectedPriorities.includes(priority.id)}
                      onChange={() => handlePriorityToggle(priority.id)}
                      label={priority.label}
                    />
                  ))}
                </div>
              </div>

              {activeFilterCount > 0 && (
                <AtlantisButton
                  type="tertiary"
                  variation="subtle"
                  size="small"
                  fullWidth
                  onClick={clearFilters}
                >
                  Clear filters
                </AtlantisButton>
              )}
            </div>
          </Popover.Content>
        </Popover>

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

        {/* Job Count - pushed to the right */}
        <div className="ml-auto">
          <Text element="span" variation="subdued" size="small">
            {total} {total === 1 ? 'job' : 'jobs'}
          </Text>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 min-h-0">
        {showNoFilterResults ? (
          <NoFilterResults />
        ) : (
          <DataTable<Job>
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
    <Page title={false}>
      {/* Header Actions with Status Tabs */}
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
          <CreateButton />
          <ExportButton />
        </div>
      </div>

      {/* Job Status Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="cursor-pointer rounded-lg border border-solid border-[#DADFE2] bg-white px-4 py-3 transition-all duration-200 hover:border-[#7C8A94] hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <Text variation="subdued" size="small">Completed</Text>
            <Icon name="checkmark" color="green" size="small" />
          </div>
          <Heading level={2}>{jobStatusCounts.completed}</Heading>
          <Text variation="subdued" size="small">Jobs completed</Text>
        </div>
        <div className="cursor-pointer rounded-lg border border-solid border-[#DADFE2] bg-white px-4 py-3 transition-all duration-200 hover:border-[#7C8A94] hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <Text variation="subdued" size="small">Scheduled</Text>
            <Icon name="calendar" color="blue" size="small" />
          </div>
          <Heading level={2}>{jobStatusCounts.scheduled}</Heading>
          <Text variation="subdued" size="small">Jobs scheduled</Text>
        </div>
        <div className="cursor-pointer rounded-lg border border-solid border-[#DADFE2] bg-white px-4 py-3 transition-all duration-200 hover:border-[#7C8A94] hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <Text variation="subdued" size="small">In Progress</Text>
            <Icon name="timer" color="orange" size="small" />
          </div>
          <Heading level={2}>{jobStatusCounts.inProgress}</Heading>
          <Text variation="subdued" size="small">Jobs in progress</Text>
        </div>
      </div>

      {/* Tab Content (shared across all tabs - filtering handled by API) */}
      {renderTabContent()}

      {/* Action Bar - appears when rows are selected */}
      <JobActionBar
        selectedJobs={selectedRows}
        onClearSelection={handleClearSelection}
        onAssign={(jobs) => toast.info('Assign feature coming soon')}
        onChangeStatus={handleChangeStatus}
        onReschedule={handleReschedule}
        onDelete={handleDelete}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        open={rescheduleModal.value}
        onClose={handleRescheduleClose}
        jobs={rescheduleJobs}
      />

      {/* Job Quick Actions BottomSheet */}
      {jobQuickActions.sheet}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={confirmDelete}
        title="Delete Jobs"
        message={
          jobsToDelete.length === 1
            ? `Are you sure you want to delete "${jobsToDelete[0]?.title}"? This action cannot be undone.`
            : `Are you sure you want to delete ${jobsToDelete.length} jobs? This action cannot be undone.`
        }
        confirmLabel="Delete"
        variation="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setConfirmDelete(false);
          setJobsToDelete([]);
        }}
        onRequestClose={() => {
          setConfirmDelete(false);
          setJobsToDelete([]);
        }}
      />

      {/* Change Status Modal */}
      <Modal
        open={showStatusModal}
        onRequestClose={() => {
          setShowStatusModal(false);
          setJobsToUpdate([]);
          setNewStatus('');
        }}
        title={`Change Status for ${jobsToUpdate.length} ${jobsToUpdate.length === 1 ? 'Job' : 'Jobs'}`}
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
            setJobsToUpdate([]);
            setNewStatus('');
          },
        }}
      >
        <div className="space-y-4">
          <Text variation="subdued">
            Select a new status for the selected {jobsToUpdate.length === 1 ? 'job' : 'jobs'}.
          </Text>
          <Select
            value={newStatus}
            onChange={(value) => setNewStatus(value)}
            placeholder="Select status"
          >
            {jobStatusOptions.map((option) => (
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
