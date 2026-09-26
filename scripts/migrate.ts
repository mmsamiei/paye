import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  await pool.query(readFileSync(resolve('sql/001_initial.sql'), 'utf8'));
  console.log('Database schema ready');
} finally {
  await pool.end();
}
