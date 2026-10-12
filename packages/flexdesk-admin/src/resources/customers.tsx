"use client";

import {
  List,
  Create,
  Edit,
  Show,
  DataTable,
  SimpleForm,
  TextInput,
  EmailInput,
  PhoneInput,
  EmailField,
  DateField,
  RecordField,
  EditButton,
} from "@/components/admin";
import { required } from "ra-core";

export const CustomerList = () => (
  <List sort={{ field: "name", order: "ASC" }}>
    <DataTable rowClick="show">
      <DataTable.Col source="name" />
      <DataTable.Col source="email">
        <EmailField source="email" />
      </DataTable.Col>
      <DataTable.Col source="phone" />
      <DataTable.Col source="createdAt" label="Created">
        <DateField source="createdAt" />
      </DataTable.Col>
      <DataTable.Col>
        <EditButton />
      </DataTable.Col>
    </DataTable>
  </List>
);

export const CustomerCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" validate={required()} />
      <EmailInput source="email" />
      <PhoneInput source="phone" />
      <TextInput source="address.street" label="Street" />
      <TextInput source="address.city" label="City" />
      <TextInput source="address.state" label="State" />
      <TextInput source="address.zip" label="ZIP" />
    </SimpleForm>
  </Create>
);

export const CustomerEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" validate={required()} />
      <EmailInput source="email" />
      <PhoneInput source="phone" />
      <TextInput source="address.street" label="Street" />
      <TextInput source="address.city" label="City" />
      <TextInput source="address.state" label="State" />
      <TextInput source="address.zip" label="ZIP" />
    </SimpleForm>
  </Edit>
);

export const CustomerShow = () => (
  <Show>
    <div className="flex flex-col gap-4">
      <RecordField source="name" />
      <RecordField source="email">
        <EmailField source="email" />
      </RecordField>
      <RecordField source="phone" />
      <RecordField source="address.street" label="Street" />
      <RecordField source="address.city" label="City" />
      <RecordField source="address.state" label="State" />
      <RecordField source="address.zip" label="ZIP" />
      <RecordField source="createdAt" label="Created">
        <DateField source="createdAt" showTime />
      </RecordField>
    </div>
  </Show>
);
