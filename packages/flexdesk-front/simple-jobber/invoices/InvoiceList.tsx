import { useMemo, useState, useRef, useCallback } from 'react';
import { useListContext, useListFilterContext, useDeleteMany, useRefresh, useNotify } from 'ra-core';
import {
  List,
  CreateButton,
  ExportButton,
  ListPagination,
} from '@/components/admin';
import {
  Button as AtlantisButton,
  Text,
  InputText,
  Checkbox,
  StatusLabel,
  DataTable,
  createColumnHelper,
  Popover,
  Page,
  Tabs,
  Tab,
  useBool,
  ConfirmationModal,
  toast,
} from '../components/atlantis';
import { ReferenceCell, DateCell, CurrencyCell } from '../components/atlantis/table-cells';
import { invoiceStatusToSemantic, formatStatusLabel, type Invoice } from '../types';
import { EmptyInvoiceList, NoFilterResults, FilteredListSkeleton } from '../components';

// Status tab configuration
const statusTabs = [
  { id: 'all', label: 'All Invoices', filter: undefined },
  { id: 'draft', label: 'Draft', filter: 'DRAFT' },
  { id: 'sent', label: 'Sent', filter: 'SENT' },
  { id: 'paid', label: 'Paid', filter: 'PAID' },
  { id: 'overdue', label: 'Overdue', filter: 'OVERDUE' },
  { id: 'cancelled', label: 'Cancelled', filter: 'CANCELLED' },
] as const;

// Amount range options for filter
const amountRangeOptions = [
  { id: 'under_100', label: 'Under $100', min: 0, max: 100 },
  { id: '100_500', label: '$100 - $500', min: 100, max: 500 },
  { id: '500_1000', label: '$500 - $1,000', min: 500, max: 1000 },
  { id: 'over_1000', label: 'Over $1,000', min: 1000, max: Infinity },
];

// Column helper for type-safe column definitions
const columnHelper = createColumnHelper<Invoice>();

export const InvoiceList = () => {
  return (
    <List
      perPage={25}
      sort={{ field: 'createdAt', order: 'DESC' }}
      pagination={false}
      actions={false} // We'll handle actions in the content
      empty={<EmptyInvoiceList />}
    >
      <InvoiceListContent />
    </List>
  );
};

