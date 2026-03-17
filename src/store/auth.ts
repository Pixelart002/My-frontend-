import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@/types";

interface AuthState {
 user: UserProfile | null;
 isAuthenticated: boolean;
 isLoading: boolean;
 setUser: (user: UserProfile | null) => void;
 setLoading: (loading: boolean) => void;
 logout: () => void;
}

export const useAuthStore = create < AuthState > ()(
 persist(
  (set) => ({
   user: null,
   isAuthenticated: false,
   isLoading: false,
   
   setUser: (user) =>
    set({ user, isAuthenticated: !!user }),
   
   setLoading: (isLoading) => set({ isLoading }),
   
   logout: () =>
    set({ user: null, isAuthenticated: false }),
  }),
  {
   name: "ms-auth",
   partialize: (state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
   }),
  }
 )
);