import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { categories, categoryLabel, classifyPost } from '../src/lib/categories.ts';

test('four useful categories and no Other category', () => {
  assert.deepEqual(categories.map(item => item.label), ['همراهی','یادگیری','مشورت','گفت‌وگو']);
  assert.equal(categoryLabel(null), null);
});

test('classifies clear Persian posts by the response they seek', () => {
  assert.equal(classifyPost('کسی پنجشنبه پایه تئاتر هست؟'), 'companionship');
  assert.equal(classifyPost('کسی پایه هست با هم یادگیری ماشین تمرین کنیم؟'), 'learning');
  assert.equal(classifyPost('می‌خوام ML یاد بگیرم؛ کسی هست با هم تمرین کنیم؟'), 'learning');
  assert.equal(classifyPost('برای انتخاب استاد درس مشورت می‌خوام'), 'advice');
  assert.equal(classifyPost('به نظرتون کدوم درس رو بردارم؟'), 'advice');
  assert.equal(classifyPost('با سمیعی درس بگذرونم؟'), 'advice');
  assert.equal(classifyPost('فردا می‌خوام برم دانشگاه، چطوری وارد شم؟ چی بگم؟'), 'advice');
  assert.equal(classifyPost('نظرتون درباره آینده هوش مصنوعی چیه؟'), 'discussion');
});

test('leaves unclear and unrelated posts uncategorized', () => {
  assert.equal(classifyPost('کتاب CLRS برای فروش دارم.'), null);
  assert.equal(classifyPost('امروز روز خوبی بود.'), null);
  assert.equal(classifyPost(''), null);
});
