/**
 * LocationCell - Table cell component for displaying location
 *
 * Used with Atlantis DataTable column definitions.
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '../Icon';

export interface LocationCellProps {
  /**
   * City name
   */
  readonly city?: string;

  /**
   * State/province name
   */
  readonly state?: string;

  /**
   * Additional CSS classes
   */
  readonly className?: string;
}

export function LocationCell({ city, state, className }: LocationCellProps) {
  if (!city && !state) return null;

  const location = [city, state].filter(Boolean).join(', ');

  return (
    <div className={cn('flex items-center gap-2 text-[var(--color-text--secondary)]', className)}>
      <Icon name="address" size="small" />
      <span>{location}</span>
    </div>
  );
}

export default LocationCell;
