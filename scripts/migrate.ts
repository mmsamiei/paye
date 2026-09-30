import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY)');
  for (const file of ['sql/001_initial.sql', 'sql/002_space_paths.sql', 'sql/003_space_aliases.sql', 'sql/004_avatar_visibility.sql', 'sql/005_uploaded_avatars.sql', 'sql/006_notification_comment_targets.sql', 'sql/007_post_categories.sql']) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const applied = await client.query('SELECT 1 FROM schema_migrations WHERE name=$1', [file]);
      if (!applied.rowCount) {
        await client.query(readFileSync(resolve(file), 'utf8'));
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  console.log('Database schema ready');
} finally {
  await pool.end();
}
