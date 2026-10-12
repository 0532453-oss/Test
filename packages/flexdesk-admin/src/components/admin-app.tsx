"use client";

import { Admin } from "@/components/admin";
import { Resource } from "ra-core";
import { dataProvider } from "@/lib/dataProvider";
import { authProvider } from "@/lib/authProvider";
import { JobList, JobCreate, JobEdit, JobShow } from "@/resources/jobs";
import {
  CustomerList,
  CustomerCreate,
  CustomerEdit,
  CustomerShow,
} from "@/resources/customers";
import { InvoiceList, InvoiceShow } from "@/resources/invoices";
import { Briefcase, Users, FileText } from "lucide-react";
import { NotFound } from "@/components/admin/not-found";
import { Loading } from "@/components/admin/loading";

export default function AdminApp() {
  return (
    <Admin
      dataProvider={dataProvider}
      authProvider={authProvider}
      requireAuth
      title="FlexDesk Admin"
      catchAll={NotFound}
      loading={Loading}
    >
      <Resource
        name="jobs"
        list={JobList}
        create={JobCreate}
        edit={JobEdit}
        show={JobShow}
        icon={Briefcase}
        recordRepresentation="title"
      />
      <Resource
        name="customers"
        list={CustomerList}
        create={CustomerCreate}
        edit={CustomerEdit}
        show={CustomerShow}
        icon={Users}
        recordRepresentation="name"
      />
      <Resource
        name="invoices"
        list={InvoiceList}
        show={InvoiceShow}
        icon={FileText}
        recordRepresentation="invoiceNumber"
      />
    </Admin>
  );
}
