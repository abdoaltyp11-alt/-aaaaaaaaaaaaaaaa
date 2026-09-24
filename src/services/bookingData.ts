import { equalTo, get, onValue, orderByChild, query, ref, set } from 'firebase/database';
import { db, isFirebaseConfigured } from '@/lib/firebase';

export type AppointmentStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled'
  | 'no_show'
  | 'payment_failed';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'fawry' | 'instapay';

export type Prescription = {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  diagnosis: string;
  medications: string;
  createdAt: string;
};

export type Specialty = {
  id: string;
  name: string;
  arabicName: string;
  description: string;
  icon: string;
  active: boolean;
  order: number;
};

export type Doctor = {
  id: string;
  fullName: string;
  specialtyId: string;
  photo: string;
  title: string;
  bio: string;
  experience: number;
  rating: number;
  reviews: number;
  consultationPrice: number;
  verified: boolean;
  online: boolean;
  offline: boolean;
  availableDates: string[];
  timeSlots: string[];
};

export type ServiceOption = {
  id: string;
  doctorId: string;
  name: string;
  duration: number;
  price: number;
  type: 'online' | 'offline';
  active: boolean;
};

export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  specialtyId: string;
  serviceId: string;
  serviceName: string;
  appointmentType: 'online' | 'offline';
  date: string;
  time: string;
  duration: number;
  price: number;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes: string;
  createdAt: string;
  doctorName: string;
  patientName: string;
};

const SPECIALTIES_STORAGE_KEY = 'sahhati-specialties';
const DOCTORS_STORAGE_KEY = 'sahhati-doctors';
const SERVICES_STORAGE_KEY = 'sahhati-services';
const BOOKINGS_STORAGE_KEY = 'sahhati-bookings';
const PRESCRIPTIONS_STORAGE_KEY = 'sahhati-prescriptions';

const defaultSpecialties: Specialty[] = [
  {
    id: 'cardiology',
    name: 'Cardiology',
    arabicName: 'قلب',
    description: 'متابعة القلب والصحة القلبية',
    icon: '❤️',
    active: true,
    order: 1,
  },
  {
    id: 'internal-medicine',
    name: 'Internal Medicine',
    arabicName: 'باطنة',
    description: 'تشخيص وعلاج الأمراض الباطنية',
    icon: '🩺',
    active: true,
    order: 2,
  },
  {
    id: 'dentistry',
    name: 'Dentistry',
    arabicName: 'أسنان',
    description: 'رعاية الأسنان والوقاية',
    icon: '🦷',
    active: true,
    order: 3,
  },
  {
    id: 'pediatrics',
    name: 'Pediatrics',
    arabicName: 'أطفال',
    description: 'رعاية الأطفال والنمو',
    icon: '👶',
    active: true,
    order: 4,
  },
  {
    id: 'dermatology',
    name: 'Dermatology',
    arabicName: 'جلدية',
    description: 'رعاية الجلد والشعر',
    icon: '✨',
    active: true,
    order: 5,
  },
];

const defaultDoctors: Doctor[] = [
  {
    id: 'doc-sarah',
    fullName: 'د. سارة علي',
    specialtyId: 'cardiology',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
    title: 'أخصائية قلب',
    bio: 'طبيبة قلب بخبرة 12 عامًا في متابعة مرضى القلب والضغط.',
    experience: 12,
    rating: 4.9,
    reviews: 224,
    consultationPrice: 180,
    verified: true,
    online: true,
    offline: true,
    availableDates: ['2026-09-25', '2026-09-26', '2026-09-28'],
    timeSlots: ['09:00', '09:30', '10:00', '11:00', '13:30', '15:00'],
  },
  {
    id: 'doc-ahmad',
    fullName: 'د. أحمد النجار',
    specialtyId: 'internal-medicine',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80',
    title: 'طبيب باطنية',
    bio: 'متخصص في الأمراض الباطنية ومتابعة chronic diseases.',
    experience: 10,
    rating: 4.8,
    reviews: 176,
    consultationPrice: 160,
    verified: true,
    online: true,
    offline: true,
    availableDates: ['2026-09-25', '2026-09-27', '2026-09-29'],
    timeSlots: ['08:30', '10:30', '12:00', '14:00', '16:00'],
  },
  {
    id: 'doc-lina',
    fullName: 'د. لينا فواز',
    specialtyId: 'dentistry',
    photo: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=600&q=80',
    title: 'طبيبة أسنان',
    bio: 'متخصصة في علاج الأسنان، التجميل والعناية الوقائية.',
    experience: 8,
    rating: 4.7,
    reviews: 142,
    consultationPrice: 140,
    verified: true,
    online: true,
    offline: true,
    availableDates: ['2026-09-24', '2026-09-26', '2026-09-30'],
    timeSlots: ['09:00', '10:00', '12:30', '14:30'],
  },
  {
    id: 'doc-zain',
    fullName: 'د. زين العابدين',
    specialtyId: 'pediatrics',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    title: 'طبيب أطفال',
    bio: 'رعاية شاملة للرضع والأطفال والوقاية والعلاج.',
    experience: 11,
    rating: 4.9,
    reviews: 260,
    consultationPrice: 170,
    verified: true,
    online: true,
    offline: true,
    availableDates: ['2026-09-25', '2026-09-27', '2026-09-28'],
    timeSlots: ['08:00', '09:30', '11:30', '15:30'],
  },
  {
    id: 'doc-maya',
    fullName: 'د. ميساء تركي',
    specialtyId: 'dermatology',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    title: 'طبيبة جلدية',
    bio: 'متخصصة في العناية الجلدية ومعالجة البشرة وأمراض الشعر.',
    experience: 9,
    rating: 4.8,
    reviews: 188,
    consultationPrice: 150,
    verified: true,
    online: true,
    offline: true,
    availableDates: ['2026-09-24', '2026-09-25', '2026-09-29'],
    timeSlots: ['10:00', '11:00', '13:00', '16:00'],
  },
];

