/**
 * Card - Local implementation matching @jobber/components Card API
 *
 * This provides the same interface as the Atlantis component library's Card,
 * allowing future migration to the actual library when fully integrated.
 */
import React, { forwardRef, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

// Accent color types matching Atlantis
export type CardAccent =
  | 'green'
  | 'lightBlue'
  | 'blue'
  | 'indigo'
  | 'indigoLight'
  | 'purple'
  | 'pink'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'lime'
  | 'teal'
  | 'greyBlue';

export type CardElevation = 'none' | 'base' | 'elevated';

export interface CardHeaderAction {
  readonly title: string;
  readonly action?: React.ReactNode;
}

export interface CardProps {
  /**
   * Card header content - can be string, ReactNode, or object with title/action
   */
  readonly header?: string | React.ReactNode | CardHeaderAction;

  /**
   * Accent color for left border
   */
  readonly accent?: CardAccent;

  /**
   * Card elevation (shadow)
   * @default "none"
   */
  readonly elevation?: CardElevation;

  /**
   * URL to make card a link
   */
  readonly url?: string;

  /**
   * Click handler for interactive cards
   */
  readonly onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;

  /**
   * Card content
   */
  readonly children?: React.ReactNode;

  /**
   * Additional CSS class
   */
  readonly className?: string;
}

// Map accent colors to CSS values
const accentColors: Record<CardAccent, string> = {
  green: 'border-l-green-500',
  lightBlue: 'border-l-sky-400',
  blue: 'border-l-blue-500',
  indigo: 'border-l-indigo-600',
  indigoLight: 'border-l-indigo-400',
  purple: 'border-l-purple-500',
  pink: 'border-l-pink-500',
  red: 'border-l-red-500',
  orange: 'border-l-orange-500',
  yellow: 'border-l-yellow-500',
  lime: 'border-l-lime-500',
  teal: 'border-l-teal-500',
  greyBlue: 'border-l-slate-500',
};

// Map elevation to shadow classes
const elevationStyles: Record<CardElevation, string> = {
  none: '',
  base: 'shadow-sm',
  elevated: 'shadow-md',
};

// Context for card compound components
const CardContext = createContext<{ hasCustomHeader: boolean }>({ hasCustomHeader: false });

/**
 * Card.Header compound component
 */
function CardHeader({
  children,
  className,
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
}) {
  return (
    <div className={cn('border-b border-[--color-border]', className)}>
      {children}
    </div>
  );
}

/**
 * Card.Body compound component
 */
function CardBody({
  children,
  className,
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
}) {
  return (
    <div className={cn('p-4', className)}>
      {children}
    </div>
  );
}

/**
 * Render header based on header prop type
 */
function renderHeader(header: CardProps['header']): React.ReactNode {
  if (!header) return null;

  // String header
  if (typeof header === 'string') {
    return (
      <div className="px-4 py-3 border-b border-[--color-border]">
        <h3 className="text-base font-semibold text-[--color-text]">{header}</h3>
      </div>
    );
  }

  // Object with title and action
  if (typeof header === 'object' && 'title' in header && typeof header.title === 'string') {
    const headerObj = header as CardHeaderAction;
    return (
      <div className="px-4 py-3 border-b border-[--color-border] flex items-center justify-between">
        <h3 className="text-base font-semibold text-[--color-text]">{headerObj.title}</h3>
        {headerObj.action}
      </div>
    );
  }

  // ReactNode header
  return header as React.ReactNode;
}

/**
 * Card component following Atlantis/Jobber design system
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { header, accent, elevation = 'none', url, onClick, children, className },
  ref
) {
  const isInteractive = Boolean(url || onClick);
  const hasCustomHeader = Boolean(header);

  const cardClasses = cn(
    'rounded-xl border border-[--color-border] bg-[--color-surface] overflow-hidden',
    accent && `border-l-4 ${accentColors[accent]}`,
    elevationStyles[elevation],
    isInteractive && 'cursor-pointer hover:bg-[--color-surface--hover] transition-colors',
    className
  );

  const content = (
    <CardContext.Provider value={{ hasCustomHeader }}>
      {renderHeader(header)}
      {children}
    </CardContext.Provider>
  );

  if (url) {
    return (
      <a href={url} className={cardClasses} ref={ref as React.Ref<HTMLAnchorElement>}>
        {content}
      </a>
    );
  }

  return (
    <div
      ref={ref}
      className={cardClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {content}
    </div>
  );
}) as React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>> & {
  Header: typeof CardHeader;
  Body: typeof CardBody;
};

// Attach compound components
Card.Header = CardHeader;
Card.Body = CardBody;

Card.displayName = 'Card';

export default Card;
