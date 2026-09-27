import type { NextRequest } from 'next/server';
import { db, rows, type Sql } from './db';
import { validateInitData } from './telegram';

export type Viewer = { id: string; telegram_id: string; display_name: string; username: string | null; avatar_url: string | null; show_avatar: boolean; disabled_at: string | null };
export function isAdmin(viewer: Viewer): boolean {
  return (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map(x => x.trim()).includes(String(viewer.telegram_id));
}
export async function getViewer(request: NextRequest): Promise<Viewer> {
  const raw = request.headers.get('authorization')?.replace(/^tma\s+/i, '') || '';
  const tg = validateInitData(raw, process.env.TELEGRAM_BOT_TOKEN || '');
  const name = [tg.first_name, tg.last_name].filter(Boolean).join(' ').slice(0, 120);
  const [viewer] = await rows<Viewer>(db, `INSERT INTO users (telegram_id, display_name, username, avatar_url)
    VALUES ($1,$2,$3,$4) ON CONFLICT (telegram_id) DO UPDATE SET
    display_name=EXCLUDED.display_name, username=EXCLUDED.username, avatar_url=EXCLUDED.avatar_url, updated_at=now()
    RETURNING id, telegram_id, display_name, username, avatar_url, show_avatar, disabled_at`,
    [tg.id, name, tg.username || null, tg.photo_url || null]);
  if (viewer.disabled_at) throw new Error('Account disabled');
  return viewer;
}
export async function event(sql: Sql, viewer: Viewer, name: string, properties: Record<string, unknown> = {}) {
  await sql.query('INSERT INTO analytics_events (user_id,name,properties) VALUES ($1,$2,$3)', [viewer.id, name, JSON.stringify(properties)]);
}
