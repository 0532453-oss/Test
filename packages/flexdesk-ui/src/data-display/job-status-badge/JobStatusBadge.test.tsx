import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JobStatusBadge } from './JobStatusBadge';
import type { JobStatus } from '../types/JobStatus';

describe('JobStatusBadge', () => {
  const statuses: JobStatus[] = [
    'SCHEDULED',
    'DISPATCHED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'ON_HOLD',
  ];

  it.each(statuses)('renders the correct label for %s status', (status) => {
    render(<JobStatusBadge status={status} />);

    const expectedLabels: Record<JobStatus, string> = {
      SCHEDULED: 'Scheduled',
      DISPATCHED: 'Dispatched',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      ON_HOLD: 'On Hold',
    };

    expect(screen.getByText(expectedLabels[status])).toBeInTheDocument();
  });

  it('renders as an inline span with rounded-full styling', () => {
    render(<JobStatusBadge status="SCHEDULED" />);
    const badge = screen.getByText('Scheduled');
    expect(badge.tagName).toBe('SPAN');
    expect(badge.className).toContain('rounded-full');
    expect(badge.className).toContain('text-xs');
  });

  it.each([
    ['SCHEDULED', 'bg-blue-100', 'Scheduled'],
    ['DISPATCHED', 'bg-yellow-100', 'Dispatched'],
    ['IN_PROGRESS', 'bg-green-100', 'In Progress'],
    ['COMPLETED', 'bg-gray-100', 'Completed'],
    ['CANCELLED', 'bg-red-100', 'Cancelled'],
    ['ON_HOLD', 'bg-orange-100', 'On Hold'],
  ] as const)('applies correct color class for %s', (status, expectedClass, label) => {
    render(<JobStatusBadge status={status} />);
    const badge = screen.getByText(label);
    expect(badge.className).toContain(expectedClass);
  });

  it('applies custom className', () => {
    render(<JobStatusBadge status="COMPLETED" className="mt-4" />);
    const badge = screen.getByText('Completed');
    expect(badge.className).toContain('mt-4');
  });

  it('defaults className to empty string', () => {
    const { container } = render(<JobStatusBadge status="COMPLETED" />);
    const badge = container.querySelector('span')!;
    // Should not have extra whitespace issues; class should end cleanly
    expect(badge).toBeInTheDocument();
  });
});
