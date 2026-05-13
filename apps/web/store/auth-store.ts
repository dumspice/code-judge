import { create } from 'zustand';
import { authApi, type UserProfile } from '@/services/auth.apis';
import { setOnUnauthorizedHandler } from '@/services/api-client';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
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
      set({ user: null, loading: false });
      window.location.replace('/login');
    }
  },
}));

// Đăng ký handler với api-client: khi refresh thất bại (session hết hoàn toàn),
// tự động logout và đưa về trang login.
setOnUnauthorizedHandler(() => {
  const { user, logout } = useAuthStore.getState();
  // Chỉ trigger nếu đang có user (tránh lặp khi chưa login)
  if (user) {
    logout();
  } else {
    // User chưa có trong store nhưng có cookie → xóa state và redirect
    useAuthStore.setState({ user: null, loading: false });
    window.location.replace('/login');
  }
});
