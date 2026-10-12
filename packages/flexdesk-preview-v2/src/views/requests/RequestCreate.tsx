import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Create,
  AtlantisSimpleForm,
  TextInput,
  SelectInput,
  AutocompleteInput,
  ReferenceInput,
  NumberInput,
  useFormContext,
} from '@/components/admin'
import { required } from 'ra-core'
import { requestStatusChoices } from '@/types'
import {
  Card,
  Heading,
  Text,
  Icon,
  InputGroup,
  Button,
  DatePicker,
  FormatFile,
  InputFile,
  FormValidationBanner,
  ProgressBar,
  useFormState,
  useSuccessNotification,
} from '@/atlantis'
import type { FileUpload } from '@/atlantis'

// Lead source choices
const leadSourceChoices = [
  { id: 'EXISTING_CLIENT', name: 'Existing Client' },
  { id: 'FACEBOOK', name: 'Facebook' },
  { id: 'GOOGLE', name: 'Google' },
  { id: 'INSTAGRAM', name: 'Instagram' },
  { id: 'REFERRAL', name: 'Referral' },
  { id: 'WEBSITE', name: 'Website' },
  { id: 'PHONE', name: 'Phone Call' },
  { id: 'OTHER', name: 'Other' },
]

// Card-based section component with Atlantis Card
const FormSection = ({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) => (
  <Card>
    <Card.Header className="px-4 py-3">
      <Heading level={4}>{title}</Heading>
      {description && (
        <Text variation="subdued" size="small" className="mt-1">
          {description}
        </Text>
      )}
    </Card.Header>
    <Card.Body>{children}</Card.Body>
  </Card>
)

// Collapsible Card section component
const CollapsibleSection = ({
  title,
  description,
  children,
  defaultOpen = false,
  actionButton,
}: {
  title: string
  description?: string
  children?: React.ReactNode
  defaultOpen?: boolean
  actionButton?: React.ReactNode
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsOpen(!isOpen)
    }
  }

  return (
    <Card>
      <div className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--color-surface--hover)] transition-colors">
        <div
          role="button"
          tabIndex={0}
          className="flex items-center gap-2 cursor-pointer flex-1"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
        >
          <Icon
            name={isOpen ? 'arrowUp' : 'arrowDown'}
            size="base"
            className="text-[var(--color-text--secondary)]"
          />
          <Text element="span" className="font-semibold">
            {title}
          </Text>
        </div>
        {actionButton && (
          <div className="flex items-center gap-3">
            {actionButton}
          </div>
        )}
      </div>
      {isOpen && (
        <Card.Body>
          {description && (
            <Text variation="subdued" size="small" className="mb-4">
              {description}
            </Text>
          )}
          {children}
        </Card.Body>
      )}
    </Card>
  )
}

