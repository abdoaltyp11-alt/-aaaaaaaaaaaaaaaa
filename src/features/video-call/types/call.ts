export type CallRole = 'patient' | 'doctor';
export type CallState = 'idle' | 'waiting' | 'connecting' | 'connected' | 'reconnecting' | 'ended' | 'failed';

export type SignalDescription = {
  type: 'offer' | 'answer';
  sdp: string;
};

export type SignalCandidate = {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
};