const defaultServices: ServiceOption[] = [
  { id: 'consult-online', doctorId: 'doc-sarah', name: 'كشف أونلاين', duration: 30, price: 180, type: 'online', active: true },
  { id: 'consult-offline', doctorId: 'doc-sarah', name: 'كشف في العيادة', duration: 30, price: 220, type: 'offline', active: true },
  { id: 'followup-online', doctorId: 'doc-sarah', name: 'متابعة', duration: 20, price: 120, type: 'online', active: true },
  { id: 'consult-online-2', doctorId: 'doc-ahmad', name: 'كشف أونلاين', duration: 30, price: 160, type: 'online', active: true },
  { id: 'consult-offline-2', doctorId: 'doc-ahmad', name: 'كشف في العيادة', duration: 30, price: 200, type: 'offline', active: true },
  { id: 'consult-online-3', doctorId: 'doc-lina', name: 'كشف أونلاين', duration: 30, price: 140, type: 'online', active: true },
  { id: 'consult-offline-3', doctorId: 'doc-lina', name: 'كشف في العيادة', duration: 30, price: 180, type: 'offline', active: true },
  { id: 'consult-online-4', doctorId: 'doc-zain', name: 'كشف أونلاين', duration: 30, price: 170, type: 'online', active: true },
  { id: 'consult-offline-4', doctorId: 'doc-zain', name: 'كشف في العيادة', duration: 30, price: 210, type: 'offline', active: true },
  { id: 'consult-online-5', doctorId: 'doc-maya', name: 'كشف أونلاين', duration: 30, price: 150, type: 'online', active: true },
  { id: 'consult-offline-5', doctorId: 'doc-maya', name: 'كشف في العيادة', duration: 30, price: 190, type: 'offline', active: true },
];

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const value = window.localStorage.getItem(key);
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

async function writeCloudRecord(collectionName: 'appointments' | 'prescriptions', id: string, value: object) {
  if (!isFirebaseConfigured || !db) return;
  try {
    await set(ref(db, `${collectionName}/${id}`), value);
  } catch (error) {
    console.error(`Firebase ${collectionName} write failed`, error);
  }
}

export async function syncUserCloudData(userId: string, role: 'PATIENT' | 'DOCTOR') {
  if (!isFirebaseConfigured || !db) return false;
  try {
    const appointmentField = role === 'PATIENT' ? 'patientId' : 'doctorId';
    const appointmentsSnapshot = await get(query(ref(db, 'appointments'), orderByChild(appointmentField), equalTo(userId)));
    const appointmentsData = appointmentsSnapshot.val() as Record<string, Appointment> | null;
    const appointments = Object.values(appointmentsData ?? {});
    writeStorage(BOOKINGS_STORAGE_KEY, appointments);

    if (role === 'PATIENT') {
      const prescriptionsSnapshot = await get(query(ref(db, 'prescriptions'), orderByChild('patientId'), equalTo(userId)));
      const prescriptionsData = prescriptionsSnapshot.val() as Record<string, Prescription> | null;
      writeStorage(PRESCRIPTIONS_STORAGE_KEY, Object.values(prescriptionsData ?? {}));
    }

    return true;
  } catch (error) {
    console.error('Firebase sync failed', error);
    return false;
  }
}

