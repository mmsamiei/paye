# پایه

پایه یک Telegram Mini App برای پست، کامنت، دنبال‌کردن و مرور محتوای Spaceهاست. دامنهٔ نسخهٔ اول در [برنامهٔ محصول](telegram-social-product-spec-v2.md) توضیح داده شده است.

## اجرای محلی

1. `.env.example` را به `.env.local` کپی کنید و `TELEGRAM_BOT_TOKEN` و `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` را برای بات خودتان تنظیم کنید. برای مدیریت، Telegram ID مدیران را در `ADMIN_TELEGRAM_IDS` با ویرگول جدا کنید.
2. PostgreSQL را اجرا کنید: `docker compose up -d db`.
3. پکیج‌ها را از رجیستری رسمی npm نصب کنید: `npm install --registry=https://registry.npmjs.org`.
4. متغیرهای `.env.local` را در shell بارگذاری کنید و `npm run db:migrate` را اجرا کنید؛ سپس برای اجرای پایدار دمو `docker compose up -d --build app`.
5. Mini App را با HTTPS در تنظیمات بات تلگرام ثبت کنید. API فقط `initData` معتبر تلگرام را می‌پذیرد؛ مرورگر عادی محیط تست ورود نیست.

برای اولین دانشگاه، مدیر یک Space با `POST /api/admin/spaces` و `is_default: true` ایجاد می‌کند. هر Space یک `slug_segment` محلی دارد؛ برای نمونه `sharif-university` برای والد و `computer-engineering` برای فرزند با `parent_id` والد. سرور اسلاگ کامل فرزند را به‌صورت `sharif-university/computer-engineering` می‌سازد و هنگام جابه‌جایی یا تغییر اسلاگ والد، مسیر فرزندان را هم به‌روز می‌کند. در رابط مدیریت، مسیر کامل پیش از ثبت نمایش داده می‌شود. کاربر در فرم پست و فید، فضا را با جست‌وجوی نام یا مسیر انتخاب می‌کند. درخواست‌های API باید هدر `Authorization: tma <initData>` داشته باشند.

## API اصلی

`/api/me`, `/api/feed`, `/api/posts`, `/api/posts/:id/comments`, `/api/users/:id`, `/api/users/:id/follow`, `/api/follow-requests`, `/api/spaces`, `/api/spaces/:id/posts`, `/api/me/notifications`, `/api/reports`.

مدیریت: `/api/admin/spaces`, `/api/admin/reports`, `/api/admin/posts/:id`, `/api/admin/comments/:id`, `/api/admin/users/:id/disable`.

## نکات عرضه

پیش از عرضه، بات، دامنهٔ HTTPS، PostgreSQL پایدار، بکاپ، دانشگاه پیش‌فرض، حداقل چند کاربر و پست واقعی، و حساب ادمین را آماده کنید. تا قبل از این مراحل، برنامه صرفاً آمادهٔ اجرای توسعه است. `npm run test`, `npm run typecheck`, و `npm run build` برای بررسی محلی هستند.

برای دمو می‌توان از Cloudflare Quick Tunnel استفاده کرد. نشانی `trycloudflare.com` موقت است و با راه‌اندازی دوبارهٔ تونل ممکن است عوض شود؛ در این صورت URL دکمهٔ Mini App بات هم باید به‌روز شود. برای آدرس پایدار، تونل نام‌گذاری‌شده یا میزبانی دائمی لازم است.
