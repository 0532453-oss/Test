import { type ReactNode } from 'react';
import { useGetList, useRecordContext, ListContextProvider, RaRecord } from 'ra-core';

export interface ReferenceManyFieldProps {
  reference: string;
  target: string;
  children: ReactNode;
  perPage?: number;
  sort?: { field: string; order: 'ASC' | 'DESC' };
}

/**
 * ReferenceManyField fetches related records for a parent record
 * and provides them via ListContext to child components like DataTable.
 *
 * @example
 * <ReferenceManyField reference="jobs" target="clientId">
 *   <DataTable>
 *     <DataTable.Col source="title" label="Title" />
 *   </DataTable>
 * </ReferenceManyField>
 */
export function ReferenceManyField({
  reference,
  target,
  children,
  perPage = 25,
  sort = { field: 'id', order: 'DESC' },
}: ReferenceManyFieldProps) {
  const record = useRecordContext();

  const { data = [], total = 0, isPending, error, refetch } = useGetList(reference, {
    pagination: { page: 1, perPage },
    sort,
    filter: record ? { [target]: record.id } : {},
  }, { enabled: !!record?.id });

  if (!record) {
    return null;
  }

  // Create a ListContext-compatible value
  const listContextValue = {
    data,
    total,
    isPending,
    isLoading: isPending,
    isFetching: isPending,
    error,
    page: 1,
    perPage,
    sort,
    filterValues: { [target]: record.id },
    displayedFilters: {},
    setFilters: () => {},
    showFilter: () => {},
    hideFilter: () => {},
    setPage: () => {},
    setPerPage: () => {},
    setSort: () => {},
    refetch,
    resource: reference,
    selectedIds: [],
    onSelect: () => {},
    onToggleItem: () => {},
    onUnselectItems: () => {},
    hasNextPage: false,
    hasPreviousPage: false,
  };

  return (
    <ListContextProvider value={listContextValue as any}>
      {children}
    </ListContextProvider>
  );
}
