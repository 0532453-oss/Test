import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router'
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
} from '@/components/admin'
import { required, useGetOne } from 'ra-core'
import { jobPriorityChoices, type Client } from '@/types'
import {
  Card,
  Heading,
  Text,
  Icon,
  InputTime,
  InputGroup,
  Button,
  DatePicker,
  FormatFile,
  InputFile,
  FormValidationBanner,
  InlineBanner,
  ProgressBar,
  RecurringSelect,
  DurationPeriod,
  useFormState,
  useSuccessNotification,
} from '@/atlantis'
import type { FileUpload, RecurrenceRule } from '@/atlantis'

// Card-based section component with Atlantis Card
const FormSection = ({
  title,
  description,
  children,
  accent,
}: {
  title: string
  description?: string
  children: React.ReactNode
  accent?: 'blue' | 'indigo' | 'purple' | 'green' | 'orange'
}) => (
    <Card className="mb-6 transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 border border-gray-200/60" elevation="base" accent={accent}>
    <Card.Header className="px-8 py-6 bg-gradient-to-r from-white to-gray-50/50 border-b border-gray-100">
      <Heading level={4} className="text-lg font-semibold text-gray-900">{title}</Heading>
      {description && (
        <Text variation="subdued" size="small" className="mt-2 text-gray-600">
          {description}
        </Text>
      )}
    </Card.Header>
    <Card.Body className="px-8 py-8 space-y-5 bg-white">{children}</Card.Body>
  </Card>
)

// Collapsible Card section component
const CollapsibleSection = ({
  title,
  description,
  children,
  defaultOpen = false,
  actionButton,
  accent,
}: {
  title: string
  description?: string
  children?: React.ReactNode
  defaultOpen?: boolean
  actionButton?: React.ReactNode
  accent?: 'blue' | 'indigo' | 'purple' | 'green' | 'orange'
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Card className="mb-6 transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 border border-gray-200/60" elevation="base" accent={accent}>
      <button
        type="button"
        className="w-full px-8 py-6 flex items-center justify-between hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-white transition-all duration-200 rounded-t-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <Icon
            name={isOpen ? 'arrowUp' : 'arrowDown'}
            size="base"
            className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
          <Text element="span" className="font-semibold text-gray-900 text-base">
            {title}
          </Text>
        </div>
        <div
          className="flex items-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          {actionButton}
        </div>
      </button>
      {isOpen && (
        <Card.Body className="px-8 py-8 bg-white border-t border-gray-100">
          {description && (
            <Text variation="subdued" size="small" className="mb-5 text-gray-600">
              {description}
            </Text>
          )}
          {children}
        </Card.Body>
      )}
    </Card>
  )
}

type JobType = 'ONE_OFF' | 'RECURRING'

const JobTypeToggle = ({
  value,
  onChange,
}: {
  value: JobType
  onChange: (value: JobType) => void
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <button
      type="button"
      onClick={() => onChange('ONE_OFF')}
      className={`group relative flex items-start gap-4 p-5 rounded-xl border-2 transition-all duration-200 text-left ${
        value === 'ONE_OFF'
          ? 'border-indigo-500 bg-indigo-50/50 shadow-md ring-1 ring-indigo-500/20'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
        value === 'ONE_OFF'
          ? 'bg-indigo-100 text-indigo-600'
          : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
      }`}>
        <Icon name="checkmark" size="base" />
      </div>
      <div>
        <p className={`text-sm font-semibold ${value === 'ONE_OFF' ? 'text-indigo-900' : 'text-gray-900'}`}>
          One-off
        </p>
        <p className={`text-xs mt-0.5 ${value === 'ONE_OFF' ? 'text-indigo-600' : 'text-gray-500'}`}>
          Single job, done once
        </p>
      </div>
      {value === 'ONE_OFF' && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
          <Icon name="checkmark" size="small" className="text-white" />
        </div>
      )}
    </button>

    <button
      type="button"
      onClick={() => onChange('RECURRING')}
      className={`group relative flex items-start gap-4 p-5 rounded-xl border-2 transition-all duration-200 text-left ${
        value === 'RECURRING'
          ? 'border-indigo-500 bg-indigo-50/50 shadow-md ring-1 ring-indigo-500/20'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
        value === 'RECURRING'
          ? 'bg-indigo-100 text-indigo-600'
          : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
      }`}>
        <Icon name="sync" size="base" />
      </div>
      <div>
        <p className={`text-sm font-semibold ${value === 'RECURRING' ? 'text-indigo-900' : 'text-gray-900'}`}>
          Recurring
        </p>
        <p className={`text-xs mt-0.5 ${value === 'RECURRING' ? 'text-indigo-600' : 'text-gray-500'}`}>
          Repeats on a schedule
        </p>
      </div>
      {value === 'RECURRING' && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
          <Icon name="checkmark" size="small" className="text-white" />
        </div>
      )}
    </button>
  </div>
)

