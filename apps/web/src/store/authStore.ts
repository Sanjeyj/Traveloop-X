import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthStore {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  getAuthHeader: () => Record<string, string>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      clearAuth: () => set({ token: null, user: null, isAuthenticated: false }),
      getAuthHeader: () => {
        const token = get().token;
        if (!token) return {} as Record<string, string>;
        return { Authorization: `Bearer ${token}` } as Record<string, string>;
      },
    }),
    { name: 'traveloop-auth-store' }
  )
);
