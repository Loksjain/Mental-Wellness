import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wind, 
  Brain, 
  Heart, 
  Target, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle,
  Star,
  Zap,
  Flower
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useMoodStore } from '../../store/useMoodStore';
import { useTheme } from '../ui/ThemeProvider';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { supabase } from '../../lib/supabase';

interface Exercise {
  id: string;
  title: string;
  description: string;
  category: 'breathing' | 'grounding' | 'cbt' | 'mindfulness';
  duration_minutes: number;
  difficulty_level: number;
  instructions: string[];
  icon: React.ReactNode;
}

interface ExerciseCompletion {
  id: string;
  exercise_id: string;
  rating?: number;
  notes?: string;
  completed_at: string;
}

const exercises: Exercise[] = [
  {
    id: 'box-breathing',
    title: '4-7-8 Breathing',
    description: 'A calming breathing technique to reduce anxiety and promote relaxation',
    category: 'breathing',
    duration_minutes: 5,
    difficulty_level: 1,
    instructions: [
      'Sit comfortably with your back straight',
      'Exhale completely through your mouth',
      'Inhale through your nose for 4 counts',
      'Hold your breath for 7 counts',
      'Exhale through your mouth for 8 counts',
      'Repeat this cycle 3-4 times'
    ],
    icon: <Wind size={24} />,
  },
  {
    id: '5-4-3-2-1-grounding',
    title: '5-4-3-2-1 Grounding',
    description: 'Use your senses to ground yourself in the present moment',
    category: 'grounding',
    duration_minutes: 10,
    difficulty_level: 1,
    instructions: [
      'Name 5 things you can see around you',
      'Name 4 things you can touch',
      'Name 3 things you can hear',
      'Name 2 things you can smell',
      'Name 1 thing you can taste',
      'Take a deep breath and notice how you feel'
    ],
    icon: <Target size={24} />,
  },
  {
    id: 'thought-challenging',
    title: 'Thought Challenging',
    description: 'Challenge negative thoughts with evidence-based questions',
    category: 'cbt',
    duration_minutes: 15,
    difficulty_level: 2,
    instructions: [
      'Identify the negative thought',
      'Ask: Is this thought realistic?',
      'Ask: What evidence supports this thought?',
      'Ask: What evidence contradicts this thought?',
      'Ask: What would I tell a friend in this situation?',
      'Create a more balanced, realistic thought'
    ],
    icon: <Brain size={24} />,
  },
  {
    id: 'body-scan',
    title: 'Progressive Body Scan',
    description: 'Release tension by systematically relaxing each part of your body',
    category: 'mindfulness',
    duration_minutes: 20,
    difficulty_level: 2,
    instructions: [
      'Lie down comfortably and close your eyes',
      'Start with your toes - tense for 5 seconds, then relax',
      'Move to your feet, calves, thighs, continuing upward',
      'Tense and relax each muscle group',
      'Notice the contrast between tension and relaxation',
      'End with your face and scalp, then rest in full relaxation'
    ],
    icon: <Heart size={24} />,
  },
  {
    id: 'loving-kindness',
    title: 'Loving-Kindness Meditation',
    description: 'Cultivate compassion for yourself and others',
    category: 'mindfulness',
    duration_minutes: 15,
    difficulty_level: 2,
    instructions: [
      'Sit comfortably and close your eyes',
      'Start with yourself: "May I be happy, may I be healthy, may I be at peace"',
      'Think of a loved one and repeat the phrases for them',
      'Think of a neutral person and extend the same wishes',
      'Think of someone difficult and try to extend compassion',
      'End by extending these wishes to all beings everywhere'
    ],
    icon: <Flower size={24} />,
  },
];

