# صحيحتي

منصة رعاية صحية رقمية مبنية باستخدام React وVite وFirebase.

## التشغيل محليًا

```bash
npm install
npm run dev
```

ثم افتح `http://localhost:5173`.

## النشر على GitHub Pages

المشروع مجهز للنشر التلقائي:

1. ارفع الملفات إلى مستودع GitHub على فرع `main`.
2. افتح **Settings > Pages**.
3. اختر **GitHub Actions** كمصدر النشر.
4. انتظر نجاح Workflow باسم **Deploy to GitHub Pages**.
5. افتح الرابط الظاهر في صفحة الـ Workflow.

يتم بناء نسخة الإنتاج تلقائيًا داخل GitHub Actions، لذلك لا تفتح ملف `index.html` من مستودع GitHub مباشرة.

## Firebase

لربط Firebase الحقيقي، أنشئ ملف `.env` محليًا اعتمادًا على `.env.example`. لا ترفع `.env` إلى GitHub.

في GitHub Actions أضف القيم التالية من **Settings > Secrets and variables > Actions** كـ Repository secrets:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_WEBRTC_STUN_URL` (اختياري)
- `VITE_WEBRTC_ICE_SERVERS_ENDPOINT` (اختياري)

أضف دومين GitHub Pages إلى Firebase Authentication من **Authentication > Settings > Authorized domains**.

المشروع الحالي يستخدم Firebase Realtime Database وFirebase Storage في الكود؛ لا توجد عمليات Firestore مستخدمة حاليًا.

## إنشاء حسابات الاختبار محليًا

يتطلب السكربت Node.js 20 أو أحدث. انسخ `.env.example` إلى `.env.local`، واضبط محليًا `FIREBASE_PROJECT_ID` و`FIREBASE_DATABASE_URL` و`FIREBASE_API_KEY`. للمصادقة، استخدم Application Default Credentials أو مسار حساب خدمة محفوظ خارج المستودع في `GOOGLE_APPLICATION_CREDENTIALS`، أو اضبط `FIREBASE_CLIENT_EMAIL` و`FIREBASE_PRIVATE_KEY` محليًا. لا تضع بيانات اعتماد Admin في متغيرات `VITE_`، ولا ترفعها إلى GitHub.

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\outside\repository\firebase-admin.json"
npm install
npm run seed:test-users
```

يطلب السكربت كلمات مرور الحسابات الثلاثة بإدخال مخفي، وينشئ ملفاتها في `users/{uid}` على Realtime Database. لا يحذف حسابًا موجودًا أو يغيّر كلمة مروره أو ملفه، ويتحقق من تسجيل الدخول بعد تجهيز الحسابات. يعمل تفاعليًا محليًا فقط، ويرفض التشغيل في CI.

## الفحص

```bash
npm run typecheck
npm run build
```
