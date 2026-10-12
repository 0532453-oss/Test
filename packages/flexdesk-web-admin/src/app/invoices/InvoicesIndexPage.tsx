import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { InvoiceCard } from '@service-flex/components/InvoiceCard';
import type { Invoice } from '@/modules/billing/types/Invoice';

export const InvoicesIndexPage = () => {
  const { records: invoices, loading } = useFindManyRecords<Invoice>({
    objectNameSingular: 'Invoice',
    limit: 50,
  });

  if (loading) return <div className="p-4">Loading invoices...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Invoices</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {invoices.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))}
        </div>
      </div>
    </div>
  );
};
