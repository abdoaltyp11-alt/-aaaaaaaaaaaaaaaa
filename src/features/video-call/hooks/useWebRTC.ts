import { useCallback, useEffect, useRef, useState } from 'react';
import { cleanupSignaling, publishCandidate, publishCallState, publishDescription, publishParticipant, subscribeToSignal } from '@/features/video-call/services/signaling';
import { Appointment } from '@/services/bookingData';
import { CallRole, CallState, SignalCandidate, SignalDescription } from '@/features/video-call/types/call';

export type InMemoryMessage = {
  id: string;
  text: string;
  sender: 'local' | 'remote';
  timestamp: number;
};

const MAX_CALL_SECONDS = 60 * 60;
const MAX_RECONNECT_ATTEMPTS = 3;
const publicIceServers: RTCIceServer[] = [
  { urls: import.meta.env.VITE_WEBRTC_STUN_URL || 'stun:stun.l.google.com:19302' },
];

async function getIceServers() {
  const endpoint = import.meta.env.VITE_WEBRTC_ICE_SERVERS_ENDPOINT;
  if (!endpoint) return publicIceServers;
  try {
    const response = await fetch(endpoint, { credentials: 'include' });
    if (!response.ok) return publicIceServers;
    const servers = await response.json() as RTCIceServer[];
    return servers.length > 0 ? servers : publicIceServers;
  } catch {
    return publicIceServers;
  }
}

function appointmentStart(appointment: Appointment) {
  return new Date(`${appointment.date}T${appointment.time}:00`).getTime();
}

export function canJoinAppointment(appointment: Appointment) {
  if (appointment.appointmentType !== 'online' || appointment.status === 'cancelled' || appointment.status === 'completed') return false;
  if (appointment.paymentStatus !== 'paid' || appointment.status !== 'confirmed') return false;
  const start = appointmentStart(appointment);
  return Date.now() >= start - 10 * 60 * 1000 && Date.now() <= start + 60 * 60 * 1000;
}

