import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import {
  Content,
  Heading,
  Text,
  Icon,
  Button as AtlantisButton,
  type IconNames,
} from './atlantis';

interface EmptyStateProps {
  /**
   * Icon name to display in the empty state.
   * Uses Atlantis Icon names.
   */
  icon?: IconNames;
  /**
   * The title text to display.
   */
  title: string;
  /**
   * Optional description text below the title.
   */
  description?: string;
  /**
   * Optional action button configuration.
   */
  action?: {
    label: string;
    to?: string;
    onClick?: () => void;
    icon?: IconNames;
  };
  /**
   * Additional class names for custom styling.
   */
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Content
      spacing="small"
      className={cn(
        'items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {icon && (
        <div className="w-16 h-16 rounded-full bg-[--color-surface--hover] flex items-center justify-center">
          <Icon name={icon} size="large" color="greyBlue" />
        </div>
      )}
      <Heading level={3}>{title}</Heading>
      {description && (
        <Text variation="subdued" size="small" className="max-w-sm">
          {description}
        </Text>
      )}
      {action && (
        <div className="mt-2">
          {action.to ? (
            <Link to={action.to}>
              <AtlantisButton
                label={action.label}
                icon={action.icon || 'add'}
              />
            </Link>
          ) : (
            <AtlantisButton
              label={action.label}
              icon={action.icon || 'add'}
              onClick={action.onClick}
            />
          )}
        </div>
      )}
    </Content>
  );
}

// Pre-configured empty states for common scenarios
export function EmptyClientList() {
  return (
    <EmptyState
      icon="clients"
      title="No clients yet"
      description="Add your first client to get started managing your customer relationships."
      action={{ label: 'Add Client', to: '/clients/create' }}
    />
  );
}

export function EmptyJobList() {
  return (
    <EmptyState
      icon="work"
      title="No jobs yet"
      description="Create your first job to start scheduling and tracking work."
      action={{ label: 'Create Job', to: '/jobs/create' }}
    />
  );
}

export function EmptyInvoiceList() {
  return (
    <EmptyState
      icon="invoice"
      title="No invoices yet"
      description="Create your first invoice to start billing clients for completed work."
      action={{ label: 'Create Invoice', to: '/invoices/create' }}
    />
  );
}

export function EmptyRequestList() {
  return (
    <EmptyState
      icon="inbox"
      title="No requests yet"
      description="Requests will appear here when customers submit work inquiries."
    />
  );
}

export function EmptySchedule() {
  return (
    <EmptyState
      icon="calendar"
      title="No scheduled jobs"
      description="Schedule jobs to see them appear on the calendar."
      action={{ label: 'Create Job', to: '/jobs/create' }}
    />
  );
}

export function NoSearchResults({ query }: { query?: string }) {
  return (
    <EmptyState
      icon="search"
      title="No results found"
      description={
        query
          ? `No items match "${query}". Try adjusting your search or filters.`
          : 'Try adjusting your search or filters to find what you\'re looking for.'
      }
    />
  );
}

export function NoFilterResults() {
  return (
    <EmptyState
      icon="fileEmpty"
      title="No matching items"
      description="No items match your current filters. Try removing some filters to see more results."
    />
  );
}
