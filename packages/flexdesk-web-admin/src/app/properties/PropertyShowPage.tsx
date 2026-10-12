import React, { useState } from 'react';
import {
  usePropertyWithRelations,
  useSetPrimaryProperty,
  useDeleteProperty,
} from './hooks/useProperties';
import type { Property } from './types/Property';

interface PropertyShowPageProps {
  propertyId: string;
}

// Format full address
function formatFullAddress(property: Property): string {
  const lines: string[] = [];
  if (property.street) lines.push(property.street);
  if (property.street2) lines.push(property.street2);

  const cityStateZip = [
    property.city,
    property.state && property.zip
      ? `${property.state} ${property.zip}`
      : property.state || property.zip,
  ]
    .filter(Boolean)
    .join(', ');
  if (cityStateZip) lines.push(cityStateZip);
  if (property.country && property.country !== 'US') lines.push(property.country);

  return lines.length > 0 ? lines.join('\n') : 'No address';
}

// Job status colors
const jobStatusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  DISPATCHED: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  ON_HOLD: 'bg-gray-100 text-gray-800',
};

export function PropertyShowPage({ propertyId }: PropertyShowPageProps) {
  const { property, loading, error, refetch } = usePropertyWithRelations(propertyId);
  const { setPrimary, loading: settingPrimary } = useSetPrimaryProperty();
  const { deleteProperty, loading: deleting } = useDeleteProperty();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSetPrimary = async () => {
    try {
      await setPrimary(propertyId);
      refetch();
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProperty(propertyId);
      // Redirect to properties list
      window.location.href = '/properties';
    } catch (err) {
      // Error handled by hook
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading property</h3>
          <p className="text-red-600 text-sm mt-1">
            {error?.message || 'Property not found'}
          </p>
          <a
            href="/properties"
            className="inline-block mt-3 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Back to Properties
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
            {property.isPrimary && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Primary
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1">
            Customer:{' '}
            <a
              href={`/customers/${property.customerId}`}
              className="text-blue-600 hover:text-blue-700"
            >
              {property.customer.name}
            </a>
          </p>
        </div>
        <div className="flex gap-2">
          {!property.isPrimary && (
            <button
              onClick={handleSetPrimary}
              disabled={settingPrimary}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
            >
              {settingPrimary ? 'Setting...' : 'Set as Primary'}
            </button>
          )}
          <a
            href={`/properties/${propertyId}/edit`}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Edit
          </a>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Confirm Delete</h3>
          <p className="text-red-600 text-sm mt-1">
            Are you sure you want to delete this property? This action cannot be undone.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Address Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Address</h2>
          <pre className="text-gray-700 whitespace-pre-wrap font-sans">
            {formatFullAddress(property)}
          </pre>
          {property.lat && property.lng && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Coordinates: {property.lat.toFixed(6)}, {property.lng.toFixed(6)}
              </p>
              <a
                href={`https://maps.google.com/?q=${property.lat},${property.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Open in Google Maps
              </a>
            </div>
          )}
        </div>

        {/* Notes Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          {property.accessNotes && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Access Notes</h3>
              <p className="text-gray-700">{property.accessNotes}</p>
            </div>
          )}
          {property.serviceNotes && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Service Notes</h3>
              <p className="text-gray-700">{property.serviceNotes}</p>
            </div>
          )}
          {!property.accessNotes && !property.serviceNotes && (
            <p className="text-gray-500">No notes added.</p>
          )}
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
          <a
            href={`/jobs/new?propertyId=${propertyId}&customerId=${property.customerId}`}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Create Job
          </a>
        </div>
        {property.jobs.length === 0 ? (
          <p className="text-gray-500">No jobs at this property yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Title
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Scheduled
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {property.jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <a
                        href={`/jobs/${job.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {job.title}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          jobStatusColors[job.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {job.scheduledAt
                        ? new Date(job.scheduledAt).toLocaleDateString()
                        : 'Not scheduled'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/jobs/${job.id}`}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-6 text-sm text-gray-500">
        <p>
          Created: {new Date(property.createdAt).toLocaleString()} | Updated:{' '}
          {new Date(property.updatedAt).toLocaleString()}
        </p>
        <p>
          Sync Status: {property.syncStatus} | Version: {property.syncVersion}
        </p>
      </div>
    </div>
  );
}

export default PropertyShowPage;
