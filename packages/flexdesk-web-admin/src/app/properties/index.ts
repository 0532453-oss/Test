// Components
export { PropertiesIndexPage } from './PropertiesIndexPage';
export { PropertyShowPage } from './PropertyShowPage';
export { PropertyCreatePage } from './PropertyCreatePage';

// Hooks
export {
  useProperties,
  useProperty,
  usePropertyWithRelations,
  usePropertiesByCustomer,
  usePrimaryProperty,
  useSearchProperties,
  useCreateProperty,
  useUpdateProperty,
  useSetPrimaryProperty,
  useDeleteProperty,
  useMigrateCustomerAddress,
} from './hooks/useProperties';

// Types
export type {
  Property,
  PropertyWithRelations,
  PropertyCustomer,
  CreatePropertyInput,
  UpdatePropertyInput,
  SyncStatus,
} from './types/Property';
