import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Create,
  AtlantisSimpleForm,
  TextInput,
  SelectInput,
  AutocompleteInput,
  ReferenceInput,
  BooleanInput,
  AddressAutocompleteInput,
  useFormContext,
} from '@/components/admin';
import { required } from 'ra-core';
import { jobPriorityChoices } from '../types';
import { Card, Heading, Text, Icon, InputTime, InputGroup, Button, DatePicker, FormatFile, InputFile, FormValidationBanner, InlineBanner, ProgressBar, RecurringSelect, DurationPeriod } from '../components/atlantis';
import type { FileUpload, RecurrenceRule } from '../components/atlantis';
import { useFormState, useSuccessNotification } from '../components/atlantis/hooks';

// Two-column section layout using Tailwind
const FormSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="py-6 border-b border-border/50 last:border-b-0 flex flex-col lg:flex-row gap-6">
    <div className="lg:w-56 shrink-0">
      <Heading level={4}>{title}</Heading>
      {description && (
        <Text variation="subdued" size="small" className="mt-1 leading-relaxed">{description}</Text>
      )}
    </div>
    <div className="flex-1 space-y-4">{children}</div>
  </div>
);

// Collapsible section component using Atlantis Card
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
    <Card className="mb-3">
      <button
        type="button"
        className="w-full flex justify-between items-center p-4 font-semibold cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Text element="span" size="small" className="font-semibold">{title}</Text>
        <div className="flex items-center gap-3">
          {actionButton}
          {isOpen ? (
            <Icon name="arrowUp" size="base" className="text-[--color-text--secondary]" />
          ) : (
            <Icon name="arrowDown" size="base" className="text-[--color-text--secondary]" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          {description && (
            <Text variation="subdued" size="small" className="mb-4">{description}</Text>
          )}
          {children}
        </div>
      )}
    </Card>
  );
};

type JobType = 'ONE_OFF' | 'RECURRING';

const JobTypeToggle = ({
  value,
  onChange,
}: {
  value: JobType;
  onChange: (value: JobType) => void;
}) => (
  <div className="flex rounded-lg border border-[--color-border] overflow-hidden w-fit">
    <button
      type="button"
      onClick={() => onChange('ONE_OFF')}
      className={`px-5 py-2.5 text-sm font-medium transition-colors ${
        value === 'ONE_OFF'
          ? 'bg-[--color-interactive] text-[--color-text--reverse]'
          : 'bg-[--color-surface] text-[--color-text--secondary] hover:bg-[--color-surface--hover]'
      }`}
    >
      One-off
    </button>
    <button
      type="button"
      onClick={() => onChange('RECURRING')}
      className={`px-5 py-2.5 text-sm font-medium transition-colors border-l border-[--color-border] ${
        value === 'RECURRING'
          ? 'bg-[--color-interactive] text-[--color-text--reverse]'
          : 'bg-[--color-surface] text-[--color-text--secondary] hover:bg-[--color-surface--hover]'
      }`}
    >
      Recurring
    </button>
  </div>
);

// Time input field wrapper using Atlantis InputTime
const TimeInputField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="space-y-2">
    <Text element="span" size="small" variation="subdued">{label}</Text>
    <InputTime
      value={value}
      onChange={onChange}
      className="w-36"
      ariaLabel={label}
    />
  </div>
);

// DatePicker wrapper for react-admin form integration with date range validation
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

  // Convert form string value (YYYY-MM-DD) to Date object for DatePicker
  const selectedDate = formValue ? new Date(formValue + 'T00:00:00') : undefined;

  // Convert minDateSource value to Date for minDate constraint (end date cannot be before start date)
  const minDate = minDateValue ? new Date(minDateValue + 'T00:00:00') : undefined;
  const validMinDate = minDate && !isNaN(minDate.getTime()) ? minDate : undefined;

  const handleDateChange = (date: Date) => {
    // Convert Date to YYYY-MM-DD string for form state
    const yyyy = date.getFullYear().toString();
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    setValue(source, `${yyyy}-${mm}-${dd}`, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className={className}>
      <Text element="span" size="small" variation="subdued">{label}</Text>
      <div className="mt-2">
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          minDate={validMinDate}
          fullWidth
        />
      </div>
    </div>
  );
};

// Country choices for job location
const countryChoices = [
  { id: 'US', name: 'United States' },
  { id: 'CA', name: 'Canada' },
];

