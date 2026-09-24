import { get, onValue, ref, set, update } from 'firebase/database';
import { getBlob, ref as storageRef, uploadBytes } from 'firebase/storage';
import { auth, db, isFirebaseConfigured, storage } from '@/lib/firebase';

export type StaffRole = 'DOCTOR' | 'CONSULTANT' | 'NURSE';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
export type AccountStatus = 'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';

export type StaffDocument = {
  documentId: string;
  documentType: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
  uploadedBy: string;
  uploadedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
};

export type StaffVerificationRequest = {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  roleRequested: StaffRole;
  verificationStatus: VerificationStatus;
  accountStatus: AccountStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  documents?: Record<string, StaffDocument>;
};

export type StaffDocumentUpload = {
  documentType: string;
  file: File;
};

function requireFirebase() {
  if (!isFirebaseConfigured || !db || !storage || !auth?.currentUser) throw new Error('Firebase authentication and storage are required');
  return { database: db, bucket: storage, currentUser: auth.currentUser };
}

export async function submitStaffVerification(request: Omit<StaffVerificationRequest, 'verificationStatus' | 'accountStatus' | 'submittedAt' | 'documents'>, uploads: StaffDocumentUpload[]) {
  const { database, bucket, currentUser } = requireFirebase();
  if (currentUser.uid !== request.uid) throw new Error('You can only submit your own verification request');
  if (uploads.length === 0) throw new Error('أرفق مستندات التحقق المطلوبة');

  const documents: Record<string, StaffDocument> = {};
  for (const upload of uploads) {
    const documentId = crypto.randomUUID();
    const storagePath = `staffVerification/${request.uid}/${documentId}`;
    await uploadBytes(storageRef(bucket, storagePath), upload.file, { contentType: upload.file.type, customMetadata: { documentType: upload.documentType, uploadedBy: request.uid } });
    documents[documentId] = {
      documentId,
      documentType: upload.documentType,
      fileName: upload.file.name,
      mimeType: upload.file.type,
      fileSize: upload.file.size,
      storagePath,
      uploadedBy: request.uid,
      uploadedAt: new Date().toISOString(),
      status: 'PENDING',
    };
  }

  await set(ref(database, `staffVerificationRequests/${request.uid}`), {
    ...request,
    verificationStatus: 'PENDING',
    accountStatus: 'PENDING_REVIEW',
    submittedAt: new Date().toISOString(),
    documents,
  });
}

export function subscribeToStaffRequests(onChange: (requests: StaffVerificationRequest[]) => void) {
  if (!isFirebaseConfigured || !db) {
    onChange([]);
    return () => undefined;
  }
  return onValue(ref(db, 'staffVerificationRequests'), (snapshot) => {
    const data = snapshot.val() as Record<string, StaffVerificationRequest> | null;
    onChange(Object.values(data ?? {}));
  });
}

export async function getStaffVerificationRequest(uid: string) {
  const { database, currentUser } = requireFirebase();
  if (currentUser.uid !== uid) throw new Error('You can only read your own verification request');
  const snapshot = await get(ref(database, `staffVerificationRequests/${uid}`));
  return snapshot.val() as StaffVerificationRequest | null;
}

export async function downloadStaffDocument(path: string) {
  const { bucket } = requireFirebase();
  return getBlob(storageRef(bucket, path));
}

export async function reviewStaffRequest(uid: string, decision: 'APPROVED' | 'REJECTED' | 'SUSPENDED', reason = '') {
  const { database, currentUser } = requireFirebase();
  const requestRef = ref(database, `staffVerificationRequests/${uid}`);
  const snapshot = await get(requestRef);
  const request = snapshot.val() as StaffVerificationRequest | null;
  if (!request) throw new Error('طلب التحقق غير موجود');
  if (decision === 'REJECTED' && !reason.trim()) throw new Error('سبب الرفض مطلوب');

  const now = new Date().toISOString();
  const nextStatus = decision === 'APPROVED' ? 'VERIFIED' : decision;
  const nextAccountStatus = decision === 'APPROVED' ? 'ACTIVE' : decision;
  await update(requestRef, { verificationStatus: nextStatus, accountStatus: nextAccountStatus, reviewedAt: now, reviewedBy: currentUser.uid, rejectionReason: reason.trim() || null });
  await set(ref(database, `auditLogs/${crypto.randomUUID()}`), { action: `verification.${decision.toLowerCase()}`, adminUid: currentUser.uid, targetUserUid: uid, timestamp: now, previousStatus: request.verificationStatus, newStatus: nextStatus, reason: reason.trim() });
  await set(ref(database, `notifications/${uid}/${crypto.randomUUID()}`), { type: `verification.${decision.toLowerCase()}`, message: decision === 'APPROVED' ? 'تم اعتماد طلبك، وسيتم تفعيل الصلاحيات المهنية عبر النظام الآمن.' : `تم تحديث طلب التحقق: ${reason.trim()}`, createdAt: now, read: false });
}
