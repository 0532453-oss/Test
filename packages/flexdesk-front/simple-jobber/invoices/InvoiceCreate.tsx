import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Create,
  AtlantisSimpleForm,
  TextInput,
  SelectInput,
  AutocompleteInput,
  ReferenceInput,
  DateInput,
  useFormContext,
} from '@/components/admin';
import { required, useInput, useCreate, useRefresh } from 'ra-core';
import { Button as AtlantisButton, Card, Icon, Heading, Text, InputText, InputNumber, FormatFile, InputFile, FormValidationBanner, ProgressBar, InputEmail, InputPhone } from '../components/atlantis';
import type { FileUpload } from '../components/atlantis';
import { useFormState, useSuccessNotification } from '../components/atlantis/hooks';
import { invoiceStatusChoices } from '../types';

interface LineItemInput {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

// Inline client creation component
const CreateClientInline = ({
  onClientCreated,
  onCancel,
}: {
  onClientCreated: (clientId: string, clientName: string) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [create] = useCreate();

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const newClient = await create(
        'clients',
        { data: { name: name.trim(), email, phone } },
        { returnPromise: true }
      );
      if (newClient?.data?.id) {
        onClientCreated(newClient.data.id, name.trim());
      }
    } catch (error) {
      console.error('Failed to create client:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 rounded-lg border border-border bg-[--color-surface--background] space-y-3">
      <div className="flex items-center justify-between">
        <Text element="span" size="small" className="font-semibold">Quick add client</Text>
        <button type="button" onClick={onCancel} className="text-[--color-text--secondary] hover:text-[--color-text]">
          <Icon name="cross" size="base" />
        </button>
      </div>
      <InputText
        value={name}
        onChange={setName}
        placeholder="Client name *"
        autoFocus
      />
      <div className="grid grid-cols-2 gap-3">
        <InputText
          value={email}
          onChange={setEmail}
          placeholder="Email (optional)"
          type="email"
        />
        <InputText
          value={phone}
          onChange={setPhone}
          placeholder="Phone (optional)"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <AtlantisButton
          type="secondary"
          size="small"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </AtlantisButton>
        <AtlantisButton
          type="primary"
          size="small"
          onClick={handleSubmit}
          disabled={!name.trim() || isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create client'}
        </AtlantisButton>
      </div>
    </div>
  );
};

// Client section with inline creation
const ClientSection = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { setValue } = useFormContext();
  const refresh = useRefresh();

  const handleClientCreated = (clientId: string, clientName: string) => {
    setValue('customerId', clientId);
    setShowCreateForm(false);
    refresh();
  };

  return (
    <FormSection
      title="Client"
      description="Who is this invoice for?"
    >
      <ReferenceInput source="customerId" reference="clients">
        <AutocompleteInput
          label={false}
          optionText="name"
          validate={required()}
          placeholder="Search clients..."
        />
      </ReferenceInput>
      {showCreateForm ? (
        <CreateClientInline
          onClientCreated={handleClientCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      ) : (
        <button
          type="button"
          className="text-sm text-[--color-interactive] hover:underline font-medium"
          onClick={() => setShowCreateForm(true)}
        >
          + Create new client
        </button>
      )}
    </FormSection>
  );
};

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
      <div className="w-full flex justify-between items-center p-4 font-semibold">
        <button
          type="button"
          className="flex items-center gap-2 cursor-pointer flex-1"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Text element="span" size="small" className="font-semibold">{title}</Text>
        </button>
        <div className="flex items-center gap-3">
          {actionButton}
          <button
            type="button"
            className="cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <Icon name="arrowUp" size="base" className="text-[--color-text--secondary]" />
            ) : (
              <Icon name="arrowDown" size="base" className="text-[--color-text--secondary]" />
            )}
          </button>
        </div>
      </div>
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

const LineItemsInput = () => {
  const { field } = useInput({ source: 'lineItems', defaultValue: [] });
  const [items, setItems] = useState<LineItemInput[]>(field.value || []);

  const addItem = useCallback(() => {
    const newItem: LineItemInput = {
      id: `temp-${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    field.onChange(newItems);
  }, [items, field]);

  const removeItem = useCallback((id: string) => {
    const newItems = items.filter((item) => item.id !== id);
    setItems(newItems);
    field.onChange(newItems);
  }, [items, field]);

  const updateItem = useCallback((id: string, updates: Partial<LineItemInput>) => {
    const newItems = items.map((item) => item.id === id ? { ...item, ...updates } : item);
    setItems(newItems);
    field.onChange(newItems);
  }, [items, field]);

  const getTotal = (item: LineItemInput) => item.quantity * item.unitPrice;
  const subtotal = items.reduce((sum, item) => sum + getTotal(item), 0);

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <div className="space-y-3">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_80px_100px_80px_40px] gap-3 px-1">
            <Text element="span" variation="subdued" size="small" className="font-medium">Description</Text>
            <Text element="span" variation="subdued" size="small" className="font-medium text-center">Qty</Text>
            <Text element="span" variation="subdued" size="small" className="font-medium text-right">Unit Price</Text>
            <Text element="span" variation="subdued" size="small" className="font-medium text-right">Total</Text>
            <span></span>
          </div>
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-[1fr_80px_100px_80px_40px] items-center gap-3 p-3 rounded-lg border border-border bg-card">
              <InputText
                value={item.description}
                onChange={(value) => updateItem(item.id, { description: value })}
                placeholder="Item description"
              />
              <InputNumber
                value={item.quantity}
                onChange={(value) => updateItem(item.id, { quantity: value ?? 0 })}
                min={0}
                placeholder="1"
                align="center"
              />
              <InputNumber
                value={item.unitPrice}
                onChange={(value) => updateItem(item.id, { unitPrice: value ?? 0 })}
                min={0}
                step={0.01}
                prefixText="$"
                placeholder="0.00"
                align="right"
              />
              <Text element="span" size="small" align="end" className="font-medium tabular-nums">
                ${getTotal(item).toFixed(2)}
              </Text>
              <AtlantisButton
                type="tertiary"
                variation="destructive"
                size="small"
                icon="trash"
                ariaLabel="Remove line item"
                className="h-8 w-8"
                onClick={() => removeItem(item.id)}
              />
            </div>
          ))}
        </div>
      )}

      <AtlantisButton
        type="tertiary"
        variation="subtle"
        size="small"
        icon="add"
        onClick={addItem}
      >
        Add line item
      </AtlantisButton>

      {items.length > 0 && (
        <div className="flex justify-end pt-4 border-t border-border/40">
          <div className="w-64 space-y-2">
            <div className="flex justify-between">
              <Text element="span" variation="subdued" size="small">Subtotal</Text>
              <Text element="span" size="small" className="font-medium tabular-nums">${subtotal.toFixed(2)}</Text>
            </div>
            <div className="flex justify-between py-2 border-t border-border">
              <Text element="span" size="small" className="font-semibold">Total</Text>
              <Text element="span" size="large" className="font-bold tabular-nums">${subtotal.toFixed(2)}</Text>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Toolbar with Atlantis Button components
const InvoiceFormToolbar = () => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between pt-6 mt-6 border-t border-border/50">
      <AtlantisButton type="secondary" size="base" label="Cancel" onClick={() => navigate(-1)} />
      <div className="flex items-center gap-3">
        <AtlantisButton type="secondary" size="base">
          Save as draft
        </AtlantisButton>
        <AtlantisButton type="primary" size="base" label="Send Invoice" submit />
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
      description="Supporting documents for this invoice."
      actionButton={
        <AtlantisButton
          type="tertiary"
          variation="subtle"
          size="small"
          icon="add"
          onClick={(e) => e.stopPropagation()}
        >
          Add file
        </AtlantisButton>
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

export const InvoiceCreate = () => {
  // Track form state for unsaved changes warning using Atlantis useFormState hook
  const { setFormState, hasUnsavedChanges } = useFormState();
  const { mutationOptions } = useSuccessNotification('created', { resourceLabel: 'Invoice' });

  // hasUnsavedChanges can be used for unsaved changes warnings

  return (
    <Create title="New Invoice" mutationOptions={mutationOptions}>
      <AtlantisSimpleForm
        defaultValues={{
          status: 'DRAFT',
          lineItems: [],
        }}
        toolbar={<InvoiceFormToolbar />}
        className="max-w-4xl mx-auto"
        onStateChange={setFormState}
      >
      <FormValidationBanner />

      {/* Invoice Details */}
      <FormSection
        title="Invoice details"
        description="Basic information about this invoice."
      >
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            source="invoiceNumber"
            label={false}
            placeholder="Invoice # (auto-generated)"
            inputClassName="h-[3.75rem] py-3.5 px-4"
          />
          <SelectInput
            source="status"
            label={false}
            choices={invoiceStatusChoices}
            emptyText="Select status"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <DateInput source="issuedDate" label="Issue date" />
          <DateInput source="dueDate" label="Due date" />
        </div>
      </FormSection>

      {/* Client */}
      <ClientSection />

      {/* Related Job */}
      <FormSection
        title="Related job"
        description="Link this invoice to an existing job."
      >
        <ReferenceInput source="jobId" reference="jobs">
          <AutocompleteInput
            label={false}
            optionText="title"
            placeholder="Search jobs..."
          />
        </ReferenceInput>
      </FormSection>

      {/* Line Items */}
      <FormSection
        title="Line items"
        description="Products and services to charge for."
      >
        <LineItemsInput />
      </FormSection>

      {/* Client Message */}
      <FormSection
        title="Client message"
        description="This message will be visible to the client."
      >
        <TextInput
          source="clientMessage"
          label={false}
          placeholder="Thank you for your business..."
          multiline
          rows={3}
        />
      </FormSection>

      {/* Internal Notes - Collapsible */}
      <CollapsibleSection
        title="Internal notes"
        description="Only visible to you and your team."
        defaultOpen={false}
      >
        <TextInput
          source="notes"
          label={false}
          placeholder="Add internal notes about this invoice..."
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
