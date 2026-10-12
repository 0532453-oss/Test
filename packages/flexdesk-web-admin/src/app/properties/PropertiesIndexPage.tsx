import React, { useState } from 'react';
import { useProperties, useSearchProperties, useDeleteProperty } from './hooks/useProperties';
import type { Property } from './types/Property';

// Format address for display
function formatAddress(property: Property): string {
  const parts = [
    property.street,
    property.street2,
    property.city,
    property.state && property.zip ? `${property.state} ${property.zip}` : property.state || property.zip,
  ].filter(Boolean);
  return parts.join(', ') || 'No address';
}

export function PropertiesIndexPage() {
  const { properties, loading, error, refetch } = useProperties();
  const { properties: searchResults, search, loading: searching } = useSearchProperties();
  const { deleteProperty, loading: deleting } = useDeleteProperty();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const displayProperties = searchQuery.trim() ? searchResults : properties;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      search(searchQuery);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProperty(id);
      setDeleteConfirmId(null);
      refetch();
    } catch (err) {
      // Error is handled by the hook
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading properties</h3>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
          <button
            onClick={refetch}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
        <a
          href="/properties/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Property
        </a>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, address, city, or zip..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Properties list */}
      {displayProperties.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {searchQuery ? 'No properties found matching your search.' : 'No properties yet.'}
          </p>
          {!searchQuery && (
            <a
              href="/properties/new"
              className="inline-block mt-4 text-blue-600 hover:text-blue-700"
            >
              Add your first property
            </a>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayProperties.map((property) => (
                <tr key={property.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={`/properties/${property.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {property.name}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {property.customer ? (
                      <a
                        href={`/customers/${property.customerId}`}
                        className="text-gray-900 hover:text-blue-600"
                      >
                        {property.customer.name}
                      </a>
                    ) : (
                      <span className="text-gray-500">Unknown</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600 text-sm">{formatAddress(property)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {property.isPrimary && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Primary
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <a
                      href={`/properties/${property.id}`}
                      className="text-blue-600 hover:text-blue-700 mr-4"
                    >
                      View
                    </a>
                    <a
                      href={`/properties/${property.id}/edit`}
                      className="text-gray-600 hover:text-gray-700 mr-4"
                    >
                      Edit
                    </a>
                    {deleteConfirmId === property.id ? (
                      <>
                        <button
                          onClick={() => handleDelete(property.id)}
                          disabled={deleting}
                          className="text-red-600 hover:text-red-700 mr-2"
                        >
                          {deleting ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-gray-500 hover:text-gray-600"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(property.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PropertiesIndexPage;
