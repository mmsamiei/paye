# Product Spec v2 — Social Discovery Layer on Telegram

**نسخه:** 0.2 — Simplified Product Thesis / PRD / Technical Product Spec  
**تاریخ:** 2026-09-26  
**وضعیت:** Draft for MVP design and implementation  
**بازار اولیه:** جامعه‌های دانشگاهی، با قابلیت تعمیم به جامعه‌های عمومی‌تر  

---

# 0. خلاصه اجرایی

این محصول یک شبکهٔ اجتماعی مستقل از تلگرام نیست. محصول یک **Social Discovery Layer روی Telegram** است.

تلگرام از قبل بخش‌هایی را که بسیار سخت و پرهزینه‌اند حل کرده است:

- identity اولیهٔ کاربر؛
- username؛
- private messaging؛
- group chat؛
- channel؛
- notification؛
- distribution از طریق لینک و گروه و کانال.

بنابراین محصول نباید chat، group یا channel دیگری بسازد. کار ما این است که روی زیرساخت موجود تلگرام، چند primitive اجتماعی ساده ولی ترکیب‌پذیر ایجاد کنیم:

1. **Post** — هر چیزی که کاربر می‌خواهد منتشر کند: سؤال، درخواست، demand، نظر، پیشنهاد فعالیت، آگهی، تجربه و غیره.
2. **Comment** — گفت‌وگوی عمومی زیر Post.
3. **Follow** — ساختن graph ارتباطات و کنترل دسترسی به Postهای private.
4. **Space** — context مکانی/اجتماعی قابل browse، مثل `Sharif / Computer Engineering`؛ اما به شکلی عمومی که بعداً فقط محدود به دانشگاه نباشد.
5. **Item + Like** — فهرست کنترل‌شده‌ای از فیلم، موسیقی، کتاب، بازی، موضوع و چیزهای دیگر که کاربر می‌تواند آنها را Like کند.
6. **RadarSource + RadarEntry** — ingest محتوای کانال‌های تلگرامی و نمایش آن در یک feed ساده.

سه ستون تجربهٔ محصول عبارت‌اند از:

- **Social Feed:** آدم‌ها Post می‌گذارند، Comment می‌گیرند، Follow می‌شوند و در صورت نیاز conversation خصوصی را روی Telegram ادامه می‌دهند.
- **Radar:** محتوای کانال‌های موجود Telegram وارد یک feed خواندنی و یکپارچه می‌شود.
- **Likes:** آدم‌ها Itemهای مورد علاقهٔ خود را Like می‌کنند؛ Itemها صفحه دارند و افراد دارای علاقهٔ مشترک قابل کشف می‌شوند.

## Thesis اصلی

> **Telegram already has communication. We add discovery, context and lightweight social structure.**

بازار اولیه دانشگاه‌ها هستند، ولی architecture نباید «دانشگاه» را primitive اصلی بداند.

دانشگاه فقط اولین **Space hierarchy** و اولین wedge توزیع محصول است.

---

# 1. تغییر فلسفه نسبت به نسخهٔ قبلی

نسخهٔ اول محصول assumptions زیادی داشت:

- Demand به‌عنوان entity مستقل؛
- Question، Activity، Ask، Learn و چند نوع object جدا؛
- lifecycle برای Demand؛
- expiration؛
- campus-specific metadata؛
- age verification؛
- Approach/Wave primitive؛
- profile غنی؛
- taxonomy پیچیده؛
- Radar classification و tagging از روز اول؛
- Interest Graph چندلایه.

در نسخهٔ جدید اصل طراحی این است:

> **هر concept تا زمانی که ضرورت آن در usage واقعی ثابت نشده، نباید به primitive محصول تبدیل شود.**

بنابراین:

- Demand یک نوع Post نیست؛ **یک رفتار یا interpretation از Post است**.
- Question هم فقط یک Post است.
- «کسی پایه تئاتر هست؟» و «با فلانی درس بردارم؟» و «به نظرم این فیلم عالی بود» همگی Post هستند.
- Comment یک primitive واقعی است چون interaction عمومی را ممکن می‌کند.
- Follow یک primitive واقعی است چون هم graph می‌سازد و هم private visibility را کنترل می‌کند.
- Like فقط رابطهٔ User → Item است.
- Radar در MVP فقط ingest و display است.
- Space جایگزین مدل‌های campus / university / faculty / department می‌شود.

---

# 2. Product Principles

## 2.1. Telegram-first

اگر Telegram کاری را خوب انجام می‌دهد، آن را دوباره نمی‌سازیم.

در نتیجه:

- private chat → Telegram؛
- group chat → Telegram؛
- channel publishing → Telegram؛
- Mini App → discovery, posting, comments, follow graph, spaces, likes, radar.

## 2.2. One content primitive

تمام محتوای user-generated در MVP یک object دارد:

```text
Post
```

نه:

```text
Demand
Question
Activity
Offer
Request
Discussion
```

این مفاهیم در صورت نیاز می‌توانند بعداً با classifier یا metadata سبک از Post استخراج شوند.

## 2.3. Minimal user input

کاربر نباید برای یک Post ساده یک فرم classified طولانی پر کند.

Composer پایه:

```text
What's on your mind?

[ text ]

Visibility: Public / Private
Post
```

Category، Space یا metadataهای دیگر فقط در صورت اثبات ارزش به UX اضافه می‌شوند.

## 2.4. Structured discovery without structured authoring

می‌خواهیم پیدا کردن Postها structured باشد، ولی ساختن آنها را بیش از حد structured نکنیم.

مثال:

- author فقط می‌نویسد: «کسی آخر هفته پایه کوه هست؟»
- classifier می‌تواند پشت صحنه category را `Activities` تشخیص دهد.
- browse بعداً می‌تواند Category filter داشته باشد.

## 2.5. Generalizable core

مدل داده نباید فرض کند کاربر:

- دانشجو است؛
- بالای یک سن خاص است؛
- حتماً دانشگاه دارد؛
- حتماً یک campus دارد؛
- حتماً دنبال relationship خاصی است.

## 2.6. Public discussion here, private conversation there

Comment داخل محصول است.

Private conversation داخل Telegram است.

## 2.7. Explicit features over speculative intelligence

تا زمانی که حجم داده و رفتار واقعی کاربران نشان نداده:

- embeddings پیچیده نمی‌سازیم؛
- knowledge graph پیچیده نمی‌سازیم؛
- recommendation stack سنگین نمی‌سازیم؛
- LLM summarization را core requirement نمی‌کنیم.

---

# 3. Jobs To Be Done

به‌جای personaهای متعدد، محصول با چند Job عمومی تعریف می‌شود.

## Job 1 — چیزی را مطرح کنم

> چیزی در ذهنم هست و می‌خواهم آدم‌های مرتبط آن را ببینند.

مثال:

- سؤال؛
- demand؛
- دعوت؛
- نظر؛
- درخواست کمک؛
- تجربه؛
- آگهی؛
- توصیه‌خواهی.

## Job 2 — آدم مرتبط پیدا کنم

> می‌خواهم آدم‌هایی را پیدا کنم که به چیزی که من دوست دارم علاقه دارند یا در graph اجتماعی به من نزدیک‌اند.

## Job 3 — بدانم در context مورد علاقه‌ام چه خبر است

> می‌خواهم Postها و محتوای مرتبط با یک Space یا Source را ببینم.

## Job 4 — محتوای پراکندهٔ Telegram را یکجا ببینم

> نمی‌خواهم برای فهمیدن اتفاق‌ها ده‌ها Channel را جداگانه باز کنم.

## Job 5 — رابطهٔ اجتماعی سبک بسازم

> می‌خواهم کسی را Follow کنم، محتوایش را ببینم و اگر او اجازه داد Postهای Privateاش را هم ببینم.

---

# 4. Core Domain Model

MVP باید بتواند تقریباً با این objectها تعریف شود:

```text
User
Post
Comment
Follow
Space
Item
Like
RadarSource
RadarEntry
```

Objectهای کمکی:

```text
PostCategory          optional / system-facing
SpaceMembership       optional later
ModerationAction      internal
Notification          delivery object
```

## 4.1. چیزی که عمداً وجود ندارد

در MVP object مستقل برای اینها نداریم:

```text
Demand
Question
Approach
Wave
Match
Chat
Conversation
Group
Channel
Campus
University
Faculty
Department
Skill
Event
```

اگر بعداً نیاز باشد بعضی از اینها می‌توانند اضافه شوند، اما core architecture به آنها وابسته نیست.

---

# 5. Information Architecture

پیشنهاد MVP:

```text
Home
Radar
Likes
Profile
```

و در سطح global:

```text
Search
Space selector / browser
Notifications
Composer
```

## 5.1. Home

مرکز interaction اجتماعی.

محتوای اصلی:

- Postهای public؛
- Postهای private از accepted follows؛
- Postهای افراد followشده؛
- Postهای Space انتخاب‌شده؛
- در آینده recommendation.

