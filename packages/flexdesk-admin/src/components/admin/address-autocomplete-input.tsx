/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  FormError,
  FormField,
  FormLabel,
} from "@/components/admin/form";
import { Autocomplete, type AutocompleteOption } from "@/components/atlantis";
import type { InputProps } from "ra-core";
import { useInput, FieldTitle, useTranslate } from "ra-core";
import { InputHelperText } from "./input-helper-text";

/**
 * Address suggestion option with structured address data
 */
export interface AddressSuggestion extends AutocompleteOption {
  /** Full formatted address string */
  label: string;
  /** Structured address data */
  data: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    lat?: number;
    lng?: number;
    placeId?: string;
  };
}

/**
 * Function type for fetching address suggestions
 */
export type GetAddressSuggestions = (
  query: string
) => Promise<AddressSuggestion[]>;

export interface AddressAutocompleteInputProps
  extends Omit<InputProps, "source"> {
  source: string;
  className?: string;
  placeholder?: string;
  /**
   * Custom function to fetch address suggestions.
   * If not provided, uses a mock implementation.
   */
  getAddressSuggestions?: GetAddressSuggestions;
  /**
   * Callback when a structured address is selected.
   * Can be used to populate related address fields.
   */
  onAddressSelect?: (address: AddressSuggestion["data"]) => void;
  /**
   * Debounce time for address lookups in ms (default: 300)
   */
  debounce?: number;
  /**
   * Minimum characters before searching (default: 3)
   */
  minChars?: number;
}

/**
 * Mock address suggestions for development/demo purposes.
 * In production, this would be replaced with a real geocoding service like:
 * - Google Places API
 * - Mapbox Geocoding API
 * - OpenStreetMap Nominatim
 * - HERE Geocoding API
 */
const mockGetAddressSuggestions: GetAddressSuggestions = async (query) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (!query || query.length < 3) {
    return [];
  }

  const lowerQuery = query.toLowerCase();

  // Mock address database
  const mockAddresses: AddressSuggestion[] = [
    {
      id: "1",
      label: "123 Main Street, New York, NY 10001",
      description: "New York, United States",
      data: {
        street1: "123 Main Street",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "US",
        lat: 40.7484,
        lng: -73.9967,
      },
    },
    {
      id: "2",
      label: "456 Oak Avenue, Los Angeles, CA 90001",
      description: "Los Angeles, United States",
      data: {
        street1: "456 Oak Avenue",
        city: "Los Angeles",
        state: "CA",
        zipCode: "90001",
        country: "US",
        lat: 33.9425,
        lng: -118.2551,
      },
    },
    {
      id: "3",
      label: "789 Maple Drive, Chicago, IL 60601",
      description: "Chicago, United States",
      data: {
        street1: "789 Maple Drive",
        city: "Chicago",
        state: "IL",
        zipCode: "60601",
        country: "US",
        lat: 41.8819,
        lng: -87.6278,
      },
    },
    {
      id: "4",
      label: "321 Pine Boulevard, Houston, TX 77001",
      description: "Houston, United States",
      data: {
        street1: "321 Pine Boulevard",
        city: "Houston",
        state: "TX",
        zipCode: "77001",
        country: "US",
        lat: 29.7604,
        lng: -95.3698,
      },
    },
    {
      id: "5",
      label: "555 Elm Street, Phoenix, AZ 85001",
      description: "Phoenix, United States",
      data: {
        street1: "555 Elm Street",
        city: "Phoenix",
        state: "AZ",
        zipCode: "85001",
        country: "US",
        lat: 33.4484,
        lng: -112.074,
      },
    },
    {
      id: "6",
      label: "100 Queen Street West, Toronto, ON M5H 2N2",
      description: "Toronto, Canada",
      data: {
        street1: "100 Queen Street West",
        city: "Toronto",
        state: "ON",
        zipCode: "M5H 2N2",
        country: "CA",
        lat: 43.6532,
        lng: -79.3832,
      },
    },
    {
      id: "7",
      label: "200 Granville Street, Vancouver, BC V6C 1S4",
      description: "Vancouver, Canada",
      data: {
        street1: "200 Granville Street",
        city: "Vancouver",
        state: "BC",
        zipCode: "V6C 1S4",
        country: "CA",
        lat: 49.2827,
        lng: -123.1207,
      },
    },
  ];

  // Filter addresses that match the query
  return mockAddresses.filter(
    (addr) =>
      addr.label.toLowerCase().includes(lowerQuery) ||
      addr.data.city?.toLowerCase().includes(lowerQuery) ||
      addr.data.state?.toLowerCase().includes(lowerQuery) ||
      addr.data.zipCode?.toLowerCase().includes(lowerQuery)
  );
};