// Address section with autocomplete
const JobAddressSection = () => {
  const { setValue } = useFormContext();

  const handleAddressSelect = (address: {
    street1?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    lat?: number;
    lng?: number;
  }) => {
    // Populate form fields with selected address data
    if (address.street1) setValue('address.street', address.street1);
    if (address.city) setValue('address.city', address.city);
    if (address.state) setValue('address.state', address.state);
    if (address.zipCode) setValue('address.zipCode', address.zipCode);
    if (address.country) setValue('address.country', address.country);
    if (address.lat) setValue('address.lat', address.lat);
    if (address.lng) setValue('address.lng', address.lng);
  };

  return (
    <FormSection
      title="Location"
      description="Service address for this job."
    >
      <AddressAutocompleteInput
        source="address.street"
        label={false}
        placeholder="Start typing an address..."
        onAddressSelect={handleAddressSelect}
        debounce={300}
        minChars={3}
      />
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
          emptyText="Select country"
          className="flex-1"
        />
      </InputGroup>
    </FormSection>
  );
};

// Toolbar with Atlantis Button components
const JobFormToolbar = () => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between pt-6 mt-6 border-t border-border/50">
      <Button type="secondary" size="base" label="Cancel" onClick={() => navigate(-1)} />
      <div className="flex items-center gap-3">
        <Button type="secondary" size="base">
          Save as draft
        </Button>
        <Button type="primary" size="base" label="Save Job" submit />
      </div>
    </div>
  );
};

// Attachments section with file upload and FormatFile display
const AttachmentsSection = () => {
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);

  const handleUploadStart = (file: FileUpload) => {
    setUploadedFiles((prev) => [...prev, file]);
  };

  const handleUploadProgress = (file: FileUpload) => {
    setUploadedFiles((prev) =>
      prev.map((f) => (f.key === file.key ? file : f))
    );
  };

  const handleUploadComplete = (file: FileUpload) => {
    setUploadedFiles((prev) =>
      prev.map((f) => (f.key === file.key ? file : f))
    );
  };

  const handleDelete = (key: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.key !== key));
  };

  const uploadsInProgress = uploadedFiles.filter((f) => f.progress < 1);
  const overallProgress = uploadsInProgress.length > 0
    ? Math.round(uploadsInProgress.reduce((sum, f) => sum + f.progress, 0) / uploadsInProgress.length * 100)
    : 0;

  return (
    <CollapsibleSection
      title="Attachments"
      description="Photos, documents, and other files."
      actionButton={
        <Button
          type="tertiary"
          variation="subtle"
          size="small"
          icon="add"
          onClick={(e) => e.stopPropagation()}
        >
          Add file
        </Button>
      }
    >
      {uploadsInProgress.length > 0 && (
        <div className="mb-4">
          <Text size="small" variation="subdued">
            Uploading {uploadsInProgress.length} file{uploadsInProgress.length > 1 ? 's' : ''}... {overallProgress}%
          </Text>
          <ProgressBar currentStep={overallProgress} totalSteps={100} size="small" />
        </div>
      )}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2 mb-4">
          {uploadedFiles.map((file) => (
            <FormatFile
              key={file.key}
              file={file}
              onDelete={() => handleDelete(file.key)}
            />
          ))}
        </div>
      )}
      <InputFile
        allowedTypes="all"
        allowMultiple
        maxFileSize={10 * 1024 * 1024}
        onUploadStart={handleUploadStart}
        onUploadProgress={handleUploadProgress}
        onUploadComplete={handleUploadComplete}
        getUploadParams={(file) => ({
          url: '/api/upload',
          key: file.name,
        })}
      />
    </CollapsibleSection>
  );
};