## 5.2. Radar

feed جدا برای محتوای ingestشده از Telegram Channels.

در MVP Radar را با Home مخلوط نمی‌کنیم تا بفهمیم آیا خودش utility مستقل ایجاد می‌کند یا نه.

## 5.3. Likes

ورودی social discovery بر اساس Itemها.

کاربر می‌تواند:

- Item search کند؛
- Item را Like کند؛
- Likeهای خودش را ببیند؛
- Item page را باز کند؛
- افرادی را که Item را Like کرده‌اند ببیند.

## 5.4. Profile

نسخهٔ اولیه minimal است.

```text
Avatar
Display name
Telegram username
Follower count
Following count
Likes
Posts
```

---

# 6. Identity و Onboarding

## 6.1. Identity source

هویت اولیه از Telegram Mini App session گرفته می‌شود.

اطلاعات پایهٔ مورد نیاز:

```text
telegram_user_id
display_name
username          nullable
avatar            if accessible / cached reference
```

## 6.2. چه چیزهایی در onboarding نمی‌پرسیم

در MVP اجباری نیست:

- سن؛
- تاریخ تولد؛
- جنسیت؛
- دانشگاه؛
- دانشکده؛
- رشته؛
- مقطع؛
- سال ورود؛
- occupation؛
- bio؛
- goals؛
- relationship intent.

## 6.3. Onboarding پیشنهادی

حداقل ممکن:

```text
1. Open Mini App
2. Telegram identity recognized
3. Optional: choose one or more Spaces to start browsing
4. Optional: like a few Items
5. Enter Home
```

حتی Step 3 و 4 نیز می‌توانند skippable باشند.

## 6.4. Activation را به فرم onboarding گره نزنیم

کاربر ممکن است از deep link یک Post وارد شود.

در این حالت flow درست:

```text
Open specific Post
→ read it
→ optionally comment/follow
→ then discover rest of app
```

نه اینکه ابتدا مجبور شود چند صفحه onboarding را رد کند.

---

# 7. Post — هستهٔ Social Feed

## 7.1. تعریف

Post واحد اصلی user-generated content است.

Post می‌تواند هر ماهیتی داشته باشد:

> کسی فردا پایه تئاتر هست؟

> با فلانی درس بردارم؟

> کسی تجربه اپلای کانادا داره؟

> این فیلم واقعاً underrated بود.

> دنبال یک کتاب خاص می‌گردم.

> کسی Rust بلده یه سؤال دارم؟

هیچ‌کدام از اینها entity جدا نیستند.

## 7.2. MVP Post fields

حداقل schema مفهومی:

```text
Post
- id
- author_id
- text
- visibility        public | private
- created_at
- updated_at
- deleted_at        nullable, internal
```

Fieldهای اختیاری که می‌توانند از روز اول یا کمی بعد اضافه شوند:

```text
- space_id          nullable
- category_id       nullable
```

## 7.3. Composer

نسخهٔ پیشنهادی MVP:

```text
┌────────────────────────────┐
│ What's on your mind?       │
│                            │
│ [                         ]│
│                            │
│ Public ▾                   │
│                       Post │
└────────────────────────────┘
```

نباید کاربر مجبور شود تعیین کند:

- این Question است یا Demand؛
- چه intent typeای دارد؛
- چه مدت فعال است؛
- چه کسی باید جواب دهد؛
- skill لازم چیست؛
- چه interestهایی به آن وصل است.

## 7.4. Text first

نسخهٔ اول Post می‌تواند **صرفاً text** باشد.

Media attachment می‌تواند بعداً اضافه شود.

این تصمیم چند مزیت دارد:

- implementation سریع‌تر؛
- moderation ساده‌تر؛
- feed سبک‌تر؛
- behavioral learning سریع‌تر؛
- جلوگیری از تبدیل سریع محصول به Instagram clone.

## 7.5. Public / Private

فقط دو visibility mode داریم.

### Public

```text
visibility = public
```

- هر کاربری می‌تواند Post را ببیند؛
- ممکن است در Home، Space view، Search یا direct link دیده شود؛
- Follow برای دیدن آن لازم نیست.

### Private

```text
visibility = private
```

فقط کاربرانی می‌توانند ببینند که:

1. author را Follow درخواست کرده‌اند؛
2. author درخواست آنها را Accept کرده است.

یعنی:

```text
accepted follower → can see private posts
pending follower  → cannot see private posts
rejected follower → cannot see private posts
```

## 7.6. Lifecycle

از دید محصول، Post lifecycle نداریم.

Post:

- ساخته می‌شود؛
- وجود دارد؛
- ممکن است edit یا delete شود.

نداریم:

```text
active
matched
fulfilled
expired
closed
archived
```

اگر یک demand دیگر relevant نیست، author می‌تواند Post را delete کند یا در آینده edit کند.

## 7.7. Demand به‌عنوان رفتار، نه schema

بعضی Postها عملاً demand هستند:

> کسی هست با هم بریم تئاتر؟

> کسی این مبحث رو بلده؟

> کسی می‌تونه برای اپلای راهنماییم کنه؟

اما این تفاوت در behavior است، نه در content object.

در آینده classifier می‌تواند احتمال بدهد:

```text
demand_probability = 0.91
question_probability = 0.62
```

ولی اینها internal signals هستند و نباید authoring UX را پیچیده کنند.

---

# 8. Comments

## 8.1. چرا Comments داخل محصول هستند؟

تلگرام private conversation را حل کرده، ولی discussion عمومی زیر یک Post را نه.

Comment باعث می‌شود Post یک social object واقعی شود.

مثال:

> با سمیعی NLP بردارم؟

زیر آن:

```text
Ali: من ترم قبل برداشتم...
Sara: تمریناش چطوره؟
Reza: سیلابس جدید فرق کرده.
```

این conversation باید کنار Post باقی بماند و برای خوانندگان بعدی ارزش تولید کند.

## 8.2. MVP model

نسخهٔ اول flat comments:

```text
Comment
- id
- post_id
- author_id
- text
- created_at
- updated_at
- deleted_at
```

نداریم:

- nested replies؛
- thread tree؛
- quote reply؛
- reactions متعدد.

## 8.3. ترتیب نمایش

MVP:

```text
Oldest first
```

یا:

```text
Newest first
```

یکی انتخاب شود و ثابت بماند.

بعداً می‌توان ranking بر اساس likes/relevance داشت.

## 8.4. Comment و Telegram DM

دو interaction متفاوت:

```text
Public response → Comment
Private response → Open Telegram profile / chat
```

دکمهٔ profile یا username می‌تواند کاربر را به Telegram برگرداند.

محصول خودش DM inbox نمی‌سازد.

---

# 9. Category — ساده و عمدتاً پشت صحنه

## 9.1. هدف Category

Category برای این نیست که author فرم طولانی پر کند.

هدف:

- browse؛
- filter؛
- search refinement؛
- analytics؛
- بعداً feed ranking.

## 9.2. UX پیشنهادی

MVP اولیه می‌تواند بدون category selector launch شود.

بعد classifier برای هر Post یک Category ساده تشخیص دهد.

مثلاً:

```text
«کسی پایه تئاتر هست؟»
→ Activities
```

```text
«کسی Transformer رو بلده توضیح بده؟»
→ Learning
```

```text
«کتاب CLRS کسی برای فروش داره؟»
→ Buy & Sell
```

## 9.3. Taxonomy باید shallow باشد

نمونهٔ اولیه:

```text
General
Questions
Activities
Learning
Advice
Buy & Sell
Opportunities
Other
```

این فقط نمونه است؛ taxonomy باید با دادهٔ واقعی refine شود.

## 9.4. Category یک label است، نه یک class hierarchy

Schema اولیه:

```text
PostCategory
- id
- name
- is_active
```

و روی Post:

```text
category_id nullable
```

نه:

```text
category
subcategory
subsubcategory
intent
skill
interest_ids
campus_scope
```

## 9.5. Human override

اگر classifier اشتباه کرد، بعداً می‌توان اجازه داد author category را تغییر دهد.

اما این feature MVP-critical نیست.

---

# 10. Space — معادل عمومی «شهر» در Divar

## 10.1. مسئله

در Divar کاربر معمولاً دو dimension مهم دارد:

```text
Category → چه چیزی؟
City     → کجا؟
```

در محصول ما نیز یک dimension محتوایی داریم:

```text
Category → دربارهٔ چه چیزی؟
```

و یک dimension context:

```text
Space → در کدام فضای اجتماعی/مکانی؟
```

## 10.2. چرا اسم آن University یا Campus نیست؟

چون می‌خواهیم مدل generalizable باشد.

امروز:

```text
Sharif
└── Computer Engineering
```

فردا شاید:

```text
Tehran
└── Vanak
```

یا:

```text
AI Community
└── LLM Builders
```

بنابراین primitive عمومی‌تر:

