/**
 * AvatarNameCell - Table cell component for displaying avatar and name
 *
 * Used with Atlantis DataTable column definitions.
 */
import React from 'react';
import { Avatar } from '../InputAvatar';

export interface AvatarNameCellProps {
  /**
   * Name to display
   */
  readonly name: string;

  /**
   * Avatar image URL
   */
  readonly avatar?: string;

  /**
   * Additional CSS classes
   */
  readonly className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function AvatarNameCell({ name, avatar, className }: AvatarNameCellProps) {
  if (!name) return null;

  return (
    <div className={`flex items-center gap-3 py-1 ${className ?? ''}`}>
      <Avatar
        imageUrl={avatar}
        initials={getInitials(name)}
        name={name}
        size="base"
      />
      <span className="font-medium">{name}</span>
    </div>
  );
}

export default AvatarNameCell;
