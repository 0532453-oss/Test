import { useState, useEffect } from 'react'
import {
  Edit,
  AtlantisSimpleForm,
  AtlantisFormToolbar,
  TextInput,
  SelectInput,
  AutocompleteInput,
  ReferenceInput,
  NumberInput,
  useFormContext,
} from '@/components/admin'
import { required } from 'ra-core'
import { jobStatusChoices, jobPriorityChoices } from '@/types'
import {
  Heading,
  InputGroup,
  DatePicker,
  Text,
  InputTime,
  FormValidationBanner,
  InlineBanner,
  RecurringSelect,
  DurationPeriod,
  useFormState,
  useSuccessNotification,
} from '@/atlantis'
import type { RecurrenceRule } from '@/atlantis'

// DatePicker wrapper for react-admin form integration (edit mode)
// Works with YYYY-MM-DD string format (backend scheduledDate field)
const DatePickerField = ({
  source,
  label,
  className,
}: {
  source: string
  label: string
  className?: string
}) => {
  const { setValue, watch } = useFormContext()
  const formValue = watch(source)

  // Convert form value (YYYY-MM-DD string) to Date object for DatePicker
  const selectedDate = formValue ? new Date(formValue + 'T00:00:00') : undefined
  const validSelectedDate =
    selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate : undefined

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
          selected={validSelectedDate}
          onChange={handleDateChange}
          fullWidth
        />
      </div>
    </div>
  )
}

