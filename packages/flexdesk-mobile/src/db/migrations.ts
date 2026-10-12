import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

/**
 * Schema migrations for WatermelonDB.
 *
 * IMPORTANT: Every time you bump the schema version in schema.ts, add a
 * corresponding migration step here. Without migrations, a version bump
 * causes WatermelonDB to destroy and recreate the entire database, losing
 * all local data including unsynced queue items.
 *
 * Example migration (uncomment and adapt when bumping to version 2):
 *
 *   {
 *     toVersion: 2,
 *     steps: [
 *       addColumns({
 *         table: 'jobs',
 *         columns: [{ name: 'new_column', type: 'string', isOptional: true }],
 *       }),
 *     ],
 *   },
 */
export default schemaMigrations({
  migrations: [
    // Add migration steps here when schema version changes.
  ],
});