export async function syncCatalogData() {
  if (!isFirebaseConfigured || !db) return false;
  try {
    const [specialtiesSnapshot, doctorsSnapshot, servicesSnapshot] = await Promise.all([
      get(ref(db, 'specialties')),
      get(ref(db, 'doctors')),
      get(ref(db, 'services')),
    ]);
    const specialties = specialtiesSnapshot.val() as Record<string, Specialty> | null;
    const doctors = doctorsSnapshot.val() as Record<string, Doctor> | null;
    const services = servicesSnapshot.val() as Record<string, ServiceOption> | null;
    writeStorage(SPECIALTIES_STORAGE_KEY, Object.values(specialties ?? {}));
    writeStorage(DOCTORS_STORAGE_KEY, Object.values(doctors ?? {}));
    writeStorage(SERVICES_STORAGE_KEY, Object.values(services ?? {}));
    return true;
  } catch (error) {
    console.error('Firebase catalog sync failed', error);
    return false;
  }
}

function ensureSeedData() {
  if (isFirebaseConfigured) return;

  const specialties = readStorage<Specialty[]>(SPECIALTIES_STORAGE_KEY, []);
  const doctors = readStorage<Doctor[]>(DOCTORS_STORAGE_KEY, []);

  if (specialties.length === 0) {
    writeStorage(SPECIALTIES_STORAGE_KEY, defaultSpecialties);
  }

  if (doctors.length === 0) {
    writeStorage(DOCTORS_STORAGE_KEY, defaultDoctors);
  }
}

export function getSpecialties(): Specialty[] {
  ensureSeedData();
  return readStorage<Specialty[]>(SPECIALTIES_STORAGE_KEY, isFirebaseConfigured ? [] : defaultSpecialties)
    .filter((specialty) => specialty.active)
    .sort((a, b) => a.order - b.order);
}

export function getDoctorsBySpecialty(specialtyId?: string): Doctor[] {
  ensureSeedData();
  const doctors = readStorage<Doctor[]>(DOCTORS_STORAGE_KEY, isFirebaseConfigured ? [] : defaultDoctors);

  if (!specialtyId) return doctors.filter((doctor) => doctor.verified);

  return doctors.filter((doctor) => doctor.specialtyId === specialtyId && doctor.verified);
}

export function getDoctorById(doctorId: string): Doctor | undefined {
  ensureSeedData();
  const doctors = readStorage<Doctor[]>(DOCTORS_STORAGE_KEY, isFirebaseConfigured ? [] : defaultDoctors);
  return doctors.find((doctor) => doctor.id === doctorId);
}

export function getDoctorServices(doctorId: string): ServiceOption[] {
  const services = readStorage<ServiceOption[]>(SERVICES_STORAGE_KEY, isFirebaseConfigured ? [] : defaultServices);
  return services.filter(
    (service) => service.doctorId === doctorId && service.active,
  );
}

export function getAppointmentsByUser(userId: string): Appointment[] {
  const bookings = readStorage<Appointment[]>(BOOKINGS_STORAGE_KEY, []);
  return bookings.filter((appointment) => appointment.patientId === userId);
}

export function getAppointmentsByDoctor(doctorId: string): Appointment[] {
  const bookings = readStorage<Appointment[]>(BOOKINGS_STORAGE_KEY, []);
  return bookings.filter((appointment) => appointment.doctorId === doctorId);
}

function subscribeToCollection<T>(collectionName: 'appointments' | 'prescriptions', field: string, userId: string, onChange: (items: T[]) => void) {
  if (!isFirebaseConfigured || !db) {
    onChange([]);
    return () => undefined;
  }

  return onValue(query(ref(db, collectionName), orderByChild(field), equalTo(userId)), (snapshot) => {
    const data = snapshot.val() as Record<string, T> | null;
    onChange(Object.values(data ?? {}));
  });
}

export function subscribeToUserAppointments(userId: string, onChange: (items: Appointment[]) => void) {
  return subscribeToCollection<Appointment>('appointments', 'patientId', userId, onChange);
}

export function subscribeToDoctorAppointments(doctorId: string, onChange: (items: Appointment[]) => void) {
  return subscribeToCollection<Appointment>('appointments', 'doctorId', doctorId, onChange);
}

export function subscribeToPatientPrescriptions(patientId: string, onChange: (items: Prescription[]) => void) {
  return subscribeToCollection<Prescription>('prescriptions', 'patientId', patientId, onChange);
}

export function subscribeToSpecialties(onChange: (items: Specialty[]) => void) {
  if (!isFirebaseConfigured || !db) {
    onChange(getSpecialties());
    return () => undefined;
  }
  return onValue(ref(db, 'specialties'), (snapshot) => {
    const data = snapshot.val() as Record<string, Specialty> | null;
    const specialties = Object.values(data ?? {}).filter((specialty) => specialty.active).sort((a, b) => a.order - b.order);
    writeStorage(SPECIALTIES_STORAGE_KEY, specialties);
    onChange(specialties);
  });
}

