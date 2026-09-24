import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { AuthSession, RegisterPayload, Role, User } from '@/types/user';
import { syncCatalogData, syncUserCloudData } from '@/services/bookingData';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { get, ref, set } from 'firebase/database';
import { createUserWithEmailAndPassword, deleteUser, FacebookAuthProvider, GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';

const AUTH_STORAGE_KEY = 'sahhati-auth-session';

function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T;
}

function signInWithPopupTimeout<T>(operation: Promise<T>) {
  return Promise.race([
    operation,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => {
        const error = Object.assign(new Error('The authentication popup was blocked or did not open.'), { code: 'auth/popup-blocked' });
        reject(error);
      }, 10000);
    }),
  ]);
}

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  authReady: boolean;
  signIn: (emailOrPhone: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  pendingGoogleUser: { uid: string; fullName: string; email: string; phone: string; avatarUrl?: string } | null;
  chooseGoogleRole: (role: 'PATIENT' | 'DOCTOR' | 'NURSE') => Promise<void>;
  updateUser: (updates: Pick<User, 'fullName' | 'phone'>) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  logout: () => void;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const readStoredSession = (): AuthSession | null => {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as AuthSession;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => isFirebaseConfigured ? null : readStoredSession());
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<AuthContextValue['pendingGoogleUser']>(null);

  useEffect(() => {
    void syncCatalogData();
  }, []);

  useEffect(() => {
    if (!session || !['PATIENT', 'DOCTOR'].includes(session.user.role)) return;
    void syncUserCloudData(session.user.id, session.user.role as 'PATIENT' | 'DOCTOR');
  }, [session]);

  const persistSession = useCallback((nextSession: AuthSession | null) => {
    setSession(nextSession);

    if (nextSession) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
      return;
    }

    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) return undefined;
    const firebaseAuth = auth;
    const database = db;

    return onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          persistSession(null);
          setAuthReady(true);
          return;
        }

        const profileSnapshot = await get(ref(database, `users/${firebaseUser.uid}`));
        const profile = profileSnapshot.val() as User | null;
        if (!profile || profile.id !== firebaseUser.uid) {
          await signOut(firebaseAuth);
          persistSession(null);
          setAuthReady(true);
          return;
        }

        persistSession({ user: profile, token: await firebaseUser.getIdToken() });
        setAuthReady(true);
      } catch {
        await signOut(firebaseAuth);
        persistSession(null);
        setAuthReady(true);
      }
    });
  }, [persistSession]);

  const createGoogleSession = useCallback(async (googleUser: FirebaseUser, role: Role) => {
    const user: User = {
      id: googleUser.uid,
      fullName: googleUser.displayName ?? 'مستخدم Google',
      email: googleUser.email ?? '',
      phone: googleUser.phoneNumber ?? '',
      role,
      status: 'VERIFIED',
      avatarUrl: googleUser.photoURL ?? undefined,
    };

    persistSession({ user, token: await googleUser.getIdToken() });
    setPendingGoogleUser(null);
  }, [persistSession]);

  const signIn = useCallback(async (emailOrPhone: string, password: string) => {
    if (!isFirebaseConfigured || !auth || !db || !emailOrPhone.includes('@')) {
      throw new Error('يجب استخدام حساب Firebase حقيقي بالبريد الإلكتروني');
    }
    const credential = await signInWithEmailAndPassword(auth, emailOrPhone.trim(), password);
    const profileSnapshot = await get(ref(db, `users/${credential.user.uid}`));
    const profile = profileSnapshot.val() as User | null;
    if (!profile || profile.id !== credential.user.uid) {
      await signOut(auth);
      throw new Error('حساب Firebase ليس له ملف مستخدم معتمد');
    }
    persistSession({ user: profile, token: await credential.user.getIdToken() });
  }, [persistSession]);

  const signInWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured || !auth || !db) {
      throw new Error('إعدادات Google Firebase غير مكتملة');
    }

    const result = await signInWithPopupTimeout(signInWithPopup(auth, new GoogleAuthProvider()));
    const googleUser = result.user;
    const profileSnapshot = await get(ref(db, `users/${googleUser.uid}`));
    const profile = profileSnapshot.val() as User | null;
    if (profile?.role) {
      await createGoogleSession(googleUser, profile.role);
      return;
    }
    setPendingGoogleUser({
      uid: googleUser.uid,
      fullName: googleUser.displayName ?? 'مستخدم Google',
      email: googleUser.email ?? '',
      phone: googleUser.phoneNumber ?? '',
      avatarUrl: googleUser.photoURL ?? undefined,
    });
  }, [createGoogleSession]);

  const signInWithFacebook = useCallback(async () => {
    if (!isFirebaseConfigured || !auth || !db) {
      throw new Error('إعدادات Facebook Firebase غير مكتملة');
    }

    const result = await signInWithPopupTimeout(signInWithPopup(auth, new FacebookAuthProvider()));
    const facebookUser = result.user;
    const profileSnapshot = await get(ref(db, `users/${facebookUser.uid}`));
    const profile = profileSnapshot.val() as User | null;
    if (profile?.role) {
      await createGoogleSession(facebookUser, profile.role);
      return;
    }
    setPendingGoogleUser({
      uid: facebookUser.uid,
      fullName: facebookUser.displayName ?? 'مستخدم Facebook',
      email: facebookUser.email ?? '',
      phone: facebookUser.phoneNumber ?? '',
      avatarUrl: facebookUser.photoURL ?? undefined,
    });
  }, [createGoogleSession]);

  const chooseGoogleRole = useCallback(async (role: 'PATIENT' | 'DOCTOR' | 'NURSE') => {
    if (!auth?.currentUser || !pendingGoogleUser) return;
    if (!db) return;
    const profileReference = ref(db, `users/${auth.currentUser.uid}`);
    const profileSnapshot = await get(profileReference);
    const profile = profileSnapshot.val() as User | null;
    if (role !== 'PATIENT' && profile?.role !== role) {
      throw new Error('هذا الدور يحتاج اعتماد الإدارة قبل تفعيله');
    }
    if (!profile) {
      const patientProfile: User = {
        id: auth.currentUser.uid,
        fullName: pendingGoogleUser.fullName,
        email: pendingGoogleUser.email,
        phone: pendingGoogleUser.phone,
        role: 'PATIENT',
        status: 'VERIFIED',
        avatarUrl: pendingGoogleUser.avatarUrl,
      };
      await set(profileReference, withoutUndefined(patientProfile));
    }
    await createGoogleSession(auth.currentUser, role);
  }, [createGoogleSession, pendingGoogleUser]);

  const signUp = useCallback(async (payload: RegisterPayload) => {
    if (!isFirebaseConfigured || !auth || !db) {
      throw new Error('إعدادات Firebase غير مكتملة');
    }
    if (payload.role !== 'PATIENT') {
      throw new Error('إنشاء حساب طبيب أو ممرض يتم بواسطة الإدارة فقط');
    }
    const credential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
    const user: User = {
      id: credential.user.uid,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      role: 'PATIENT',
      status: 'VERIFIED',
      avatarUrl: payload.avatarUrl,
    };
    try {
      await set(ref(db, `users/${user.id}`), withoutUndefined(user));
    } catch (error) {
      await deleteUser(credential.user);
      throw error;
    }
    persistSession({ user, token: await credential.user.getIdToken() });
  }, [persistSession]);

  const verifyOtp = useCallback(async (otp: string) => {
    await Promise.resolve();

    if (!session) return;

    const expectedCode = session.verificationCode ?? '123456';

    if (!otp || otp.length < 4 || otp !== expectedCode) {
      throw new Error('رمز التحقق غير صحيح');
    }

    const verifiedUser = {
      ...session.user,
      status: 'VERIFIED' as const,
    };

    persistSession({
      user: verifiedUser,
      token: session.token,
      verificationCode: expectedCode,
    });
  }, [persistSession, session]);

  const logout = useCallback(() => {
    if (auth) void signOut(auth);
    persistSession(null);
  }, [persistSession]);

  const updateUser = useCallback(async (updates: Pick<User, 'fullName' | 'phone'>) => {
    if (!session) return;
    const updatedUser = { ...session.user, ...updates };
    persistSession({ ...session, user: updatedUser });
    if (db && isFirebaseConfigured) {
      await set(ref(db, `users/${session.user.id}`), withoutUndefined(updatedUser));
    }
  }, [persistSession, session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      authReady,
      signIn,
      signInWithGoogle,
      signInWithFacebook,
      pendingGoogleUser,
      chooseGoogleRole,
      updateUser,
      signUp,
      verifyOtp,
      logout,
      user: session?.user ?? null,
    }),
    [session, authReady, signIn, signInWithGoogle, signInWithFacebook, pendingGoogleUser, chooseGoogleRole, updateUser, signUp, verifyOtp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
