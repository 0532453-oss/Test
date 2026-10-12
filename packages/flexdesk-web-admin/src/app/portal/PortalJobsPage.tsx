/**
 * Customer Portal - Jobs Page
 * Public page for customers to view their job history using a portal token
 */

import { useSearchParams, useNavigate } from 'react-router';
import { useCustomerPortalData, PortalJob } from './hooks/useCustomerPortal';

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const JobStatusBadge = ({ status }: { status: string }) => {
  const statusColors: Record<string, string> = {
    SCHEDULED: 'bg-yellow-100 text-yellow-800',
    DISPATCHED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-200 text-gray-600',
    ON_HOLD: 'bg-orange-100 text-orange-800',
  };

  const statusLabels: Record<string, string> = {
    SCHEDULED: 'Scheduled',
    DISPATCHED: 'Dispatched',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    ON_HOLD: 'On Hold',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusColors[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {statusLabels[status] || status}
    </span>
  );
};

const JobCard = ({ job }: { job: PortalJob }) => {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
        <JobStatusBadge status={job.status} />
      </div>

      {job.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>
      )}

      <div className="space-y-2 text-sm">
        {job.scheduledAt && (
          <div className="flex items-center text-gray-500">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Scheduled: {formatDateTime(job.scheduledAt)}</span>
          </div>
        )}

        {job.completedAt && (
          <div className="flex items-center text-green-600">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Completed: {formatDateTime(job.completedAt)}</span>
          </div>
        )}

        {job.technician && (
          <div className="flex items-center text-gray-500 mt-2 pt-2 border-t border-gray-100">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span>Technician: {job.technician.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const PortalJobsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const { customer, jobs, loading, error } = useCustomerPortalData(token);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">
            No access token provided. Please use the link sent to your email to
            access your customer portal.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your job history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error.message}</p>
          <p className="text-sm text-gray-500 mt-4">
            Your access link may have expired. Please contact support for a new
            link.
          </p>
        </div>
      </div>
    );
  }

  const handleViewInvoices = () => {
    navigate(`/portal/invoices?token=${encodeURIComponent(token)}`);
  };

  // Separate jobs by status
  const activeJobs = jobs.filter(
    (job) =>
      job.status === 'SCHEDULED' ||
      job.status === 'DISPATCHED' ||
      job.status === 'IN_PROGRESS',
  );
  const completedJobs = jobs.filter((job) => job.status === 'COMPLETED');
  const otherJobs = jobs.filter(
    (job) => job.status === 'CANCELLED' || job.status === 'ON_HOLD',
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customer Portal</h1>
              {customer && (
                <p className="text-gray-600">Welcome, {customer.name}</p>
              )}
            </div>
            <nav className="flex space-x-4">
              <button
                onClick={handleViewInvoices}
                className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Invoices
              </button>
              <span className="px-3 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
                Job History
              </span>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-gray-900">{jobs.length}</p>
              <p className="text-sm text-gray-500">Total Jobs</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600">{activeJobs.length}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">
                {completedJobs.length}
              </p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-400">{otherJobs.length}</p>
              <p className="text-sm text-gray-500">Other</p>
            </div>
          </div>
        </div>

        {/* Active Jobs */}
        {activeJobs.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Active Jobs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </section>
        )}

        {/* Completed Jobs */}
        {completedJobs.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Completed Jobs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </section>
        )}

        {/* Other Jobs */}
        {otherJobs.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Cancelled / On Hold
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {jobs.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-gray-500 text-lg">You don't have any jobs yet.</p>
          </div>
        )}
      </main>
    </div>
  );
};
