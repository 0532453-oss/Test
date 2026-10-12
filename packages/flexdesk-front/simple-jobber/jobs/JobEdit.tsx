import {
  Edit,
  AtlantisSimpleForm,
  TextInput,
  SelectInput,
  AutocompleteInput,
  ReferenceInput,
  NumberInput,
  AtlantisFormToolbar,
  useFormContext,
} from '@/components/admin';
import { required } from 'ra-core';
import { jobStatusChoices, jobPriorityChoices } from '../types';
import { useState } from 'react';
import { Heading, InputGroup, DatePicker, Text, InputTime, FormValidationBanner, InlineBanner, RecurringSelect, DurationPeriod } from '../components/atlantis';
import type { RecurrenceRule } from '../components/atlantis';
import { useFormState, useSuccessNotification } from '../components/atlantis/hooks';

// DatePicker wrapper for react-admin form integration (edit mode)
// Handles ISO datetime strings from the API, extracting just the date portion
const DatePickerField = ({
  source,
  label,
  className,
  minDateSource,
}: {
  source: string;
  label: string;
  className?: string;
  minDateSource?: string;
}) => {
  const { setValue, watch } = useFormContext();
  const formValue = watch(source);
  const minDateValue = minDateSource ? watch(minDateSource) : undefined;

  // Convert form value (ISO string or YYYY-MM-DDTHH:MM) to Date object for DatePicker
  const selectedDate = formValue ? new Date(formValue) : undefined;
  // Ensure invalid dates don't crash the DatePicker
  const validSelectedDate =
    selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate : undefined;

  // Convert minDateSource value to Date for minDate constraint (end date cannot be before start date)
  const minDate = minDateValue ? new Date(minDateValue) : undefined;
  const validMinDate = minDate && !isNaN(minDate.getTime()) ? minDate : undefined;

  const handleDateChange = (date: Date) => {
    // Preserve existing time from the current value, or default to midnight
    let hours = 0;
    let minutes = 0;
    if (formValue) {
      const existing = new Date(formValue);
      if (!isNaN(existing.getTime())) {
        hours = existing.getHours();
        minutes = existing.getMinutes();
      }
    }
    // Build new datetime with selected date + preserved time
    const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
    setValue(source, newDate.toISOString(), { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className={className}>
      <Text element="span" size="small" variation="subdued">{label}</Text>
      <div className="mt-2">
        <DatePicker
          selected={validSelectedDate}
          onChange={handleDateChange}
          minDate={validMinDate}
          fullWidth
        />
      </div>
    </div>
  );
};

// Time input field wrapper for react-admin form integration (edit mode)
// Extracts time from an ISO datetime string and writes back a full ISO string
const TimeInputField = ({
  source,
  label,
  className,
}: {
  source: string;
  label: string;
  className?: string;
}) => {
  const { setValue, watch } = useFormContext();
  const formValue = watch(source);

  // Extract HH:MM from the form value (ISO string or YYYY-MM-DDTHH:MM)
  let timeValue = '00:00';
  if (formValue) {
    const existing = new Date(formValue);
    if (!isNaN(existing.getTime())) {
      const hh = existing.getHours().toString().padStart(2, '0');
      const mm = existing.getMinutes().toString().padStart(2, '0');
      timeValue = `${hh}:${mm}`;
    }
  }

  const handleTimeChange = (newTime: string) => {
    // Parse the new time and combine with existing date
    const [hours, minutes] = newTime.split(':').map(Number);
    let baseDate = new Date();
    if (formValue) {
      const existing = new Date(formValue);
      if (!isNaN(existing.getTime())) {
        baseDate = existing;
      }
    }
    const newDate = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hours || 0,
      minutes || 0,
    );
    setValue(source, newDate.toISOString(), { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className={className}>
      <Text element="span" size="small" variation="subdued">{label}</Text>
      <div className="mt-2">
        <InputTime
          value={timeValue}
          onChange={handleTimeChange}
          className="w-36"
          ariaLabel={label}
        />
      </div>
    </div>
  );
};

export const JobEdit = () => {
  // Track form state for unsaved changes warning using Atlantis useFormState hook
  const { setFormState, hasUnsavedChanges } = useFormState();
  const { mutationOptions } = useSuccessNotification('updated', { resourceLabel: 'Job' });
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>({
    interval: 1,
    type: DurationPeriod.Week,
    weekDays: new Set(),
  });

  // hasUnsavedChanges can be used for unsaved changes warnings

  return (
    <Edit mutationOptions={mutationOptions}>
      <AtlantisSimpleForm
        className="max-w-4xl mx-auto"
        toolbar={
          <AtlantisFormToolbar className="pt-4 pb-4 sticky bottom-0 bg-linear-to-b from-transparent to-background to-10%" />
        }
        onStateChange={setFormState}
      >
        <FormValidationBanner />

        {/* Basic Info Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Heading level={6} className="min-w-32">Job Info</Heading>
          <div className="border rounded-sm p-4 bg-[--color-surface--background] flex-1 flex flex-col gap-4">
            <TextInput
              source="title"
              label="Job Title"
              validate={required()}
              className="[&>input]:bg-[--color-surface]"
            />
            <ReferenceInput source="clientId" reference="clients">
              <AutocompleteInput
                label="Client"
                optionText="name"
                validate={required()}
                placeholder="Search clients..."
              />
            </ReferenceInput>
            <TextInput
              source="description"
              label="Description"
              multiline
              className="[&>textarea]:bg-[--color-surface]"
            />
          </div>
        </div>

        {/* Status & Priority Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Heading level={6} className="min-w-32">Status</Heading>
          <div className="border rounded-sm p-4 bg-[--color-surface--background] flex-1 flex flex-col gap-4">
            <InlineBanner variant="info">
              Changing the status to "Completed" will mark this job as done. Status changes may affect scheduling and reporting.
            </InlineBanner>
            <InputGroup flowDirection="horizontal">
              <SelectInput
                source="status"
                label="Status"
                choices={jobStatusChoices}
                className="flex-1 [&_button]:bg-[--color-surface]"
              />
              <SelectInput
                source="priority"
                label="Priority"
                choices={jobPriorityChoices}
                className="flex-1 [&_button]:bg-[--color-surface]"
              />
            </InputGroup>
          </div>
        </div>

        {/* Schedule Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Heading level={6} className="min-w-32">Schedule</Heading>
          <div className="border rounded-sm p-4 bg-[--color-surface--background] flex-1 flex flex-col gap-4">
            <InputGroup flowDirection="horizontal">
              <DatePickerField
                source="scheduledStartAt"
                label="Start Date"
                className="flex-1"
              />
              <DatePickerField
                source="scheduledEndAt"
                label="End Date"
                className="flex-1"
                minDateSource="scheduledStartAt"
              />
            </InputGroup>
            <InputGroup flowDirection="horizontal">
              <TimeInputField
                source="scheduledStartAt"
                label="Start Time"
                className="flex-1"
              />
              <TimeInputField
                source="scheduledEndAt"
                label="End Time"
                className="flex-1"
              />
            </InputGroup>
            <NumberInput
              source="estimatedDuration"
              label="Estimated Duration (minutes)"
              min={0}
              step={15}
              className="[&>input]:bg-[--color-surface]"
            />
          </div>
        </div>

        {/* Recurrence Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Heading level={6} className="min-w-32">Recurrence</Heading>
          <div className="border rounded-sm p-4 bg-[--color-surface--background] flex-1 flex flex-col gap-4">
            <RecurringSelect
              value={recurrenceRule}
              onChange={setRecurrenceRule}
            />
          </div>
        </div>

        {/* Assignment Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Heading level={6} className="min-w-32">Assignment</Heading>
          <div className="border rounded-sm p-4 bg-[--color-surface--background] flex-1">
            <ReferenceInput source="assignedToId" reference="teamMembers">
              <AutocompleteInput
                label="Assign To"
                optionText="name"
                placeholder="Search team members..."
              />
            </ReferenceInput>
          </div>
        </div>

        {/* Address Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Heading level={6} className="min-w-32">Location</Heading>
          <div className="border rounded-sm p-4 bg-[--color-surface--background] flex-1 flex flex-col gap-4">
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
          <Heading level={6} className="min-w-32">Notes</Heading>
          <div className="border rounded-sm p-4 bg-[--color-surface--background] flex-1 flex flex-col gap-4">
            <InlineBanner variant="info">
              Internal notes are only visible to you and other admins. Team members will not see these notes.
            </InlineBanner>
            <TextInput
              source="notes"
              label="Internal Notes"
              multiline
              className="[&>textarea]:bg-[--color-surface]"
            />
          </div>
        </div>
      </AtlantisSimpleForm>
    </Edit>
  );
};
