// Profile = User dari backend /auth/me
export interface Profile {
  id: string;
  nama: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
