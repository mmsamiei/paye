import { timingSafeEqual } from 'node:crypto';

export type BotUpdate = {
  message?: { text?: string; chat?: { id?: number; type?: string } };
};

export function validWebhookSecret(received: string | null, expected: string | undefined): boolean {
  if (!received || !expected) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function startChatId(update: BotUpdate): number | null {
  const message = update.message;
  if (message?.chat?.type !== 'private' || !Number.isSafeInteger(message.chat.id)) return null;
  if (!/^\/start(?:@[A-Za-z0-9_]+)?(?:\s|$)/.test(message.text || '')) return null;
  return message.chat.id!;
}

export function startMessage(chatId: number, appUrl: string) {
  const url = new URL(appUrl);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid Mini App URL');
  return {
    chat_id: chatId,
    text: 'به پایه خوش آمدی! برای دیدن پست‌ها و نوشتن پست، برنامه را باز کن.',
    reply_markup: { inline_keyboard: [[{ text: 'باز کردن پایه', web_app: { url: url.toString() } }]] },
  };
}
