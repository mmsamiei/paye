import { db, rows } from './db';
import type { Viewer } from './auth';

export type Post = { id: string; author_id: string; display_name: string; username: string | null; avatar_url: string | null; body: string; visibility: 'public' | 'private'; space_id: string | null; space_name: string | null; created_at: string; updated_at: string; comment_count: string };
export const readable = `(p.visibility='public' OR p.author_id=$1 OR EXISTS (
  SELECT 1 FROM follows f WHERE f.follower_id=$1 AND f.followee_id=p.author_id AND f.status='accepted'))`;
export const avatarSql = `CASE WHEN u.show_avatar THEN CASE WHEN ua.user_id IS NOT NULL THEN '/api/avatars/' || u.id || '?v=' || (extract(epoch from ua.updated_at)*1000)::bigint ELSE u.avatar_url END ELSE NULL END`;
export const postSelect = `SELECT p.id,p.author_id,u.display_name,u.username,${avatarSql} AS avatar_url,p.body,p.visibility,p.space_id,s.name AS space_name,p.created_at,p.updated_at,
  (SELECT count(*) FROM comments c WHERE c.post_id=p.id AND c.deleted_at IS NULL)::text AS comment_count
  FROM posts p JOIN users u ON u.id=p.author_id LEFT JOIN user_avatar_uploads ua ON ua.user_id=u.id LEFT JOIN spaces s ON s.id=p.space_id`;
export async function getPost(id: string, viewer: Viewer): Promise<Post | null> {
  const [post] = await rows<Post>(db, `${postSelect} WHERE p.id=$2 AND p.deleted_at IS NULL AND u.disabled_at IS NULL AND ${readable}`, [viewer.id,id]);
  return post || null;
}
export function parseId(value: string | undefined): string {
  if (!value || !/^[1-9]\d*$/.test(value)) throw new Error('Invalid ID');
  return value;
}