export function useWebRTC(appointment: Appointment, role: CallRole, uid: string) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [error, setError] = useState('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<InMemoryMessage[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const subscriptionsRef = useRef<Array<() => void>>([]);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const creatingPeerRef = useRef(false);
  const closingRef = useRef(false);
  const remoteDescriptionReadyRef = useRef(false);
  const pendingCandidatesRef = useRef<SignalCandidate[]>([]);
  const appliedCandidatesRef = useRef(new Set<string>());
  const offerAppliedRef = useRef(false);
  const answerAppliedRef = useRef(false);

  const clearSubscriptions = useCallback(() => {
    subscriptionsRef.current.forEach((unsubscribe) => unsubscribe());
    subscriptionsRef.current = [];
  }, []);

  const closePeer = useCallback(() => {
    clearSubscriptions();
    channelRef.current?.close();
    channelRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    remoteDescriptionReadyRef.current = false;
    pendingCandidatesRef.current = [];
    appliedCandidatesRef.current.clear();
    offerAppliedRef.current = false;
    answerAppliedRef.current = false;
  }, [clearSubscriptions]);

  const addCandidateSafely = useCallback(async (peer: RTCPeerConnection, candidate: SignalCandidate) => {
    if (appliedCandidatesRef.current.has(candidate.candidate)) return;
    appliedCandidatesRef.current.add(candidate.candidate);
    if (!remoteDescriptionReadyRef.current) {
      pendingCandidatesRef.current.push(candidate);
      return;
    }
    try {
      await peer.addIceCandidate(candidate);
    } catch {
      // Ignore stale or malformed candidates without crashing the call.
    }
  }, []);

  const flushCandidates = useCallback(async (peer: RTCPeerConnection) => {
    const queued = pendingCandidatesRef.current.splice(0);
    for (const candidate of queued) {
      try {
        await peer.addIceCandidate(candidate);
      } catch {
        // Ignore candidates that belong to an old negotiation.
      }
    }
  }, []);

  const closeCall = useCallback(async (finalState: CallState = 'ended') => {
    closingRef.current = true;
    if (reconnectTimerRef.current !== null) window.clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = null;
    closePeer();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setMessages([]);
    setCallState(finalState);
    try {
      await cleanupSignaling(appointment.id, role);
    } catch {
      // Local media cleanup has already completed.
    }
  }, [appointment.id, closePeer, role]);

  const attachChannel = useCallback((channel: RTCDataChannel) => {
    if (channelRef.current && channelRef.current !== channel) channelRef.current.close();
    channelRef.current = channel;
    channel.onopen = () => setCallState('connected');
    channel.onmessage = (event) => setMessages((current) => [...current, { id: crypto.randomUUID(), text: String(event.data), sender: 'remote', timestamp: Date.now() }]);
    channel.onclose = () => setCallState((current) => current === 'ended' ? current : 'reconnecting');
  }, []);

  const prepareMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('المتصفح لا يدعم الكاميرا والميكروفون.');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const connectPeer = useCallback(async () => {
    if (closingRef.current || peerRef.current || creatingPeerRef.current) return;
    creatingPeerRef.current = true;
    try {
      const stream = await prepareMedia();
      const peer = new RTCPeerConnection({ iceServers: await getIceServers() });
      peerRef.current = peer;
      setRemoteStream(null);
      const remote = new MediaStream();
      remoteStreamRef.current = remote;
      setRemoteStream(remote);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      peer.ontrack = (event) => event.streams[0]?.getTracks().forEach((track) => remote.addTrack(track));
      peer.onicecandidate = (event) => {
        if (event.candidate) void publishCandidate(appointment.id, role, { candidate: event.candidate.candidate, sdpMid: event.candidate.sdpMid, sdpMLineIndex: event.candidate.sdpMLineIndex });
      };
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === 'connected') {
          reconnectAttemptsRef.current = 0;
          setCallState('connected');
          void publishCallState(appointment.id, 'connected');
        } else if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
          if (!closingRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS && reconnectTimerRef.current === null) {
            const delay = 500 * (2 ** reconnectAttemptsRef.current);
            reconnectAttemptsRef.current += 1;
            setCallState('reconnecting');
            reconnectTimerRef.current = window.setTimeout(() => {
              reconnectTimerRef.current = null;
              closePeer();
              void connectPeer();
            }, delay);
          } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
            setCallState('failed');
          }
        }
      };
      if (role === 'patient') attachChannel(peer.createDataChannel('private-chat'));
      else peer.ondatachannel = (event) => attachChannel(event.channel);

      subscriptionsRef.current.push(
        subscribeToSignal<SignalDescription>(appointment.id, 'offer', async (offer) => {
          if (role !== 'doctor' || !offer || offerAppliedRef.current || peerRef.current !== peer) return;
          try {
            offerAppliedRef.current = true;
            await peer.setRemoteDescription(offer);
            remoteDescriptionReadyRef.current = true;
            await flushCandidates(peer);
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            await publishDescription(appointment.id, 'answer', { type: 'answer', sdp: answer.sdp ?? '' });
          } catch {
            setCallState('failed');
          }
        }),
        subscribeToSignal<SignalDescription>(appointment.id, 'answer', async (answer) => {
          if (role !== 'patient' || !answer || answerAppliedRef.current || peerRef.current !== peer) return;
          try {
            answerAppliedRef.current = true;
            await peer.setRemoteDescription(answer);
            remoteDescriptionReadyRef.current = true;
            await flushCandidates(peer);
          } catch {
            setCallState('failed');
          }
        }),
        subscribeToSignal<Record<string, SignalCandidate>>(appointment.id, `iceCandidates/${role === 'patient' ? 'doctor' : 'patient'}`, async (candidates) => {
          for (const candidate of Object.values(candidates ?? {})) await addCandidateSafely(peer, candidate);
        }),
      );
      await publishParticipant(appointment.id, role, uid);
      await publishCallState(appointment.id, 'connecting');
      if (role === 'patient') {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        await publishDescription(appointment.id, 'offer', { type: 'offer', sdp: offer.sdp ?? '' });
      } else {
        setCallState('waiting');
      }
    } catch (callError) {
      closePeer();
      setError(callError instanceof DOMException && callError.name === 'NotAllowedError' ? 'يرجى السماح باستخدام الكاميرا والميكروفون للمتابعة.' : 'تعذر إنشاء اتصال المكالمة.');
      setCallState('failed');
    } finally {
      creatingPeerRef.current = false;
    }
  }, [addCandidateSafely, appointment.id, attachChannel, closePeer, flushCandidates, prepareMedia, role, uid]);

  const startCall = useCallback(async () => {
    if (!canJoinAppointment(appointment)) {
      setError('الموعد غير متاح للمكالمة الآن أو لم يتم تأكيد الدفع والموعد.');
      setCallState('failed');
      return;
    }
    if (typeof RTCPeerConnection === 'undefined') {
      setError('المتصفح لا يدعم مكالمات الفيديو الحديثة.');
      setCallState('failed');
      return;
    }
    closingRef.current = false;
    setError('');
    setCallState('connecting');
    await connectPeer();
  }, [appointment, connectPeer]);

  const sendMessage = useCallback((text: string) => {
    const cleanText = text.trim();
    if (!cleanText || channelRef.current?.readyState !== 'open') return false;
    channelRef.current.send(cleanText);
    setMessages((current) => [...current, { id: crypto.randomUUID(), text: cleanText, sender: 'local', timestamp: Date.now() }]);
    return true;
  }, []);

  useEffect(() => {
    if (callState !== 'connected') return undefined;
    const timer = window.setInterval(() => setElapsedSeconds((seconds) => {
      if (seconds + 1 >= MAX_CALL_SECONDS) {
        void closeCall('ended');
        return MAX_CALL_SECONDS;
      }
      return seconds + 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [callState, closeCall]);

  useEffect(() => () => { void closeCall('ended'); }, [closeCall]);

  return { callState, error, localStream, remoteStream, messages, elapsedSeconds, startCall, closeCall, sendMessage };
}