```text
Space
```

## 10.3. Space hierarchy

Space می‌تواند parent داشته باشد.

```text
Sharif University
├── Computer Engineering
├── Electrical Engineering
├── Mathematics
└── Physics

Amirkabir University
├── Computer Engineering
├── Electrical Engineering
└── Mathematics
```

Schema:

```text
Space
- id
- name
- parent_id nullable
- slug
- is_active
```

## 10.4. Post و Space

Post می‌تواند:

```text
space_id = null
```

باشد؛ یعنی global/public context.

یا:

```text
space_id = Sharif / CE
```

داشته باشد.

این association فقط context برای browse است.

## 10.5. Space selector

کاربر می‌تواند در بالای feed چیزی شبیه Divar داشته باشد:

```text
Space: Sharif / Computer Engineering ▾
```

و Postهای آن Space را ببیند.

## 10.6. انتخاب Space برای Post

برای کم‌کردن friction، Space نباید در هر Post اجباری باشد.

گزینه‌ها:

### گزینه A — inherit از context

اگر کاربر در صفحهٔ `Sharif / CE` Composer را باز کند، Post خودکار همان Space را می‌گیرد.

### گزینه B — optional selector

در composer:

```text
Space: none ▾
```

### توصیه

MVP بهتر است از ترکیب این دو استفاده کند:

- در context یک Space → auto-fill؛
- از Home → بدون Space یا انتخاب optional.

## 10.7. Space membership نداریم

فعلاً لازم نیست بگوییم:

> این کاربر عضو رسمی این دانشکده است.

یا verification دانشجویی انجام دهیم.

کاربر فقط می‌تواند Space را browse کند.

اگر روزی abuse یا relevance مشکل شد، verification جداگانه بررسی می‌شود.

---

# 11. Follow Graph

## 11.1. هدف Follow

Follow چهار کاربرد دارد:

1. ساختن social graph؛
2. افزایش relevance پست‌های افراد مورد علاقه؛
3. کنترل دسترسی به Postهای Private؛
4. signal برای recommendationهای بعدی.

## 11.2. Follow معنای مشخص عاطفی ندارد

Follow می‌تواند یعنی:

- نوشته‌های این فرد را دوست دارم؛
- این فرد برایم جالب است؛
- او را می‌شناسم؛
- می‌خواهم private posts او را ببینم؛
- از نظر حرفه‌ای برایم relevant است؛
- صرفاً کنجکاوم.

محصول نباید Follow را به dating یا romantic interest تقلیل دهد.

## 11.3. Follow Request

در MVP Follow یک action نیازمند acceptance است.

Stateها:

```text
pending
accepted
rejected
```

Flow:

```text
A taps Follow on B
→ Follow request created: pending
→ B receives notification
→ B accepts or rejects
```

اگر Accept:

```text
A is an accepted follower of B
```

و می‌تواند private posts B را ببیند.

## 11.4. Directional graph

Follow directional است.

```text
A → B
```

به این معنی نیست که:

```text
B → A
```

هم وجود دارد.

اگر هر دو accepted follow داشته باشند:

```text
A ↔ B
```

این mutual follow است، ولی در MVP feature خاص جدیدی روی آن نمی‌سازیم.

## 11.5. Follow و public content

حتی اگر B درخواست A را reject کند:

- A همچنان می‌تواند public Postهای B را ببیند؛
- فقط private Postها و follower-only distribution برایش باز نمی‌شود.

## 11.6. Follower / Following counts

در MVP می‌توان count را نمایش داد:

```text
128 followers
96 following
```

ولی ranking نباید بر اساس raw popularity dominance شکل بگیرد.

اگر مشاهده شد count باعث popularity game ناسالم می‌شود، می‌توان display آن را حذف یا محدود کرد بدون تغییر graph backend.

## 11.7. No Approach primitive

فعلاً نداریم:

```text
Wave
Approach
Connect
Interested
Crush
```

اگر یک Post برای کسی جذاب است:

- Comment می‌گذارد؛
- author را Follow می‌کند؛
- یا از Telegram username برای DM استفاده می‌کند.

---

# 12. Home Feed

## 12.1. هدف

Home باید پاسخ دهد:

> الان چه Postهایی ارزش دیدن دارند؟

## 12.2. Candidate sources

MVP candidates:

```text
1. Public posts
2. Public posts from followed users
3. Private posts from accepted-follow relationships
4. Posts in currently selected Space
```

## 12.3. Ranking در MVP

از الگوریتم پیچیده شروع نکنیم.

نسخهٔ بسیار ساده:

```text
score = recency
```

با boost ساده:

```text
if author is followed: + follow_boost
if post in selected_space: + space_boost
```

مثلاً مفهومی:

```text
score =
    recency_score
  + 2 * is_followed_author
  + 1 * is_selected_space
```

اعداد فقط illustrative هستند.

## 12.4. چرا chronological-ish؟

چون در شروع:

- data کم است؛
- interaction کم است؛
- recommendation signal کم است؛
- explainability مهم است.

## 12.5. آینده

وقتی usage زیاد شد می‌توان signalهای زیر را بررسی کرد:

- shared likes؛
- mutual follows؛
- comment affinity؛
- Space affinity؛
- category affinity؛
- dwell time؛
- hide/report feedback.

اما اینها MVP requirement نیستند.

---

# 13. Browse / Search / Filter

## 13.1. Explore به‌عنوان primitive مستقل لازم نیست

لازم نیست از روز اول tabی با فلسفهٔ پیچیدهٔ `Explore` تعریف کنیم.

Discovery می‌تواند از چند مسیر ساده بیاید:

- Search؛
- Space browser؛
- Category filter؛
- Item pages؛
- Follower/Following lists؛
- Profile navigation.

## 13.2. Search MVP

جست‌وجو روی:

```text
People
Posts
Spaces
Items
```

Radar search می‌تواند بعداً اضافه شود.

## 13.3. Post filtering

Filterهای اولیهٔ ممکن:

```text
Space
Category
Recency
```

نه ده‌ها dimension.

## 13.4. Divar-like browse

یک صفحه می‌تواند تقریباً چنین مدلی داشته باشد:

```text
Space: Sharif / CE
Category: All

--------------------------------
Post 1
Post 2
Post 3
--------------------------------
```

کاربر می‌تواند Space و Category را عوض کند و feed همان context را ببیند.

---

# 14. Radar

## 14.1. تعریف

Radar یک feed از محتوای ingestشده از Telegram Channels و sourceهای منتخب است.

هدف اولیه:

> آیا کاربران برای دیدن محتوای پراکندهٔ کانال‌های مهم، یک feed یکپارچه را مرتب باز می‌کنند؟

## 14.2. چیزی که Radar در MVP نیست

Radar در MVP نیست:

- LLM news summarizer؛
- entity extraction system؛
- embedding recommendation system؛
- sophisticated topic graph؛
- auto-tagging platform؛
- event normalization engine.

## 14.3. RadarSource

هر source یک Telegram channel یا منبع مشخص است.

Schema مفهومی:

```text
RadarSource
- id
- title
- telegram_identifier / source_reference
- space_id nullable
- is_active
- created_at
```

`space_id` در سطح Source می‌تواند دستی تعیین شود.

مثلاً:

```text
CE Scientific Association Channel
→ Sharif / Computer Engineering
```

این tagging روی هر پیام نیست؛ فقط context خود Source است.

## 14.4. RadarEntry

```text
RadarEntry
- id
- source_id
- external_message_id
- text
- media_reference nullable
- published_at
- external_url nullable
- ingested_at
```

## 14.5. Ingestion

Pipeline مفهومی:

```text
Telegram Source
→ Collector
→ Deduplication
→ Store raw normalized entry
→ Radar Feed
```

در MVP مرحلهٔ classifier نداریم.

## 14.6. Deduplication

حداقل dedupe بر اساس:

```text
(source_id, external_message_id)
```

اگر forward/repost detection بعداً لازم شد جداگانه اضافه شود.

## 14.7. Radar Feed

نسخهٔ اول:

```text
reverse chronological
```

و optional filter:

```text
Space
Source
```

## 14.8. Radar و Home جدا بمانند

در MVP بهتر است دو surface جدا باشند:

```text
Home  → user posts
Radar → ingested channel posts
```

دلایل:

- measurement شفاف‌تر؛
- UI ساده‌تر؛
- عدم confusion بین user content و channel content؛
- فهمیدن اینکه Radar واقعاً retention utility دارد یا نه.

بعداً در صورت اثبات usage می‌توان بعضی RadarEntryها را در Home inject کرد.

## 14.9. Source page

صفحهٔ سادهٔ Source:

```text
Source name
Space
Recent entries
Open original Telegram channel
```

نیازی به follower system جدا برای Source در MVP نیست.

## 14.10. Tags vs Embeddings

تصمیم فعلی:

> فعلاً هیچ‌کدام core requirement نیستند.

