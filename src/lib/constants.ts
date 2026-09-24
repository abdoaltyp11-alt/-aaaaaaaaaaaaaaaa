export const APP_NAME = 'صحيحتي';
export const INSTAPAY_NUMBER = '01120362974';

export const ROLE_OPTIONS = [
  { value: 'PATIENT', label: 'مريض' },
  { value: 'DOCTOR', label: 'طبيب' },
  { value: 'CONSULTANT', label: 'استشاري' },
  { value: 'NURSE', label: 'ممرض' },
  { value: 'ADMIN', label: 'إدارة' },
] as const;

export const BASE_PATHS: Record<string, string> = {
  PATIENT: '/patient',
  DOCTOR: '/doctor',
  CONSULTANT: '/consultant',
  NURSE: '/nurse',
  ADMIN: '/admin',
};
