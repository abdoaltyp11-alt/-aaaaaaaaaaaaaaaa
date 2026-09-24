import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/app/AuthProvider';
import { Appointment, subscribeToAppointment } from '@/services/bookingData';
import { canJoinAppointment, useWebRTC } from '@/features/video-call/hooks/useWebRTC';
import { CallRole } from '@/features/video-call/types/call';

export default function CallPage() {
  const { appointmentId } = useParams();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState<Appointment>();

  useEffect(() => {
    if (!appointmentId) return undefined;
    return subscribeToAppointment(appointmentId, setAppointment);
  }, [appointmentId]);

  if (!user || !appointment || !appointmentId) {
    return <CallEmptyState message="جاري تحميل بيانات الموعد الآمنة..." />;
  }

  if (user.id !== appointment.patientId && user.id !== appointment.doctorId) {
    return <CallEmptyState message="لا تملك صلاحية الدخول إلى هذه المكالمة." />;
  }

  const role: CallRole = user.id === appointment.patientId ? 'patient' : 'doctor';
  return <CallSession appointment={appointment} role={role} uid={user.id} />;
}

function CallSession({ appointment, role, uid }: { appointment: Appointment; role: CallRole; uid: string }) {
  const navigate = useNavigate();
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const callContainerRef = useRef<HTMLDivElement>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const { callState, error, localStream, remoteStream, messages, elapsedSeconds, startCall, closeCall, sendMessage } = useWebRTC(appointment, role, uid);

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream]);
  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  const toggleMute = () => {
    localStream?.getAudioTracks().forEach((track) => { track.enabled = muted; });
    setMuted((value) => !value);
  };
  const toggleCamera = () => {
    localStream?.getVideoTracks().forEach((track) => { track.enabled = cameraOff; });
    setCameraOff((value) => !value);
  };
  const submitMessage = (event: FormEvent) => {
    event.preventDefault();
    if (sendMessage(message)) setMessage('');
  };
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void callContainerRef.current?.requestFullscreen();
  };
  const timer = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`;

  return (
    <div ref={callContainerRef} className="app-shell min-h-screen bg-slate-950 px-3 py-4 text-white md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="text-sm text-emerald-300">مكالمة صحيحتي الآمنة</p>
            <h1 className="text-xl font-black">{role === 'patient' ? appointment.doctorName : appointment.patientName}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span>{callState === 'connected' ? 'متصل' : callState === 'reconnecting' ? 'جارٍ إعادة الاتصال' : callState === 'ended' ? 'انتهت المكالمة' : 'في انتظار الاتصال'}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 font-mono">{timer}</span>
          </div>
        </header>

        <main className="relative mt-4 flex flex-1 gap-4">
          <section className="relative flex min-h-[60vh] flex-1 items-center justify-center overflow-hidden rounded-3xl bg-slate-900">
            <video ref={remoteVideoRef} autoPlay playsInline className="h-full max-h-[70vh] w-full object-contain" />
            {!remoteStream && <div className="text-center text-slate-400"><div className="text-5xl">◉</div><p className="mt-3">{callState === 'idle' ? 'اضغط بدء المكالمة للانضمام' : 'في انتظار الطرف الآخر...'}</p></div>}
            <video ref={localVideoRef} autoPlay muted playsInline className="absolute bottom-4 left-4 h-28 w-44 rounded-2xl border border-white/20 bg-black object-cover shadow-xl md:h-36 md:w-56" />
          </section>

          {chatOpen && (
            <aside className="absolute inset-x-0 bottom-0 z-10 flex h-[55vh] flex-col rounded-3xl bg-white text-slate-900 shadow-2xl md:static md:h-auto md:w-80">
              <div className="flex items-center justify-between border-b p-4"><h2 className="font-bold">محادثة خاصة</h2><button type="button" onClick={() => setChatOpen(false)} className="text-slate-500">إغلاق</button></div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.length === 0 && <p className="text-center text-sm text-slate-400">لا توجد رسائل بعد. الرسائل مؤقتة ولا يتم حفظها.</p>}
                {messages.map((item) => <div key={item.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${item.sender === 'local' ? 'mr-auto bg-emerald-100' : 'bg-slate-100'}`}>{item.text}</div>)}
              </div>
              <form onSubmit={submitMessage} className="flex gap-2 border-t p-3"><input className="input" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="اكتب رسالة مؤقتة" /><button className="btn-primary px-3" type="submit">إرسال</button></form>
            </aside>
          )}
        </main>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {callState === 'idle' && <button type="button" onClick={() => void startCall()} className="btn-primary">بدء المكالمة</button>}
          {callState === 'failed' && <button type="button" onClick={() => void startCall()} className="btn-primary">إعادة المحاولة</button>}
          {callState !== 'idle' && callState !== 'ended' && <button type="button" onClick={() => void closeCall()} className="rounded-xl bg-red-600 px-5 py-2.5 font-medium text-white">إنهاء المكالمة</button>}
          <button type="button" onClick={toggleMute} className="btn-secondary">{muted ? 'تشغيل الميكروفون' : 'كتم الميكروفون'}</button>
          <button type="button" onClick={toggleCamera} className="btn-secondary">{cameraOff ? 'تشغيل الكاميرا' : 'إيقاف الكاميرا'}</button>
          <button type="button" onClick={() => setChatOpen((value) => !value)} className="btn-secondary">المحادثة</button>
          <button type="button" onClick={toggleFullscreen} className="btn-secondary">ملء الشاشة</button>
          <Link to="/booking/appointments" className="btn-secondary">العودة للحجوزات</Link>
        </div>
        {error && <p className="mt-3 text-center text-sm text-red-300">{error}</p>}
        {!canJoinAppointment(appointment) && callState === 'idle' && <p className="mt-3 text-center text-sm text-amber-300">المكالمة متاحة قبل الموعد بـ10 دقائق وحتى ساعة بعد بدايته، بعد تأكيد الدفع والموعد.</p>}
      </div>
    </div>
  );
}

function CallEmptyState({ message }: { message: string }) {
  return <div className="app-shell flex min-h-screen items-center justify-center px-4"><div className="card max-w-md p-8 text-center text-slate-600">{message}</div></div>;
}
