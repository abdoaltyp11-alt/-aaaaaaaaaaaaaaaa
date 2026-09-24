import { child, onDisconnect, onValue, push, ref, remove, set } from 'firebase/database';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { SignalCandidate, SignalDescription } from '@/features/video-call/types/call';

function sessionRef(appointmentId: string) {
  if (!db) throw new Error('Firebase Realtime Database is not configured');
  return ref(db, `callSessions/${appointmentId}`);
}

export function subscribeToSignal<T>(appointmentId: string, path: string, onChange: (value: T | null) => void) {
  if (!isFirebaseConfigured || !db) {
    onChange(null);
    return () => undefined;
  }
  return onValue(child(sessionRef(appointmentId), path), (snapshot) => onChange(snapshot.val() as T | null));
}

export async function publishParticipant(appointmentId: string, role: 'patient' | 'doctor', uid: string) {
  await onDisconnect(sessionRef(appointmentId)).remove();
  await set(child(sessionRef(appointmentId), `${role}Id`), uid);
  await onDisconnect(child(sessionRef(appointmentId), `${role}Id`)).remove();
}

export async function publishDescription(appointmentId: string, type: 'offer' | 'answer', description: SignalDescription) {
  await set(child(sessionRef(appointmentId), type), description);
}

export async function publishCandidate(appointmentId: string, role: 'patient' | 'doctor', candidate: SignalCandidate) {
  const candidateRef = push(child(sessionRef(appointmentId), `iceCandidates/${role}`));
  await set(candidateRef, candidate);
  await onDisconnect(candidateRef).remove();
}

export async function publishCallState(appointmentId: string, state: 'waiting' | 'connecting' | 'connected' | 'ended') {
  await set(child(sessionRef(appointmentId), 'state'), state);
}

export async function cleanupSignaling(appointmentId: string, role: 'patient' | 'doctor') {
  if (!isFirebaseConfigured || !db) return;
  await publishCallState(appointmentId, 'ended');
  await remove(sessionRef(appointmentId));
}
