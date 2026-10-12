import { Edit, AtlantisSimpleForm, TextInput, SelectInput, AtlantisFormToolbar, EmailInput, PhoneInput } from '@/components/admin';
import { required } from 'ra-core';
import { clientStatusChoices } from '../types';
import { Heading, InputGroup, FormValidationBanner, InputAvatar } from '../components/atlantis';
import { useFormState, useSuccessNotification } from '../components/atlantis/hooks';

export const ClientEdit = () => {
  // Track form state for unsaved changes warning using Atlantis useFormState hook
  const { setFormState, hasUnsavedChanges } = useFormState();
  const { mutationOptions } = useSuccessNotification('updated', { resourceLabel: 'Client' });

  // hasUnsavedChanges can be used for unsaved changes warnings

  return (
    <Edit mutationOptions={mutationOptions}>
      <AtlantisSimpleForm
        toolbar={
          <AtlantisFormToolbar className="pt-4 pb-4 sticky bottom-0 bg-linear-to-b from-transparent to-background to-10%" />
        }
        className="max-w-4xl mx-auto"
        onStateChange={setFormState}
      >
        <FormValidationBanner />

        {/* Profile Photo */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Heading level={6} className="min-w-36 pt-2">Photo</Heading>
          <div className="border rounded-lg p-6 bg-[--color-surface--background] flex-1">
            <InputAvatar />
          </div>
        </div>

        {/* Identity Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Heading level={6} className="min-w-36 pt-2">Client Info</Heading>
          <div className="border rounded-lg p-6 bg-[--color-surface--background] flex-1 flex flex-col gap-5">
            <TextInput
              source="name"
              label="Client Name"
              validate={required()}
              className="[&>input]:bg-[--color-surface]"
            />
            <InputGroup flowDirection="horizontal">
              <EmailInput
                source="email"
                label="Email"
                className="flex-1"
              />
              <PhoneInput
                source="phone"
                label="Phone"
                className="flex-1"
              />
            </InputGroup>
            <SelectInput
              source="status"
              label="Status"
              choices={clientStatusChoices}
              className="[&_button]:bg-[--color-surface]"
            />
          </div>
        </div>

        {/* Address Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Heading level={6} className="min-w-36 pt-2">Address</Heading>
          <div className="border rounded-lg p-6 bg-[--color-surface--background] flex-1 flex flex-col gap-5">
            <TextInput
              source="address.street"
              label="Street Address"
              className="[&>input]:bg-[--color-surface]"
            />
            <InputGroup flowDirection="horizontal">
              <TextInput
                source="address.city"
                label="City"
                className="flex-1 [&>input]:bg-[--color-surface]"
              />
              <TextInput
                source="address.state"
                label="State"
                className="w-24 [&>input]:bg-[--color-surface]"
              />
              <TextInput
                source="address.zipCode"
                label="ZIP Code"
                className="w-32 [&>input]:bg-[--color-surface]"
              />
            </InputGroup>
          </div>
        </div>

        {/* Notes Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Heading level={6} className="min-w-36 pt-2">Notes</Heading>
          <div className="border rounded-lg p-6 bg-[--color-surface--background] flex-1">
            <TextInput
              source="notes"
              label="Notes"
              multiline
              className="[&>textarea]:bg-[--color-surface]"
            />
          </div>
        </div>
      </AtlantisSimpleForm>
    </Edit>
  );
};
