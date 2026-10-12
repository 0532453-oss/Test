import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaymentStatusBadge } from './PaymentStatusBadge';

describe('PaymentStatusBadge', () => {
  const statuses = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] as const;

  it.each(statuses)('renders the %s status text', (status) => {
    render(<PaymentStatusBadge status={status} />);
    expect(screen.getByText(status)).toBeInTheDocument();
  });

  it('renders as a span with rounded-full styling', () => {
    render(<PaymentStatusBadge status="PAID" />);
    const badge = screen.getByText('PAID');
    expect(badge.tagName).toBe('SPAN');
    expect(badge.className).toContain('rounded-full');
    expect(badge.className).toContain('text-xs');
  });

  it.each([
    ['DRAFT', 'bg-gray-100'],
    ['SENT', 'bg-blue-100'],
    ['PAID', 'bg-green-100'],
    ['OVERDUE', 'bg-red-100'],
    ['CANCELLED', 'bg-gray-100'],
  ] as const)('applies correct color class for %s', (status, expectedClass) => {
    render(<PaymentStatusBadge status={status} />);
    const badge = screen.getByText(status);
    expect(badge.className).toContain(expectedClass);
  });
});
