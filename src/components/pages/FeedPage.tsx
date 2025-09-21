import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Flag, Plus, Users, TrendingUp, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useMoodStore } from '../../store/useMoodStore';
import { useTheme } from '../ui/ThemeProvider';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface PeerStory {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category?: string;
  is_moderated: boolean;
  is_approved: boolean;
  upvotes: number;
  created_at: string;
  users?: {
    name?: string;
    avatar_url?: string;
  };
}

const categories = [
  'All',
  'Anxiety',
  'Depression',
  'Self-Care',
  'Recovery',
  'Relationships',
  'Work-Life',
  'Gratitude',
  'Breakthrough',
];

const safetyKeywords = [
  'suicide', 'kill myself', 'end it all', 'self-harm', 'cutting',
  'overdose', 'pills', 'hurt myself', 'die', 'death'
];

export const FeedPage: React.FC = () => {
  const { user, profile } = useAuthStore();
  const { currentMood } = useMoodStore();
  const { theme } = useTheme();

  const [stories, setStories] = useState<PeerStory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newStory, setNewStory] = useState({
    title: '',
    content: '',
    category: 'Self-Care',
  });

  useEffect(() => {
    fetchStories();
  }, [selectedCategory]);

  const fetchStories = async () => {
    setLoading(true);
    
    let query = supabase
      .from('peer_stories')
      .select(`
        *,
        users (
          name,
          avatar_url
        )
      `)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (selectedCategory !== 'All') {
      query = query.eq('category', selectedCategory);
    }

    const { data, error } = await query;

    if (data && !error) {
      setStories(data);
    }
    setLoading(false);
  };

  const checkContentSafety = (content: string): boolean => {
    const lowerContent = content.toLowerCase();
    return !safetyKeywords.some(keyword => lowerContent.includes(keyword));
  };

  const handleCreateStory = async () => {
    if (!user || !newStory.title.trim() || !newStory.content.trim()) return;

    // Safety check
    const isSafe = checkContentSafety(newStory.content) && checkContentSafety(newStory.title);
    
    if (!isSafe) {
      alert('Your story contains content that requires review. Please consider reaching out to a mental health professional or crisis helpline if you\'re in distress.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('peer_stories')
      .insert([{
        user_id: user.id,
        title: newStory.title.trim(),
        content: newStory.content.trim(),
        category: newStory.category,
        is_moderated: true,
        is_approved: true, // Auto-approve safe content
      }])
      .select(`
        *,
        users (
          name,
          avatar_url
        )
      `)
      .single();

    if (data && !error) {
      setStories(prev => [data, ...prev]);
      setNewStory({ title: '', content: '', category: 'Self-Care' });
      setShowCreateForm(false);

      // Award points for sharing
      if (profile) {
        await supabase
          .from('users')
          .update({
            garden_points: (profile.garden_points || 0) + 15,
          })
          .eq('id', user.id);
      }
    }
    setLoading(false);
  };

  const handleUpvote = async (storyId: string) => {
    // In a real app, you'd track user votes to prevent duplicate voting
    const { error } = await supabase
      .from('peer_stories')
      .update({
        upvotes: supabase.sql`upvotes + 1`,
      })
      .eq('id', storyId);

    if (!error) {
      setStories(prev => prev.map(story => 
        story.id === storyId 
          ? { ...story, upvotes: story.upvotes + 1 }
          : story
      ));
    }
  };

  const getMoodColor = (category: string) => {
    const colors = {
      'Anxiety': '#FFB74D',
      'Depression': '#64B5F6',
      'Self-Care': '#81C784',
      'Recovery': '#BA68C8',
      'Relationships': '#FF8A65',
      'Work-Life': '#A1887F',
      'Gratitude': '#FFD93D',
      'Breakthrough': '#4ECDC4',
    };
    return colors[category as keyof typeof colors] || theme.primary;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: theme.text }}>
            Community Stories 💬
          </h1>
          <p style={{ color: theme.textSecondary }}>
            Share your journey and find inspiration from others
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus size={18} className="mr-2" />
          Share Your Story
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="text-center space-y-2">
          <Users size={24} style={{ color: theme.primary }} className="mx-auto" />
          <div className="text-2xl font-bold" style={{ color: theme.text }}>
            {stories.length}
          </div>
          <div className="text-sm" style={{ color: theme.textSecondary }}>
            Community Stories
          </div>
        </Card>

        <Card className="text-center space-y-2">
          <TrendingUp size={24} style={{ color: theme.accent }} className="mx-auto" />
          <div className="text-2xl font-bold" style={{ color: theme.text }}>
            {stories.reduce((sum, story) => sum + story.upvotes, 0)}
          </div>
          <div className="text-sm" style={{ color: theme.textSecondary }}>
            Total Support
          </div>
        </Card>

        <Card className="text-center space-y-2">
          <Heart size={24} style={{ color: theme.secondary }} className="mx-auto" />
          <div className="text-2xl font-bold" style={{ color: theme.text }}>
            Safe
          </div>
          <div className="text-sm" style={{ color: theme.textSecondary }}>
            Moderated Space
          </div>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Create Story Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateForm(false)}
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
                    Share Your Story
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: `${theme.primary}10` }}>
                  <h3 className="font-semibold mb-2" style={{ color: theme.text }}>
                    Community Guidelines
                  </h3>
                  <ul className="text-sm space-y-1" style={{ color: theme.textSecondary }}>
                    <li>• Share your experiences to inspire and support others</li>
                    <li>• Be respectful and kind in your language</li>
                    <li>• Avoid sharing personal identifying information</li>
                    <li>• If you're in crisis, please contact emergency services</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Story Title"
                    placeholder="Give your story a meaningful title..."
                    value={newStory.title}
                    onChange={(e) => setNewStory(prev => ({ ...prev, title: e.target.value }))}
                  />

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                      Category
                    </label>
                    <select
                      value={newStory.category}
                      onChange={(e) => setNewStory(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border-2 transition-colors"
                      style={{
                        borderColor: theme.primary,
                        backgroundColor: theme.background,
                        color: theme.text,
                      }}
                    >
                      {categories.slice(1).map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Textarea
                    label="Your Story"
                    placeholder="Share your experience, what you learned, or how you overcame challenges..."
                    value={newStory.content}
                    onChange={(e) => setNewStory(prev => ({ ...prev, content: e.target.value }))}
                    rows={8}
                  />
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleCreateStory}
                    disabled={loading || !newStory.title.trim() || !newStory.content.trim()}
                    className="flex-1"
                  >
                    {loading ? 'Sharing...' : 'Share Story'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
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

      {/* Stories Feed */}
      <div className="space-y-6">
        {loading && stories.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-pulse">
              <Users size={48} style={{ color: theme.primary }} className="mx-auto mb-4" />
              <p style={{ color: theme.textSecondary }}>Loading community stories...</p>
            </div>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} style={{ color: theme.primary }} className="mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2" style={{ color: theme.text }}>
              No stories yet
            </h3>
            <p style={{ color: theme.textSecondary }}>
              Be the first to share your story with the community
            </p>
            <Button onClick={() => setShowCreateForm(true)} className="mt-4">
              Share Your Story
            </Button>
          </div>
        ) : (
          <AnimatePresence>
            {stories.map((story) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                layout
              >
                <Card hover className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                           style={{ backgroundColor: getMoodColor(story.category || 'Self-Care') }}>
                        <Users size={20} color="white" />
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{ color: theme.text }}>
                          {story.users?.name || 'Anonymous'}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm" style={{ color: theme.textSecondary }}>
                          <Clock size={14} />
                          <span>{formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}</span>
                          {story.category && (
                            <>
                              <span>•</span>
                              <span className="px-2 py-1 rounded-full text-xs"
                                    style={{ 
                                      backgroundColor: `${getMoodColor(story.category)}20`,
                                      color: getMoodColor(story.category)
                                    }}>
                                {story.category}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: theme.text }}>
                      {story.title}
                    </h4>
                    <p className="leading-relaxed" style={{ color: theme.text }}>
                      {story.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t" 
                       style={{ borderColor: `${theme.primary}20` }}>
                    <div className="flex items-center space-x-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleUpvote(story.id)}
                        className="flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors"
                        style={{ 
                          backgroundColor: `${theme.primary}10`,
                          color: theme.primary 
                        }}
                      >
                        <Heart size={16} />
                        <span className="text-sm font-medium">{story.upvotes}</span>
                      </motion.button>

                      <button
                        className="flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors"
                        style={{ 
                          backgroundColor: `${theme.accent}10`,
                          color: theme.accent 
                        }}
                      >
                        <MessageCircle size={16} />
                        <span className="text-sm">Support</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        className="p-2 rounded-lg transition-colors"
                        style={{ 
                          backgroundColor: `${theme.textSecondary}10`,
                          color: theme.textSecondary 
                        }}
                      >
                        <Share2 size={16} />
                      </button>
                      <button
                        className="p-2 rounded-lg transition-colors"
                        style={{ 
                          backgroundColor: `${theme.textSecondary}10`,
                          color: theme.textSecondary 
                        }}
                      >
                        <Flag size={16} />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};