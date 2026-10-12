import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEstimates } from './hooks/useEstimates';
import { EstimateStatusBadge } from './components/EstimateStatusBadge';
import type { EstimateStatus } from './types/Estimate';

const STATUS_FILTERS: { label: string; value: EstimateStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Sent', value: 'SENT' },
  { label: 'Viewed', value: 'VIEWED' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Converted', value: 'CONVERTED' },
];

export const EstimatesIndexPage = () => {
  const [statusFilter, setStatusFilter] = useState<EstimateStatus | undefined>(undefined);
  const { estimates, loading, error, refetch } = useEstimates(statusFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-gray-600">Loading estimates...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            Error: {error.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Estimates / Quotes</h1>
          <Link
            to="/estimates/new"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            + New Estimate
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.label}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 rounded-lg transition ${
                statusFilter === filter.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {estimates.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">No estimates found</p>
            <Link
              to="/estimates/new"
              className="text-blue-500 hover:text-blue-600"
            >
              Create your first estimate
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estimate #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid Until
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {estimates.map((estimate) => (
                  <tr key={estimate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/estimates/${estimate.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {estimate.estimateNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {estimate.customer?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate">{estimate.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <EstimateStatusBadge status={estimate.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      ${parseFloat(String(estimate.total)).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {estimate.validUntil
                        ? new Date(estimate.validUntil).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/estimates/${estimate.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
