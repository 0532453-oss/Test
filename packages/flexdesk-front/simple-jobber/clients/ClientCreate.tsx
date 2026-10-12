import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Create, AtlantisSimpleForm, TextInput, SelectInput, BooleanInput, EmailInput, PhoneInput, AddressAutocompleteInput, useFormContext } from '@/components/admin';
import { required } from 'ra-core';
import { clientStatusChoices } from '../types';
import { Card, Heading, Text, Icon, InputGroup, Button, FormValidationBanner } from '../components/atlantis';
import { useFormState, useSuccessNotification } from '../components/atlantis/hooks';

// Title choices for honorific
const titleChoices = [
  { id: '', name: 'No title' },
  { id: 'MR', name: 'Mr.' },
  { id: 'MS', name: 'Ms.' },
  { id: 'MRS', name: 'Mrs.' },
  { id: 'MISS', name: 'Miss.' },
  { id: 'DR', name: 'Dr.' },
];

// Lead source choices
const leadSourceChoices = [
  { id: 'EXISTING_CLIENT', name: 'Existing Client' },
  { id: 'FACEBOOK', name: 'Facebook' },
  { id: 'FLYER', name: 'Flyer' },
  { id: 'GOOGLE', name: 'Google' },
  { id: 'INSTAGRAM', name: 'Instagram' },
  { id: 'REFERRAL', name: 'Referral' },
  { id: 'WEBSITE', name: 'Website' },
  { id: 'OTHER', name: 'Other' },
];

// Country choices
const countryChoices = [
  { id: 'US', name: 'United States' },
  { id: 'CA', name: 'Canada' },
  { id: 'MX', name: 'Mexico' },
  { id: 'GB', name: 'United Kingdom' },
  { id: 'AU', name: 'Australia' },
];

// Card-based section component with Atlantis Card
const FormSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <Card>
    <Card.Header className="px-4 py-3">
      <Heading level={4}>{title}</Heading>
      {description && (
        <Text variation="subdued" size="small" className="mt-1">{description}</Text>
      )}
    </Card.Header>
    <Card.Body>{children}</Card.Body>
  </Card>
);

// Collapsible Card section component
const CollapsibleSection = ({
  title,
  description,
  children,
  defaultOpen = false,
  actionButton,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  actionButton?: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card>
      <button
        type="button"
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[--color-surface--hover] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Icon name={isOpen ? 'arrowUp' : 'arrowDown'} size="base" className="text-[--color-text--secondary]" />
          <Text element="span" className="font-semibold">{title}</Text>
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {actionButton}
        </div>
      </button>
      {isOpen && (
        <Card.Body>
          {description && (
            <Text variation="subdued" size="small" className="mb-4">{description}</Text>
          )}
          {children}
        </Card.Body>
      )}
    </Card>
  );
};

// Address autocomplete with form integration
const AddressSection = () => {
  const { setValue } = useFormContext();

  const handleAddressSelect = (address: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    lat?: number;
    lng?: number;
  }) => {
    // Populate form fields with selected address data
    if (address.street1) setValue('address.street1', address.street1);
    if (address.city) setValue('address.city', address.city);
    if (address.state) setValue('address.state', address.state);
    if (address.zipCode) setValue('address.zipCode', address.zipCode);
    if (address.country) setValue('address.country', address.country);
    if (address.lat) setValue('address.lat', address.lat);
    if (address.lng) setValue('address.lng', address.lng);
  };

  return (
    <FormSection
      title="Property address"
      description="Enter the primary service address, billing address, or any additional locations where services may take place."
    >
      <AddressAutocompleteInput
        source="address.street1"
        label={false}
        placeholder="Start typing an address..."
        onAddressSelect={handleAddressSelect}
        debounce={300}
        minChars={3}
      />
      <TextInput
        source="address.street2"
        label={false}
        placeholder="Apt, Suite, Unit (optional)"
        inputClassName="h-[3.75rem] py-3.5 px-4"
      />

      {/* City / State row */}
      <InputGroup flowDirection="horizontal">
        <TextInput
          source="address.city"
          label={false}
          placeholder="City"
          inputClassName="h-[3.75rem] py-3.5 px-4"
          className="flex-1"
        />
        <TextInput
          source="address.state"
          label={false}
          placeholder="State"
          inputClassName="h-[3.75rem] py-3.5 px-4"
          className="flex-1"
        />
      </InputGroup>

      {/* ZIP / Country row */}
      <InputGroup flowDirection="horizontal">
        <TextInput
          source="address.zipCode"
          label={false}
          placeholder="ZIP code"
          inputClassName="h-[3.75rem] py-3.5 px-4"
          className="flex-1"
        />
        <SelectInput
          source="address.country"
          label={false}
          choices={countryChoices}
          emptyText="Select a country"
          className="flex-1"
        />
      </InputGroup>

      {/* Billing address checkbox */}
      <div className="flex items-center gap-2 mt-4">
        <BooleanInput
          source="billingAddressSameAsProperty"
          label="Billing address is the same as property address"
        />
      </div>

      <Button type="tertiary" variation="subtle" size="small" icon="add">
        Add Another Address
      </Button>
    </FormSection>
  );
};