export function subscribeToDoctors(onChange: (items: Doctor[]) => void) {
  if (!isFirebaseConfigured || !db) {
    onChange(getDoctorsBySpecialty());
    return () => undefined;
  }
  return onValue(ref(db, 'doctors'), (snapshot) => {
    const data = snapshot.val() as Record<string, Doctor> | null;
    const doctors = Object.values(data ?? {}).filter((doctor) => doctor.verified);
    writeStorage(DOCTORS_STORAGE_KEY, doctors);
    onChange(doctors);
  });
}

export function getPrescriptionsByPatient(patientId: string): Prescription[] {
  const prescriptions = readStorage<Prescription[]>(PRESCRIPTIONS_STORAGE_KEY, []);
  return prescriptions.filter((prescription) => prescription.patientId === patientId);
}

export function createPrescription(payload: {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  diagnosis: string;
  medications: string;
}): Prescription {
  const prescription: Prescription = {
    ...payload,
    id: `rx-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const existing = readStorage<Prescription[]>(PRESCRIPTIONS_STORAGE_KEY, []);
  writeStorage(PRESCRIPTIONS_STORAGE_KEY, [prescription, ...existing]);
  void writeCloudRecord('prescriptions', prescription.id, prescription);
  return prescription;
}

export function createAppointment(payload: {
  patientId: string;
  patientName: string;
  doctorId: string;
  serviceId: string;
  appointmentType: 'online' | 'offline';
  date: string;
  time: string;
  duration: number;
  price: number;
  paymentMethod: PaymentMethod;
  notes: string;
}): Appointment {
  const doctor = getDoctorById(payload.doctorId);
  const specialty = getSpecialties().find((item) => item.id === doctor?.specialtyId);
  const service = getDoctorServices(payload.doctorId).find((item) => item.id === payload.serviceId);

  const existing = readStorage<Appointment[]>(BOOKINGS_STORAGE_KEY, []);
  const appointment: Appointment = {
    id: `apt-${Date.now()}`,
    patientId: payload.patientId,
    doctorId: payload.doctorId,
    specialtyId: doctor?.specialtyId ?? 'internal-medicine',
    serviceId: payload.serviceId,
    serviceName: service?.name ?? 'كشف طبي',
    appointmentType: payload.appointmentType,
    date: payload.date,
    time: payload.time,
    duration: payload.duration,
    price: payload.price,
    status: 'pending_payment',
    paymentStatus: 'pending',
    paymentMethod: payload.paymentMethod,
    notes: payload.notes,
    createdAt: new Date().toISOString(),
    doctorName: doctor?.fullName ?? 'طبيب',
    patientName: payload.patientName,
  };

  const next = [appointment, ...existing];
  writeStorage(BOOKINGS_STORAGE_KEY, next);
  void writeCloudRecord('appointments', appointment.id, appointment);
  return appointment;
}

export function getAppointmentById(id: string): Appointment | undefined {
  return readStorage<Appointment[]>(BOOKINGS_STORAGE_KEY, []).find((item) => item.id === id);
}

export function subscribeToAppointment(appointmentId: string, onChange: (appointment: Appointment | undefined) => void) {
  if (!isFirebaseConfigured || !db) {
    onChange(getAppointmentById(appointmentId));
    return () => undefined;
  }
  return onValue(ref(db, `appointments/${appointmentId}`), (snapshot) => {
    onChange(snapshot.val() as Appointment | undefined);
  });
}

export function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  paymentStatus?: PaymentStatus,
): Appointment | undefined {
  const appointments = readStorage<Appointment[]>(BOOKINGS_STORAGE_KEY, []);
  const index = appointments.findIndex((item) => item.id === id);

  if (index === -1) return undefined;

  appointments[index] = {
    ...appointments[index],
    status,
    paymentStatus: paymentStatus ?? appointments[index].paymentStatus,
  };

  writeStorage(BOOKINGS_STORAGE_KEY, appointments);
  void writeCloudRecord('appointments', appointments[index].id, appointments[index]);
  return appointments[index];
}

export function getAppointmentSummary() {
  const appointments = readStorage<Appointment[]>(BOOKINGS_STORAGE_KEY, []);
  return {
    total: appointments.length,
    pending: appointments.filter((item) => item.status === 'pending_payment').length,
    confirmed: appointments.filter((item) => item.status === 'confirmed').length,
    completed: appointments.filter((item) => item.status === 'completed').length,
  };
}

export function getAvailableDaysForDoctor(doctorId: string): string[] {
  const doctor = getDoctorById(doctorId);
  return doctor?.availableDates ?? [];
}

export function getAvailableSlotsForDoctor(doctorId: string, date: string): string[] {
  const doctor = getDoctorById(doctorId);
  if (!doctor) return [];

  const today = new Date();
  const isFutureDate = date >= today.toISOString().slice(0, 10);
  return isFutureDate ? doctor.timeSlots : [];
}