اول ingest و consumption را بسنجیم.

اگر Radar بزرگ شد، آن زمان مسئلهٔ retrieval را با دادهٔ واقعی حل می‌کنیم.

گزینه‌های آینده:

- manual tags؛
- source-level tags؛
- embedding similarity؛
- lightweight classifier؛
- hybrid search.

---

# 15. Items و Likes

## 15.1. تعریف

Interest system در MVP فقط دو object دارد:

```text
Item
Like
```

رابطه:

```text
User ──likes──> Item
```

## 15.2. Item catalog کنترل‌شده است

کاربر در MVP Item آزاد خلق نمی‌کند.

مزایا:

- duplicate کمتر؛
- typo کمتر؛
- moderation ساده‌تر؛
- matching قابل اعتمادتر؛
- item pages تمیزتر.

## 15.3. Item types

می‌توان Itemها را برای مدیریت catalog type‌بندی کرد، بدون اینکه UX پیچیده شود.

مثلاً:

```text
Movie
Music Artist
Album
Book
Game
Anime
Topic
Activity
Other
```

این taxonomy متعلق به catalog است، نه الزاماً به user workflow.

## 15.4. Item schema

```text
Item
- id
- type
- title
- subtitle nullable
- image_url nullable
- external_key nullable
- is_active
```

## 15.5. Like schema

```text
Like
- user_id
- item_id
- created_at
```

unique constraint:

```text
(user_id, item_id)
```

## 15.6. Likes screen

کاربر می‌تواند:

```text
Search item
→ open item
→ Like
```

و Likeهای خودش را به شکل grid/list ببیند.

## 15.7. Item Page

مثال:

```text
Interstellar

❤️ 1,283 likes

People who like this
- Ali
- Sara
- Mahdi
- ...
```

از هر Person card می‌توان وارد Profile شد.

## 15.8. Shared Likes

روی Profile یک فرد می‌توان نشان داد:

```text
You both like 7 items
```

و در صورت tap:

```text
Interstellar
Radiohead
Dostoevsky
...
```

این یکی از ساده‌ترین و explainableترین social discovery signals است.

## 15.9. Matching در MVP

نیازی به «match score» پیچیده نیست.

حتی می‌توان اصلاً درصد نشان نداد.

فقط:

```text
3 shared likes
8 shared likes
```

بعداً recommendation people می‌تواند از shared likes استفاده کند.

## 15.10. Recommendation baseline آینده

مثلاً:

```text
shared_like_count(A, B)
```

یا Jaccard:

```text
|Likes(A) ∩ Likes(B)|
---------------------
|Likes(A) ∪ Likes(B)|
```

ولی محاسبهٔ score و نمایش آن MVP-critical نیست.

---

# 16. Profile

## 16.1. اصل طراحی

Profile باید در MVP **نتیجهٔ رفتار کاربر** باشد، نه یک فرم رزومه.

کاربر لازم نیست profile طولانی پر کند.

## 16.2. Header

```text
Avatar
Display Name
@telegram_username
Follow button / Requested / Following
Followers
Following
```

## 16.3. Content sections

```text
Posts
Likes
```

و در آینده شاید:

```text
Mutuals
Shared Likes
```

## 16.4. Telegram handoff

اگر username قابل استفاده وجود دارد:

```text
Open in Telegram
```

یا equivalent deep link.

این action کاربر را از Mini App به conversation مناسب در Telegram می‌برد.

## 16.5. چیزی که فعلاً در Profile نمی‌خواهیم

- biography اجباری؛
- age؛
- gender؛
- CV؛
- university field؛
- skills list؛
- relationship intent؛
- badges متعدد؛
- reputation score؛
- availability status.

---

# 17. Notifications

Notification system باید کوچک و رفتارمحور باشد.

## 17.1. MVP notifications

```text
Someone requested to follow you
Your follow request was accepted
Someone commented on your post
Someone replied/mentioned you       later if reply/mention exists
```

## 17.2. Optional later

```text
A followed user posted
A Space you browse has new posts
A Radar source has important updates
Someone with shared likes followed you
```

اینها تا قبل از اثبات retention نباید spam تولید کنند.

## 17.3. Delivery

تا حد ممکن از Telegram bot notification استفاده شود، ولی notification preference باید قابل کنترل باشد.

---

# 18. End-to-End User Flows

## Flow A — سؤال ساده

```text
User opens Home
→ Composer
→ writes: «با سمیعی NLP بردارم؟»
→ visibility = public
→ Post
→ other users see it
→ comments appear
→ author reads/responds
```

هیچ `Question` entity ساخته نمی‌شود.

## Flow B — Demand اجتماعی

```text
User writes:
«کسی پنجشنبه پایه تئاتر شهره؟»

→ public Post
→ another user sees it
→ checks author's Profile
→ sees 4 shared Likes
→ comments or opens Telegram
```

هیچ `Demand` lifecycle و هیچ `Approach` object لازم نیست.

## Flow C — Private Post

```text
A posts private content
B opens A's profile
→ Follow
→ request = pending
A receives request
→ Accept
B can now see A's private posts
```

## Flow D — Browse a Space

```text
User opens Space selector
→ Sharif
→ Computer Engineering
→ sees posts in that Space
→ changes Category to Activities
→ sees relevant subset
```

## Flow E — Like discovery

```text
User searches “Interstellar”
→ opens Item
→ Like
→ sees People who like this
→ opens Sara's profile
→ sees 5 shared likes
→ Follow
```

## Flow F — Radar

```text
User opens Radar
→ selects Sharif / CE
→ sees recent ingested channel posts
→ opens an entry
→ can open original Telegram source
```

---

# 19. Telegram Boundary

## 19.1. Mini App owns

```text
Posts
Comments
Follow graph
Visibility
Spaces
Categories
Items
Likes
Radar feed
Search / browse
Profiles
```

## 19.2. Telegram owns

```text
Private chat
Group chat
Channels
Messaging delivery
Telegram identity
Existing social distribution
```

## 19.3. Architectural principle

هر بار که می‌خواهیم feature جدید بسازیم، اول سؤال شود:

> آیا Telegram این مسئله را از قبل حل کرده؟

اگر جواب بله است، ترجیح با handoff/integration است، نه duplication.

---

# 20. Data Model — پیشنهادی

این بخش implementation-level است، ولی عمداً minimal نگه داشته شده است.

## 20.1. users

```sql
users
-----
id                      bigint / uuid PK
telegram_user_id        bigint UNIQUE NOT NULL
display_name            text NOT NULL
telegram_username       text NULL
avatar_ref              text NULL
created_at              timestamp NOT NULL
updated_at              timestamp NOT NULL
status                  text NOT NULL DEFAULT 'active'
```

`status` internal است و برای moderation/account disable استفاده می‌شود.

## 20.2. posts

```sql
posts
-----
id                      bigint / uuid PK
author_id               FK users NOT NULL
text                     text NOT NULL
visibility               enum('public', 'private') NOT NULL
space_id                 FK spaces NULL
category_id              FK post_categories NULL
created_at               timestamp NOT NULL
updated_at               timestamp NOT NULL
deleted_at               timestamp NULL
```

## 20.3. comments

```sql
comments
--------
id                      bigint / uuid PK
post_id                  FK posts NOT NULL
author_id                FK users NOT NULL
text                     text NOT NULL
created_at               timestamp NOT NULL
updated_at               timestamp NOT NULL
deleted_at               timestamp NULL
```

## 20.4. follows

```sql
follows
-------
follower_id              FK users NOT NULL
followee_id              FK users NOT NULL
status                   enum('pending','accepted','rejected') NOT NULL
created_at               timestamp NOT NULL
updated_at               timestamp NOT NULL

UNIQUE(follower_id, followee_id)
```

Constraint:

```text
follower_id != followee_id
```

## 20.5. spaces

```sql
spaces
------
id                      bigint / uuid PK
name                     text NOT NULL
slug                     text UNIQUE NOT NULL
parent_id                FK spaces NULL
is_active                boolean NOT NULL DEFAULT true
created_at               timestamp NOT NULL
```

## 20.6. post_categories

```sql
post_categories
---------------
id                      bigint / uuid PK
name                     text NOT NULL
slug                     text UNIQUE NOT NULL
is_active                boolean NOT NULL DEFAULT true
```

## 20.7. items

```sql
items
-----
id                      bigint / uuid PK
type                     text NOT NULL
title                    text NOT NULL
subtitle                 text NULL
image_ref                text NULL
external_key             text NULL
is_active                boolean NOT NULL DEFAULT true
created_at               timestamp NOT NULL
```

## 20.8. likes

```sql
likes
-----
user_id                  FK users NOT NULL
item_id                  FK items NOT NULL
created_at               timestamp NOT NULL

UNIQUE(user_id, item_id)
```

## 20.9. radar_sources

