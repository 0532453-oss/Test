import { createElement } from 'react';
import { ResourceProps } from 'ra-core';
import { Icon } from '../components/atlantis';
import { InvoiceList } from './InvoiceList';
import { InvoiceShow } from './InvoiceShow';
import { InvoiceCreate } from './InvoiceCreate';
import { InvoiceEdit } from './InvoiceEdit';

/** Invoices resource icon wrapper for React Admin */
const InvoicesIcon = () => createElement(Icon, { name: 'invoice' });

export const invoices: ResourceProps = {
  name: 'invoices',
  list: InvoiceList,
  show: InvoiceShow,
  create: InvoiceCreate,
  edit: InvoiceEdit,
  recordRepresentation: 'invoiceNumber',
  icon: InvoicesIcon,
};

export { InvoiceList, InvoiceShow, InvoiceCreate, InvoiceEdit };
