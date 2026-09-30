import { NextRequest, NextResponse } from 'next/server';
import { startChatId, startMessage, validWebhookSecret, type BotUpdate } from '@/lib/bot-start';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!process.env.TELEGRAM_WEBHOOK_SECRET) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  if (!validWebhookSecret(request.headers.get('x-telegram-bot-api-secret-token'), process.env.TELEGRAM_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let update: BotUpdate;
  try { update = await request.json() as BotUpdate; }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const chatId = startChatId(update);
  if (chatId === null) return NextResponse.json({ ok: true });
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.PUBLIC_APP_URL) {
    return NextResponse.json({ error: 'Bot not configured' }, { status: 503 });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(startMessage(chatId, process.env.PUBLIC_APP_URL)),
      signal: AbortSignal.timeout(5000),
    });
    const result = await response.json() as { ok?: boolean };
    if (!response.ok || !result.ok) throw new Error('Telegram rejected start reply');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn('Telegram start reply failed', error instanceof Error ? error.name : 'Unknown error');
    return NextResponse.json({ error: 'Bot reply failed' }, { status: 502 });
  }
}