```sql
radar_sources
-------------
id                      bigint / uuid PK
title                    text NOT NULL
source_reference         text NOT NULL
space_id                 FK spaces NULL
is_active                boolean NOT NULL DEFAULT true
created_at               timestamp NOT NULL
```

## 20.10. radar_entries

```sql
radar_entries
-------------
id                      bigint / uuid PK
source_id                FK radar_sources NOT NULL
external_message_id      text NOT NULL
text                     text NULL
media_ref                text NULL
external_url             text NULL
published_at             timestamp NOT NULL
ingested_at              timestamp NOT NULL

UNIQUE(source_id, external_message_id)
```

## 20.11. reports

برای safety حداقلی:

```sql
reports
-------
id
reporter_id
entity_type              post | comment | user | radar_entry
entity_id
reason
created_at
status
```

---

# 21. Access Control Rules

## 21.1. Public Post

Readable if:

```text
post.visibility == public
AND post not deleted
AND author not disabled
```

## 21.2. Private Post

Readable if:

```text
viewer == author
OR
exists accepted follow:
    follower = viewer
    followee = author
```

## 21.3. Comment visibility

Comment visibility inherits Post visibility.

اگر viewer خود Post را نمی‌تواند ببیند، Commentهای آن را هم نمی‌تواند ببیند.

## 21.4. Search visibility

Private Post نباید در search result کسی ظاهر شود که مجوز دیدنش را ندارد.

## 21.5. Direct link

اگر کسی direct link یک private Post را داشته باشد ولی accepted follower نباشد:

```text
This post is private.
Follow this user to request access.
```

محتوا نباید leak شود.

---

# 22. Backend Components

برای MVP architecture می‌تواند modular monolith باشد.

نیازی به microservice-heavy design نیست.

## 22.1. Modules

```text
Auth / Telegram Session
Users
Posts
Comments
Follows
Spaces
Categories
Items / Likes
Radar Ingestion
Radar Read API
Search
Notifications
Moderation
Analytics Events
```

## 22.2. Database

یک relational DB مثل PostgreSQL برای تقریباً کل MVP کافی است.

دلایل:

- graph هنوز در مقیاس لازم برای graph DB نیست؛
- follow edges relational ساده‌اند؛
- likes relational ساده‌اند؛
- filters و joins قابل مدیریت‌اند.

## 22.3. Search

فاز اول:

- PostgreSQL text search / trigram؛
- prefix search برای People/Items/Spaces.

بعداً اگر حجم زیاد شد:

- OpenSearch / Elasticsearch؛
- vector search در صورت نیاز واقعی.

## 22.4. Cache

در MVP فقط برای مواردی مثل:

- feed pages؛
- follower counts؛
- hot Item pages؛
- Radar recent entries.

ولی cache نباید قبل از bottleneck واقعی پیچیده شود.

---

# 23. API Surface — نمونه

API دقیق به stack وابسته است، ولی conceptual endpoints می‌توانند چنین باشند.

## 23.1. Posts

```text
POST   /posts
GET    /posts/:id
PATCH  /posts/:id
DELETE /posts/:id
GET    /feed
```

## 23.2. Comments

```text
GET    /posts/:id/comments
POST   /posts/:id/comments
DELETE /comments/:id
```

## 23.3. Follow

```text
POST   /users/:id/follow
POST   /follow-requests/:id/accept
POST   /follow-requests/:id/reject
DELETE /users/:id/follow
GET    /users/:id/followers
GET    /users/:id/following
```

## 23.4. Spaces

```text
GET    /spaces
GET    /spaces/:id
GET    /spaces/:id/posts
```

## 23.5. Items / Likes

```text
GET    /items/search?q=
GET    /items/:id
POST   /items/:id/like
DELETE /items/:id/like
GET    /items/:id/people
GET    /me/likes
```

## 23.6. Radar

```text
GET    /radar
GET    /radar/sources
GET    /radar/sources/:id
```

---

# 24. Feed Query Semantics

## 24.1. Base visibility query

Feed باید فقط Postهایی را candidate کند که viewer حق دیدنشان را دارد.

Conceptually:

```sql
WHERE
    visibility = 'public'
OR
    author_id = :viewer_id
OR
    (
        visibility = 'private'
        AND EXISTS accepted_follow(viewer_id, author_id)
    )
```

## 24.2. Space filter

اگر Space انتخاب شده:

```text
post.space_id = selected_space
```

یا اگر parent inheritance بعداً خواستیم، subtree query اضافه می‌شود.

برای MVP بهتر است exact Space ساده باشد.

## 24.3. Category filter

اگر category انتخاب شده:

```text
post.category_id = selected_category
```

## 24.4. Pagination

Cursor-based pagination ترجیح دارد.

مثلاً:

```text
(created_at, id)
```

برای feed chronological.

---

# 25. Category Classifier — فقط در حد نیاز

## 25.1. چرا classifier؟

برای اینکه structured browse داشته باشیم بدون اینکه author را مجبور کنیم فرم پر کند.

## 25.2. MVP classifier

حتی می‌تواند rule-based یا small model باشد.

نیازی نیست از روز اول LLM call برای هر Post داشته باشیم.

## 25.3. Confidence threshold

```text
if confidence >= threshold:
    set category_id
else:
    category_id = null / General
```

## 25.4. No taxonomy explosion

اگر classifier مرتب در تشخیص category مشکل دارد، احتمالاً taxonomy بد است، نه اینکه باید ده‌ها subcategory اضافه کنیم.

---

# 26. Item Catalog Operations

چون Itemها closed set هستند، باید عملیات مدیریت catalog تعریف شود.

## 26.1. Admin capabilities

```text
Create Item
Edit Item
Deactivate Item
Merge duplicate Items
Change image/title/type
```

## 26.2. User request for missing Item

MVP دو گزینه دارد:

### گزینه ساده‌تر

اگر Item نبود:

```text
Can't find it?
Suggest an item
```

Suggestion وارد admin queue شود.

### گزینه حتی ساده‌تر

در نسخهٔ اول اصلاً suggestion هم نباشد و catalog دستی seed شود.

## 26.3. Seed catalog

برای شروع بهتر است categoryهای cultural/social با density بالا seed شوند:

- فیلم؛
- سریال؛
- انیمه؛
- کتاب؛
- هنرمند موسیقی؛
- بازی؛
- topicهای عمومی.

هدف breadth کامل نیست؛ هدف ایجاد اولین shared-like edges است.

---

# 27. Radar Operations

## 27.1. Admin source registry

Sourceها بهتر است در شروع curated باشند.

Admin:

```text
Add source
Map source to optional Space
Pause source
Remove source
Inspect ingestion errors
```

## 27.2. Source quality

در MVP منبعی که:

- spam زیاد دارد؛
- repost زیاد دارد؛
- محتوای بی‌ربط دارد؛

می‌تواند به‌صورت دستی disable شود.

نیازی به quality score پیچیده نیست.

## 27.3. Missing / edited / deleted Telegram messages

حداقل policy:

- اگر edit دریافت شد → RadarEntry update شود؛
- اگر delete قابل تشخیص بود → entry حذف/mark شود؛
- اگر sync از دست رفت → ingestion health dashboard هشدار دهد.

جزئیات implementation به روش integration با Telegram بستگی دارد.

---

# 28. Moderation و Safety

ساده بودن product model به معنی بی‌نیازی از moderation نیست.

## 28.1. Minimum controls

برای User/Post/Comment:

```text
Report
Block
Delete own content
```

Admin:

```text
Remove Post
Remove Comment
Disable User
Review Reports
```

## 28.2. Block semantics

اگر A، B را block کند:

- B نباید بتواند A را Follow کند؛
- pending follow بینشان حذف/باطل شود؛
- private content قطعاً قابل مشاهده نباشد؛
- بهتر است public content و comments مستقیم هم برای دو طرف hide شود؛
- DM در Telegram خارج از control مستقیم ماست.

این محدودیت باید در UI صریح باشد.

## 28.3. Spam

راهکارهای اولیه:

- post rate limit؛
- comment rate limit؛
- follow request rate limit؛
- account age / behavior signal در backend؛
- report threshold برای review؛
- duplicate text detection ساده.

## 28.4. Harassment

ریسک خاص Follow Request:

کاربر ممکن است بعد از reject بارها درخواست بفرستد.

Rule پیشنهادی:

```text
After reject, requester cannot resend immediately.
```

Cooldown یا permanent reject-until-reset را بعداً می‌توان انتخاب کرد.

## 28.5. Public accusation / defamation

چون محیط اولیه دانشگاه است، Postهایی دربارهٔ افراد واقعی ممکن است حساس شوند.

لازم است:

- report reason مشخص؛
- fast moderation path؛
- policy برای doxxing، تهدید، اطلاعات شخصی و impersonation.

## 28.6. Age

در product model فعلاً age field و age-verification نداریم.

اما اگر در آینده محصول به‌صورت فعال برای minors distribution شود، safety requirements باید دوباره طراحی شوند؛ این موضوع را نباید با نبودن field سن، حل‌شده فرض کرد.

