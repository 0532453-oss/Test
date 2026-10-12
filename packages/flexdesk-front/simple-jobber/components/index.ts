export { Highlights, JobHighlights, ClientHighlights, RequestHighlights } from './Highlights';
export type { HighlightItem } from './Highlights';

export {
  EmptyState,
  EmptyClientList,
  EmptyJobList,
  EmptyInvoiceList,
  EmptyRequestList,
  EmptySchedule,
  NoSearchResults,
  NoFilterResults,
} from './EmptyState';

export {
  SortDropdown,
  jobSortOptions,
  clientSortOptions,
  requestSortOptions,
  invoiceSortOptions,
} from './SortDropdown';
export type { SortOption } from './SortDropdown';

export { CommandPalette, useCommandPalette } from './CommandPalette';
export { AppLayout } from './AppLayout';
export { ClientLocationMap } from './ClientLocationMap';

// Atlantis components
export { Icon } from './atlantis';

// Skeleton loaders
export {
  DashboardSkeleton,
  TableSkeleton,
  ClientListSkeleton,
  JobListSkeleton,
  InvoiceListSkeleton,
  RequestListSkeleton,
  FilteredListSkeleton,
  ScheduleSkeleton,
} from './skeletons';
