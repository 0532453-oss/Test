import type { ListBaseProps, RaRecord } from 'ra-core'
import { ListBase, ResourceContextProvider } from 'ra-core'
import type { ReactNode } from 'react'

export interface ListProps<RecordType extends RaRecord = RaRecord>
  extends ListBaseProps<RecordType> {
  children: ReactNode
  resource?: string
  empty?: ReactNode
  actions?: ReactNode | false
  pagination?: ReactNode | false
}

/**
 * List component wrapper for React Admin's ListBase.
 * Provides the list context (data, filtering, sorting, pagination) to children.
 *
 * @example
 * <List resource="clients" perPage={25}>
 *   <ClientListContent />
 * </List>
 */
export function List<RecordType extends RaRecord = RaRecord>({
  children,
  resource = 'clients',
  empty,
  actions,
  pagination,
  ...props
}: ListProps<RecordType>) {
  return (
    <ResourceContextProvider value={resource}>
      <ListBase<RecordType> resource={resource} {...props}>
        {children}
      </ListBase>
    </ResourceContextProvider>
  )
}