---

# 29. Privacy

## 29.1. Data minimization

از Telegram فقط آنچه برای product لازم است ذخیره شود.

## 29.2. Private Post semantics باید قابل فهم باشد

متن UI باید روشن باشد:

> Private posts are visible to followers you have accepted.

نه عباراتی مثل:

> friends only

چون relationship واقعاً friendship نیست.

## 29.3. Like visibility

پیشنهاد MVP:

Likeهای کاربر public روی Profile هستند، چون کل ارزش social discovery به همین وابسته است.

اما این تصمیم باید در onboarding/UX شفاف باشد.

بعداً می‌توان setting مخفی‌کردن Likes را بررسی کرد.

## 29.4. Follow privacy

Follower/Following list در MVP public است مگر دلایل product/safety خلافش را نشان دهد.

## 29.5. Delete account

باید امکان حذف account و user-generated data تعریف شود.

حداقل:

- Posts؛
- Comments؛
- Likes؛
- Follow edges.

Radar content متعلق به sources است و user-generated نیست.

---

# 30. Analytics

## 30.1. North Star پیشنهادی

به‌جای raw signup:

> **Weekly Meaningful Social Actions (WMSA)**

مثلاً مجموعه‌ای از:

- Comment created؛
- Follow accepted؛
- Like leading to profile visit؛
- Post created؛
- Telegram handoff from a profile/post.

تعریف دقیق باید بعد از instrument اولیه ثابت شود.

## 30.2. Core funnel

```text
Open Mini App
→ View feed / radar / item
→ View Post or Profile
→ Social action
→ Return within 7 days
```

## 30.3. Post metrics

```text
posts_created
posts_viewed
comments_per_post
unique_commenters_per_post
private_post_share
public_post_share
post_delete_rate
```

## 30.4. Follow metrics

```text
follow_requests_sent
follow_accept_rate
follow_reject_rate
time_to_accept
mutual_follow_rate
private_post_views
```

## 30.5. Likes metrics

```text
items_liked_per_user
item_page_views
people_clicked_from_item_page
profile_views_from_shared_likes
follow_requests_from_item_discovery
```

## 30.6. Radar metrics

```text
radar_DAU
entries_viewed_per_session
source_open_rate
telegram_source_clickthrough
return_rate of radar users
```

## 30.7. Space metrics

```text
space_views
posts_per_space
unique_posters_per_space
comments_per_space
active_spaces
```

Density از total user count مهم‌تر است.

---

# 31. Growth Loops

## 31.1. Post share loop

```text
User creates Post
→ shares Telegram deep link in a group/channel/chat
→ other user opens exact Post
→ reads/comments
→ becomes app user
```

این یکی از طبیعی‌ترین loops است چون distribution خود Telegram را مصرف می‌کند.

## 31.2. Item loop

```text
User likes Item
→ sees people with same interest
→ opens profile
→ follows
→ receives more private/social content
→ returns
```

## 31.3. Space loop

```text
A Space becomes locally useful
→ users share its feed/posts in existing Telegram groups
→ more local users enter
→ more posts/comments
→ Space gets denser
```

## 31.4. Radar loop

```text
Radar aggregates useful sources
→ user opens original source / shares entry
→ source admins notice traffic
→ more sources agree to integrate
→ Radar becomes more useful
```

## 31.5. Follow loop

```text
A follows B
→ B receives request
→ opens app
→ checks A's profile/shared likes
→ accepts / follows back
→ graph densifies
```

---

# 32. Cold Start Strategy

## 32.1. چرا دانشگاه هنوز wedge خوبی است؟

نه به این خاطر که architecture دانشگاهی است، بلکه چون:

- context مشترک بالاست؛
- density قابل ایجاد است؛
- Telegram usage بالاست؛
- existing channels فراوان‌اند؛
- conversations naturally local هستند.

## 32.2. شروع پیشنهادی

به‌جای کل ایران:

```text
Sharif
→ 1-2 dense Spaces
→ whole Sharif
→ Amirkabir
→ other universities
```

## 32.3. Content cold start

Radar کمک می‌کند محصول در روز اول خالی نباشد.

ولی Radar نباید جای user social feed را بگیرد.

## 32.4. Social cold start

برای هر Space اولیه بهتر است چند ده seed user واقعی وجود داشته باشد که:

- Post بگذارند؛
- Comment کنند؛
- Item Like کنند؛
- Follow requests را جواب دهند.

## 32.5. Fake activity ممنوع

نباید برای پر نشان‌دادن feed، fake users یا fake social interactions ایجاد شود.

---

# 33. MVP Scope

## 33.1. MUST

### Telegram identity

- session validation؛
- basic profile import.

### Post

- create text Post؛
- public/private visibility؛
- edit/delete own Post؛
- Post detail؛
- Home feed.

### Comment

- create/delete own Comment؛
- view comments.

### Follow

- request؛
- accept/reject؛
- unfollow؛
- followers/following list؛
- private post authorization.

### Space

- hierarchy؛
- browse/select؛
- optional post association؛
- Space feed.

### Category

- small controlled list؛
- backend category assignment یا manual admin assignment؛
- basic filter.

### Likes

- controlled Item catalog؛
- search Item؛
- Like/unlike؛
- Item page؛
- people who like Item؛
- user Likes tab.

### Radar

- curated Source registry؛
- ingestion؛
- chronological feed؛
- Source page؛
- optional Space filtering.

### Safety

- report؛
- block؛
- moderation admin basics؛
- rate limits.

## 33.2. SHOULD

- shared-like count on Profile؛
- simple global search؛
- Telegram deep link sharing for Post؛
- notification bot for follow requests/comments؛
- category classifier.

## 33.3. NOT MVP

- internal chat؛
- internal group؛
- internal channel؛
- stories؛
- media-heavy feed؛
- age verification؛
- university verification؛
- Approach/Wave؛
- Demand entity؛
- Question entity؛
- Post expiration؛
- complex lifecycle؛
- matching percentage؛
- embedding-based Radar personalization؛
- sophisticated recommender؛
- nested comments؛
- badges/gamification؛
- monetization.

---

# 34. Suggested Build Order

## Phase 1 — Social skeleton

```text
Telegram Auth
User
Post
Comment
Public feed
Profile
```

هدف:

> آیا مردم حاضرند داخل Mini App واقعاً Post و Comment تولید کنند؟

## Phase 2 — Follow + Private

```text
Follow Request
Accept/Reject
Private Posts
Follower/Following lists
Notifications
```

هدف:

> آیا graph اجتماعی شکل می‌گیرد؟

## Phase 3 — Space

```text
Space hierarchy
Space selector
Space feed
Optional post placement
```

هدف:

> آیا context محلی density و relevance را بالا می‌برد؟

## Phase 4 — Likes

```text
Item catalog
Like
Item page
People discovery
Shared likes
```

هدف:

> آیا taste واقعاً social discovery تولید می‌کند؟

## Phase 5 — Radar

```text
Source ingestion
Radar feed
Source page
Space mapping
```

هدف:

> آیا Radar یک retention utility مستقل است؟

ترتیب Phase 4 و 5 می‌تواند بر اساس implementation/distribution جابه‌جا شود.

---

# 35. Experiments

## Experiment 1 — Post composer complexity

### A

```text
Text + Visibility only
```

### B

```text
Text + optional Category + Visibility
```

Metric:

- completion rate؛
- time to post؛
- category usefulness.

فرض فعلی: A بهتر است.

## Experiment 2 — Follow acceptance

بررسی:

- چند درصد requestها accept می‌شوند؟
- آیا acceptance friction graph را بیش از حد کند می‌کند؟
- آیا در عوض private posting confidence را زیاد می‌کند؟

## Experiment 3 — Shared Likes visibility

### A

```text
You both like 5 items
```

### B

عدم نمایش.

Metric:

- profile-to-follow conversion.

## Experiment 4 — Space default

### A

آخرین Space انتخاب‌شده حفظ شود.

### B

Home global باشد.

Metric:

- session depth؛
- relevant post interactions.

## Experiment 5 — Radar as separate tab

بررسی retention کاربرانی که Radar استفاده می‌کنند در مقایسه با social-only users.

---

# 36. Product Risks

## Risk 1 — Feed خالی باشد

Mitigation:

- شروع dense؛
- Radar؛
- share loops؛
- seed community.

## Risk 2 — Feed تبدیل به Twitter clone شود

این لزوماً فاجعه نیست، ولی differentiation کم می‌شود.

Mitigation:

- Space context؛
- private follow graph؛
- Likes discovery؛
- Telegram integration؛
- local density.

## Risk 3 — همه‌چیز dating شود

ممکن است social discovery به dating-heavy behavior کشیده شود.

راهکار اولیه:

- Follow را semantically neutral نگه داریم؛
- UI romantic framing نداشته باشد؛
- diverse Item/Space discovery؛
- moderation علیه harassment.