const InvoiceListContent = () => {
  const { data, filterValues, total, isLoading } = useListContext<Invoice>();
  const { setFilters } = useListFilterContext();
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const showSearch = useBool(false);
  const [selectedAmountRanges, setSelectedAmountRanges] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<Invoice[]>([]);
  const filterPopover = useBool(false);
  const displayPopover = useBool(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const displayButtonRef = useRef<HTMLButtonElement>(null);

  // Delete state
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [invoicesToDelete, setInvoicesToDelete] = useState<Invoice[]>([]);

  // React Admin hooks
  const [deleteMany] = useDeleteMany();
  const refresh = useRefresh();
  const notify = useNotify();

  const hasFilters = Object.keys(filterValues || {}).some((key) => filterValues[key]);
  const showNoFilterResults = data && data.length === 0 && hasFilters;
  const activeFilterCount = (filterValues?.amountRange ? 1 : 0) + (filterValues?.q ? 1 : 0);

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

  // Handle amount range filter
  const handleAmountRangeToggle = (rangeId: string) => {
    const newRanges = selectedAmountRanges.includes(rangeId)
      ? selectedAmountRanges.filter(r => r !== rangeId)
      : [...selectedAmountRanges, rangeId];

    setSelectedAmountRanges(newRanges);
    setFilters({
      ...filterValues,
      amountRange: newRanges.length > 0 ? newRanges : undefined,
    }, undefined);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedAmountRanges([]);
    setSearchQuery('');
    setFilters({
      status: filterValues?.status, // Keep status tab
    }, undefined);
  };

  // Handle delete action
  const handleDelete = (invoices: Invoice[]) => {
    setInvoicesToDelete(invoices);
    setConfirmDelete(true);
  };

  const handleDeleteConfirm = async () => {
    if (invoicesToDelete.length === 0) return;

    try {
      await deleteMany(
        'invoices',
        { ids: invoicesToDelete.map((i) => i.id) },
        { mutationMode: 'pessimistic' }
      );

      const invoiceText = invoicesToDelete.length === 1 ? 'Invoice' : `${invoicesToDelete.length} invoices`;
      toast.success(`${invoiceText} deleted`, {
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
      setInvoicesToDelete([]);
    }
  };

  // Column definitions for Atlantis DataTable
  const columns = useMemo(
    () => [
      columnHelper.accessor('invoiceNumber', {
        header: 'Invoice #',
        cell: (info) => (
          <Text element="span" className="font-medium">
            {info.getValue()}
          </Text>
        ),
        minSize: 120,
      }),
      columnHelper.accessor('customerId', {
        header: 'Client',
        cell: (info) => (
          <ReferenceCell
            id={info.getValue()}
            reference="clients"
            displayField="name"
            link="show"
          />
        ),
        minSize: 150,
      }),
      columnHelper.accessor('total', {
        header: 'Amount',
        cell: (info) => (
          <CurrencyCell value={info.getValue()} currency="USD" />
        ),
        minSize: 120,
      }),
      columnHelper.accessor('dueDate', {
        header: 'Due Date',
        cell: (info) => {
          const dueDate = info.getValue();
          const invoice = info.row.original;
          const isOverdue =
            invoice?.status === 'OVERDUE' ||
            (invoice?.status === 'SENT' && dueDate && new Date(dueDate) < new Date());

          return (
            <DateCell
              date={dueDate}
              showYear
              className={isOverdue ? 'text-[--color-critical--text] font-medium' : undefined}
            />
          );
        },
        minSize: 130,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue();
          return (
            <StatusLabel
              label={formatStatusLabel(status)}
              status={invoiceStatusToSemantic[status]}
            />
          );
        },
        minSize: 120,
      }),
      columnHelper.accessor('jobId', {
        header: 'Job',
        cell: (info) => (
          <ReferenceCell
            id={info.getValue()}
            reference="jobs"
            displayField="title"
            link="show"
          />
        ),
        minSize: 120,
      }),
    ],
    []
  );

  if (isLoading) {
    return <FilteredListSkeleton rows={10} columns={6} />;
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
              placeholder="Search by invoice #, client, or job..."
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
                  Amount Range
                </Text>
                <div className="space-y-2">
                  {amountRangeOptions.map((range) => (
                    <Checkbox
                      key={range.id}
                      id={range.id}
                      checked={selectedAmountRanges.includes(range.id)}
                      onChange={() => handleAmountRangeToggle(range.id)}
                      label={range.label}
                    />
                  ))}
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="border-t border-border pt-4">
                  <AtlantisButton
                    type="tertiary"
                    variation="subtle"
                    size="small"
                    fullWidth
                    onClick={clearFilters}
                  >
                    Clear filters
                  </AtlantisButton>
                </div>
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

        {/* Invoice Count - pushed to the right */}
        <div className="ml-auto">
          <Text element="span" variation="subdued" size="small">
            {total} {total === 1 ? 'invoice' : 'invoices'}
          </Text>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 min-h-0">
        {showNoFilterResults ? (
          <NoFilterResults />
        ) : (
          <>
            <DataTable<Invoice>
              data={data || []}
              columns={columns}
              height="calc(100vh - 320px)"
              stickyHeader
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
            <ListPagination className="justify-start mt-4" />
          </>
        )}
      </div>
    </div>
  );

  return (
    <Page title={false}>
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
          <CreateButton label="Add Invoice" />
          <ExportButton />
        </div>
      </div>

      {/* Tab Content (shared across all tabs - filtering handled by API) */}
      {renderTabContent()}

      {/* Action Bar - appears when rows are selected */}
      {selectedRows.length > 0 && (
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
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedRows.length} {selectedRows.length === 1 ? 'invoice' : 'invoices'} selected
              </span>
              <AtlantisButton
                type="tertiary"
                variation="subtle"
                size="small"
                icon="cross"
                ariaLabel="Clear selection"
                className="h-6 w-6"
                onClick={() => setSelectedRows([])}
              />
            </div>
            <div className="h-6 w-px bg-border" />
            <AtlantisButton
              type="primary"
              variation="destructive"
              size="small"
              icon="trash"
              onClick={() => handleDelete(selectedRows)}
            >
              Delete
            </AtlantisButton>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={confirmDelete}
        title="Delete Invoices"
        message={
          invoicesToDelete.length === 1
            ? `Are you sure you want to delete invoice #${invoicesToDelete[0]?.invoiceNumber}? This action cannot be undone.`
            : `Are you sure you want to delete ${invoicesToDelete.length} invoices? This action cannot be undone.`
        }
        confirmLabel="Delete"
        variation="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setConfirmDelete(false);
          setInvoicesToDelete([]);
        }}
        onRequestClose={() => {
          setConfirmDelete(false);
          setInvoicesToDelete([]);
        }}
      />
    </Page>
  );
};
