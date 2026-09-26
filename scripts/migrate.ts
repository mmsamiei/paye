import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  for (const file of ['sql/001_initial.sql', 'sql/002_space_paths.sql']) {
    await pool.query(readFileSync(resolve(file), 'utf8'));
  }
  console.log('Database schema ready');
} finally {
  await pool.end();
}
