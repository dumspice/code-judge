import { create } from 'zustand';
import { authApi, clearTokens, type UserProfile } from '@/services/auth.apis';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  refreshUser: async () => {
    set({ loading: true });
    try {
      const profile = await authApi.me();
      set({ user: profile, loading: false });
    } catch (error) {
      set({ user: null, loading: false });
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      clearTokens();
      set({ user: null, loading: false });

      // optional nhưng nên có
      window.location.replace('/');
    }
  },
}));
