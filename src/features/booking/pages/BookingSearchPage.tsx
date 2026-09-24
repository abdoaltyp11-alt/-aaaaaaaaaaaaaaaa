import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Doctor, getDoctorsBySpecialty, getSpecialties, Specialty, subscribeToDoctors, subscribeToSpecialties } from '@/services/bookingData';

export default function BookingSearchPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>(() => getSpecialties());
  const [allDoctors, setAllDoctors] = useState<Doctor[]>(() => getDoctorsBySpecialty());
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSpecialty = searchParams.get('specialty') ?? '';
  const requestedSpecialtyId = specialties.find(
    (specialty) => specialty.id === requestedSpecialty || specialty.arabicName === requestedSpecialty,
  )?.id ?? '';
  const [selectedSpecialty, setSelectedSpecialty] = useState(requestedSpecialtyId);
  const [query, setQuery] = useState('');

  useEffect(() => subscribeToSpecialties(setSpecialties), []);
  useEffect(() => subscribeToDoctors(setAllDoctors), []);
  useEffect(() => {
    const specialtyId = specialties.find((specialty) => specialty.id === requestedSpecialty || specialty.arabicName === requestedSpecialty)?.id;
    if (specialtyId) setSelectedSpecialty(specialtyId);
  }, [requestedSpecialty, specialties]);

  const doctors = useMemo(() => {
    const filtered = allDoctors.filter((doctor) => !selectedSpecialty || doctor.specialtyId === selectedSpecialty);

    if (!query.trim()) return filtered;

    return filtered.filter((doctor) =>
      doctor.fullName.toLowerCase().includes(query.toLowerCase()) ||
      doctor.title.toLowerCase().includes(query.toLowerCase()),
    );
  }, [allDoctors, selectedSpecialty, query]);

  return (
    <div className="app-shell px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link to="/patient" className="btn-secondary">رجوع للوحة المريض</Link>
          <Link to="/booking/appointments" className="btn-secondary">حجوزاتي</Link>
        </div>
        <div className="mb-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-700">احجز موعدك</p>
              <h1 className="mt-2 text-3xl font-black text-slate-900">ابحث عن الطبيب المناسب</h1>
            </div>

            <div className="w-full max-w-md">
              <label className="label">البحث</label>
              <input
                className="input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ابحث باسم الطبيب أو تخصصه"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedSpecialty('');
                setSearchParams({});
              }}
              className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                selectedSpecialty === ''
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50'
              }`}
            >
              كل التخصصات
            </button>
            {specialties.map((specialty) => (
              <button
                key={specialty.id}
                type="button"
                onClick={() => {
                  setSelectedSpecialty(specialty.id);
                  setSearchParams({ specialty: specialty.id });
                }}
                className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                  selectedSpecialty === specialty.id
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50'
                }`}
              >
                {specialty.icon} {specialty.arabicName}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {doctors.length > 0 ? (
            doctors.map((doctor) => (
              <div key={doctor.id} className="card overflow-hidden">
                <div className="flex items-center gap-4 p-5">
                  <img src={doctor.photo} alt={doctor.fullName} className="h-16 w-16 rounded-full object-cover" />
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{doctor.fullName}</h2>
                    <p className="text-sm text-slate-500">{doctor.title}</p>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <div className="mb-3 flex items-center justify-between text-sm text-slate-600">
                    <span>⭐ {doctor.rating}</span>
                    <span>{doctor.reviews} تقييم</span>
                  </div>

                  <div className="mb-3 flex items-center justify-between text-sm text-slate-600">
                    <span>خبرة: {doctor.experience} سنة</span>
                    <span>{doctor.online ? 'متاح أونلاين' : 'غير متاح'}</span>
                  </div>

                  <div className="mb-4 flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-sm">
                    <span className="text-slate-500">سعر الكشف</span>
                    <span className="font-bold text-brand-700">{doctor.consultationPrice} جنيه مصري</span>
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/booking/doctor/${doctor.id}`} className="btn-secondary flex-1">
                      عرض الملف
                    </Link>
                    <Link to={`/booking/checkout/${doctor.id}`} className="btn-primary flex-1">
                      احجز موعد
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="card col-span-full p-8 text-center text-slate-600">
              لا توجد أطباء متاحة في هذا التخصص حالياً.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
