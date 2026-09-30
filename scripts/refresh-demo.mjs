import { execFileSync, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const tunnelLogs = () => {
  const result = spawnSync('docker', ['logs', 'paye-cloudflared'], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error('Could not read tunnel logs');
  return `${result.stdout}\n${result.stderr}`;
};
const envFile = '.env.local';
let env = readFileSync(envFile, 'utf8');
const value = key => env.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim();
const setValue = (key, next) => {
  const line = `${key}=${next}`;
  env = new RegExp(`^${key}=.*$`, 'm').test(env)
    ? env.replace(new RegExp(`^${key}=.*$`, 'm'), line)
    : `${env.trimEnd()}\n${line}\n`;
};
const token = value('TELEGRAM_BOT_TOKEN');
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is missing from .env.local');

if (!process.argv.includes('--reuse')) {
  spawnSync('docker', ['rm', '-f', 'paye-cloudflared'], { stdio: 'ignore' });
  docker('run', '-d', '--rm', '--pull=never', '--name', 'paye-cloudflared',
    'cloudflare/cloudflared:latest', 'tunnel', '--no-autoupdate', '--url', 'http://host.docker.internal:3000');
}

let appUrl;
for (let attempt = 0; attempt < 20; attempt++) {
  const logs = tunnelLogs();
  appUrl = logs.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)?.[0];
  if (appUrl) break;
  await new Promise(resolve => setTimeout(resolve, 1000));
}
if (!appUrl) throw new Error('Cloudflare did not return a public URL');

setValue('PUBLIC_APP_URL', `${appUrl}/`);
const secret = value('TELEGRAM_WEBHOOK_SECRET') || randomBytes(32).toString('hex');
setValue('TELEGRAM_WEBHOOK_SECRET', secret);
writeFileSync(envFile, env, { mode: 0o600 });
docker('compose', 'up', '-d', '--no-build', '--force-recreate', 'app');

let reachable = false;
for (let attempt = 0; attempt < 60; attempt++) {
  try {
    const response = await fetch(appUrl, { signal: AbortSignal.timeout(5000) });
    if (response.ok) { reachable = true; break; }
  } catch { /* DNS propagation can take a few seconds. */ }
  await new Promise(resolve => setTimeout(resolve, 1000));
}
if (!reachable) throw new Error(`The public app did not become reachable: ${appUrl}`);

async function botCall(method, body) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(`${method} failed: ${result.description || response.status}`);
  return result.result;
}

await botCall('setChatMenuButton', {
  menu_button: { type: 'web_app', text: 'باز کردن پایه', web_app: { url: `${appUrl}/` } },
});
await botCall('setWebhook', {
  url: `${appUrl}/api/telegram/webhook`,
  secret_token: secret,
  allowed_updates: ['message'],
});
const webhook = await botCall('getWebhookInfo', {});
if (webhook.url !== `${appUrl}/api/telegram/webhook`) throw new Error('Webhook URL did not update');
console.log(`Paye is ready: ${appUrl}/`);
console.log('Telegram menu and /start reply are synchronized with this URL.');
