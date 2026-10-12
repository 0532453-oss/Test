/**
 * Atlantis Page Component
 *
 * Matches @jobber/components Page API for migration path.
 * Page provides a consistent page layout with title, subtitle, intro text,
 * and action buttons.
 *
 * @example
 * <Page
 *   title="Clients"
 *   primaryAction={{ label: "Add Client", onClick: () => {} }}
 * >
 *   <DataTable ... />
 * </Page>
 */
import type { ReactNode, RefObject } from 'react';
// @ts-ignore - react-router may not be installed
import { Link } from 'react-router';
import { Heading } from './Heading';
import { Text } from './Text';
import { Button, type ButtonProps } from './Button';
import { cn } from '@/lib/utils';

export type ButtonActionProps = Omit<ButtonProps, 'children'> & {
  label: string;
  ref?: RefObject<HTMLDivElement | null>;
  /** URL to navigate to when clicked. Renders as Link if provided. */
  url?: string;
};

export interface PageProps {
  /** Content of the page */
  readonly children: ReactNode | ReactNode[];

  /**
   * Title of the page.
   * If a string is provided, it will be rendered as an H1 heading.
   * Otherwise it will be rendered as is.
   */
  readonly title: ReactNode;

  /**
   * Metadata component to display next to the title.
   * Only compatible with string titles.
   */
  readonly titleMetaData?: ReactNode;

  /**
   * Subtitle of the page.
   */
  readonly subtitle?: string;

  /**
   * Intro text for the page. Displayed below the title/subtitle.
   */
  readonly intro?: string;

  /**
   * Determines the width of the page.
   * - fill: Width grows to 100%
   * - standard: Caps out at 1280px
   * - narrow: Caps out at 1024px
   * @default "fill"
   */
  readonly width?: 'fill' | 'standard' | 'narrow';

  /**
   * Primary action button settings.
   */
  readonly primaryAction?: ButtonActionProps;

  /**
   * Secondary action button settings.
   */
  readonly secondaryAction?: ButtonActionProps;

  /**
   * Additional class name for the page container.
   */
  readonly className?: string;
}

const widthClasses = {
  fill: 'w-full',
  standard: 'max-w-7xl',
  narrow: 'max-w-5xl',
} as const;

/** Helper component to render action buttons with optional Link wrapper */
function ActionButton({
  action,
  defaultType,
}: {
  action: ButtonActionProps;
  defaultType: 'primary' | 'secondary';
}) {
  const button = (
    <Button
      type={action.type ?? defaultType}
      variation={action.variation}
      size={action.size}
      icon={action.icon}
      iconOnRight={action.iconOnRight}
      disabled={action.disabled}
      loading={action.loading}
      onClick={action.onClick}
      ariaLabel={action.ariaLabel}
    >
      {action.label}
    </Button>
  );

  if (action.url) {
    return (
      <div ref={action.ref as React.Ref<HTMLDivElement>}>
        <Link to={action.url}>{button}</Link>
      </div>
    );
  }

  return <div ref={action.ref as React.Ref<HTMLDivElement>}>{button}</div>;
}

export function Page({
  title,
  titleMetaData,
  subtitle,
  intro,
  children,
  width = 'fill',
  primaryAction,
  secondaryAction,
  className,
}: PageProps) {
  const showActions = primaryAction || secondaryAction;

  return (
    <div className={cn('flex flex-col gap-6', widthClasses[width], className)}>
      {/* Title Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          {/* Title */}
          {typeof title === 'string' ? (
            <div className="flex items-center gap-3">
              <Heading level={1}>{title}</Heading>
              {titleMetaData}
            </div>
          ) : (
            title
          )}

          {/* Subtitle */}
          {subtitle && (
            <Text size="large" variation="subdued">
              {subtitle}
            </Text>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            {secondaryAction && (
              <ActionButton action={secondaryAction} defaultType="secondary" />
            )}
            {primaryAction && (
              <ActionButton action={primaryAction} defaultType="primary" />
            )}
          </div>
        )}
      </div>

      {/* Intro */}
      {intro && (
        <Text size="large">{intro}</Text>
      )}

      {/* Page Content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
