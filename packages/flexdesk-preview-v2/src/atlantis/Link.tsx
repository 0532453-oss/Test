/**
 * Atlantis Link Component
 *
 * Matches @jobber/components Link API for migration path.
 * Link provides styled navigation links with router integration.
 *
 * @example
 * <Link to="/dashboard" icon="home">Dashboard</Link>
 */
import type { ReactNode, CSSProperties, MouseEventHandler } from 'react';
import { Link as RouterLink } from 'react-router';
import { cn } from '@/lib/utils';
import { Icon, type IconNames } from './Icon';

export type LinkVariation = 'default' | 'subtle' | 'inherit';
export type LinkSize = 'small' | 'base' | 'large';

export interface LinkProps {
  /** Link destination (internal route) */
  readonly to?: string;
  /** Link destination (external URL) */
  readonly url?: string;
  /** Link content */
  readonly children: ReactNode;
  /** Icon to display before the link text */
  readonly icon?: IconNames;
  /** Whether the link is active (current page) */
  readonly isActive?: boolean;
  /** Link variation */
  readonly variation?: LinkVariation;
  /** Link size */
  readonly size?: LinkSize;
  /** Whether to open in new tab (for external links) */
  readonly external?: boolean;
  /** Additional class name */
  readonly className?: string;
  /** Additional inline styles */
  readonly style?: CSSProperties;
  /** Click handler */
  readonly onClick?: MouseEventHandler<HTMLAnchorElement>;
  /** Additional props to pass to the link */
  readonly state?: Record<string, unknown>;
}

const variationClasses: Record<LinkVariation, string> = {
  'default': 'text-sidebar-foreground hover:text-sidebar-accent-foreground',
  'subtle': 'text-sidebar-foreground/70 hover:text-sidebar-foreground',
  'inherit': 'text-inherit hover:text-inherit',
};

const sizeClasses: Record<LinkSize, string> = {
  'small': 'text-xs',
  'base': 'text-sm',
  'large': 'text-base',
};

const iconSizeMap: Record<LinkSize, 'small' | 'base' | 'large'> = {
  'small': 'small',
  'base': 'small',
  'large': 'base',
};

export function Link({
  to,
  url,
  children,
  icon,
  isActive = false,
  variation = 'default',
  size = 'base',
  external = false,
  className,
  style,
  onClick,
  state,
}: LinkProps) {
  const linkClasses = cn(
    'inline-flex items-center gap-2 rounded-lg transition-colors',
    'outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
    variationClasses[variation],
    sizeClasses[size],
    isActive && 'font-medium text-sidebar-accent-foreground bg-sidebar-accent',
    className
  );

  const content = (
    <>
      {icon && <Icon name={icon} size={iconSizeMap[size]} />}
      {children}
    </>
  );

  // External link
  if (url || external) {
    return (
      <a
        href={url || to}
        className={linkClasses}
        style={style}
        onClick={onClick}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {content}
      </a>
    );
  }

  // Internal link (React Router)
  if (to) {
    return (
      <RouterLink
        to={to}
        className={linkClasses}
        style={style}
        onClick={onClick}
        state={state}
      >
        {content}
      </RouterLink>
    );
  }

  // Fallback to span if no destination
  return (
    <span className={linkClasses} style={style}>
      {content}
    </span>
  );
}
