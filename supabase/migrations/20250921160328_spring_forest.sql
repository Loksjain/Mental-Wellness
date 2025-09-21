/*
  # Mental Health & Wellness App Database Schema

  1. New Tables
    - `profiles` - Extended user profiles with wellness data
      - `id` (uuid, references auth.users)
      - `username` (text, unique)
      - `display_name` (text)
      - `avatar_url` (text)
      - `garden_points` (integer, default 0)
      - `current_streak` (integer, default 0)
      - `total_check_ins` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `mood_entries` - Daily mood check-ins
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `mood_type` (text) - happy, sad, anxious, angry, calm, excited, etc.
      - `intensity` (integer, 1-10)
      - `description` (text, optional)
      - `ai_response` (text) - Generated supportive message
      - `created_at` (timestamp)

    - `journal_entries` - User journal entries
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `content` (text)
      - `mood_at_time` (text)
      - `ai_insights` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `garden_items` - Gamification elements
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `item_type` (text) - plant, decoration, etc.
      - `item_name` (text)
      - `position_x` (integer)
      - `position_y` (integer)
      - `growth_stage` (integer, default 1)
      - `unlocked_at` (timestamp)

    - `peer_stories` - Anonymous peer support stories
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `content` (text)
      - `category` (text)
      - `is_moderated` (boolean, default false)
      - `is_approved` (boolean, default false)
      - `upvotes` (integer, default 0)
      - `created_at` (timestamp)

    - `cbt_exercises` - CBT and wellness exercises
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `category` (text) - breathing, grounding, cognitive, etc.
      - `instructions` (text)
      - `duration_minutes` (integer)
      - `difficulty_level` (integer, 1-3)

    - `user_exercise_completions` - Track completed exercises
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `exercise_id` (uuid, references cbt_exercises)
      - `rating` (integer, 1-5)
      - `notes` (text)
      - `completed_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Special policies for peer stories with moderation
</sql>

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE,
  display_name text,
  avatar_url text,
  garden_points integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  total_check_ins integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create mood_entries table
CREATE TABLE IF NOT EXISTS mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mood_type text NOT NULL,
  intensity integer CHECK (intensity >= 1 AND intensity <= 10) NOT NULL,
  description text,
  ai_response text,
  created_at timestamptz DEFAULT now()
);

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  mood_at_time text,
  ai_insights text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create garden_items table
CREATE TABLE IF NOT EXISTS garden_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_type text NOT NULL,
  item_name text NOT NULL,
  position_x integer DEFAULT 0,
  position_y integer DEFAULT 0,
  growth_stage integer DEFAULT 1,
  unlocked_at timestamptz DEFAULT now()
);

-- Create peer_stories table
CREATE TABLE IF NOT EXISTS peer_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text,
  is_moderated boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  upvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create cbt_exercises table
CREATE TABLE IF NOT EXISTS cbt_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  instructions text NOT NULL,
  duration_minutes integer DEFAULT 5,
  difficulty_level integer CHECK (difficulty_level >= 1 AND difficulty_level <= 3) DEFAULT 1
);

-- Create user_exercise_completions table
CREATE TABLE IF NOT EXISTS user_exercise_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_id uuid REFERENCES cbt_exercises(id) ON DELETE CASCADE NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  notes text,
  completed_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exercise_completions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Mood entries policies
CREATE POLICY "Users can manage own mood entries"
  ON mood_entries FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Journal entries policies
CREATE POLICY "Users can manage own journal entries"
  ON journal_entries FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Garden items policies
CREATE POLICY "Users can manage own garden items"
  ON garden_items FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Peer stories policies
CREATE POLICY "Users can insert own stories"
  ON peer_stories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view approved stories"
  ON peer_stories FOR SELECT
  TO authenticated
  USING (is_approved = true OR auth.uid() = user_id);

CREATE POLICY "Users can update own stories"
  ON peer_stories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Exercise completions policies
CREATE POLICY "Users can manage own exercise completions"
  ON user_exercise_completions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- CBT exercises are public (read-only)
ALTER TABLE cbt_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view exercises"
  ON cbt_exercises FOR SELECT
  TO authenticated
  USING (true);

-- Insert sample CBT exercises
INSERT INTO cbt_exercises (title, description, category, instructions, duration_minutes, difficulty_level)
VALUES 
  ('Deep Breathing', 'Simple breathing exercise to reduce anxiety and promote calm', 'breathing', 'Inhale slowly through your nose for 4 counts, hold for 4 counts, exhale through your mouth for 6 counts. Repeat 5-10 times.', 5, 1),
  ('5-4-3-2-1 Grounding', 'Grounding technique to manage anxiety and panic', 'grounding', 'Name 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, 1 thing you can taste.', 10, 1),
  ('Thought Record', 'Challenge negative thought patterns', 'cognitive', 'Write down the negative thought, identify the emotion, examine the evidence, and create a balanced alternative thought.', 15, 2),
  ('Progressive Muscle Relaxation', 'Reduce physical tension and stress', 'relaxation', 'Tense and relax each muscle group for 5 seconds, starting from your toes and working up to your head.', 20, 2),
  ('Mindful Observation', 'Practice present-moment awareness', 'mindfulness', 'Choose an object and observe it for 3 minutes, noting its colors, textures, shapes, and other details without judgment.', 3, 1);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();