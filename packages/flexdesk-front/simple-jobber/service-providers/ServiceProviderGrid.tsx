import { useMemo, useState, useCallback } from 'react';
import {
  Heading,
  Text,
  StatusLabel,
  DataTable,
  createColumnHelper,
  type ColumnDef,
  type CellContext,
} from '../components/atlantis';
import { RatingCell, LocationCell } from '../components/atlantis/table-cells';
import {
  ServiceProvider,
  ServiceProviderStatus,
} from '@service-flex/types';
import { serviceProviderStatusToSemantic, formatStatusLabel } from '../types';

// Mock data for service providers
const mockServiceProviders: ServiceProvider[] = [
  {
    id: '1',
    name: 'John Smith Plumbing',
    rating: 4.8,
    status: ServiceProviderStatus.ACTIVE,
    contact: {
      email: 'john@smithplumbing.com',
      phone: '(555) 123-4567',
      city: 'Austin',
      state: 'TX',
    },
    workspaceId: 'ws-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-06-20'),
  },
  {
    id: '2',
    name: 'Elite Electric Services',
    rating: 4.5,
    status: ServiceProviderStatus.ACTIVE,
    contact: {
      email: 'contact@eliteelectric.com',
      phone: '(555) 234-5678',
      city: 'Dallas',
      state: 'TX',
    },
    workspaceId: 'ws-1',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-07-01'),
  },
  {
    id: '3',
    name: 'ABC HVAC Solutions',
    rating: 4.2,
    status: ServiceProviderStatus.PENDING,
    contact: {
      email: 'info@abchvac.com',
      phone: '(555) 345-6789',
      city: 'Houston',
      state: 'TX',
    },
    workspaceId: 'ws-1',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-07-15'),
  },
  {
    id: '4',
    name: 'Green Lawn Care',
    rating: 3.9,
    status: ServiceProviderStatus.INACTIVE,
    contact: {
      email: 'hello@greenlawn.com',
      phone: '(555) 456-7890',
      city: 'San Antonio',
      state: 'TX',
    },
    workspaceId: 'ws-1',
    createdAt: new Date('2023-11-20'),
    updatedAt: new Date('2024-04-10'),
  },
  {
    id: '5',
    name: 'Pro Painting Co',
    rating: 4.7,
    status: ServiceProviderStatus.ACTIVE,
    contact: {
      email: 'jobs@propainting.com',
      phone: '(555) 567-8901',
      city: 'Fort Worth',
      state: 'TX',
    },
    workspaceId: 'ws-1',
    createdAt: new Date('2024-01-30'),
    updatedAt: new Date('2024-08-01'),
  },
  {
    id: '6',
    name: 'Quick Fix Handyman',
    rating: 4.0,
    status: ServiceProviderStatus.SUSPENDED,
    contact: {
      email: 'service@quickfix.com',
      phone: '(555) 678-9012',
      city: 'El Paso',
      state: 'TX',
    },
    workspaceId: 'ws-1',
    createdAt: new Date('2024-04-15'),
    updatedAt: new Date('2024-07-20'),
  },
];

// Create column helper for type-safe column definitions
const columnHelper = createColumnHelper<ServiceProvider>();

export const ServiceProviderGrid = () => {
  const [selectedRows, setSelectedRows] = useState<ServiceProvider[]>([]);

  const columns = useMemo<ColumnDef<ServiceProvider, unknown>[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'Provider Name',
        size: 200,
        minSize: 200,
        cell: (info: CellContext<ServiceProvider, string>) => (
          <span className="font-medium">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('rating', {
        header: 'Rating',
        size: 100,
        minSize: 100,
        cell: (info: CellContext<ServiceProvider, number>) => (
          <RatingCell value={info.getValue()} />
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        size: 120,
        minSize: 120,
        cell: (info: CellContext<ServiceProvider, ServiceProviderStatus>) => {
          const status = info.getValue();
          return (
            <StatusLabel
              label={formatStatusLabel(status)}
              status={serviceProviderStatusToSemantic[status]}
            />
          );
        },
      }),
      columnHelper.display({
        id: 'email',
        header: 'Email',
        size: 200,
        minSize: 200,
        cell: (info: CellContext<ServiceProvider, unknown>) => {
          const provider = info.row.original;
          return <Text>{provider.contact?.email || '-'}</Text>;
        },
      }),
      columnHelper.display({
        id: 'phone',
        header: 'Phone',
        size: 140,
        minSize: 140,
        cell: (info: CellContext<ServiceProvider, unknown>) => {
          const provider = info.row.original;
          return <Text>{provider.contact?.phone || '-'}</Text>;
        },
      }),
      columnHelper.display({
        id: 'location',
        header: 'Location',
        size: 140,
        minSize: 140,
        cell: (info: CellContext<ServiceProvider, unknown>) => {
          const provider = info.row.original;
          return (
            <LocationCell
              city={provider.contact?.city ?? undefined}
              state={provider.contact?.state ?? undefined}
            />
          );
        },
      }),
    ],
    []
  );

  const handleSelectionChange = useCallback((rows: ServiceProvider[]) => {
    setSelectedRows(rows);
    const selectedIds = rows.map((row) => row.id);
    console.log('Selected provider IDs:', selectedIds);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <Heading level={1}>Service Providers</Heading>
        <Text variation="subdued" size="small">
          {mockServiceProviders.length} providers
          {selectedRows.length > 0 && ` (${selectedRows.length} selected)`}
        </Text>
      </div>
      <DataTable
        data={mockServiceProviders}
        columns={columns}
        rowSelection="multiple"
        onSelectionChanged={handleSelectionChange}
        itemsPerPage={[10, 25, 50]}
        stickyHeader
        pinFirstColumn
        height={500}
      />
    </div>
  );
};

export default ServiceProviderGrid;
