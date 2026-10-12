/**
 * ObjectRecord Type
 * 
 * Generic record type that extends BaseObjectRecord.
 * Used throughout the application for type-safe record handling.
 */

import { type BaseObjectRecord } from '@/modules/object-record/types/BaseObjectRecord';

export type ObjectRecord = Record<string, any> & BaseObjectRecord;
