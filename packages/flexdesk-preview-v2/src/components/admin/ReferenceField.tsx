import { type ReactNode, cloneElement, isValidElement, Children } from 'react';
import { useGetOne, RecordContextProvider, useRecordContext, useCreatePath } from 'ra-core';
import { Link } from 'react-router';

export interface ReferenceFieldProps {
  source: string;
  reference: string;
  link?: boolean | 'show' | 'edit';
  children: ReactNode;
}

/**
 * ReferenceField fetches a related record and provides it via RecordContextProvider.
 * Child components can use useRecordContext() to access the fetched record.
 *
 * @example
 * <ReferenceField source="clientId" reference="clients" link="show">
 *   <ClientName />
 * </ReferenceField>
 */
export const ReferenceField = ({
  source,
  reference,
  link = false,
  children,
}: ReferenceFieldProps) => {
  const record = useRecordContext();
  const createPath = useCreatePath();

  const referenceId = record?.[source];

  const { data: referenceRecord, isPending, error } = useGetOne(
    reference,
    { id: referenceId || '' },
    { enabled: !!referenceId }
  );

  if (!referenceId) {
    return null;
  }

  if (isPending) {
    return <span className="text-gray-400">Loading...</span>;
  }

  if (error || !referenceRecord) {
    return null;
  }

  const content = (
    <RecordContextProvider value={referenceRecord}>
      {children}
    </RecordContextProvider>
  );

  if (link) {
    const linkType = link === true ? 'edit' : link;
    const path = createPath({
      resource: reference,
      type: linkType,
      id: referenceId,
    });
    return (
      <Link to={path} className="text-blue-600 hover:text-blue-800 hover:underline">
        {content}
      </Link>
    );
  }

  return content;
};
