export type Role = 'PATIENT' | 'DOCTOR' | 'CONSULTANT' | 'NURSE' | 'ADMIN';

export type User = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  avatarUrl?: string;
};

export type AuthSession = {
  user: User;
  token: string;
  verificationCode?: string;
};

export type AuthStep = 'account' | 'profile' | 'role';

export type RegisterPayload = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  avatarUrl?: string;
};