export const ToolkitPage: React.FC = () => {
  const { user, profile } = useAuthStore();
  const { currentMood } = useMoodStore();
  const { theme } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [exerciseStep, setExerciseStep] = useState(0);
  const [isExerciseActive, setIsExerciseActive] = useState(false);
  const [timer, setTimer] = useState(0);
  const [completions, setCompletions] = useState<ExerciseCompletion[]>([]);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (user) {
      fetchCompletions();
    }
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isExerciseActive) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isExerciseActive]);

  const fetchCompletions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_exercise_completions')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    if (data && !error) {
      setCompletions(data);
    }
  };

  const categories = [
    { id: 'all', label: 'All Exercises', icon: <Star size={20} /> },
    { id: 'breathing', label: 'Breathing', icon: <Wind size={20} /> },
    { id: 'grounding', label: 'Grounding', icon: <Target size={20} /> },
    { id: 'cbt', label: 'CBT', icon: <Brain size={20} /> },
    { id: 'mindfulness', label: 'Mindfulness', icon: <Heart size={20} /> },
  ];

  const filteredExercises = selectedCategory === 'all' 
    ? exercises 
    : exercises.filter(ex => ex.category === selectedCategory);

  const getRecommendedExercises = () => {
    const moodRecommendations = {
      anxious: ['box-breathing', '5-4-3-2-1-grounding'],
      sad: ['loving-kindness', 'body-scan'],
      angry: ['box-breathing', 'thought-challenging'],
      frustrated: ['body-scan', 'thought-challenging'],
      happy: ['loving-kindness'],
      excited: ['body-scan'],
      calm: ['loving-kindness'],
      grateful: ['loving-kindness'],
    };

    const recommended = moodRecommendations[currentMood as keyof typeof moodRecommendations] || [];
    return exercises.filter(ex => recommended.includes(ex.id));
  };

  const startExercise = (exercise: Exercise) => {
    setActiveExercise(exercise);
    setExerciseStep(0);
    setTimer(0);
    setIsExerciseActive(true);
  };

  const completeExercise = async () => {
    if (!activeExercise || !user) return;

    setIsExerciseActive(false);
    setShowRating(true);
  };

  const submitCompletion = async () => {
    if (!activeExercise || !user) return;

    const { data, error } = await supabase
      .from('user_exercise_completions')
      .insert([{
        user_id: user.id,
        exercise_id: activeExercise.id,
        rating,
        notes: notes.trim() || null,
      }])
      .select()
      .single();

    if (data && !error) {
      setCompletions(prev => [data, ...prev]);
      
      // Award points
      if (profile) {
        await supabase
          .from('users')
          .update({
            garden_points: (profile.garden_points || 0) + 8,
          })
          .eq('id', user.id);
      }
    }

    setActiveExercise(null);
    setShowRating(false);
    setRating(5);
    setNotes('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (level: number) => {
    const colors = ['#4CAF50', '#FF9800', '#F44336'];
    return colors[level - 1] || colors[0];
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      breathing: '#64B5F6',
      grounding: '#81C784',
      cbt: '#BA68C8',
      mindfulness: '#FFB74D',
    };
    return colors[category as keyof typeof colors] || theme.primary;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: theme.text }}>
          Wellness Toolkit 🧘‍♀️
        </h1>
        <p style={{ color: theme.textSecondary }}>
          Evidence-based exercises to support your mental health
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="text-center space-y-2">
          <CheckCircle size={24} style={{ color: theme.primary }} className="mx-auto" />
          <div className="text-2xl font-bold" style={{ color: theme.text }}>
            {completions.length}
          </div>
          <div className="text-sm" style={{ color: theme.textSecondary }}>
            Completed
          </div>
        </Card>

        <Card className="text-center space-y-2">
          <Clock size={24} style={{ color: theme.accent }} className="mx-auto" />
          <div className="text-2xl font-bold" style={{ color: theme.text }}>
            {Math.round(completions.reduce((total, comp) => {
              const exercise = exercises.find(ex => ex.id === comp.exercise_id);
              return total + (exercise?.duration_minutes || 0);
            }, 0))}
          </div>
          <div className="text-sm" style={{ color: theme.textSecondary }}>
            Minutes Practiced
          </div>
        </Card>

        <Card className="text-center space-y-2">
          <Zap size={24} style={{ color: theme.secondary }} className="mx-auto" />
          <div className="text-2xl font-bold" style={{ color: theme.text }}>
            {new Set(completions.map(c => c.exercise_id)).size}
          </div>
          <div className="text-sm" style={{ color: theme.textSecondary }}>
            Unique Exercises
          </div>
        </Card>

        <Card className="text-center space-y-2">
          <Star size={24} style={{ color: '#FFD93D' }} className="mx-auto" />
          <div className="text-2xl font-bold" style={{ color: theme.text }}>
            {completions.length > 0 
              ? (completions.reduce((sum, comp) => sum + (comp.rating || 0), 0) / completions.length).toFixed(1)
              : '0'
            }
          </div>
          <div className="text-sm" style={{ color: theme.textSecondary }}>
            Avg Rating
          </div>
        </Card>
      </div>

      {/* Mood-Based Recommendations */}
      {currentMood && getRecommendedExercises().length > 0 && (
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: theme.text }}>
            Recommended for your current mood: <span className="capitalize">{currentMood}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getRecommendedExercises().map((exercise) => (
              <motion.div
                key={exercise.id}
                whileHover={{ scale: 1.02 }}
                className="p-4 rounded-lg border-2 cursor-pointer"
                style={{
                  borderColor: getCategoryColor(exercise.category),
                  backgroundColor: `${getCategoryColor(exercise.category)}10`,
                }}
                onClick={() => startExercise(exercise)}
              >
                <div className="flex items-center space-x-3">
                  <div style={{ color: getCategoryColor(exercise.category) }}>
                    {exercise.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: theme.text }}>
                      {exercise.title}
                    </h3>
                    <p className="text-sm" style={{ color: theme.textSecondary }}>
                      {exercise.duration_minutes} min • Level {exercise.difficulty_level}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="flex items-center space-x-2"
          >
            {category.icon}
            <span>{category.label}</span>
          </Button>
        ))}
      </div>

      {/* Exercises Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredExercises.map((exercise) => {
          const completionCount = completions.filter(c => c.exercise_id === exercise.id).length;
          
          return (
            <motion.div
              key={exercise.id}
              whileHover={{ scale: 1.02 }}
              layout
            >
              <Card hover className="h-full flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div style={{ color: getCategoryColor(exercise.category) }}>
                    {exercise.icon}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 rounded-full"
                          style={{ 
                            backgroundColor: `${getDifficultyColor(exercise.difficulty_level)}20`,
                            color: getDifficultyColor(exercise.difficulty_level)
                          }}>
                      Level {exercise.difficulty_level}
                    </span>
                    {completionCount > 0 && (
                      <span className="text-xs px-2 py-1 rounded-full"
                            style={{ 
                              backgroundColor: `${theme.primary}20`,
                              color: theme.primary
                            }}>
                        {completionCount}x
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-2" style={{ color: theme.text }}>
                  {exercise.title}
                </h3>
                
                <p className="text-sm mb-4 flex-1" style={{ color: theme.textSecondary }}>
                  {exercise.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm" style={{ color: theme.textSecondary }}>
                    <Clock size={14} />
                    <span>{exercise.duration_minutes} min</span>
                  </div>
                  <Button size="sm" onClick={() => startExercise(exercise)}>
                    Start
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Exercise Modal */}
      <AnimatePresence>
        {activeExercise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <Card className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div style={{ color: getCategoryColor(activeExercise.category) }}>
                      {activeExercise.icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold" style={{ color: theme.text }}>
                        {activeExercise.title}
                      </h2>
                      <p className="text-sm" style={{ color: theme.textSecondary }}>
                        {activeExercise.duration_minutes} minutes • Level {activeExercise.difficulty_level}
                      </p>
                    </div>
                  </div>
                  <div className="text-2xl font-mono" style={{ color: theme.primary }}>
                    {formatTime(timer)}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold" style={{ color: theme.text }}>
                      Step {exerciseStep + 1} of {activeExercise.instructions.length}
                    </h3>
                    <div className="w-32 h-2 rounded-full" style={{ backgroundColor: `${theme.primary}20` }}>
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          backgroundColor: theme.primary,
                          width: `${((exerciseStep + 1) / activeExercise.instructions.length) * 100}%`
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-6 rounded-lg text-center" 
                       style={{ backgroundColor: `${theme.primary}10` }}>
                    <p className="text-lg leading-relaxed" style={{ color: theme.text }}>
                      {activeExercise.instructions[exerciseStep]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-4">
                  {exerciseStep > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setExerciseStep(prev => prev - 1)}
                    >
                      Previous
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => setIsExerciseActive(!isExerciseActive)}
                    className="flex items-center space-x-2"
                  >
                    {isExerciseActive ? <Pause size={16} /> : <Play size={16} />}
                    <span>{isExerciseActive ? 'Pause' : 'Resume'}</span>
                  </Button>

                  {exerciseStep < activeExercise.instructions.length - 1 ? (
                    <Button onClick={() => setExerciseStep(prev => prev + 1)}>
                      Next
                    </Button>
                  ) : (
                    <Button onClick={completeExercise}>
                      Complete
                    </Button>
                  )}
                </div>

                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveExercise(null);
                      setIsExerciseActive(false);
                    }}
                  >
                    Exit Exercise
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
            >
              <Card className="space-y-6 text-center">
                <div>
                  <CheckCircle size={48} style={{ color: theme.primary }} className="mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2" style={{ color: theme.text }}>
                    Exercise Complete!
                  </h2>
                  <p style={{ color: theme.textSecondary }}>
                    How did this exercise feel for you?
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                      Rating (1-10)
                    </label>
                    <div className="flex justify-center space-x-2">
                      {[...Array(10)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setRating(i + 1)}
                          className="w-8 h-8 rounded-full transition-colors"
                          style={{
                            backgroundColor: rating >= i + 1 ? theme.primary : `${theme.primary}20`,
                            color: rating >= i + 1 ? 'white' : theme.primary,
                          }}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                      Notes (optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="How are you feeling? Any insights?"
                      className="w-full px-3 py-2 rounded-lg border-2 transition-colors resize-none"
                      style={{
                        borderColor: theme.primary,
                        backgroundColor: theme.background,
                        color: theme.text,
                      }}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button onClick={submitCompletion} className="flex-1">
                    Save & Continue
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRating(false);
                      setActiveExercise(null);
                    }}
                    className="flex-1"
                  >
                    Skip
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};