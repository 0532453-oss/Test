declare module '@nozbe/watermelondb' {
  export class Model {
    static table: string;
    static associations?: Record<string, { type: string; key?: string; foreignKey?: string }>;
    id: string;
    update(recordUpdater: (record: any) => void): Promise<void>;
    prepareUpdate(recordUpdater: (record: any) => void): this;
    markAsDeleted(): Promise<void>;
    destroyPermanently(): Promise<void>;
  }

  export class Database {
    constructor(options: { adapter: any; modelClasses: any[] });
    get<T extends Model>(tableName: string): Collection<T>;
    write<T>(action: () => Promise<T>): Promise<T>;
    batch(...records: any[]): Promise<void>;
  }

  export class Collection<T extends Model = Model> {
    find(id: string): Promise<T>;
    query(...conditions: any[]): Query<T>;
    create(recordCreator: (record: T) => void): Promise<T>;
    prepareCreate(recordCreator: (record: T) => void): T;
  }

  export class Query<T extends Model = Model> {
    fetch(): Promise<T[]>;
    fetchCount(): Promise<number>;
    observe(): any;
    observeCount(): any;
  }

  export function appSchema(schema: { version: number; tables: any[] }): any;
  export function tableSchema(schema: { name: string; columns: any[] }): any;
}

declare module '@nozbe/watermelondb/decorators' {
  export function field(columnName: string): PropertyDecorator;
  export function text(columnName: string): PropertyDecorator;
  export function date(columnName: string): PropertyDecorator;
  export function readonly(target: any, key: string, descriptor?: PropertyDescriptor): void;
  export function relation(tableName: string, columnName: string): PropertyDecorator;
  export function children(tableName: string): PropertyDecorator;
}

declare module '@nozbe/watermelondb/adapters/sqlite' {
  export default class SQLiteAdapter {
    constructor(options: {
      schema: any;
      migrations?: any;
      jsi?: boolean;
      onSetUpError?: (error: any) => void;
    });
  }
}

declare module '@nozbe/watermelondb/DatabaseProvider' {
  import { Database } from '@nozbe/watermelondb';
  import React from 'react';

  interface DatabaseProviderProps {
    database: Database;
    children: React.ReactNode;
  }

  const DatabaseProvider: React.FC<DatabaseProviderProps>;
  export default DatabaseProvider;
}

declare module '@nozbe/with-observables' {
  export default function withObservables<InputProps, ObservableProps>(
    triggerProps: string[],
    getObservables: (props: InputProps) => ObservableProps,
  ): (component: React.ComponentType<InputProps & ObservableProps>) => React.ComponentType<InputProps>;
}