// Time input field wrapper using Atlantis InputTime
const TimeInputField = ({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) => (
  <div className="space-y-2">
    <Text element="span" size="small" variation="subdued">
      {label}
    </Text>
    <InputTime
      value={value}
      onChange={onChange}
      className="w-36"
      ariaLabel={label}
    />
  </div>
)

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

  // Convert minDateSource value to Date for minDate constraint (end date cannot be before start date)
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

// Sync local time state into form fields so they are submitted
const ScheduleFieldSync = ({
  startTime,
  endTime,
  scheduleLater,
}: {
  startTime: string
  endTime: string
  scheduleLater: boolean
}) => {
  const { setValue } = useFormContext()

  useEffect(() => {
    if (scheduleLater) return
    // Write scheduledStartTime and scheduledEndTime into form state
    setValue('scheduledStartTime', startTime, { shouldDirty: false })
    setValue('scheduledEndTime', endTime, { shouldDirty: false })
  }, [startTime, endTime, scheduleLater, setValue])

  return null
}

// Country choices for job location
const countryChoices = [
  { id: 'US', name: 'United States' },
  { id: 'CA', name: 'Canada' },
]

// Address section with autocomplete
const JobAddressSection = () => {
  const { setValue } = useFormContext()

  const handleAddressSelect = (address: {
    street1?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
    lat?: number
    lng?: number
  }) => {
    // Populate form fields with selected address data
    if (address.street1) setValue('address.street', address.street1)
    if (address.city) setValue('address.city', address.city)
    if (address.state) setValue('address.state', address.state)
    if (address.zipCode) setValue('address.zipCode', address.zipCode)
    if (address.country) setValue('address.country', address.country)
    if (address.lat) setValue('address.lat', address.lat)
    if (address.lng) setValue('address.lng', address.lng)
  }

  return (
    <FormSection title="Location" description="Service address for this job." accent="blue">
      <AddressAutocompleteInput
        source="address.street"
        label={false}
        placeholder="Start typing an address..."
        onAddressSelect={handleAddressSelect}
        debounce={300}
        minChars={3}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput
          source="address.city"
          label={false}
          placeholder="City"
          inputClassName="h-[3.75rem] py-3.5 px-4"
        />
        <TextInput
          source="address.state"
          label={false}
          placeholder="State"
          inputClassName="h-[3.75rem] py-3.5 px-4"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput
          source="address.zipCode"
          label={false}
          placeholder="ZIP code"
          inputClassName="h-[3.75rem] py-3.5 px-4"
        />
        <SelectInput
          source="address.country"
          label={false}
          choices={countryChoices}
          emptyText="Select country"
        />
      </div>
    </FormSection>
  )
}

// Toolbar with Atlantis Button components
const JobFormToolbar = () => {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-200 bg-white/80 backdrop-blur-sm px-0 py-6 sticky bottom-0">
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
        <Button type="primary" size="base" label="Save Job" submit />
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
      description="Photos, documents, and other files."
      accent="green"
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

// Component to handle client data pre-population
const JobCreateFormContent = () => {
  const location = useLocation()
  const { setValue } = useFormContext()

  // Get params from URL query params
  const searchParams = new URLSearchParams(location.search)
  const clientId = searchParams.get('clientId')
  const scheduledDate = searchParams.get('scheduledDate')
  const scheduledStartTime = searchParams.get('scheduledStartTime')
  const scheduledEndTime = searchParams.get('scheduledEndTime')
  const assignedTechnicianId = searchParams.get('assignedTechnicianId')

  // Fetch client data if clientId is provided
  const { data: client } = useGetOne<Client>(
    'clients',
    { id: clientId || '' },
    { enabled: !!clientId }
  )

  // Pre-populate form with client data when client is loaded
  useEffect(() => {
    if (client) {
      // Set customerId
      if (clientId) {
        setValue('customerId', clientId, { shouldDirty: false })
      }

      // Pre-populate address if client has one
      if (client.address) {
        if (client.address.street) {
          setValue('address.street', client.address.street, { shouldDirty: false })
        }
        if (client.address.city) {
          setValue('address.city', client.address.city, { shouldDirty: false })
        }
        if (client.address.state) {
          setValue('address.state', client.address.state, { shouldDirty: false })
        }
        if (client.address.zipCode) {
          setValue('address.zipCode', client.address.zipCode, { shouldDirty: false })
        }
        if (client.address.country) {
          setValue('address.country', client.address.country, { shouldDirty: false })
        }
        if (client.address.lat) {
          setValue('address.lat', client.address.lat, { shouldDirty: false })
        }
        if (client.address.lng) {
          setValue('address.lng', client.address.lng, { shouldDirty: false })
        }
      }
    }
  }, [client, clientId, setValue])

  // Pre-populate schedule fields from URL params (e.g., when clicking calendar)
  useEffect(() => {
    if (scheduledDate) {
      setValue('scheduledDate', scheduledDate, { shouldDirty: false })
    }
    if (scheduledStartTime) {
      setValue('scheduledStartTime', scheduledStartTime, { shouldDirty: false })
    }
    if (scheduledEndTime) {
      setValue('scheduledEndTime', scheduledEndTime, { shouldDirty: false })
    }
    if (assignedTechnicianId) {
      setValue('technicianId', assignedTechnicianId, { shouldDirty: false })
    }
  }, [scheduledDate, scheduledStartTime, scheduledEndTime, assignedTechnicianId, setValue])

  return null // This component only handles side effects
}

// Transform form data to match backend CreateJobDto before submission
const transformJobData = (data: Record<string, unknown>) => {
  // Build location object from address.* form fields
  const address = data.address as Record<string, unknown> | undefined
  const location: Record<string, unknown> = {}
  if (address) {
    const parts = [address.street, address.city, address.state, address.zipCode].filter(Boolean)
    if (parts.length > 0) {
      location.address = parts.join(', ')
    }
    if (address.lat) location.lat = address.lat
    if (address.lng) location.lng = address.lng
  }

  // Return only fields from CreateJobDto
  const result: Record<string, unknown> = {
    title: data.title,
    customerId: data.customerId,
  }

  if (data.description) result.description = data.description
  if (data.technicianId) result.technicianId = data.technicianId
  if (data.priority) result.priority = data.priority
  if (data.scheduledDate) result.scheduledDate = data.scheduledDate
  if (data.scheduledStartTime) result.scheduledStartTime = data.scheduledStartTime
  if (data.scheduledEndTime) result.scheduledEndTime = data.scheduledEndTime
  if (data.estimatedDuration) result.estimatedDuration = data.estimatedDuration
  if (Object.keys(location).length > 0) result.location = location

  return result
}

export const JobCreate = () => {
  const location = useLocation()
  const [jobType, setJobType] = useState<JobType>('ONE_OFF')
  const searchParamsInit = new URLSearchParams(location.search)
  const [startTime, setStartTime] = useState(searchParamsInit.get('scheduledStartTime') || '09:00')
  const [endTime, setEndTime] = useState(searchParamsInit.get('scheduledEndTime') || '17:00')
  const [scheduleLater, setScheduleLater] = useState(false)
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>({
    interval: 1,
    type: DurationPeriod.Week,
    weekDays: new Set(),
  })

  // Get clientId from URL to set as default value
  const searchParams = new URLSearchParams(location.search)
  const clientId = searchParams.get('clientId')

  // Track form state for unsaved changes warning using Atlantis useFormState hook
  const { setFormState } = useFormState()
  const { mutationOptions } = useSuccessNotification('created', {
    resourceLabel: 'Job',
  })

  return (
    <Create title={false} disableBreadcrumb fullWidth resource="jobs" mutationOptions={mutationOptions} transform={transformJobData} className="!my-0 !p-0">
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 py-8 px-4">
        <div className="w-full max-w-[1500px] mx-auto">
        {/* Enhanced Header Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-10 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
            <Heading level={1} className="text-3xl md:text-4xl font-bold text-gray-900">
              Create New Job
            </Heading>
          </div>
          <Text variation="subdued" size="base" className="ml-4 text-gray-600">
            Fill in the details below to create a new job for your team
          </Text>
        </div>

        <AtlantisSimpleForm
          defaultValues={{
            priority: 'MEDIUM',
            ...(clientId ? { customerId: clientId } : {}),
          }}
          toolbar={<JobFormToolbar />}
          onStateChange={setFormState}
        >
          <JobCreateFormContent />
          <FormValidationBanner />

          {/* Job Details */}
          <FormSection
            title="Job details"
            description="Basic information about the job."
            accent="blue"
          >
            <TextInput
              source="title"
              label={false}
              placeholder="Job title"
              validate={required()}
              inputClassName="h-[3.75rem] py-3.5 px-4"
            />
            <SelectInput
              source="priority"
              label={false}
              choices={jobPriorityChoices}
              emptyText="Priority"
            />
          </FormSection>

          {/* Client */}
          <FormSection title="Client" description="Who is this job for?" accent="indigo">
            <ReferenceInput source="customerId" reference="clients">
              <AutocompleteInput
                source="customerId"
                label={false}
                optionText="name"
                validate={required()}
                placeholder="Search clients..."
              />
            </ReferenceInput>
            <button
              type="button"
              className="text-sm text-[var(--color-interactive)] hover:underline font-medium mt-2"
            >
              + Create new client
            </button>
          </FormSection>

          {/* Job Type */}
          <FormSection
            title="Job type"
            description="Is this a one-time or recurring job?"
            accent="purple"
          >
            <JobTypeToggle value={jobType} onChange={setJobType} />
            {jobType === 'RECURRING' && (
              <div className="mt-5 pt-5 border-t border-gray-200/60 overflow-hidden">
                <RecurringSelect
                  value={recurrenceRule}
                  onChange={setRecurrenceRule}
                />
              </div>
            )}
          </FormSection>

          {/* Sync time state to form fields */}
          <ScheduleFieldSync startTime={startTime} endTime={endTime} scheduleLater={scheduleLater} />

          {/* Schedule */}
          <FormSection
            title="Schedule"
            description="When should this job be done?"
            accent="orange"
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
                  Unscheduled jobs won't appear on the calendar. You can schedule
                  them later from the job detail page or the schedule view.
                </InlineBanner>
              )}

              {!scheduleLater && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DatePickerField
                      source="scheduledDate"
                      label="Scheduled date"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TimeInputField
                      label="Start time"
                      value={startTime}
                      onChange={(val) => { setStartTime(val); }}
                    />
                    <TimeInputField
                      label="End time"
                      value={endTime}
                      onChange={(val) => { setEndTime(val); }}
                    />
                  </div>
                </>
              )}
            </div>
          </FormSection>

          {/* Team */}
          <FormSection title="Team" description="Who will do this job?" accent="green">
            <ReferenceInput source="technicianId" reference="teamMembers">
              <AutocompleteInput
                source="technicianId"
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
            accent="purple"
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
            <div className="p-4 rounded-lg bg-[var(--color-surface--hover)] border border-border/40 text-center">
              <Text variation="subdued" size="small">
                No line items added yet. Click "Add line item" to add products or
                services.
              </Text>
            </div>
          </CollapsibleSection>

          {/* Instructions */}
          <FormSection
            title="Instructions"
            description="Visible to team members."
            accent="indigo"
          >
            <TextInput
              source="description"
              label={false}
              placeholder="Add instructions for this job..."
              multiline
              rows={4}
            />
          </FormSection>

          {/* Internal Notes - removed: not in backend CreateJobDto */}

          {/* Attachments - Collapsible */}
          <AttachmentsSection />
        </AtlantisSimpleForm>
        </div>
      </div>
    </Create>
  )
}
