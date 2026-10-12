import { createElement } from 'react';
import { ResourceProps } from 'ra-core';
import { Icon } from '../components/atlantis';
import { RequestList } from './RequestList';
import { RequestShow } from './RequestShow';
import { RequestCreate } from './RequestCreate';
import { RequestEdit } from './RequestEdit';

/** Requests resource icon wrapper for React Admin */
const RequestsIcon = () => createElement(Icon, { name: 'inbox' });

export const requests: ResourceProps = {
  name: 'requests',
  list: RequestList,
  show: RequestShow,
  create: RequestCreate,
  edit: RequestEdit,
  recordRepresentation: 'title',
  icon: RequestsIcon,
};

export { RequestList, RequestShow, RequestCreate, RequestEdit };
