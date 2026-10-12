"use client";

import {
  List,
  Show,
  DataTable,
  BadgeField,
  DateField,
  NumberField,
  RecordField,
  ReferenceField,
  ShowButton,
} from "@/components/admin";

export const InvoiceList = () => (
  <List sort={{ field: "createdAt", order: "DESC" }}>
    <DataTable rowClick="show">
      <DataTable.Col source="invoiceNumber" label="Invoice #" />
      <DataTable.Col source="status">
        <BadgeField source="status" />
      </DataTable.Col>
      <DataTable.Col source="customerId" label="Customer">
        <ReferenceField source="customerId" reference="customers" />
      </DataTable.Col>
      <DataTable.NumberCol
        source="total"
        label="Total"
        options={{ style: "currency", currency: "USD" }}
      />
      <DataTable.Col source="dueDate" label="Due Date">
        <DateField source="dueDate" />
      </DataTable.Col>
      <DataTable.Col source="createdAt" label="Created">
        <DateField source="createdAt" />
      </DataTable.Col>
      <DataTable.Col>
        <ShowButton />
      </DataTable.Col>
    </DataTable>
  </List>
);

export const InvoiceShow = () => (
  <Show>
    <div className="flex flex-col gap-4">
      <RecordField source="invoiceNumber" label="Invoice #" />
      <RecordField source="status">
        <BadgeField source="status" />
      </RecordField>
      <RecordField source="customerId" label="Customer">
        <ReferenceField source="customerId" reference="customers" />
      </RecordField>
      <RecordField source="jobId" label="Job">
        <ReferenceField source="jobId" reference="jobs" />
      </RecordField>
      <RecordField source="amount" label="Subtotal">
        <NumberField
          source="amount"
          options={{ style: "currency", currency: "USD" }}
        />
      </RecordField>
      <RecordField source="tax" label="Tax">
        <NumberField
          source="tax"
          options={{ style: "currency", currency: "USD" }}
        />
      </RecordField>
      <RecordField source="total" label="Total">
        <NumberField
          source="total"
          options={{ style: "currency", currency: "USD" }}
        />
      </RecordField>
      <RecordField source="dueDate" label="Due Date">
        <DateField source="dueDate" />
      </RecordField>
      <RecordField source="paidAt" label="Paid At">
        <DateField source="paidAt" showTime />
      </RecordField>
      <RecordField source="createdAt" label="Created">
        <DateField source="createdAt" showTime />
      </RecordField>
    </div>
  </Show>
);
