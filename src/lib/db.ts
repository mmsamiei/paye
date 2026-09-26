import { Pool, type PoolClient, type QueryResultRow } from 'pg';

const globalForDb = globalThis as unknown as { payePool?: Pool };
export const db = globalForDb.payePool ?? new Pool({ connectionString: process.env.DATABASE_URL });
if (process.env.NODE_ENV !== 'production') globalForDb.payePool = db;
export type Sql = Pool | PoolClient;
export async function rows<T extends QueryResultRow>(sql: Sql, query: string, values: unknown[] = []): Promise<T[]> {
  return (await sql.query<T>(query, values)).rows;
}
export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await db.connect();
  try { await client.query('BEGIN'); const result = await fn(client); await client.query('COMMIT'); return result; }
  catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
