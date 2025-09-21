import { create } from 'zustand';
import { supabase, MoodEntry } from '../lib/supabase';
import { getAIResponse } from '../lib/ai';

export type MoodType = 'happy' | 'sad' | 'anxious' | 'angry' | 'calm' | 'excited' | 'frustrated' | 'grateful';

interface MoodState {
  currentMood: MoodType | null;
  moodHistory: MoodEntry[];
  loading: boolean;
  setCurrentMood: (mood: MoodType) => void;
  addMoodEntry: (mood: MoodType, intensity: number, description?: string) => Promise<void>;
  fetchMoodHistory: () => Promise<void>;
  getMoodTheme: () => {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
}

const moodThemes = {
  happy: {
    primary: '#FFD93D',
    secondary: '#FFF176',
    accent: '#FF8A65',
    background: '#FFFEF7',
    surface: '#FFF9C4',
    text: '#333333',
    textSecondary: '#666666',
  },
  excited: {
    primary: '#FF6B6B',
    secondary: '#FFE066',
    accent: '#4ECDC4',
    background: '#FFF8F8',
    surface: '#FFE5E5',
    text: '#333333',
    textSecondary: '#666666',
  },
  calm: {
    primary: '#81C784',
    secondary: '#A5D6A7',
    accent: '#64B5F6',
    background: '#F1F8E9',
    surface: '#E8F5E8',
    text: '#2E7D32',
    textSecondary: '#558B2F',
  },
  grateful: {
    primary: '#BA68C8',
    secondary: '#CE93D8',
    accent: '#FFB74D',
    background: '#F3E5F5',
    surface: '#E1BEE7',
    text: '#4A148C',
    textSecondary: '#7B1FA2',
  },
  sad: {
    primary: '#64B5F6',
    secondary: '#90CAF9',
    accent: '#81C784',
    background: '#E3F2FD',
    surface: '#BBDEFB',
    text: '#1565C0',
    textSecondary: '#1976D2',
  },
  anxious: {
    primary: '#FFB74D',
    secondary: '#FFCC02',
    accent: '#81C784',
    background: '#FFF3E0',
    surface: '#FFE0B2',
    text: '#E65100',
    textSecondary: '#F57C00',
  },
  angry: {
    primary: '#E57373',
    secondary: '#FFAB91',
    accent: '#81C784',
    background: '#FFEBEE',
    surface: '#FFCDD2',
    text: '#C62828',
    textSecondary: '#D32F2F',
  },
  frustrated: {
    primary: '#A1887F',
    secondary: '#BCAAA4',
    accent: '#81C784',
    background: '#EFEBE9',
    surface: '#D7CCC8',
    text: '#5D4037',
    textSecondary: '#6D4C41',
  },
};

export const useMoodStore = create<MoodState>((set, get) => ({
  currentMood: null,
  moodHistory: [],
  loading: false,

  setCurrentMood: (mood) => set({ currentMood: mood }),

  addMoodEntry: async (mood, intensity, description) => {
    set({ loading: true });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Generate AI response using the new service
    const { text: aiResponse } = await getAIResponse(`I am feeling ${mood} with an intensity of ${intensity}/10. ${description || ''}`, 'mood', { mood });

    const { data, error } = await supabase
      .from('mood_entries')
      .insert([
        {
          user_id: user.id,
          mood_type: mood,
          intensity,
          description,
          ai_response: aiResponse,
        },
      ])
      .select()
      .single();

    if (data && !error) {
      set((state) => ({
        currentMood: mood,
        moodHistory: [data, ...state.moodHistory],
        loading: false,
      }));

      // Update garden points
      await supabase
        .from('profiles')
        .update({
          garden_points: supabase.sql`garden_points + 5`,
          total_check_ins: supabase.sql`total_check_ins + 1`,
        })
        .eq('id', user.id);
    } else {
      set({ loading: false });
    }
  },

  fetchMoodHistory: async () => {
    set({ loading: true });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (data && !error) {
      set({
        moodHistory: data,
        currentMood: data[0]?.mood_type as MoodType || null,
        loading: false,
      });
    } else {
      set({ loading: false });
    }
  },

  getMoodTheme: () => {
    const { currentMood } = get();
    return moodThemes[currentMood || 'calm'];
  },
}));