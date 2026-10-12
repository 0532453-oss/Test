import { useState, useEffect, useCallback } from 'react'
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
import { required, useInput, useRecordContext } from 'ra-core'
import { invoiceStatusChoices, type Invoice, type InvoiceLineItem } from '@/types'
import {
  Heading,
  Text,
  Button,
  Icon,
  InputText,
  InputNumber,
  Card,
  Table,
  FormatCurrency,
  FormValidationBanner,
  DatePicker,
  useFormState,
  useSuccessNotification,
} from '@/atlantis'

// Line item interface for the form
interface LineItemInput {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

// DatePicker wrapper for react-admin form integration
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

  // Convert form string value (YYYY-MM-DD) to Date object for DatePicker
  const validDate = formValue ? new Date(formValue + 'T00:00:00') : undefined
  const selectedDate =
    validDate && !isNaN(validDate.getTime()) ? validDate : undefined

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
          fullWidth
        />
      </div>
    </div>
  )
}

// Custom component for line items
const LineItemsInput = () => {
  const record = useRecordContext<Invoice>()
  const { field } = useInput({ source: 'lineItems', defaultValue: [] })
  const [items, setItems] = useState<LineItemInput[]>([])

  // Initialize from record when available
  useEffect(() => {
    if (record?.lineItems && items.length === 0) {
      const initialItems = record.lineItems.map((item: InvoiceLineItem) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      }))
      setItems(initialItems)
      field.onChange(initialItems)
    }
  }, [record?.lineItems])

  const addItem = useCallback(() => {
    const newItem: LineItemInput = {
      id: `temp-${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    }
    const newItems = [...items, newItem]
    setItems(newItems)
    field.onChange(newItems)
  }, [items, field])

  const removeItem = useCallback(
    (id: string) => {
      const newItems = items.filter((item) => item.id !== id)
      setItems(newItems)
      field.onChange(newItems)
    },
    [items, field]
  )

  const updateItem = useCallback(
    (id: string, updates: Partial<LineItemInput>) => {
      const newItems = items.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, ...updates }
        // Auto-calculate total
        if ('quantity' in updates || 'unitPrice' in updates) {
          updated.total = updated.quantity * updated.unitPrice
        }
        return updated
      })
      setItems(newItems)
      field.onChange(newItems)
    },
    [items, field]
  )

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)

  return (
    <Card
      header={{
        title: 'Line Items',
        action: (
          <Button
            type="secondary"
            variation="subtle"
            size="small"
            icon="add"
            onClick={addItem}
          >
            Add Line Item
          </Button>
        ),
      }}
    >
      <Card.Body>
        {items.length > 0 ? (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell width="40%">Description</Table.HeaderCell>
                <Table.HeaderCell width="15%">Qty</Table.HeaderCell>
                <Table.HeaderCell width="20%">Unit Price</Table.HeaderCell>
                <Table.HeaderCell width="15%">Total</Table.HeaderCell>
                <Table.HeaderCell width="10%"></Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.map((item) => (
                <Table.Row key={item.id}>
                  <Table.Cell>
                    <InputText
                      value={item.description}
                      onChange={(value) =>
                        updateItem(item.id, { description: value })
                      }
                      placeholder="Service or product name"
                      size="small"
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <InputNumber
                      value={item.quantity}
                      onChange={(value) =>
                        updateItem(item.id, { quantity: value ?? 0 })
                      }
                      min={0}
                      step={1}
                      size="small"
                      align="center"
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <InputNumber
                      value={item.unitPrice}
                      onChange={(value) =>
                        updateItem(item.id, { unitPrice: value ?? 0 })
                      }
                      min={0}
                      step={0.01}
                      size="small"
                      prefixText="$"
                      align="right"
                    />
                  </Table.Cell>
                  <Table.Cell className="font-medium">
                    <FormatCurrency value={item.total} />
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      type="tertiary"
                      variation="destructive"
                      size="small"
                      icon="trash"
                      ariaLabel="Remove line item"
                      onClick={() => removeItem(item.id)}
                      className="h-8 w-8 p-0"
                    />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        ) : (
          <div className="text-center py-8">
            <Text variation="subdued">No line items yet</Text>
            <Text variation="subdued" size="small">
              Click "Add Line Item" to get started
            </Text>
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-4 flex justify-end">
            <div className="text-right">
              <Text element="span" variation="subdued" size="small">
                Subtotal:{' '}
              </Text>
              <Text element="span" className="font-semibold">
                <FormatCurrency value={subtotal} />
              </Text>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  )
}

export const InvoiceEdit = () => {
  // Track form state for unsaved changes warning using Atlantis useFormState hook
  const { setFormState } = useFormState()
  const { mutationOptions } = useSuccessNotification('updated', {
    resourceLabel: 'Invoice',
  })

  return (
    <Edit resource="invoices" mutationOptions={mutationOptions}>
      <AtlantisSimpleForm
        className="max-w-none"
        toolbar={
          <AtlantisFormToolbar className="pt-4 pb-4 sticky bottom-0 bg-linear-to-b from-transparent to-background to-10%" />
        }
        onStateChange={setFormState}
      >
        <FormValidationBanner />

        {/* Basic Info Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Heading level={6} className="min-w-32">
            Invoice Info
          </Heading>
          <div className="border rounded-sm p-4 bg-[var(--color-surface--background)] flex-1 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <TextInput
                source="invoiceNumber"
                label="Invoice Number"
                className="flex-1 [&>input]:bg-[var(--color-surface)]"
              />
              <SelectInput
                source="status"
                label="Status"
                choices={invoiceStatusChoices}
                className="flex-1 [&_button]:bg-[var(--color-surface)]"
              />
            </div>
            <ReferenceInput source="customerId" reference="clients">
              <AutocompleteInput
                label="Client"
                optionText="name"
                validate={required()}
                placeholder="Search clients..."
              />
            </ReferenceInput>
            <ReferenceInput source="jobId" reference="jobs">
              <AutocompleteInput
                label="Related Job (Optional)"
                optionText="title"
                placeholder="Search jobs..."
              />
            </ReferenceInput>
          </div>
        </div>

        {/* Line Items Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Heading level={6} className="min-w-32">
            Line Items
          </Heading>
          <div className="flex-1">
            <LineItemsInput />
          </div>
        </div>

        {/* Totals Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Heading level={6} className="min-w-32">
            Totals
          </Heading>
          <div className="border rounded-sm p-4 bg-[var(--color-surface--background)] flex-1 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <NumberInput
                source="subtotal"
                label="Subtotal ($)"
                min={0}
                step={0.01}
                className="flex-1 [&>input]:bg-[var(--color-surface)]"
              />
              <NumberInput
                source="taxRate"
                label="Tax Rate (%)"
                min={0}
                max={100}
                step={0.01}
                className="flex-1 [&>input]:bg-[var(--color-surface)]"
                helperText="Enter as percentage (e.g., 8.75)"
              />
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <NumberInput
                source="taxAmount"
                label="Tax Amount ($)"
                min={0}
                step={0.01}
                className="flex-1 [&>input]:bg-[var(--color-surface)]"
              />
              <NumberInput
                source="total"
                label="Total ($)"
                min={0}
                step={0.01}
                validate={required()}
                className="flex-1 [&>input]:bg-[var(--color-surface)]"
              />
            </div>
          </div>
        </div>

        {/* Payment Terms Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Heading level={6} className="min-w-32">
            Payment
          </Heading>
          <div className="border rounded-sm p-4 bg-[var(--color-surface--background)] flex-1 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <DatePickerField
                source="dueDate"
                label="Due Date"
                className="flex-1"
              />
              <DatePickerField
                source="paidAt"
                label="Paid Date"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Heading level={6} className="min-w-32">
            Notes
          </Heading>
          <div className="border rounded-sm p-4 bg-[var(--color-surface--background)] flex-1">
            <TextInput
              source="notes"
              label="Notes (visible to client)"
              multiline
              className="[&>textarea]:bg-[var(--color-surface)]"
            />
          </div>
        </div>
      </AtlantisSimpleForm>
    </Edit>
  )
}
