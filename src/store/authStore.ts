import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppRole,
  AuthUser,
  UserProfile,
} from "@/features/auth/types/auth";

interface AuthStore {
  user: AuthUser | null;
  profile: UserProfile | null;
  role: AppRole | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setRole: (role: AppRole | null) => void;
  setIsLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      role: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setRole: (role) => set({ role }),
      setIsLoading: (isLoading) => set({ isLoading }),
      clearAuth: () =>
        set({ user: null, profile: null, role: null, isLoading: false }),
    }),
    {
      name: "sihuni-auth",
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        role: state.role,
      }),
    },
  ),
);
