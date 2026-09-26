import { createHmac, timingSafeEqual } from 'node:crypto';

export type TelegramUser = { id: number; first_name: string; last_name?: string; username?: string; photo_url?: string };

export function validateInitData(raw: string, botToken: string, nowSeconds = Math.floor(Date.now() / 1000)): TelegramUser {
  if (!raw || raw.length > 8192 || !botToken) throw new Error('Invalid Telegram session');
  const data = new URLSearchParams(raw);
  const hash = data.get('hash');
  const authDate = Number(data.get('auth_date'));
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash) || !Number.isSafeInteger(authDate) || authDate > nowSeconds + 60 || nowSeconds - authDate > 86400) throw new Error('Expired Telegram session');
  const entries = [...data.entries()].filter(([key]) => key !== 'hash').sort(([a], [b]) => a.localeCompare(b));
  if (new Set(entries.map(([key]) => key)).size !== entries.length) throw new Error('Invalid Telegram session');
  const checkString = entries.map(([key, value]) => `${key}=${value}`).join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expected = createHmac('sha256', secret).update(checkString).digest();
  if (!timingSafeEqual(expected, Buffer.from(hash, 'hex'))) throw new Error('Invalid Telegram session');
  let user: TelegramUser;
  try { user = JSON.parse(data.get('user') || 'null'); } catch { throw new Error('Invalid Telegram user'); }
  if (!user || !Number.isSafeInteger(user.id) || user.id <= 0 || typeof user.first_name !== 'string' || !user.first_name.trim()) throw new Error('Invalid Telegram user');
  return user;
}
