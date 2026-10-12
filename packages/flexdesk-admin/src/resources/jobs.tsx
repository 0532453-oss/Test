"use client";

import {
  List,
  Create,
  Edit,
  Show,
  DataTable,
  SimpleForm,
  TextInput,
  SelectInput,
  DateInput,
  NumberInput,
  BadgeField,
  DateField,
  RecordField,
  EditButton,
  ShowButton,
  ReferenceInput,
  ReferenceField,
} from "@/components/admin";
import { required } from "ra-core";

const statusChoices = [
  { id: "SCHEDULED", name: "Scheduled" },
  { id: "DISPATCHED", name: "Dispatched" },
  { id: "IN_PROGRESS", name: "In Progress" },
  { id: "COMPLETED", name: "Completed" },
  { id: "CANCELLED", name: "Cancelled" },
  { id: "ON_HOLD", name: "On Hold" },
];

const priorityChoices = [
  { id: "LOW", name: "Low" },
  { id: "MEDIUM", name: "Medium" },
  { id: "HIGH", name: "High" },
  { id: "URGENT", name: "Urgent" },
];

export const JobList = () => (
  <List sort={{ field: "createdAt", order: "DESC" }}>
    <DataTable rowClick="show">
      <DataTable.Col source="title" />
      <DataTable.Col source="status">
        <BadgeField source="status" />
      </DataTable.Col>
      <DataTable.Col source="priority">
        <BadgeField source="priority" />
      </DataTable.Col>
      <DataTable.Col source="customerId" label="Customer">
        <ReferenceField source="customerId" reference="customers" />
      </DataTable.Col>
      <DataTable.Col source="scheduledAt" label="Scheduled">
        <DateField source="scheduledAt" showTime />
      </DataTable.Col>
      <DataTable.Col source="createdAt" label="Created">
        <DateField source="createdAt" />
      </DataTable.Col>
      <DataTable.Col>
        <EditButton />
      </DataTable.Col>
    </DataTable>
  </List>
);

export const JobCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="title" validate={required()} />
      <TextInput source="description" multiline />
      <ReferenceInput source="customerId" reference="customers">
        <SelectInput optionText="name" validate={required()} />
      </ReferenceInput>
      <SelectInput source="priority" choices={priorityChoices} defaultValue="MEDIUM" />
      <DateInput source="scheduledAt" />
      <NumberInput source="estimatedDuration" label="Est. Duration (min)" />
    </SimpleForm>
  </Create>
);

export const JobEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="title" validate={required()} />
      <TextInput source="description" multiline />
      <SelectInput source="status" choices={statusChoices} />
      <SelectInput source="priority" choices={priorityChoices} />
      <ReferenceInput source="customerId" reference="customers">
        <SelectInput optionText="name" />
      </ReferenceInput>
      <DateInput source="scheduledAt" />
      <NumberInput source="estimatedDuration" label="Est. Duration (min)" />
    </SimpleForm>
  </Edit>
);

export const JobShow = () => (
  <Show>
    <div className="flex flex-col gap-4">
      <RecordField source="title" />
      <RecordField source="description" />
      <RecordField source="status">
        <BadgeField source="status" />
      </RecordField>
      <RecordField source="priority">
        <BadgeField source="priority" />
      </RecordField>
      <RecordField source="customerId" label="Customer">
        <ReferenceField source="customerId" reference="customers" />
      </RecordField>
      <RecordField source="scheduledAt" label="Scheduled">
        <DateField source="scheduledAt" showTime />
      </RecordField>
      <RecordField source="startedAt" label="Started">
        <DateField source="startedAt" showTime />
      </RecordField>
      <RecordField source="completedAt" label="Completed">
        <DateField source="completedAt" showTime />
      </RecordField>
      <RecordField source="estimatedDuration" label="Est. Duration (min)" />
      <RecordField source="createdAt" label="Created">
        <DateField source="createdAt" showTime />
      </RecordField>
    </div>
  </Show>
);