## Risk 4 — Follow acceptance رشد را کند کند

این trade-off واقعی است.

مزیت:

- کنترل privacy؛
- private post model ساده؛
- relationship intentionalتر.

عیب:

- graph growth کندتر.

باید با data سنجیده شود.

## Risk 5 — Radar فقط RSS reader شود

اگر کاربران فقط Radar بخوانند و social action نکنند، ممکن است product split ایجاد شود.

این لزوماً بد نیست، ولی باید بدانیم Radar acquisition/retention feature است یا core social feature.

## Risk 6 — Item catalog ضعیف باشد

اگر Itemهای popular کم باشند، Likes system مرده به نظر می‌رسد.

Seed quality بسیار مهم است.

## Risk 7 — Space taxonomy بیش از حد دانشگاهی شود

اگر schema یا UI به `University/Faculty` hard-code شود، generalization سخت می‌شود.

راهکار:

```text
Always model as Space hierarchy.
```

## Risk 8 — Private Post expectation اشتباه فهمیده شود

کاربر ممکن است تصور کند private یعنی end-to-end private یا Telegram private.

UI باید دقیقاً بگوید:

> visible to accepted followers in this app.

---

# 37. Generalization Beyond Universities

این بخش یکی از اهداف اصلی architecture جدید است.

## 37.1. چه چیزهایی بدون تغییر می‌ماند؟

```text
User
Post
Comment
Follow
Space
Item
Like
RadarSource
RadarEntry
```

## 37.2. فقط Space tree عوض می‌شود

امروز:

```text
Sharif
→ CE
```

فردا:

```text
Tehran
→ District 6
```

یا:

```text
Startup Community
→ AI Founders
```

## 37.3. Category هم general باقی می‌ماند

Categoryهای broad مثل:

```text
Questions
Activities
Learning
Advice
Buy & Sell
Opportunities
```

خارج از دانشگاه هم قابل استفاده‌اند.

## 37.4. Likes ذاتاً general است

فیلم، کتاب، موسیقی، بازی و topicها وابسته به دانشگاه نیستند.

## 37.5. Radar هم general است

در آینده Source می‌تواند:

- channel شهری؛
- community channel؛
- event channel؛
- niche publication؛

باشد.

بنابراین دانشگاه **go-to-market wedge** است نه **domain boundary**.

---

# 38. What We Are Deliberately Not Deciding Yet

این موارد را عمداً باز می‌گذاریم:

## 38.1. آیا Home و Radar روزی merge شوند؟

فعلاً نه.

## 38.2. آیا Category دستی باشد یا classifier؟

فعلاً classifier/admin-backed؛ بعداً با data تصمیم می‌گیریم.

## 38.3. آیا Itemها فقط culture باشند یا topics هم باشند؟

با seed catalog تست می‌شود.

## 38.4. آیا Follow همیشه approval بخواهد؟

MVP: بله.

بعداً قابل experiment است.

## 38.5. آیا Spaceها followable شوند؟

فعلاً لازم نیست؛ انتخاب/browse کافی است.

## 38.6. آیا Radar personalization داشته باشد؟

فعلاً نه.

## 38.7. آیا Post media داشته باشد؟

MVP text-first.

## 38.8. آیا public Post global باشد یا default Space بخواهد؟

با رفتار بازار اولیه آزمایش شود.

---

# 39. Open Product Questions

1. Follow approval برای همهٔ users بهترین مدل است یا باید public/private profile جدا داشته باشیم؟
2. آیا Private Post به accepted followers کافی است یا mutual follow لازم است؟ فرض فعلی: accepted follower کافی است.
3. آیا Category باید اصلاً در UI دیده شود یا فقط برای filter/backend باشد؟
4. چند Category اولیه مناسب است؟ احتمالاً 5 تا 8.
5. آیا Space child باید Postهای parent را هم نشان دهد؟
6. آیا parent Space باید Postهای همهٔ children را aggregate کند؟
7. آیا کاربر باید بتواند چند Space را همزمان select کند؟
8. آیا Like list کامل public باشد یا user control داشته باشد؟
9. آیا Item Page باید follower/following relevance را در sorting people لحاظ کند؟
10. آیا Radar Sourceها باید user-submittable باشند یا کاملاً curated؟
11. آیا Comments نیاز به like/reaction دارند؟
12. آیا Post edit history لازم است؟
13. آیا Telegram username نداشتن کاربر چه اثری روی private handoff دارد؟
14. آیا deep link هر Post باید قابل share به گروه‌های Telegram باشد؟ فرض: بله.
15. آیا follower count نمایش داده شود یا popularity game ایجاد می‌کند؟

---

# 40. Product Decision Log

## Decision 1

**Demand entity حذف شد.**

Reason:

Demand یک semantic/behavioral property از Post است، نه object مجزا.

## Decision 2

**Question entity حذف شد.**

Reason:

همهٔ user-generated content با Post مدل می‌شود.

## Decision 3

**Comment به core اضافه شد.**

Reason:

public discussion باید کنار Post باقی بماند.

## Decision 4

**Chat/Group/Channel ساخته نمی‌شود.**

Reason:

Telegram آنها را بهتر حل کرده است.

## Decision 5

**فقط Public و Private Post داریم.**

Reason:

کاهش privacy-mode complexity.

## Decision 6

**Private = accepted followers.**

Reason:

Follow graph و access control با یک primitive حل می‌شوند.

## Decision 7

**Post expiration/lifecycle حذف شد.**

Reason:

نیاز اثبات‌نشده و complexity بالا.

## Decision 8

**Space جای Campus/University/Faculty را گرفت.**

Reason:

Generalization.

## Decision 9

**Radar در MVP ingest-only است.**

Reason:

ابتدا utility را validate می‌کنیم، بعد retrieval intelligence.

## Decision 10

**Interest Graph به Item + Like کاهش یافت.**

Reason:

ساده‌ترین representation که همچنان discovery value ایجاد می‌کند.

## Decision 11

**Item catalog controlled است.**

Reason:

کیفیت identity و matching.

## Decision 12

**Profile minimal است.**

Reason:

رفتار کاربر profile را غنی می‌کند، نه فرم onboarding.

## Decision 13

**Approach/Wave primitive نداریم.**

Reason:

Comment + Follow + Telegram DM برای MVP کافی است.

## Decision 14

**Age در model/onboarding نیست.**

Reason:

فعلاً value product ندارد و verification requirement ایجاد نمی‌کنیم.

---

# 41. MVP UI Skeleton

## 41.1. Home

```text
┌──────────────────────────────┐
│ [Space: All ▾]      🔍   🔔  │
├──────────────────────────────┤
│ What's on your mind?      +  │
├──────────────────────────────┤
│ Mahdi                        │
│ 12m                          │
│                              │
│ کسی پنجشنبه پایه تئاتره؟     │
│                              │
│ 💬 8 comments                │
├──────────────────────────────┤
│ Sara                         │
│ 27m                          │
│                              │
│ با فلانی NLP بردارم؟          │
│                              │
│ 💬 13 comments               │
└──────────────────────────────┘

Home   Radar   Likes   Profile
```

## 41.2. Post Detail

```text
┌──────────────────────────────┐
│ ←                            │
│ Mahdi                  Follow│
│                              │
│ کسی پنجشنبه پایه تئاتره؟     │
│                              │
│ Open in Telegram             │
├──────────────────────────────┤
│ Comments                     │
│ Ali: من پایه‌ام              │
│ Sara: کدوم اجرا؟             │
│                              │
│ Add a comment...             │
└──────────────────────────────┘
```

## 41.3. Follow Request

```text
Ali requested to follow you

[View profile]   [Reject] [Accept]
```

## 41.4. Space Browse

```text
Select Space

Sharif University
  Computer Engineering
  Electrical Engineering
  Mathematics

Amirkabir University
  Computer Engineering
  Mathematics
```

## 41.5. Radar

```text
Radar
[Space: Sharif / CE ▾]

CE Scientific Association
2m
Registration for ...
[Open original]

Student Council
18m
...
```

## 41.6. Likes

```text
Likes

Search movies, books, music... 🔍

Your Likes
[Interstellar] [Radiohead]
[Dostoevsky]   [Attack on Titan]
```

## 41.7. Item Page

```text
Interstellar
❤️ Liked

1,283 people like this

People
Ali      5 shared likes
Sara     3 shared likes
Reza     2 shared likes
```

## 41.8. Profile

```text
[Avatar]
Mahdi
@mmsamiei

128 Followers   96 Following
[Follow]

Posts | Likes
```

---

# 42. Implementation Checklist

## Foundation

- [ ] Validate Telegram Mini App init data server-side
- [ ] Create/update User on session
- [ ] Basic profile screen
- [ ] Global error handling
- [ ] Analytics event pipeline

## Posts

