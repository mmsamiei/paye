import { Pool } from 'pg';
import { classifyPost } from '../src/lib/categories.ts';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
let lastId = '0';
const counts: Record<string, number> = { companionship: 0, learning: 0, advice: 0, discussion: 0, uncategorized: 0 };
try {
  for (;;) {
    const batch = await pool.query<{ id: string; body: string }>(
      `SELECT id,body FROM posts WHERE id>$1 AND deleted_at IS NULL AND category_source='auto' ORDER BY id LIMIT 200`, [lastId],
    );
    if (!batch.rows.length) break;
    for (const post of batch.rows) {
      const category = classifyPost(post.body);
      await pool.query(`UPDATE posts SET category=$2 WHERE id=$1 AND category_source='auto'`, [post.id, category]);
      counts[category ?? 'uncategorized']++;
      lastId = post.id;
    }
  }
  console.log('Post category backfill:', counts);
} finally {
  await pool.end();
}
