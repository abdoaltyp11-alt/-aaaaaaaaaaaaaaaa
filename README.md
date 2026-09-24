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

## الفحص

```bash
npm run typecheck
npm run build
```