- [ ] Create Post
- [ ] Edit Post
- [ ] Delete Post
- [ ] Public/private visibility
- [ ] Feed pagination
- [ ] Post detail
- [ ] Access control tests

## Comments

- [ ] Create Comment
- [ ] Delete own Comment
- [ ] Comment pagination
- [ ] Visibility inheritance tests

## Follow

- [ ] Send request
- [ ] Accept
- [ ] Reject
- [ ] Unfollow
- [ ] Followers list
- [ ] Following list
- [ ] Private content authorization
- [ ] Follow notifications

## Spaces

- [ ] Admin create/edit Space
- [ ] Parent-child hierarchy
- [ ] Space selector
- [ ] Space feed
- [ ] Optional Post space assignment

## Category

- [ ] Admin category list
- [ ] Optional classifier
- [ ] Feed filter

## Likes

- [ ] Admin Item catalog
- [ ] Item search
- [ ] Like/unlike
- [ ] User Likes
- [ ] Item Page
- [ ] People list on Item Page
- [ ] Shared-like count

## Radar

- [ ] Admin Source registry
- [ ] Ingestion worker
- [ ] Deduplication
- [ ] Radar feed
- [ ] Source page
- [ ] Open original source
- [ ] Ingestion health visibility

## Safety

- [ ] Report Post
- [ ] Report Comment
- [ ] Report User
- [ ] Block User
- [ ] Admin moderation view
- [ ] Rate limits

---

# 43. Suggested Event Taxonomy

## Session

```text
app_opened
session_started
```

## Feed

```text
feed_viewed
post_impression
post_opened
space_selected
category_selected
```

## Post

```text
post_composer_opened
post_created
post_edited
post_deleted
post_shared
```

## Comment

```text
comment_created
comment_deleted
```

## Follow

```text
follow_requested
follow_accepted
follow_rejected
follow_removed
followers_list_viewed
following_list_viewed
```

## Profile

```text
profile_viewed
telegram_handoff_clicked
shared_likes_opened
```

## Likes

```text
item_searched
item_opened
item_liked
item_unliked
item_people_opened
```

## Radar

```text
radar_opened
radar_entry_impression
radar_entry_opened
radar_source_opened
radar_external_opened
```

---

# 44. Success Criteria for Early MVP

اعداد نهایی باید با اندازهٔ cohort تعیین شوند، اما جهت metric این است.

## Activation

کاربر جدید در اولین چند session حداقل یکی از اینها را انجام دهد:

```text
Create Post
Create Comment
Send Follow Request
Like Item
Open Radar repeatedly
```

## Social density

در Spaceهای اولیه:

- تعداد poster واقعی؛
- commenter واقعی؛
- accepted follow edge؛
- comments per Post.

## Retention

D7/W4 retention به تفکیک رفتار اولیه:

```text
Posters
Commenters
Followers
Like users
Radar users
```

## Cross-feature synergy

مهم‌ترین سؤال:

> آیا استفاده از یک pillar باعث استفاده از pillar دیگر می‌شود؟

مثلاً:

```text
Item Page
→ Profile
→ Follow
→ Private/Public Post consumption
```

یا:

```text
Radar
→ Space discovery
→ Social Post
→ Comment
```

اگر سه pillar هیچ cross-over نداشته باشند، ممکن است در واقع سه محصول جدا باشند.

---

# 45. Core Hypotheses

## H1 — People will post because Telegram identity lowers friction

کاربران حاضرند سؤال و demand را در Mini App منتشر کنند چون distribution و هویت پشت آن Telegram است.

## H2 — Comments create durable local knowledge

پاسخ‌هایی که امروز در گروه‌ها گم می‌شوند، زیر Post باقی می‌مانند و value تجمعی ایجاد می‌کنند.

## H3 — Follow + Private creates a lightweight social graph

Acceptance باعث می‌شود Follow فقط passive subscription نباشد و در عین حال primitive جدیدی مثل Friend Request نسازیم.

## H4 — Space increases relevance

دیدن `Sharif / CE` برای کاربر از global feed ارزشمندتر است.

## H5 — Shared Likes are enough for initial people discovery

برای شروع لازم نیست personality profile یا matching model پیچیده داشته باشیم.

## H6 — Radar solves cold-start and recurring utility

حتی زمانی که social feed هنوز dense نیست، Radar دلیل بازگشت می‌دهد.

## H7 — Telegram handoff is better than rebuilding chat

interaction خصوصی خارج از Mini App friction کمتری نسبت به ساخت messenger جدید دارد.

---

# 46. Things to Validate Before Expanding Scope

قبل از ساخت featureهای بزرگ‌تر، باید جواب این سؤال‌ها را از داده بگیریم:

1. آیا کاربران واقعاً Post می‌گذارند یا فقط می‌خوانند؟
2. Comment rate روی Post چقدر است؟
3. آیا demand-style Postها interaction بیشتری از opinion-style Postها می‌گیرند؟
4. آیا accepted follow graph به اندازهٔ کافی سریع رشد می‌کند؟
5. چند درصد Profile views به Follow Request می‌رسد؟
6. Shared Likes چقدر این conversion را تغییر می‌دهد؟
7. Space filter چند بار استفاده می‌شود؟
8. آیا کاربران Post را به Space نسبت می‌دهند یا global posting کافی است؟
9. آیا Category filter واقعاً استفاده می‌شود؟
10. accuracy classifier چقدر برای browse مهم است؟
11. Radar چند بار در هفته باز می‌شود؟
12. آیا Radar users به social side تبدیل می‌شوند؟
13. کدام Item type بیشترین people-discovery را می‌سازد؟
14. آیا public/private ratio متعادل است؟
15. آیا Follow approval friction بیش از حد است؟

---

# 47. Future Options — فقط در صورت اثبات نیاز

این موارد عمداً roadmap قطعی نیستند.

## Feed intelligence

- personalized ranking؛
- people recommendation؛
- category affinity؛
- shared-like boost؛
- embeddings.

## Posts

- media؛
- reactions؛
- mentions؛
- nested replies؛
- polls؛
- bookmarks.

## Spaces

- follow Space؛
- verified Space admin؛
- community moderation؛
- aggregated parent feeds.

## Likes

- user-suggested Items؛
- external catalog integrations؛
- related Items؛
- similarity score.

## Radar

- tags؛
- embeddings؛
- summaries؛
- event extraction؛
- relevance ranking؛
- cross-source dedupe.

## Social graph

- close friends؛
- suggested follows؛
- mutuals؛
- private profile mode.

هیچ‌کدام نباید قبل از وجود problem واقعی ساخته شوند.

---

# 48. یک مدل ذهنی نهایی

محصول را می‌توان با این نمودار خلاصه کرد:

```text
                       Telegram
          identity / DM / groups / channels
                           │
                           │
                    Mini App Layer
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
      Social             Radar              Likes
        │                  │                  │
  Post / Comment      Channel ingest      Item / Like
  Follow / Private      Source feed       People discovery
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                         Space
                   context / locality
                           │
                    Search / Browse
```

و social interaction loop:

```text
See Post
→ Read comments
→ Open Profile
→ See shared Likes
→ Follow
→ Accepted
→ See private/public Posts
→ Continue private conversation on Telegram
```

و information loop:

```text
Open Radar
→ Read Source entry
→ Open Space / original Telegram source
→ Discover people or Posts around same context
```

---

# 49. Product Definition in One Paragraph

این محصول یک **Telegram-native social discovery layer** است که به کاربران اجازه می‌دهد Postهای عمومی یا خصوصی منتشر کنند، زیر Postها Comment بگذارند، افراد را با مکانیزم Follow Request دنبال کنند، در Spaceهای مختلف محتوا را browse کنند، Itemهای مورد علاقه‌شان را Like کنند و آدم‌های دارای علایق مشترک را پیدا کنند. در کنار آن، Radar محتوای Channelهای موجود Telegram را بدون ساختن یک سیستم پیام‌رسان یا Channel جدید ingest و نمایش می‌دهد. دانشگاه‌ها بازار اولیه و محل ایجاد density هستند، اما core model به دانشگاه وابسته نیست و می‌تواند بعداً به communityها و فضاهای عمومی‌تر گسترش پیدا کند.

---

# 50. خلاصهٔ تصمیم محصول

اگر بخواهیم تمام سند را به چند خط تقلیل دهیم:

```text
Everything user-generated is a Post.

Posts have Comments.

Posts are Public or Private.

Private means accepted followers only.

Follow is the only social-edge primitive.

Private chat stays on Telegram.

Context is modeled as Space, not University/Campus.

Post taxonomy stays shallow and mostly behind the scenes.

Radar starts as simple Telegram-channel ingestion.

Interests are just controlled Items + Likes.

Profile stays minimal.

University is the launch wedge, not the architecture.
```

این نسخه باید مبنای طراحی MVP باشد مگر اینکه دادهٔ واقعی استفاده، دلیل مشخصی برای اضافه کردن primitive جدید نشان دهد.
