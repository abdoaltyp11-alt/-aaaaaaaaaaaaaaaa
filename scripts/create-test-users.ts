import { password } from '@inquirer/prompts';
import { applicationDefault, cert, initializeApp } from 'firebase-admin/app';
import { Auth, getAuth, UserRecord } from 'firebase-admin/auth';
import { Database, getDatabase } from 'firebase-admin/database';
import { config } from 'dotenv';
import { existsSync } from 'node:fs';

const testAccounts = [
  { email: 'admin@test.com', name: 'مدير تجريبي', role: 'ADMIN' },
  { email: 'employee@test.com', name: 'موظف تجريبي', role: 'NURSE' },
  { email: 'user@test.com', name: 'مستخدم تجريبي', role: 'PATIENT' },
] as const;

type TestAccount = (typeof testAccounts)[number] & { password: string };

function errorCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : undefined;
}

function requiredEnvironmentValue(...names: string[]): string {
  const value = names.map((name) => process.env[name]).find(Boolean);
  if (!value) throw new Error(`إعداد Firebase مفقود: ${names.join(' أو ')}`);
  return value;
}

async function getOrCreateAuthUser(auth: Auth, account: TestAccount): Promise<UserRecord> {
  try {
    return await auth.getUserByEmail(account.email);
  } catch (error) {
    if (errorCode(error) !== 'auth/user-not-found') throw error;
  }

  try {
    return await auth.createUser({
      email: account.email,
      password: account.password,
      displayName: account.name,
      emailVerified: true,
      disabled: false,
    });
  } catch (error) {
    if (errorCode(error) !== 'auth/email-already-exists') throw error;
    return auth.getUserByEmail(account.email);
  }
}

async function ensureDatabaseProfile(
  database: Database,
  account: TestAccount,
  user: UserRecord,
): Promise<'created' | 'existing'> {
  const profileReference = database.ref(`users/${user.uid}`);
  const createdAt = new Date().toISOString();
  const result = await profileReference.transaction((profile: unknown) => {
    if (profile !== null) return;
    return {
      id: user.uid,
      uid: user.uid,
      fullName: account.name,
      name: account.name,
      email: account.email,
      phone: '',
      role: account.role,
      status: 'VERIFIED',
      createdAt,
    };
  });

  if (!result.committed) {
    const profile = result.snapshot.val() as { role?: string; status?: string; email?: string };
    if (profile.role !== account.role || profile.status !== 'VERIFIED' || profile.email !== account.email) {
      throw new Error(
        `يوجد ملف مستخدم بدور أو حالة مختلفة عند users/${user.uid}؛ لم يتم تعديله.`,
      );
    }
    return 'existing';
  }

  return 'created';
}

async function verifyPasswordLogin(
  apiKey: string,
  account: TestAccount,
  uid: string,
): Promise<void> {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: account.email,
        password: account.password,
        returnSecureToken: true,
      }),
    },
  );

  const result = await response.json() as {
    localId?: string;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(`فشل اختبار تسجيل الدخول: ${result.error?.message ?? response.status}`);
  }
  if (result.localId !== uid) {
    throw new Error('نجح تسجيل الدخول لكن Firebase أعاد UID غير المتوقع.');
  }
}

async function main() {
  if (process.env.CI || !process.stdin.isTTY) {
    throw new Error('هذا السكربت مخصص للتشغيل التفاعلي محليًا فقط.');
  }

  if (existsSync('.env.local')) {
    const result = config({ path: '.env.local' });
    if (result.error) throw result.error;
  }

  const projectId = requiredEnvironmentValue('FIREBASE_PROJECT_ID');
  const databaseURL = requiredEnvironmentValue('FIREBASE_DATABASE_URL');
  const apiKey = requiredEnvironmentValue('FIREBASE_API_KEY');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (Boolean(clientEmail) !== Boolean(privateKey)) {
    throw new Error('يجب ضبط FIREBASE_CLIENT_EMAIL وFIREBASE_PRIVATE_KEY معًا.');
  }
  const app = initializeApp({
    credential: clientEmail && privateKey
      ? cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      })
      : applicationDefault(),
    projectId,
    databaseURL,
  });
  const auth = getAuth(app);
  const database = getDatabase(app);

  await Promise.all([
    auth.listUsers(1),
    database.ref('users').limitToFirst(1).get(),
  ]);

  const accounts: TestAccount[] = [];
  for (const account of testAccounts) {
    const enteredPassword = await password({
      message: `أدخل كلمة مرور ${account.email}`,
      mask: '*',
      validate: (value) => value.length >= 6 || 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.',
    });
    accounts.push({ ...account, password: enteredPassword });
  }

  let failed = false;
  const readyAccounts: Array<{ account: TestAccount; user: UserRecord }> = [];

  for (const account of accounts) {
    try {
      const user = await getOrCreateAuthUser(auth, account);
      const profileStatus = await ensureDatabaseProfile(database, account, user);
      readyAccounts.push({ account, user });
      console.log(`تم تجهيز ${account.email} (${account.role})؛ ملف قاعدة البيانات ${profileStatus === 'created' ? 'أُنشئ' : 'موجود'}.`);
    } catch (error) {
      failed = true;
      console.error(`تعذر تجهيز ${account.email}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  for (const { account, user } of readyAccounts) {
    try {
      await verifyPasswordLogin(apiKey, account, user.uid);
      console.log(`نجح اختبار تسجيل الدخول: ${account.email}`);
    } catch (error) {
      failed = true;
      console.error(`فشل اختبار تسجيل الدخول لـ ${account.email}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (failed || readyAccounts.length !== testAccounts.length) {
    process.exitCode = 1;
    return;
  }
  console.log('اكتمل إنشاء/التحقق من حسابات الاختبار الثلاثة بنجاح.');
}

main().catch((error: unknown) => {
  console.error(`توقف سكربت حسابات الاختبار: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
