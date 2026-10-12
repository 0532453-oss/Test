import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvoiceCard } from './InvoiceCard';
import type { Invoice } from '../types/Invoice';

const baseInvoice: Invoice = {
  id: 'inv-1',
  invoiceNumber: 'INV-001',
  jobId: 'job-1',
  customerId: 'cust-1',
  status: 'DRAFT',
  amount: 100,
  tax: 10,
  total: 110,
  dueDate: '2025-06-15T00:00:00Z',
  lineItems: [],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('InvoiceCard', () => {
  it('renders invoice number', () => {
    render(<InvoiceCard invoice={baseInvoice} />);
    expect(screen.getByText('INV-001')).toBeInTheDocument();
  });

  it('renders formatted total', () => {
    render(<InvoiceCard invoice={baseInvoice} />);
    expect(screen.getByText('$110.00')).toBeInTheDocument();
  });

  it('renders the status badge', () => {
    render(<InvoiceCard invoice={baseInvoice} />);
    expect(screen.getByText('DRAFT')).toBeInTheDocument();
  });

  it('renders due date when provided', () => {
    render(<InvoiceCard invoice={baseInvoice} />);
    const dueDateElement = screen.getByText(/Due:/);
    expect(dueDateElement).toBeInTheDocument();
  });

  it('does not render due date when null', () => {
    const invoice = { ...baseInvoice, dueDate: null };
    render(<InvoiceCard invoice={invoice} />);
    expect(screen.queryByText(/Due:/)).not.toBeInTheDocument();
  });

  it('calls onClick when card is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<InvoiceCard invoice={baseInvoice} onClick={handleClick} />);

    await user.click(screen.getByText('INV-001'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('does not crash when onClick is not provided', async () => {
    const user = userEvent.setup();
    render(<InvoiceCard invoice={baseInvoice} />);

    // Should not throw
    await user.click(screen.getByText('INV-001'));
  });

  it.each([
    ['DRAFT', 'bg-gray-100'],
    ['SENT', 'bg-blue-100'],
    ['PAID', 'bg-green-100'],
    ['OVERDUE', 'bg-red-100'],
    ['CANCELLED', 'bg-gray-100'],
  ] as const)('applies correct status color for %s', (status, expectedClass) => {
    const invoice = { ...baseInvoice, status };
    render(<InvoiceCard invoice={invoice} />);
    const badge = screen.getByText(status);
    expect(badge.className).toContain(expectedClass);
  });
});
