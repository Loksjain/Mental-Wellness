import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Smile, Frown, Angry, Zap, Flower2, Target, TrendingUp } from 'lucide-react';
import { useMoodStore, MoodType } from '../../store/useMoodStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../ui/ThemeProvider';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Textarea } from '../ui/Textarea';

const moodOptions: { mood: MoodType; label: string; icon: React.ReactNode; color: string }[] = [
  { mood: 'happy', label: 'Happy', icon: <Smile size={24} />, color: '#FFD93D' },
  { mood: 'excited', label: 'Excited', icon: <Zap size={24} />, color: '#FF6B6B' },
  { mood: 'calm', label: 'Calm', icon: <Heart size={24} />, color: '#81C784' },
  { mood: 'grateful', label: 'Grateful', icon: <Flower2 size={24} />, color: '#BA68C8' },
  { mood: 'sad', label: 'Sad', icon: <Frown size={24} />, color: '#64B5F6' },
  { mood: 'anxious', label: 'Anxious', icon: <Target size={24} />, color: '#FFB74D' },
  { mood: 'angry', label: 'Angry', icon: <Angry size={24} />, color: '#E57373' },
  { mood: 'frustrated', label: 'Frustrated', icon: <TrendingUp size={24} />, color: '#A1887F' },
];

export const HomePage: React.FC = () => {
  const { profile } = useAuthStore();
  const { 
    currentMood, 
    moodHistory, 
    loading, 
    addMoodEntry, 
    fetchMoodHistory,
    setCurrentMood 
  } = useMoodStore();
  const { theme } = useTheme();

  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [description, setDescription] = useState('');
  const [showMoodForm, setShowMoodForm] = useState(false);

  useEffect(() => {
    fetchMoodHistory();
  }, [fetchMoodHistory]);

  const handleMoodSubmission = async () => {
    if (!selectedMood) return;
    
    await addMoodEntry(selectedMood, intensity, description);
    setSelectedMood(null);
    setIntensity(5);
    setDescription('');
    setShowMoodForm(false);
  };

  const todaysMood = moodHistory.find(
    entry => new Date(entry.created_at).toDateString() === new Date().toDateString()
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold" style={{ color: theme.text }}>
          {getGreeting()}, {profile?.display_name}! 🌸
        </h1>
        <p className="text-lg" style={{ color: theme.textSecondary }}>
          How are you feeling today?
        </p>
      </motion.div>

      {/* Today's Mood Check-in */}
      {!todaysMood && (
        <Card className="text-center space-y-6">
          <h2 className="text-2xl font-semibold" style={{ color: theme.text }}>
            Daily Mood Check-in
          </h2>
          
          {!showMoodForm ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {moodOptions.map((option) => (
                  <motion.button
                    key={option.mood}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedMood(option.mood);
                      setCurrentMood(option.mood);
                      setShowMoodForm(true);
                    }}
                    className="p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center space-y-2"
                    style={{
                      borderColor: selectedMood === option.mood ? option.color : `${option.color}50`,
                      backgroundColor: selectedMood === option.mood ? `${option.color}20` : 'transparent',
                    }}
                  >
                    <div style={{ color: option.color }}>
                      {option.icon}
                    </div>
                    <span className="text-sm font-medium" style={{ color: theme.text }}>
                      {option.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 max-w-md mx-auto"
            >
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-2"
                     style={{ backgroundColor: `${moodOptions.find(m => m.mood === selectedMood)?.color}20` }}>
                  <div style={{ color: moodOptions.find(m => m.mood === selectedMood)?.color }}>
                    {moodOptions.find(m => m.mood === selectedMood)?.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold" style={{ color: theme.text }}>
                  Feeling {selectedMood}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                    Intensity (1-10): {intensity}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: theme.primary }}
                  />
                </div>

                <Textarea
                  label="Tell me more about how you're feeling (optional)"
                  placeholder="What's contributing to this mood? Any specific thoughts or events?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />

                <div className="flex space-x-3">
                  <Button
                    onClick={handleMoodSubmission}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Saving...' : 'Check In'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowMoodForm(false)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </Card>
      )}

      {/* Today's AI Response */}
      {todaysMood && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold" style={{ color: theme.text }}>
              Today's Check-in
            </h3>
            <div className="flex items-center space-x-2">
              <div style={{ color: moodOptions.find(m => m.mood === todaysMood.mood_type)?.color }}>
                {moodOptions.find(m => m.mood === todaysMood.mood_type)?.icon}
              </div>
              <span className="font-medium capitalize" style={{ color: theme.text }}>
                {todaysMood.mood_type}
              </span>
            </div>
          </div>
          
          {todaysMood.ai_response && (
            <div className="p-4 rounded-xl" style={{ backgroundColor: `${theme.primary}10` }}>
              <p style={{ color: theme.text }}>{todaysMood.ai_response}</p>
            </div>
          )}

          {todaysMood.description && (
            <div className="space-y-2">
              <h4 className="font-medium" style={{ color: theme.textSecondary }}>Your reflection:</h4>
              <p className="text-sm" style={{ color: theme.text }}>{todaysMood.description}</p>
            </div>
          )}
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center space-y-3">
          <Flower2 size={32} style={{ color: theme.accent }} className="mx-auto" />
          <div>
            <div className="text-2xl font-bold" style={{ color: theme.text }}>
              {profile?.garden_points || 0}
            </div>
            <div className="text-sm" style={{ color: theme.textSecondary }}>
              Garden Points
            </div>
          </div>
        </Card>

        <Card className="text-center space-y-3">
          <Target size={32} style={{ color: theme.primary }} className="mx-auto" />
          <div>
            <div className="text-2xl font-bold" style={{ color: theme.text }}>
              {profile?.current_streak || 0}
            </div>
            <div className="text-sm" style={{ color: theme.textSecondary }}>
              Day Streak
            </div>
          </div>
        </Card>

        <Card className="text-center space-y-3">
          <TrendingUp size={32} style={{ color: theme.secondary }} className="mx-auto" />
          <div>
            <div className="text-2xl font-bold" style={{ color: theme.text }}>
              {profile?.total_check_ins || 0}
            </div>
            <div className="text-sm" style={{ color: theme.textSecondary }}>
              Total Check-ins
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Mood History */}
      {moodHistory.length > 1 && (
        <Card className="space-y-4">
          <h3 className="text-xl font-semibold" style={{ color: theme.text }}>
            Recent Mood History
          </h3>
          <div className="space-y-3">
            {moodHistory.slice(1, 4).map((entry) => {
              const moodOption = moodOptions.find(m => m.mood === entry.mood_type);
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-3 p-3 rounded-lg"
                  style={{ backgroundColor: `${theme.primary}05` }}
                >
                  <div style={{ color: moodOption?.color }}>
                    {moodOption?.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium capitalize" style={{ color: theme.text }}>
                        {entry.mood_type}
                      </span>
                      <span className="text-sm" style={{ color: theme.textSecondary }}>
                        • Intensity {entry.intensity}/10
                      </span>
                    </div>
                    <div className="text-sm" style={{ color: theme.textSecondary }}>
                      {new Date(entry.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};