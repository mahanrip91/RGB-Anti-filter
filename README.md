# RGB Anti-filter — Minimal Config Mechanism

این نسخه فقط مکانیزم اولیه را پیاده می‌کند:

- صفحه وب ساده برای وارد کردن Username و Cloudflare API Token
- توکن به صورت مستقیم در URL یا HTML قرار نمی‌گیرد.
- Worker درخواست را دریافت می‌کند و اعتبارسنجی پایه Cloudflare API را انجام می‌دهد.
- برای هر کاربر یک لینک اشتراک موقت/قابل‌تغییر تولید می‌شود.
- مسیر `/sub` خروجی کانفیگ را برمی‌گرداند.

## نکته مهم

Cloudflare API Token به تنهایی یک VLESS/Reality/WS node نمی‌سازد. برای اینکه لینک اشتراک واقعاً به یک پروکسی وصل شود، باید یک backend/node واقعی و پارامترهای آن (مثلاً UUID، host، port و transport) هم وجود داشته باشد.

این نسخه عمداً آن بخش را جدا نگه می‌دارد تا بعداً backend واقعی به آن وصل شود.

## تنظیم Secret

توکن‌های حساس را داخل GitHub commit نکنید. در Cloudflare Worker از Secret استفاده کنید.

برای تست محلی می‌توانید `.dev.vars` بسازید:

CLOUDFLARE_API_TOKEN="..."
ADMIN_KEY="change-me"

برای نسخه deploy شده:

npx wrangler secret put ADMIN_KEY

اگر می‌خواهید API Token را برای عملیات سروری نگه دارید، آن را هم به عنوان Secret تنظیم کنید؛ API Token کاربر نهایی را در frontend ذخیره نکنید.

## اجرا

npm install
npx wrangler dev

بعد از deploy، صفحه اصلی Worker را باز کنید.
