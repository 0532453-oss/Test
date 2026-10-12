import { cloneElement, Children, type ReactElement } from 'react'
import { useGetList } from 'ra-core'

export interface ReferenceInputProps {
  source: string
  reference: string
  children: ReactElement
  filter?: Record<string, unknown>
  sort?: { field: string; order: 'ASC' | 'DESC' }
  perPage?: number
}

/**
 * ReferenceInput wraps an input component and provides choices from a related resource.
 * It fetches the referenced resource and passes the data as choices to the child input.
 *
 * @example
 * <ReferenceInput source="clientId" reference="clients">
 *   <AutocompleteInput optionText="name" />
 * </ReferenceInput>
 */
export function ReferenceInput({
  source,
  reference,
  children,
  filter = {},
  sort = { field: 'id', order: 'ASC' },
  perPage = 25,
}: ReferenceInputProps) {
  const { data, isLoading, error } = useGetList(reference, {
    pagination: { page: 1, perPage },
    sort,
    filter,
  })

  // Transform data to choices format - data already has id property
  const choices = data || []

  // Clone the child element and pass required props
  const child = Children.only(children)

  return cloneElement(child, {
    source,
    choices,
    isLoading,
    error: error?.message,
  })
}
