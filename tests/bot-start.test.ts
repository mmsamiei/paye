import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { startChatId, startMessage, validWebhookSecret } from '../src/lib/bot-start.ts';

test('only a private /start message receives the launch button', () => {
  assert.equal(startChatId({ message:{ text:'/start', chat:{ id:123, type:'private' } } }), 123);
  assert.equal(startChatId({ message:{ text:'/start foo', chat:{ id:123, type:'private' } } }), 123);
  assert.equal(startChatId({ message:{ text:'hello', chat:{ id:123, type:'private' } } }), null);
  assert.equal(startChatId({ message:{ text:'/start', chat:{ id:123, type:'group' } } }), null);
});

test('start reply uses the current HTTPS Mini App address', () => {
  const payload = startMessage(123, 'https://new.example/');
  assert.equal(payload.reply_markup.inline_keyboard[0][0].web_app.url, 'https://new.example/');
  assert.throws(() => startMessage(123, 'http://new.example/'));
});

test('webhook requests require the matching secret', () => {
  assert.equal(validWebhookSecret('abc', 'abc'), true);
  assert.equal(validWebhookSecret('bad', 'abc'), false);
  assert.equal(validWebhookSecret(null, 'abc'), false);
});
