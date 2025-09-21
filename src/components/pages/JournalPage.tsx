import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Calendar, Search, Filter, Edit3, Trash2, Save, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useMoodStore } from '../../store/useMoodStore';
import { useTheme } from '../ui/ThemeProvider';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { supabase, MoodEntry } from '../../lib/supabase';
import { format, isToday, isYesterday, startOfWeek, endOfWeek } from 'date-fns';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood_at_time?: string;
  ai_insights?: string;
  created_at: string;
  updated_at: string;
}

export const JournalPage: React.FC = () => {
  const { user, profile } = useAuthStore();
  const { currentMood } = useMoodStore();
  const { theme } = useTheme();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMood, setFilterMood] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  const fetchEntries = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setEntries(data);
    }
    setLoading(false);
  };

  const handleCreateEntry = async () => {
    if (!user || !newEntry.title.trim() || !newEntry.content.trim()) return;
    setLoading(true);

    // Use the centralized AI service
    const { text: aiInsights } = await getAIResponse(newEntry.content, 'journal', { mood: currentMood });

    const { data, error } = await supabase
      .from('journal_entries')
      .insert([{
        user_id: user.id,
        title: newEntry.title.trim(),
        content: newEntry.content.trim(),
        mood_at_time: currentMood,
        ai_insights: aiInsights,
      }])
      .select()
      .single();

    if (data && !error) {
      setEntries(prev => [data, ...prev]);
      setNewEntry({ title: '', content: '' });
      setIsCreating(false);

      // Award points for journaling
      if (profile) {
        await supabase
          .from('users')
          .update({
            garden_points: (profile.garden_points || 0) + 10,
          })
          .eq('id', user.id);
      }
    }
    setLoading(false);
  };

  const handleUpdateEntry = async () => {
    if (!editingEntry || !editingEntry.title.trim() || !editingEntry.content.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('journal_entries')
      .update({
        title: editingEntry.title.trim(),
        content: editingEntry.content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingEntry.id)
      .select()
      .single();

    if (data && !error) {
      setEntries(prev => prev.map(entry => 
        entry.id === editingEntry.id ? data : entry
      ));
      setEditingEntry(null);
    }
    setLoading(false);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) return;

    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId);

    if (!error) {
      setEntries(prev => prev.filter(entry => entry.id !== entryId));
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMood = filterMood === 'all' || entry.mood_at_time === filterMood;
    return matchesSearch && matchesMood;
  });

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  const getWeeklyStats = () => {
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    
    const thisWeekEntries = entries.filter(entry => {
      const entryDate = new Date(entry.created_at);
      return entryDate >= weekStart && entryDate <= weekEnd;
    });

    return {
      count: thisWeekEntries.length,
      words: thisWeekEntries.reduce((total, entry) => 
        total + entry.content.split(' ').length, 0
      ),
    };
  };

  const weeklyStats = getWeeklyStats();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: theme.text }}>
            Your Journal 📖
          </h1>
          <p style={{ color: theme.textSecondary }}>
            Reflect, process, and grow through writing
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="mt-4 md:mt-0">
          <Plus size={18} className="mr-2" />
          New Entry
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="text-center space-y-2">
          <BookOpen size={24} style={{ color: theme.primary }} className="mx-auto" />
          <div className="text-2xl font-bold" style={{ color: theme.text }}>
            {entries.length}
          </div>
          <div className="text-sm" style={{ color: theme.textSecondary }}>
            Total Entries
          </div>
        </Card>

        <Card className="text-center space-y-2">
          <Calendar size={24} style={{ color: theme.accent }} className="mx-auto" />
          <div className="text-2xl font-bold" style={{ color: theme.text }}>
            {weeklyStats.count}
          </div>
          <div className="text-sm" style={{ color: theme.textSecondary }}>
            This Week
          </div>
        </Card>

        <Card className="text-center space-y-2">
          <Edit3 size={24} style={{ color: theme.secondary }} className="mx-auto" />
          <div className="text-2xl font-bold" style={{ color: theme.text }}>
            {weeklyStats.words}
          </div>
          <div className="text-sm" style={{ color: theme.textSecondary }}>
            Words This Week
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2" 
                  style={{ color: theme.textSecondary }} />
          <Input
            placeholder="Search your entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter size={18} style={{ color: theme.textSecondary }} />
          <select
            value={filterMood}
            onChange={(e) => setFilterMood(e.target.value)}
            className="px-3 py-2 rounded-lg border-2 transition-colors"
            style={{
              borderColor: theme.primary,
              backgroundColor: theme.background,
              color: theme.text,
            }}
          >
            <option value="all">All Moods</option>
            <option value="happy">Happy</option>
            <option value="sad">Sad</option>
            <option value="anxious">Anxious</option>
            <option value="calm">Calm</option>
            <option value="excited">Excited</option>
            <option value="grateful">Grateful</option>
            <option value="angry">Angry</option>
            <option value="frustrated">Frustrated</option>
          </select>
        </div>
      </div>

      {/* Create/Edit Entry Modal */}
      <AnimatePresence>
        {(isCreating || editingEntry) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setIsCreating(false);
              setEditingEntry(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <Card className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold" style={{ color: theme.text }}>
                    {isCreating ? 'New Journal Entry' : 'Edit Entry'}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsCreating(false);
                      setEditingEntry(null);
                    }}
                  >
                    <X size={16} />
                  </Button>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Title"
                    placeholder="What's on your mind today?"
                    value={isCreating ? newEntry.title : editingEntry?.title || ''}
                    onChange={(e) => {
                      if (isCreating) {
                        setNewEntry(prev => ({ ...prev, title: e.target.value }));
                      } else if (editingEntry) {
                        setEditingEntry(prev => prev ? { ...prev, title: e.target.value } : null);
                      }
                    }}
                  />

                  <Textarea
                    label="Your thoughts"
                    placeholder="Write freely about your thoughts, feelings, experiences, or anything that comes to mind..."
                    value={isCreating ? newEntry.content : editingEntry?.content || ''}
                    onChange={(e) => {
                      if (isCreating) {
                        setNewEntry(prev => ({ ...prev, content: e.target.value }));
                      } else if (editingEntry) {
                        setEditingEntry(prev => prev ? { ...prev, content: e.target.value } : null);
                      }
                    }}
                    rows={12}
                  />

                  {currentMood && isCreating && (
                    <div className="p-3 rounded-lg" style={{ backgroundColor: `${theme.primary}10` }}>
                      <p className="text-sm" style={{ color: theme.textSecondary }}>
                        Current mood: <span className="capitalize font-medium" style={{ color: theme.text }}>
                          {currentMood}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={isCreating ? handleCreateEntry : handleUpdateEntry}
                    disabled={loading || (isCreating ? 
                      !newEntry.title.trim() || !newEntry.content.trim() :
                      !editingEntry?.title.trim() || !editingEntry?.content.trim()
                    )}
                    className="flex-1"
                  >
                    <Save size={16} className="mr-2" />
                    {loading ? 'Saving...' : 'Save Entry'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      setEditingEntry(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entries List */}
      <div className="space-y-6">
        {loading && entries.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-pulse">
              <BookOpen size={48} style={{ color: theme.primary }} className="mx-auto mb-4" />
              <p style={{ color: theme.textSecondary }}>Loading your entries...</p>
            </div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen size={48} style={{ color: theme.primary }} className="mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2" style={{ color: theme.text }}>
              {entries.length === 0 ? 'Start Your Journey' : 'No entries found'}
            </h3>
            <p style={{ color: theme.textSecondary }}>
              {entries.length === 0 
                ? 'Begin documenting your thoughts and experiences'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {entries.length === 0 && (
              <Button onClick={() => setIsCreating(true)} className="mt-4">
                Write Your First Entry
              </Button>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {filteredEntries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                layout
              >
                <Card hover className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1" style={{ color: theme.text }}>
                        {entry.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm" style={{ color: theme.textSecondary }}>
                        <span>{getDateLabel(entry.created_at)}</span>
                        {entry.mood_at_time && (
                          <span className="capitalize">
                            Mood: {entry.mood_at_time}
                          </span>
                        )}
                        <span>{entry.content.split(' ').length} words</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingEntry(entry)}
                      >
                        <Edit3 size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEntry(entry.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    <p className="text-sm leading-relaxed" style={{ color: theme.text }}>
                      {entry.content.length > 300 
                        ? `${entry.content.substring(0, 300)}...` 
                        : entry.content
                      }
                    </p>
                  </div>

                  {entry.ai_insights && (
                    <div className="p-3 rounded-lg" style={{ backgroundColor: `${theme.primary}10` }}>
                      <h4 className="text-sm font-medium mb-1" style={{ color: theme.text }}>
                        AI Insights
                      </h4>
                      <p className="text-sm" style={{ color: theme.textSecondary }}>
                        {entry.ai_insights}
                      </p>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};