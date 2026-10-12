/**
 * Atlantis Chip and Chips Components
 *
 * Matches @jobber/components Chip/Chips API for migration path.
 * Chips are used to display selected items, tags, or filters with optional dismiss action.
 *
 * @example
 * // Single Chip
 * <Chip label="Active" onDismiss={() => removeFilter('active')} />
 *
 * // Chips container
 * <Chips>
 *   <Chip label="Status: Active" onDismiss={() => {...}} />
 *   <Chip label="Amount: $100-$500" onDismiss={() => {...}} />
 * </Chips>
 */
import type { ReactNode, MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

export type ChipVariation = 'base' | 'subtle' | 'status';
export type ChipSize = 'small' | 'base';

export interface ChipProps {
  /** Label text to display */
  readonly label: string;
  /** Optional value or secondary text */
  readonly value?: string;
  /** Optional icon before the label */
  readonly icon?: ReactNode;
  /** Chip variation */
  readonly variation?: ChipVariation;
  /** Chip size */
  readonly size?: ChipSize;
  /** Called when dismiss button is clicked */
  readonly onDismiss?: () => void;
  /** Additional class name */
  readonly className?: string;
  /** Whether the chip is disabled */
  readonly disabled?: boolean;
  /** Click handler for the chip (makes it interactive) */
  readonly onClick?: () => void;
  /** Whether the chip is selected (when clickable) */
  readonly selected?: boolean;
}

export interface ChipsProps {
  /** Child Chip elements */
  readonly children: ReactNode;
  /** Gap between chips */
  readonly gap?: 'small' | 'base';
  /** Additional class name */
  readonly className?: string;
  /** Whether chips should wrap */
  readonly wrap?: boolean;
}

const variationClasses: Record<ChipVariation, string> = {
  'base': 'bg-[var(--color-surface--hover)] text-[var(--color-text)] border-transparent',
  'subtle': 'bg-transparent text-[var(--color-text--secondary)] border-[var(--color-border)]',
  'status': 'bg-[var(--color-surface--hover)]/50 text-[var(--color-text)] border-[var(--color-border)]',
};

const sizeClasses: Record<ChipSize, string> = {
  'small': 'text-xs px-2 py-1 gap-1',
  'base': 'text-sm px-3 py-1 gap-2',
};

const dismissSizeClasses: Record<ChipSize, string> = {
  'small': 'h-3.5 w-3.5',
  'base': 'h-4 w-4',
};

export function Chip({
  label,
  value,
  icon,
  variation = 'base',
  size = 'base',
  onDismiss,
  className,
  disabled = false,
  onClick,
  selected = false,
}: ChipProps) {
  const handleDismiss = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onDismiss?.();
  };

  const isInteractive = Boolean(onClick);

  const content = (
    <>
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">
        {label}
        {value && (
          <span className="font-medium ml-1">{value}</span>
        )}
      </span>
      {onDismiss && !disabled && (
        <button
          type="button"
          onClick={handleDismiss}
          className={cn(
            'shrink-0 rounded-full hover:bg-[var(--color-text)]/10 focus:outline-none focus:ring-1 focus:ring-[var(--color-interactive)] flex items-center justify-center',
            dismissSizeClasses[size]
          )}
          aria-label={`Remove ${label}`}
        >
          <Icon name="cross" size="small" />
        </button>
      )}
    </>
  );

  const baseClasses = cn(
    'inline-flex items-center rounded-full border transition-colors',
    'max-w-full',
    variationClasses[variation],
    sizeClasses[size],
    disabled && 'opacity-50 cursor-not-allowed',
    isInteractive && !disabled && 'cursor-pointer hover:bg-[var(--color-surface--hover)]',
    selected && 'ring-2 ring-[var(--color-interactive)] ring-offset-1',
    className
  );

  if (isInteractive && !disabled) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(baseClasses, 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive)]')}
        disabled={disabled}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={baseClasses}>
      {content}
    </span>
  );
}

export function Chips({
  children,
  gap = 'small',
  className,
  wrap = true,
}: ChipsProps) {
  const gapClasses = {
    'small': 'gap-2',
    'base': 'gap-3',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center',
        wrap && 'flex-wrap',
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
}
