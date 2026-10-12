import { createElement } from 'react';
import { ResourceProps } from 'ra-core';
import { Icon } from '../components/atlantis';
import { ClientList } from './ClientList';
import { ClientShow } from './ClientShow';
import { ClientCreate } from './ClientCreate';
import { ClientEdit } from './ClientEdit';

/** Clients resource icon wrapper for React Admin */
const ClientsIcon = () => createElement(Icon, { name: 'clients' });

export const clients: ResourceProps = {
  name: 'clients',
  list: ClientList,
  show: ClientShow,
  create: ClientCreate,
  edit: ClientEdit,
  recordRepresentation: 'name',
  icon: ClientsIcon,
};

export { ClientList, ClientShow, ClientCreate, ClientEdit };
