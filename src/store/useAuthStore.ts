import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

// Based on usage in other components (HomePage, Navbar, etc.)
export interface Profile {
  id: string;
  display_name?: string;
  garden_points?: number;
  // any other fields from your 'users' table
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  setSession: (session) => {
    set({ session, user: session?.user ?? null });
  },
  setProfile: (profile) => set({ profile }),
  signOut: async () => {
    await supabase.auth.signOut();
    // The onAuthStateChange listener in App.tsx will handle setting state to null
  },
}));