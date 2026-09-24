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

1. ارفع الملفات إلى مستودع GitHub على فرع `main` أو `master`.
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

## الفحص

```bash
npm run typecheck
npm run build
```
