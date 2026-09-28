import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { commentWebAppUrl, sendCommentBotNotification } from '../src/lib/bot-notifications.ts';

test('comment links use a query parameter that survives Mini App launch', () => {
  assert.equal(commentWebAppUrl('https://paye.example/', '42', '17'), 'https://paye.example/posts/42?comment=17');
  assert.throws(() => commentWebAppUrl('http://paye.example/', '42', '17'));
});

test('sends a private bot message with a Mini App button to the comment', async () => {
  const requests: { url: string; body: { chat_id: string; reply_markup: { inline_keyboard: { web_app: { url: string } }[][] } } }[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    requests.push({ url: String(input), body: JSON.parse(String(init?.body)) });
    return Response.json({ ok: true });
  };
  const sent = await sendCommentBotNotification(
    { chatId:'123', actorName:'مریم', postId:'42', commentId:'17' },
    { botToken:'test-token', appUrl:'https://paye.example/', fetcher },
  );
  assert.equal(sent, true);
  assert.equal(requests[0].url, 'https://api.telegram.org/bottest-token/sendMessage');
  assert.equal(requests[0].body.chat_id, '123');
  assert.equal(requests[0].body.reply_markup.inline_keyboard[0][0].web_app.url, 'https://paye.example/posts/42?comment=17');
});

test('bot delivery failure does not count as a sent message', async () => {
  const fetcher: typeof fetch = async () => Response.json({ ok:false }, { status:403 });
  assert.equal(await sendCommentBotNotification(
    { chatId:'123', actorName:'مریم', postId:'42', commentId:'17' },
    { botToken:'test-token', appUrl:'https://paye.example/', fetcher },
  ), false);
});