// DatePicker wrapper for react-admin form integration with date range validation
const DatePickerField = ({
  source,
  label,
  className,
  minDateSource,
}: {
  source: string
  label: string
  className?: string
  minDateSource?: string
}) => {
  const { setValue, watch } = useFormContext()
  const formValue = watch(source)
  const minDateValue = minDateSource ? watch(minDateSource) : undefined

  // Convert form string value (YYYY-MM-DD) to Date object for DatePicker
  const selectedDate = formValue
    ? new Date(formValue + 'T00:00:00')
    : undefined

  // Convert minDateSource value to Date for minDate constraint
  const minDate = minDateValue
    ? new Date(minDateValue + 'T00:00:00')
    : undefined
  const validMinDate =
    minDate && !isNaN(minDate.getTime()) ? minDate : undefined

  const handleDateChange = (date: Date) => {
    // Convert Date to YYYY-MM-DD string for form state
    const yyyy = date.getFullYear().toString()
    const mm = (date.getMonth() + 1).toString().padStart(2, '0')
    const dd = date.getDate().toString().padStart(2, '0')
    setValue(source, `${yyyy}-${mm}-${dd}`, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  return (
    <div className={className}>
      <Text element="span" size="small" variation="subdued">
        {label}
      </Text>
      <div className="mt-2">
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          minDate={validMinDate}
          fullWidth
        />
      </div>
    </div>
  )
}

// Custom toolbar with Atlantis Button components
const RequestFormToolbar = () => {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-between pt-6 mt-6 border-t border-border/50">
      <Button
        type="secondary"
        size="base"
        label="Cancel"
        onClick={() => navigate(-1)}
      />
      <div className="flex items-center gap-3">
        <Button type="secondary" size="base">
          Save as draft
        </Button>
        <Button type="primary" size="base" label="Save Request" submit />
      </div>
    </div>
  )
}

// Attachments section with file upload and FormatFile display
const AttachmentsSection = () => {
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([])

  const handleUploadStart = (file: FileUpload) => {
    setUploadedFiles((prev) => [...prev, file])
  }

  const handleUploadProgress = (file: FileUpload) => {
    setUploadedFiles((prev) =>
      prev.map((f) => (f.key === file.key ? file : f))
    )
  }

  const handleUploadComplete = (file: FileUpload) => {
    setUploadedFiles((prev) =>
      prev.map((f) => (f.key === file.key ? file : f))
    )
  }

  const handleDelete = (key: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.key !== key))
  }

  const uploadsInProgress = uploadedFiles.filter((f) => f.progress < 1)
  const overallProgress =
    uploadsInProgress.length > 0
      ? Math.round(
          (uploadsInProgress.reduce((sum, f) => sum + f.progress, 0) /
            uploadsInProgress.length) *
            100
        )
      : 0

  return (
    <CollapsibleSection
      title="Attachments"
      description="Photos, documents, or other files from the client."
      actionButton={
        <Button type="tertiary" variation="subtle" size="small" icon="add">
          Add file
        </Button>
      }
    >
      {uploadsInProgress.length > 0 && (
        <div className="mb-4">
          <Text size="small" variation="subdued">
            Uploading {uploadsInProgress.length} file
            {uploadsInProgress.length > 1 ? 's' : ''}... {overallProgress}%
          </Text>
          <ProgressBar
            currentStep={overallProgress}
            totalSteps={100}
            size="small"
          />
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
  )
}

export const RequestCreate = () => {
  // Track form state for unsaved changes warning using Atlantis useFormState hook
  const { setFormState } = useFormState()
  const { mutationOptions } = useSuccessNotification('created', {
    resourceLabel: 'Request',
    resource: 'requests',
  })

  return (
    <Create title="New Request" resource="requests" mutationOptions={mutationOptions}>
      <AtlantisSimpleForm
        defaultValues={{
          status: 'NEW',
        }}
        toolbar={<RequestFormToolbar />}
        className="max-w-4xl mx-auto"
        onStateChange={setFormState}
      >
        <FormValidationBanner />

        {/* Request Details */}
        <FormSection
          title="Request details"
          description="Basic information about the service request."
        >
          <TextInput
            source="title"
            label={false}
            placeholder="Request title"
            validate={required()}
            inputClassName="h-[3.75rem] py-3.5 px-4"
          />
          <TextInput
            source="description"
            label={false}
            placeholder="Describe what the client is looking for..."
            multiline
            rows={4}
          />
        </FormSection>

        {/* Client */}
        <FormSection title="Client" description="Who is this request from?">
          <ReferenceInput source="clientId" reference="clients">
            <AutocompleteInput
              source="clientId"
              label={false}
              optionText="name"
              validate={required()}
              placeholder="Search clients..."
            />
          </ReferenceInput>
          <Button type="tertiary" variation="subtle" size="small" icon="add">
            Create new client
          </Button>
        </FormSection>

        {/* Status */}
        <FormSection
          title="Status"
          description="Current status of this request."
        >
          <SelectInput
            source="status"
            label={false}
            choices={requestStatusChoices}
            emptyText="Select status"
            className="max-w-xs"
          />
        </FormSection>

        {/* Scheduling */}
        <FormSection
          title="Scheduling"
          description="When does the client need this done?"
        >
          <InputGroup flowDirection="horizontal">
            <DatePickerField
              source="preferredDate"
              label="Preferred date"
              className="flex-1"
            />
            <DatePickerField
              source="preferredEndDate"
              label="Flexible until"
              className="flex-1"
              minDateSource="preferredDate"
            />
          </InputGroup>
          <TextInput
            source="preferredTime"
            label={false}
            placeholder="Preferred time (e.g., Morning, Afternoon, 9am-12pm)"
            inputClassName="h-[3.75rem] py-3.5 px-4"
          />
        </FormSection>

        {/* Location */}
        <FormSection
          title="Location"
          description="Service address for this request."
        >
          <TextInput
            source="address.street"
            label={false}
            placeholder="Street address"
            inputClassName="h-[3.75rem] py-3.5 px-4"
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
              choices={[
                { id: 'US', name: 'United States' },
                { id: 'CA', name: 'Canada' },
              ]}
              emptyText="Select country"
              className="flex-1"
            />
          </InputGroup>
        </FormSection>

        {/* Estimate */}
        <FormSection
          title="Estimate"
          description="Estimated value and lead information."
        >
          <InputGroup flowDirection="horizontal">
            <NumberInput
              source="estimatedValue"
              label="Estimated value"
              min={0}
              step={100}
              className="flex-1"
            />
            <SelectInput
              source="leadSource"
              label="Lead source"
              choices={leadSourceChoices}
              emptyText="How did they find you?"
              className="flex-1"
            />
          </InputGroup>
        </FormSection>

        {/* Attachments - Collapsible */}
        <AttachmentsSection />

        {/* Internal Notes - Collapsible */}
        <CollapsibleSection
          title="Internal notes"
          description="Only visible to you and your team."
          defaultOpen={false}
        >
          <TextInput
            source="notes"
            label={false}
            placeholder="Add internal notes about this request..."
            multiline
            rows={3}
          />
        </CollapsibleSection>
      </AtlantisSimpleForm>
    </Create>
  )
}
