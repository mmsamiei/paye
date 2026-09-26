import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createHmac } from 'node:crypto';
import { validateInitData } from '../src/lib/telegram.ts';

const token='123456:test-token';
function signed(user: unknown, authDate=1_800_000_000) {
  const data=new URLSearchParams({auth_date:String(authDate),user:JSON.stringify(user)});
  const check=[...data.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>`${key}=${value}`).join('\n');
  const secret=createHmac('sha256','WebAppData').update(token).digest();
  data.set('hash',createHmac('sha256',secret).update(check).digest('hex'));
  return data.toString();
}
test('accepts a signed current Telegram user',()=>{
  assert.equal(validateInitData(signed({id:42,first_name:'Mahdi'}),token,1_800_000_030).id,42);
});
test('rejects tampered and expired sessions',()=>{
  const raw=signed({id:42,first_name:'Mahdi'});
  assert.throws(()=>validateInitData(raw.replace('Mahdi','Other'),token,1_800_000_030));
  assert.throws(()=>validateInitData(raw,token,1_800_100_000));
});
test('rejects duplicate signed fields',()=>{
  assert.throws(()=>validateInitData(`${signed({id:42,first_name:'Mahdi'})}&user=x`,token,1_800_000_030));
});