export const JobCreate = () => {
  const [jobType, setJobType] = useState<JobType>('ONE_OFF');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [scheduleLater, setScheduleLater] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>({
    interval: 1,
    type: DurationPeriod.Week,
    weekDays: new Set(),
  });

  // Track form state for unsaved changes warning using Atlantis useFormState hook
  const { setFormState, hasUnsavedChanges } = useFormState();
  const { mutationOptions } = useSuccessNotification('created', { resourceLabel: 'Job' });

  // hasUnsavedChanges can be used for unsaved changes warnings

  return (
    <Create title="New Job" mutationOptions={mutationOptions}>
      <AtlantisSimpleForm
        defaultValues={{
          status: 'SCHEDULED',
          priority: 'MEDIUM',
        }}
        toolbar={<JobFormToolbar />}
        className="max-w-4xl mx-auto"
        onStateChange={setFormState}
      >
        <FormValidationBanner />

        {/* Job Details */}
        <FormSection
          title="Job details"
          description="Basic information about the job."
        >
          <TextInput
            source="title"
            label={false}
            placeholder="Job title"
            validate={required()}
            inputClassName="h-[3.75rem] py-3.5 px-4"
          />
          <InputGroup flowDirection="horizontal">
            <TextInput
              source="jobNumber"
              label={false}
              placeholder="Job # (auto-generated)"
              inputClassName="h-[3.75rem] py-3.5 px-4"
              className="flex-1"
            />
            <SelectInput
              source="priority"
              label={false}
              choices={jobPriorityChoices}
              emptyText="Priority"
              className="flex-1"
            />
          </InputGroup>
        </FormSection>

        {/* Client */}
        <FormSection
          title="Client"
          description="Who is this job for?"
        >
          <ReferenceInput source="clientId" reference="clients">
            <AutocompleteInput
              label={false}
              optionText="name"
              validate={required()}
              placeholder="Search clients..."
            />
          </ReferenceInput>
          <button type="button" className="text-sm text-[--color-interactive] hover:underline font-medium">
            + Create new client
          </button>
        </FormSection>

        {/* Job Type */}
        <FormSection
          title="Job type"
          description="Is this a one-time or recurring job?"
        >
          <JobTypeToggle value={jobType} onChange={setJobType} />
          {jobType === 'RECURRING' && (
            <RecurringSelect
              value={recurrenceRule}
              onChange={setRecurrenceRule}
            />
          )}
        </FormSection>

        {/* Schedule */}
        <FormSection
          title="Schedule"
          description="When should this job be done?"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <BooleanInput
                source="scheduleLater"
                label="Schedule later"
                onChange={(e) => setScheduleLater(e.target.checked)}
              />
            </div>

            {scheduleLater && (
              <InlineBanner variant="warning">
                Unscheduled jobs won't appear on the calendar. You can schedule them later from the job detail page or the schedule view.
              </InlineBanner>
            )}

            {!scheduleLater && (
              <>
                <InputGroup flowDirection="horizontal">
                  <DatePickerField
                    source="scheduledStartAt"
                    label="Start date"
                    className="flex-1"
                  />
                  <DatePickerField
                    source="scheduledEndAt"
                    label="End date"
                    className="flex-1"
                    minDateSource="scheduledStartAt"
                  />
                </InputGroup>
                <InputGroup flowDirection="horizontal">
                  <TimeInputField
                    label="Start time"
                    value={startTime}
                    onChange={setStartTime}
                  />
                  <TimeInputField
                    label="End time"
                    value={endTime}
                    onChange={setEndTime}
                  />
                </InputGroup>
              </>
            )}
          </div>
        </FormSection>

        {/* Team */}
        <FormSection
          title="Team"
          description="Who will do this job?"
        >
          <ReferenceInput source="assignedToId" reference="teamMembers">
            <AutocompleteInput
              label={false}
              optionText="name"
              placeholder="Search team members..."
            />
          </ReferenceInput>
        </FormSection>

        {/* Location - with autocomplete */}
        <JobAddressSection />

        {/* Line Items - Collapsible */}
        <CollapsibleSection
          title="Line items"
          description="Products and services for this job."
          actionButton={
            <Button
              type="tertiary"
              variation="subtle"
              size="small"
              icon="add"
              onClick={(e) => e.stopPropagation()}
            >
              Add line item
            </Button>
          }
        >
          <div className="p-4 rounded-lg bg-[--color-surface--hover] border border-border/40 text-center">
            <Text variation="subdued" size="small">
              No line items added yet. Click "Add line item" to add products or services.
            </Text>
          </div>
        </CollapsibleSection>

        {/* Instructions */}
        <FormSection
          title="Instructions"
          description="Visible to team members."
        >
          <TextInput
            source="description"
            label={false}
            placeholder="Add instructions for this job..."
            multiline
            rows={4}
          />
        </FormSection>

        {/* Internal Notes - Collapsible */}
        <CollapsibleSection
          title="Internal notes"
          description="Only visible to you and admins."
          defaultOpen={false}
        >
          <InlineBanner variant="info" className="mb-3">
            Internal notes are only visible to you and other admins. Team members assigned to this job will not see these notes.
          </InlineBanner>
          <TextInput
            source="notes"
            label={false}
            placeholder="Add internal notes..."
            multiline
            rows={3}
          />
        </CollapsibleSection>

        {/* Attachments - Collapsible */}
        <AttachmentsSection />
      </AtlantisSimpleForm>
    </Create>
  );
};
