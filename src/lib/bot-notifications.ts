type Fetcher = typeof fetch;

export function commentWebAppUrl(appUrl: string, postId: string, commentId: string): string {
  if (!/^[1-9]\d*$/.test(postId) || !/^[1-9]\d*$/.test(commentId)) throw new Error('Invalid comment target');
  const url = new URL(appUrl);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid Mini App URL');
  url.pathname = `/posts/${postId}`;
  url.search = new URLSearchParams({ comment: commentId }).toString();
  url.hash = '';
  return url.toString();
}

export async function sendCommentBotNotification(
  { chatId, actorName, postId, commentId }: { chatId: string; actorName: string; postId: string; commentId: string },
  { botToken = process.env.TELEGRAM_BOT_TOKEN, appUrl = process.env.PUBLIC_APP_URL, fetcher = fetch }: { botToken?: string; appUrl?: string; fetcher?: Fetcher } = {},
): Promise<boolean> {
  if (!botToken || !appUrl) return false;
  const url = commentWebAppUrl(appUrl, postId, commentId);
  const response = await fetcher(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: `💬 ${actorName} برای پستت کامنت گذاشت.`,
      reply_markup: { inline_keyboard: [[{ text: 'دیدن کامنت', web_app: { url } }]] },
    }),
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) return false;
  const result = await response.json() as { ok?: boolean };
  return result.ok === true;
}
