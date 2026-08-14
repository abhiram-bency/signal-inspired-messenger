import { create } from 'zustand';
import { fetchApiWithCredentials } from '@/lib/api';

export interface User {
  id: string;
  username: string | null;
  phone: string | null;
  display_name: string;
  avatar_url: string | null;
  is_online: boolean;
  last_seen_at: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  restoreSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  restoreSession: async () => {
    try {
      set({ isLoading: true });
      const res = await fetchApiWithCredentials<{ data: User }>('/auth/me');
      if (res && res.data) {
        set({ user: res.data, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
  logout: async () => {
    try {
      await fetchApiWithCredentials('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  }
}));
