export const categories = [
  { id: 'companionship', label: 'همراهی' },
  { id: 'learning', label: 'یادگیری' },
  { id: 'advice', label: 'مشورت' },
  { id: 'discussion', label: 'گفت‌وگو' },
] as const;

export type Category = (typeof categories)[number]['id'];

export function categoryLabel(category: Category | null): string | null {
  return categories.find(item => item.id === category)?.label ?? null;
}

function normalize(text: string): string {
  return text.normalize('NFKC').toLowerCase()
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک')
    .replace(/[\u064b-\u065f\u0670]/g, '')
    .replace(/[\u200c\u200d]/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ').trim();
}

/** Conservative first pass: ambiguous posts remain uncategorized. */
export function classifyPost(body: string): Category | null {
  const text = normalize(body);
  if (!text) return null;

  // Questions about a personal choice need advice even when they mention a class or skill.
  if (/(مشورت|راهنمایی می خوام|راهنمایی میخوام|کدوم (استاد|درس|رشته|گزینه)|کدام (استاد|درس|رشته|گزینه)|درس (بگذرونم|بردارم)|چطوری (وارد شم|رفتار کنم)|چی بگم|به نظرتون .* (بخرم|بردارم|انتخاب کنم|برم)|به نظرت .* (بخرم|بردارم|انتخاب کنم|برم))/.test(text)) return 'advice';

  // An explicit learning goal takes precedence over the generic phrase "با هم".
  if (/(یاد بگیر|یاد گرفتن|یاد بد|یادگیری|آموزش|درس بخون|درس خوند|تمرین کنیم|هم تمرین|مطالعه کنیم|study buddy|learn together)/.test(text)) return 'learning';

  if (/(پایه(?: \S+){0,5} (?:هست|اید|ای|ایم|باش|بریم)|همراه (می خوام|میخوام|می گردم|میگردم|برای|بریم)|با هم (بریم|بیایم|بیا|ببینیم)|هم سفر|همسفر|کسی (میاد|می آد|می خواد بیاد|میخواد بیاد)|بریم (تئاتر|سینما|کوه|کافه|کنسرت))/.test(text)) return 'companionship';

  if (/(بیایید (بحث|گفتگو|گفت و گو)|بیاین (بحث|گفتگو|گفت و گو)|گپ بزن|گفتگو کنیم|گفت و گو کنیم|نظرتون درباره|نظرتان درباره|نظرت درباره|به نظرم|فکر می کنید درباره|فکر می کنین درباره)/.test(text)) return 'discussion';

  return null;
}