// Time input field wrapper for react-admin form integration (edit mode)
// Works with HH:mm string format (backend scheduledStartTime/scheduledEndTime fields)
const TimeInputField = ({
  source,
  label,
  className,
}: {
  source: string
  label: string
  className?: string
}) => {
  const { setValue, watch } = useFormContext()
  const formValue = watch(source)

  // The value is already in HH:mm format from the backend
  const timeValue = formValue || ''

  const handleTimeChange = (newTime: string) => {
    setValue(source, newTime, {
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
        <InputTime
          value={timeValue}
          onChange={handleTimeChange}
          className="w-36"
          ariaLabel={label}
        />
      </div>
    </div>
  )
}

// Pre-populate address.* form fields from backend location object
const LocationFieldSync = () => {
  const { setValue, watch } = useFormContext()
  const location = watch('location')

  useEffect(() => {
    if (!location || typeof location !== 'object') return
    const loc = location as Record<string, unknown>
    // Parse composite address string back into parts if available
    if (typeof loc.address === 'string' && loc.address) {
      const parts = loc.address.split(', ')
      if (parts[0]) setValue('address.street', parts[0], { shouldDirty: false })
      if (parts[1]) setValue('address.city', parts[1], { shouldDirty: false })
      if (parts[2]) setValue('address.state', parts[2], { shouldDirty: false })
      if (parts[3]) setValue('address.zipCode', parts[3], { shouldDirty: false })
    }
  }, [location, setValue])

  return null
}

// Transform form data to match backend UpdateJobDto before submission
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

  // Return only fields from UpdateJobDto (all optional, customerId excluded)
  const result: Record<string, unknown> = {}

  if (data.title) result.title = data.title
  if (data.description !== undefined) result.description = data.description
  if (data.technicianId) result.technicianId = data.technicianId
  if (data.priority) result.priority = data.priority
  if (data.status) result.status = data.status
  if (data.scheduledDate) result.scheduledDate = data.scheduledDate
  if (data.scheduledStartTime) result.scheduledStartTime = data.scheduledStartTime
  if (data.scheduledEndTime) result.scheduledEndTime = data.scheduledEndTime
  if (data.estimatedDuration) result.estimatedDuration = data.estimatedDuration
  if (Object.keys(location).length > 0) result.location = location

  return result
}

export const JobEdit = () => {
  // Track form state for unsaved changes warning using Atlantis useFormState hook
  const { setFormState } = useFormState()
  const { mutationOptions } = useSuccessNotification('updated', {
    resourceLabel: 'Job',
  })
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>({
    interval: 1,
    type: DurationPeriod.Week,
    weekDays: new Set(),
  })

  return (
    <Edit resource="jobs" mutationOptions={mutationOptions} transform={transformJobData}>
      <AtlantisSimpleForm
        className="max-w-4xl mx-auto"
        toolbar={
          <AtlantisFormToolbar className="pt-4 pb-4 sticky bottom-0 bg-linear-to-b from-transparent to-background to-10%" />
        }
        onStateChange={setFormState}
      >
        <FormValidationBanner />
        <LocationFieldSync />

        {/* Basic Info Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Heading level={6} className="min-w-32">
            Job Info
          </Heading>
          <div className="border rounded-sm p-4 bg-[var(--color-surface--background)] flex-1 flex flex-col gap-4">
            <TextInput
              source="title"
              label="Job Title"
              validate={required()}
              className="[&>input]:bg-[var(--color-surface)]"
            />
            <ReferenceInput source="customerId" reference="clients">
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
              className="[&>textarea]:bg-[var(--color-surface)]"
            />
          </div>
        </div>

        {/* Status & Priority Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Heading level={6} className="min-w-32">
            Status
          </Heading>
          <div className="border rounded-sm p-4 bg-[var(--color-surface--background)] flex-1 flex flex-col gap-4">
            <InlineBanner variant="info">
              Changing the status to "Completed" will mark this job as done.
              Status changes may affect scheduling and reporting.
            </InlineBanner>
            <InputGroup flowDirection="horizontal">
              <SelectInput
                source="status"
                label="Status"
                choices={jobStatusChoices}
                className="flex-1 [&_button]:bg-[var(--color-surface)]"
              />
              <SelectInput
                source="priority"
                label="Priority"
                choices={jobPriorityChoices}
                className="flex-1 [&_button]:bg-[var(--color-surface)]"
              />
            </InputGroup>
          </div>
        </div>

        {/* Schedule Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Heading level={6} className="min-w-32">
            Schedule
          </Heading>
          <div className="border rounded-sm p-4 bg-[var(--color-surface--background)] flex-1 flex flex-col gap-4">
            <DatePickerField
              source="scheduledDate"
              label="Scheduled Date"
              className="flex-1"
            />
            <InputGroup flowDirection="horizontal">
              <TimeInputField
                source="scheduledStartTime"
                label="Start Time"
                className="flex-1"
              />
              <TimeInputField
                source="scheduledEndTime"
                label="End Time"
                className="flex-1"
              />
            </InputGroup>
            <NumberInput
              source="estimatedDuration"
              label="Estimated Duration (minutes)"
              min={0}
              step={15}
              className="[&>input]:bg-[var(--color-surface)]"
            />
          </div>
        </div>

        {/* Recurrence Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Heading level={6} className="min-w-32">
            Recurrence
          </Heading>
          <div className="border rounded-sm p-4 bg-[var(--color-surface--background)] flex-1 flex flex-col gap-4">
            <RecurringSelect value={recurrenceRule} onChange={setRecurrenceRule} />
          </div>
        </div>

        {/* Assignment Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Heading level={6} className="min-w-32">
            Assignment
          </Heading>
          <div className="border rounded-sm p-4 bg-[var(--color-surface--background)] flex-1">
            <ReferenceInput source="technicianId" reference="teamMembers">
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
          <Heading level={6} className="min-w-32">
            Location
          </Heading>
          <div className="border rounded-sm p-4 bg-[var(--color-surface--background)] flex-1 flex flex-col gap-4">
            <TextInput
              source="address.street"
              label="Street Address"
              className="[&>input]:bg-[var(--color-surface)]"
            />
            <InputGroup flowDirection="horizontal">
              <TextInput
                source="address.city"
                label="City"
                className="flex-1 [&>input]:bg-[var(--color-surface)]"
              />
              <TextInput
                source="address.state"
                label="State"
                className="w-24 [&>input]:bg-[var(--color-surface)]"
              />
              <TextInput
                source="address.zipCode"
                label="ZIP Code"
                className="w-32 [&>input]:bg-[var(--color-surface)]"
              />
            </InputGroup>
          </div>
        </div>

        {/* Notes section removed: backend uses jobNotes relation, not in UpdateJobDto */}
      </AtlantisSimpleForm>
    </Edit>
  )
}
