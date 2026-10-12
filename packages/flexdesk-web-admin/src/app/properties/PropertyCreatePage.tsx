import React, { useState } from 'react';
import { useCreateProperty } from './hooks/useProperties';
import type { CreatePropertyInput } from './types/Property';

interface PropertyCreatePageProps {
  customerId?: string;
  customerName?: string;
  onSuccess?: (propertyId: string) => void;
}

export function PropertyCreatePage({
  customerId: initialCustomerId,
  customerName,
  onSuccess,
}: PropertyCreatePageProps) {
  const { createProperty, loading, error } = useCreateProperty();
  const [formData, setFormData] = useState<CreatePropertyInput>({
    customerId: initialCustomerId || '',
    name: '',
    isPrimary: false,
    street: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    lat: undefined,
    lng: undefined,
    accessNotes: '',
    serviceNotes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
            ? value
              ? parseFloat(value)
              : undefined
            : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId) {
      alert('Please select a customer');
      return;
    }

    if (!formData.name.trim()) {
      alert('Please enter a property name');
      return;
    }

    try {
      // Clean up optional fields
      const input: CreatePropertyInput = {
        ...formData,
        street: formData.street || undefined,
        street2: formData.street2 || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zip: formData.zip || undefined,
        accessNotes: formData.accessNotes || undefined,
        serviceNotes: formData.serviceNotes || undefined,
      };

      const property = await createProperty(input);

      if (onSuccess) {
        onSuccess(property.id);
      } else {
        window.location.href = `/properties/${property.id}`;
      }
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Property</h1>
        {customerName && (
          <p className="text-gray-600 mt-1">
            For customer: <span className="font-medium">{customerName}</span>
          </p>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error creating property</h3>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        {/* Customer ID (if not provided via props) */}
        {!initialCustomerId && (
          <div className="mb-6">
            <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">
              Customer ID *
            </label>
            <input
              type="text"
              id="customerId"
              name="customerId"
              value={formData.customerId}
              onChange={handleChange}
              required
              placeholder="Enter customer ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              The customer this property belongs to
            </p>
          </div>
        )}

        {/* Property Name */}
        <div className="mb-6">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Property Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            maxLength={100}
            placeholder="e.g., Main Office, Home, Warehouse"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Is Primary */}
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isPrimary"
              checked={formData.isPrimary}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Set as primary service location</span>
          </label>
          <p className="mt-1 text-sm text-gray-500 ml-6">
            Primary location will be used as the default for new jobs
          </p>
        </div>

        {/* Address Section */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Address</h2>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                id="street"
                name="street"
                value={formData.street}
                onChange={handleChange}
                maxLength={255}
                placeholder="123 Main Street"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="street2" className="block text-sm font-medium text-gray-700 mb-1">
                Apartment, Suite, etc.
              </label>
              <input
                type="text"
                id="street2"
                name="street2"
                value={formData.street2}
                onChange={handleChange}
                maxLength={100}
                placeholder="Suite 100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="San Francisco"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  maxLength={50}
                  placeholder="CA"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  id="zip"
                  name="zip"
                  value={formData.zip}
                  onChange={handleChange}
                  maxLength={20}
                  placeholder="94102"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  maxLength={10}
                  placeholder="US"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Geolocation Section */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Geolocation <span className="text-sm font-normal text-gray-500">(Optional)</span>
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="lat" className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="number"
                id="lat"
                name="lat"
                value={formData.lat ?? ''}
                onChange={handleChange}
                step="any"
                min={-90}
                max={90}
                placeholder="37.7749"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="lng" className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="number"
                id="lng"
                name="lng"
                value={formData.lng ?? ''}
                onChange={handleChange}
                step="any"
                min={-180}
                max={180}
                placeholder="-122.4194"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Used for route optimization and geofencing
          </p>
        </div>

        {/* Notes Section */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="accessNotes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Access Notes
              </label>
              <textarea
                id="accessNotes"
                name="accessNotes"
                value={formData.accessNotes}
                onChange={handleChange}
                maxLength={1000}
                rows={3}
                placeholder="Gate code, parking instructions, building access..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="serviceNotes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Service Notes
              </label>
              <textarea
                id="serviceNotes"
                name="serviceNotes"
                value={formData.serviceNotes}
                onChange={handleChange}
                maxLength={1000}
                rows={3}
                placeholder="Equipment on-site, special instructions, hazards..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <a
            href="/properties"
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </a>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Property'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PropertyCreatePage;
