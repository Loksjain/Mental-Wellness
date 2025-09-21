import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  garden_points: number;
  current_streak: number;
  total_check_ins: number;
  created_at: string;
  updated_at: string;
}

export interface MoodEntry {
  id: string;
  user_id: string;
  mood_type: string;
  intensity: number;
  description?: string;
  ai_response?: string;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  mood_at_time?: string;
  ai_insights?: string;
  created_at: string;
  updated_at: string;
}

export interface GardenItem {
  id: string;
  user_id: string;
  item_type: string;
  item_name: string;
  position_x: number;
  position_y: number;
  growth_stage: number;
  unlocked_at: string;
}

export interface PeerStory {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category?: string;
  is_moderated: boolean;
  is_approved: boolean;
  upvotes: number;
  created_at: string;
}

export interface CBTExercise {
  id: string;
  title: string;
  description: string;
  category: string;
  instructions: string;
  duration_minutes: number;
  difficulty_level: number;
}

export interface UserExerciseCompletion {
  id: string;
  user_id: string;
  exercise_id: string;
  rating?: number;
  notes?: string;
  completed_at: string;
}