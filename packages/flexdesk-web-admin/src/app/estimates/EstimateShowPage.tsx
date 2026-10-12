import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useEstimate,
  useSendEstimate,
  useAcceptEstimate,
  useRejectEstimate,
  useConvertEstimateToJob,
  useDeleteEstimate,
} from './hooks/useEstimates';
import { EstimateStatusBadge } from './components/EstimateStatusBadge';

export const EstimateShowPage = () => {
  const { estimateId } = useParams<{ estimateId: string }>();
  const navigate = useNavigate();
  const { estimate, loading, error, refetch } = useEstimate(estimateId || null);
  const { sendEstimate, loading: sendLoading } = useSendEstimate();
  const { acceptEstimate, loading: acceptLoading } = useAcceptEstimate();
  const { rejectEstimate, loading: rejectLoading } = useRejectEstimate();
  const { convertToJob, loading: convertLoading } = useConvertEstimateToJob();
  const { deleteEstimate, loading: deleteLoading } = useDeleteEstimate();

  const handleSend = async () => {
    if (!estimateId) return;
    try {
      await sendEstimate(estimateId);
      refetch();
    } catch (err) {
      console.error('Failed to send estimate:', err);
    }
  };

  const handleAccept = async () => {
    if (!estimateId) return;
    try {
      await acceptEstimate(estimateId);
      refetch();
    } catch (err) {
      console.error('Failed to accept estimate:', err);
    }
  };

  const handleReject = async () => {
    if (!estimateId) return;
    try {
      await rejectEstimate(estimateId);
      refetch();
    } catch (err) {
      console.error('Failed to reject estimate:', err);
    }
  };

  const handleConvert = async () => {
    if (!estimateId) return;
    try {
      const result = await convertToJob(estimateId);
      if (result.convertedJobId) {
        navigate(`/jobs/${result.convertedJobId}`);
      }
    } catch (err) {
      console.error('Failed to convert estimate:', err);
    }
  };

  const handleDelete = async () => {
    if (!estimateId) return;
    if (!window.confirm('Are you sure you want to delete this estimate?')) return;
    try {
      await deleteEstimate(estimateId);
      navigate('/estimates');
    } catch (err) {
      console.error('Failed to delete estimate:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-gray-600">Loading estimate...</div>
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error?.message || 'Estimate not found'}
          </div>
          <Link to="/estimates" className="mt-4 inline-block text-blue-500 hover:text-blue-600">
            &larr; Back to Estimates
          </Link>
        </div>
      </div>
    );
  }

  const isActionLoading = sendLoading || acceptLoading || rejectLoading || convertLoading || deleteLoading;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/estimates" className="text-blue-500 hover:text-blue-600 mb-4 inline-block">
          &larr; Back to Estimates
        </Link>

        <div className="bg-white rounded-lg shadow p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold">{estimate.estimateNumber}</h1>
              <p className="text-gray-600 mt-1">{estimate.title}</p>
              <div className="mt-2">
                <EstimateStatusBadge status={estimate.status} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              {estimate.status === 'DRAFT' && (
                <>
                  <Link
                    to={`/estimates/${estimate.id}/edit`}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={handleSend}
                    disabled={isActionLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition"
                  >
                    {sendLoading ? 'Sending...' : 'Send to Customer'}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isActionLoading}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition"
                  >
                    Delete
                  </button>
                </>
              )}

              {(estimate.status === 'SENT' || estimate.status === 'VIEWED') && (
                <>
                  <button
                    onClick={handleAccept}
                    disabled={isActionLoading}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
                  >
                    {acceptLoading ? 'Accepting...' : 'Mark as Accepted'}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isActionLoading}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition"
                  >
                    {rejectLoading ? 'Rejecting...' : 'Mark as Rejected'}
                  </button>
                </>
              )}

              {estimate.status === 'ACCEPTED' && !estimate.convertedJobId && (
                <button
                  onClick={handleConvert}
                  disabled={isActionLoading}
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 transition"
                >
                  {convertLoading ? 'Converting...' : 'Convert to Job'}
                </button>
              )}

              {estimate.convertedJobId && (
                <Link
                  to={`/jobs/${estimate.convertedJobId}`}
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
                >
                  View Job
                </Link>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="border-t pt-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">Customer</h2>
            {estimate.customer ? (
              <div className="text-gray-700">
                <p className="font-medium">{estimate.customer.name}</p>
                {estimate.customer.email && <p>{estimate.customer.email}</p>}
                {estimate.customer.phone && <p>{estimate.customer.phone}</p>}
              </div>
            ) : (
              <p className="text-gray-500">Customer information not available</p>
            )}
          </div>

          {/* Description */}
          {estimate.description && (
            <div className="border-t pt-6 mb-6">
              <h2 className="text-lg font-semibold mb-3">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{estimate.description}</p>
            </div>
          )}

          {/* Line Items */}
          <div className="border-t pt-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">Line Items</h2>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Qty
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Unit Price
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {estimate.lineItems.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="px-4 py-2">
                      {item.description}
                      {item.serviceType && (
                        <span className="ml-2 text-xs text-gray-500">({item.serviceType})</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {parseFloat(String(item.quantity))}
                    </td>
                    <td className="px-4 py-2 text-right">
                      ${parseFloat(String(item.unitPrice)).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      ${parseFloat(String(item.total)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t pt-6 mb-6">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${parseFloat(String(estimate.subtotal)).toFixed(2)}</span>
                </div>
                {parseFloat(String(estimate.discount)) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${parseFloat(String(estimate.discount)).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>${parseFloat(String(estimate.tax)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>${parseFloat(String(estimate.total)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="border-t pt-6 grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-1">Valid Until</h3>
              <p>
                {estimate.validUntil
                  ? new Date(estimate.validUntil).toLocaleDateString()
                  : 'Not specified'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-1">Priority</h3>
              <p>{estimate.priority}</p>
            </div>
            {estimate.estimatedDuration && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-1">
                  Estimated Duration
                </h3>
                <p>{estimate.estimatedDuration} minutes</p>
              </div>
            )}
            {estimate.location && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-1">Location</h3>
                <p>{estimate.location.address}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {(estimate.customerNotes || estimate.notes || estimate.terms) && (
            <div className="border-t pt-6 mt-6 space-y-4">
              {estimate.customerNotes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-1">
                    Customer Notes
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{estimate.customerNotes}</p>
                </div>
              )}
              {estimate.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-1">
                    Internal Notes
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{estimate.notes}</p>
                </div>
              )}
              {estimate.terms && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-1">
                    Terms & Conditions
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{estimate.terms}</p>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span>{new Date(estimate.createdAt).toLocaleString()}</span>
              </div>
              {estimate.sentAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Sent</span>
                  <span>{new Date(estimate.sentAt).toLocaleString()}</span>
                </div>
              )}
              {estimate.viewedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Viewed</span>
                  <span>{new Date(estimate.viewedAt).toLocaleString()}</span>
                </div>
              )}
              {estimate.respondedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Responded</span>
                  <span>{new Date(estimate.respondedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
