export interface AppUser {
  id: string;
  nama: string;
  email: string;
  role: 'manager' | 'viewer';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserPayload {
  nama: string;
  email: string;
  password: string;
  role: 'manager' | 'viewer';
}

export interface UpdateUserPayload {
  nama?: string;
  email?: string;
  role?: 'manager' | 'viewer';
}
