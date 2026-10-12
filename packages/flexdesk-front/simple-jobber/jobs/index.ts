import { createElement } from 'react';
import { ResourceProps } from 'ra-core';
import { Icon } from '../components/atlantis';
import { JobList } from './JobList';
import { JobShow } from './JobShow';
import { JobCreate } from './JobCreate';
import { JobEdit } from './JobEdit';

/** Jobs resource icon wrapper for React Admin */
const JobsIcon = () => createElement(Icon, { name: 'wrench' });

export const jobs: ResourceProps = {
  name: 'jobs',
  list: JobList,
  show: JobShow,
  create: JobCreate,
  edit: JobEdit,
  recordRepresentation: 'title',
  icon: JobsIcon,
};

export { JobList, JobShow, JobCreate, JobEdit };
