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
} from '@/components/admin'
import { required } from 'ra-core'
import { requestStatusChoices } from '@/types'
import {
  Card,
  Heading,
  Text,
  InputGroup,
  DatePicker,
  FormValidationBanner,
  useFormState,
  useSuccessNotification,
} from '@/atlantis'

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
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <Card className="mb-4">
    <Card.Header className="px-4 py-3">
      <Heading level={6}>{title}</Heading>
    </Card.Header>
    <Card.Body>{children}</Card.Body>
  </Card>
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
  const selectedDate = formValue ? new Date(formValue + 'T00:00:00') : undefined
  const validSelectedDate =
    selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate : undefined

  // Convert minDateSource value to Date for minDate constraint
  const minDate = minDateValue ? new Date(minDateValue + 'T00:00:00') : undefined
  const validMinDate = minDate && !isNaN(minDate.getTime()) ? minDate : undefined

  const handleDateChange = (date: Date) => {
    // Convert Date to YYYY-MM-DD string for form state
    const yyyy = date.getFullYear().toString()
    const mm = (date.getMonth() + 1).toString().padStart(2, '0')
    const dd = date.getDate().toString().padStart(2, '0')
    setValue(source, `${yyyy}-${mm}-${dd}`, { shouldDirty: true, shouldValidate: true })
  }

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
  )
}

export const RequestEdit = () => {
  // Track form state for unsaved changes warning using Atlantis useFormState hook
  const { setFormState } = useFormState()
  const { mutationOptions } = useSuccessNotification('updated', { resourceLabel: 'Request' })

  return (
    <Edit resource="requests" mutationOptions={mutationOptions}>
      <AtlantisSimpleForm
        toolbar={
          <AtlantisFormToolbar className="pt-4 pb-4 sticky bottom-0 bg-linear-to-b from-transparent to-background to-10%" />
        }
        onStateChange={setFormState}
      >
        <FormValidationBanner />

        {/* Request Info Section */}
        <FormSection title="Request Info">
          <div className="flex flex-col gap-4">
            <TextInput
              source="title"
              label="Request Title"
              validate={required()}
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
            />
          </div>
        </FormSection>

        {/* Status Section */}
        <FormSection title="Status">
          <SelectInput
            source="status"
            label="Status"
            choices={requestStatusChoices}
          />
        </FormSection>

        {/* Scheduling Section */}
        <FormSection title="Scheduling">
          <InputGroup flowDirection="horizontal">
            <DatePickerField
              source="preferredDate"
              label="Preferred Date"
              className="flex-1"
            />
            <DatePickerField
              source="preferredEndDate"
              label="Flexible Until"
              className="flex-1"
              minDateSource="preferredDate"
            />
          </InputGroup>
        </FormSection>

        {/* Estimate Section */}
        <FormSection title="Estimate">
          <div className="flex flex-col gap-4">
            <InputGroup flowDirection="horizontal">
              <NumberInput
                source="estimatedValue"
                label="Estimated Value"
                min={0}
                step={100}
                className="flex-1"
              />
              <SelectInput
                source="leadSource"
                label="Lead Source"
                choices={leadSourceChoices}
                emptyText="Select source"
                className="flex-1"
              />
            </InputGroup>
          </div>
        </FormSection>
      </AtlantisSimpleForm>
    </Edit>
  )
}