// Custom toolbar with Atlantis Button components
const ClientFormToolbar = () => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between pt-6 mt-6 border-t border-border/50">
      <Button type="secondary" size="base" label="Cancel" onClick={() => navigate(-1)} />
      <div className="flex items-center gap-3">
        <Button type="secondary" size="base">
          Save and Create Another
        </Button>
        <Button type="primary" size="base" label="Save client" submit />
      </div>
    </div>
  );
};

export const ClientCreate = () => {
  // Track form state for unsaved changes warning using Atlantis useFormState hook
  const { setFormState, hasUnsavedChanges } = useFormState();
  const { mutationOptions } = useSuccessNotification('created', { resourceLabel: 'Client' });

  // hasUnsavedChanges can be used for unsaved changes warnings
  // Example: window.onbeforeunload when hasUnsavedChanges is true

  return (
    <Create title="New Client" mutationOptions={mutationOptions}>
      <AtlantisSimpleForm
        defaultValues={{
          status: 'LEAD',
          billingAddressSameAsProperty: true,
        }}
        toolbar={<ClientFormToolbar />}
        className="max-w-4xl mx-auto"
        onStateChange={setFormState}
      >
      <FormValidationBanner />

      {/* Primary Contact Details */}
      <FormSection
        title="Primary contact details"
        description="Provide the main point of contact to ensure smooth communication and reliable client records."
      >
        {/* Name row: Title | First name | Last name */}
        <InputGroup flowDirection="horizontal">
          <SelectInput
            source="title"
            label="Title"
            choices={titleChoices}
            emptyText="No title"
            className="w-28"
            helperText={false}
          />
          <TextInput
            source="firstName"
            label={false}
            placeholder="First name"
            className="flex-1"
            inputClassName="h-[3.75rem] py-3.5 px-4 border-0"
          />
          <TextInput
            source="lastName"
            label={false}
            placeholder="Last name"
            className="flex-1"
            inputClassName="h-[3.75rem] py-3.5 px-4 border-0"
          />
        </InputGroup>

        {/* Company name */}
        <TextInput
          source="companyName"
          label={false}
          placeholder="Company name"
          inputClassName="h-[3.75rem] py-3.5 px-4"
        />
      </FormSection>

      {/* Communication */}
      <FormSection
        title="Communication"
      >
        <PhoneInput
          source="phone"
          label={false}
          placeholder="(555) 555-5555"
        />
        <EmailInput
          source="email"
          label={false}
          placeholder="Email"
        />
        <Button type="tertiary" variation="subtle" size="small" icon="cog">
          Communication settings
        </Button>
      </FormSection>

      {/* Lead Information */}
      <FormSection
        title="Lead information"
      >
        <SelectInput
          source="leadSource"
          label={false}
          choices={leadSourceChoices}
          emptyText="Lead source"
          className="max-w-md"
        />
      </FormSection>

      {/* Additional Client Details - Collapsible */}
      <CollapsibleSection
        title="Additional client details"
        description="Need to gather specialized information? Create custom fields to capture exactly what matters to you."
        actionButton={
          <Button type="tertiary" variation="subtle" size="small" icon="add">
            Add custom field
          </Button>
        }
      >
        <TextInput
          source="notes"
          label="Internal notes"
          placeholder="Add notes about this client..."
          multiline
          rows={3}
        />
      </CollapsibleSection>

      {/* Additional Contacts - Collapsible */}
      <CollapsibleSection
        title="Additional contacts"
        description="For contacts with access to all properties, e.g., spouse or family for residential, or property or regional managers for commercial."
        actionButton={
          <Button type="tertiary" variation="subtle" size="small" icon="add">
            Add contact
          </Button>
        }
      />

      {/* Property Address - with autocomplete */}
      <AddressSection />

      {/* Property Details - Collapsible */}
      <CollapsibleSection
        title="Property details"
        description="Need to gather specialized information? Create custom fields to capture exactly what matters to you."
        actionButton={
          <Button type="tertiary" variation="subtle" size="small" icon="add">
            Add custom field
          </Button>
        }
      />
    </AtlantisSimpleForm>
  </Create>
  );
};
