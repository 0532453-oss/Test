/**
 * ReferenceCell - Table cell component for displaying referenced data
 *
 * Used with Atlantis DataTable column definitions to resolve and display
 * data from related resources (e.g., clientId → client name).
 */
import React, { useState, useEffect } from 'react';
import { useDataProvider, useCreatePath } from 'ra-core';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface ReferenceCellProps {
  /**
   * The ID of the referenced record
   */
  readonly id: string | null | undefined;

  /**
   * The resource name (e.g., 'clients', 'teamMembers')
   */
  readonly reference: string;

  /**
   * The field to display from the referenced record
   */
  readonly displayField?: string;

  /**
   * Whether to render as a link
   * - false: no link
   * - 'show': link to show view
   * - 'edit': link to edit view
   */
  readonly link?: false | 'show' | 'edit';

  /**
   * Additional CSS classes
   */
  readonly className?: string;
}

export function ReferenceCell({
  id,
  reference,
  displayField = 'name',
  link = false,
  className,
}: ReferenceCellProps) {
  const dataProvider = useDataProvider();
  const createPath = useCreatePath();

  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    dataProvider
      .getOne(reference, { id })
      .then((result: { data: Record<string, unknown> }) => {
        if (!cancelled) {
          setData(result.data);
          setIsLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dataProvider, reference, id]);

  if (!id) {
    return <span className="text-[--color-text--secondary]">—</span>;
  }

  if (isLoading) {
    return (
      <span className="inline-block h-4 w-24 bg-[--color-surface--hover]/50 animate-pulse rounded" />
    );
  }

  if (error || !data) {
    return <span className="text-[--color-text--secondary]">—</span>;
  }

  const displayValue = String(data[displayField] || id);

  if (!link) {
    return <span className={cn('text-[--color-text]', className)}>{displayValue}</span>;
  }

  const path = createPath({ resource: reference, type: link, id });

  return (
    <Link
      to={path}
      className={cn('text-[--color-interactive] hover:underline', className)}
      onClick={(e) => e.stopPropagation()}
    >
      {displayValue}
    </Link>
  );
}

export default ReferenceCell;