/**
 * AddressAutocompleteInput - React Admin form control with address type-ahead functionality.
 *
 * This component provides a text input with address suggestions that appear as the user types.
 * When a suggestion is selected, it can populate related address fields in the form.
 *
 * Uses the Atlantis Autocomplete component for consistent styling.
 *
 * @example
 * // Basic usage - standalone address field
 * <AddressAutocompleteInput source="address.street1" placeholder="Start typing an address..." />
 *
 * @example
 * // With callback to populate related fields
 * <AddressAutocompleteInput
 *   source="address.street1"
 *   onAddressSelect={(address) => {
 *     form.change('address.city', address.city);
 *     form.change('address.state', address.state);
 *     form.change('address.zipCode', address.zipCode);
 *   }}
 * />
 *
 * @example
 * // With custom geocoding service
 * <AddressAutocompleteInput
 *   source="address.street1"
 *   getAddressSuggestions={async (query) => {
 *     const response = await fetch(`/api/geocode?q=${query}`);
 *     return response.json();
 *   }}
 * />
 */
export const AddressAutocompleteInput = (
  props: AddressAutocompleteInputProps
) => {
  const {
    source,
    className,
    placeholder,
    getAddressSuggestions = mockGetAddressSuggestions,
    onAddressSelect,
    debounce = 300,
    minChars = 3,
    helperText,
    label,
    ...rest
  } = props;

  const translate = useTranslate();
  const { id, field, isRequired, fieldState } = useInput({ ...props, source });

  // Adapter to convert address suggestions to autocomplete options
  const getOptions = useCallback(
    async (inputValue: string): Promise<AutocompleteOption[]> => {
      const suggestions = await getAddressSuggestions(inputValue);
      return suggestions;
    },
    [getAddressSuggestions]
  );

  // Handle address selection
  const handleSelect = useCallback(
    (option: AutocompleteOption) => {
      const addressSuggestion = option as AddressSuggestion;
      if (addressSuggestion.data && onAddressSelect) {
        onAddressSelect(addressSuggestion.data);
      }
    },
    [onAddressSelect]
  );

  // Handle value change
  const handleChange = useCallback(
    (value: string) => {
      field.onChange(value);
    },
    [field]
  );

  const defaultPlaceholder = useMemo(
    () =>
      placeholder ||
      translate("ra.action.search", { _: "Start typing an address..." }),
    [placeholder, translate]
  );

  return (
    <FormField className={cn("w-full", className)} id={id} name={source}>
      {label !== false && (
        <FormLabel>
          <FieldTitle
            label={label}
            source={source}
            isRequired={isRequired}
          />
        </FormLabel>
      )}
      <Autocomplete
        id={id}
        name={source}
        value={field.value || ""}
        onChange={handleChange}
        onSelect={handleSelect}
        getOptions={getOptions}
        debounce={debounce}
        minChars={minChars}
        placeholder={defaultPlaceholder}
        invalid={fieldState?.invalid}
        disabled={field.disabled}
        prefix="address"
        noResultsText="No addresses found"
        loadingText="Searching addresses..."
        ariaLabel={typeof label === "string" ? label : undefined}
      />
      <InputHelperText helperText={helperText} />
      <FormError />
    </FormField>
  );
};
