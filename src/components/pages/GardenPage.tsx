import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flower, Flower2, TreePine, Sprout, Star, Gift, Trophy, Target } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useMoodStore } from '../../store/useMoodStore';
import { useTheme } from '../ui/ThemeProvider';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { supabase } from '../../lib/supabase';

interface GardenItem {
  id: string;
  item_type: string;
  item_name: string;
  position_x: number;
  position_y: number;
  growth_stage: number;
  unlocked_at: string;
}

interface ShopItem {
  id: string;
  name: string;
  type: 'flower' | 'tree' | 'decoration';
  cost: number;
  icon: React.ReactNode;
  description: string;
  unlockLevel: number;
}

const shopItems: ShopItem[] = [
  {
    id: 'sunflower',
    name: 'Sunflower',
    type: 'flower',
    cost: 50,
    icon: <Flower size={24} />,
    description: 'A bright sunflower that brings joy to your garden',
    unlockLevel: 1,
  },
  {
    id: 'rose',
    name: 'Rose',
    type: 'flower',
    cost: 75,
    icon: <Flower2 size={24} />,
    description: 'A beautiful rose symbolizing self-love',
    unlockLevel: 5,
  },
  {
    id: 'oak_tree',
    name: 'Oak Tree',
    type: 'tree',
    cost: 200,
    icon: <TreePine size={24} />,
    description: 'A strong oak tree representing resilience',
    unlockLevel: 10,
  },
  {
    id: 'meditation_stone',
    name: 'Meditation Stone',
    type: 'decoration',
    cost: 100,
    icon: <Star size={24} />,
    description: 'A peaceful stone for reflection',
    unlockLevel: 7,
  },
];

export const GardenPage: React.FC = () => {
  const { user, profile } = useAuthStore();
  const { currentMood } = useMoodStore();
  const { theme } = useTheme();

  const [gardenItems, setGardenItems] = useState<GardenItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [showShop, setShowShop] = useState(false);
  const [placingItem, setPlacingItem] = useState<ShopItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGardenItems();
    }
  }, [user]);

  const fetchGardenItems = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('garden_items')
      .select('*')
      .eq('user_id', user.id);

    if (data && !error) {
      setGardenItems(data);
    }
  };

  const getUserLevel = () => {
    const points = profile?.garden_points || 0;
    return Math.floor(points / 100) + 1;
  };

  const getPointsToNextLevel = () => {
    const points = profile?.garden_points || 0;
    const currentLevel = getUserLevel();
    const pointsForNextLevel = currentLevel * 100;
    return pointsForNextLevel - points;
  };

  const handlePurchaseItem = async (item: ShopItem) => {
    if (!user || !profile || profile.garden_points < item.cost) return;
    
    setLoading(true);
    
    // Deduct points
    const { error: updateError } = await supabase
      .from('users')
      .update({
        garden_points: profile.garden_points - item.cost,
      })
      .eq('id', user.id);

    if (!updateError) {
      setPlacingItem(item);
      setShowShop(false);
    }
    
    setLoading(false);
  };

  const handlePlaceItem = async (x: number, y: number) => {
    if (!placingItem || !user) return;

    const { data, error } = await supabase
      .from('garden_items')
      .insert([{
        user_id: user.id,
        item_type: placingItem.type,
        item_name: placingItem.name,
        position_x: x,
        position_y: y,
        growth_stage: 1,
      }])
      .select()
      .single();

    if (data && !error) {
      setGardenItems(prev => [...prev, data]);
      setPlacingItem(null);
    }
  };

  const getGardenBackground = () => {
    const moodColors = {
      happy: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 50%, #FFE082 100%)',
      excited: 'linear-gradient(135deg, #FCE4EC 0%, #F8BBD9 50%, #F48FB1 100%)',
      calm: 'linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 50%, #A5D6A7 100%)',
      grateful: 'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 50%, #CE93D8 100%)',
      sad: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 50%, #90CAF9 100%)',
      anxious: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 50%, #FFCC02 100%)',
      angry: 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 50%, #EF9A9A 100%)',
      frustrated: 'linear-gradient(135deg, #EFEBE9 0%, #D7CCC8 50%, #BCAAA4 100%)',
    };

    return moodColors[currentMood as keyof typeof moodColors] || moodColors.calm;
  };

  const renderGardenItem = (item: GardenItem) => {
    const icons = {
      sunflower: <Flower size={32} style={{ color: '#FFD93D' }} />,
      rose: <Flower2 size={32} style={{ color: '#E91E63' }} />,
      oak_tree: <TreePine size={48} style={{ color: '#4CAF50' }} />,
      meditation_stone: <Star size={24} style={{ color: '#9C27B0' }} />,
    };

    return (
      <motion.div
        key={item.id}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        className="absolute cursor-pointer"
        style={{
          left: `${item.position_x}%`,
          top: `${item.position_y}%`,
          transform: 'translate(-50%, -50%)',
        }}
        onClick={() => setSelectedItem(shopItems.find(si => si.id === item.item_name) || null)}
      >
        <div className="relative">
          {icons[item.item_name as keyof typeof icons] || <Sprout size={24} />}
          {item.growth_stage < 3 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: theme.text }}>
            Your Wellness Garden 🌿
          </h1>
          <p style={{ color: theme.textSecondary }}>
            Watch your garden grow as you nurture your mental health
          </p>
        </div>
        <Button onClick={() => setShowShop(true)}>
          <Gift size={18} className="mr-2" />
          Garden Shop
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="text-center space-y-2">
          <Flower size={24} style={{ color: theme.primary }} className="mx-auto" />
          <div className="text-2xl font-bold" style={{ color: theme.text }}>
            {profile?.garden_points || 0}
          </div>
          <div className="text-sm" style={{ color: theme.textSecondary }}>
            Garden Points
          </div>
        </Card>

        <Card className="text-center space-y-2">
          <Trophy size={24} style={{ color: theme.accent }} className="mx-auto" />
          <div className="text-2xl font-bold" style={{ color: theme.text }}>
            Level {getUserLevel()}
          </div>
          <div className="text-sm" style={{ color: theme.textSecondary }}>
            Gardener Level
          </div>
        </Card>

        <Card className="text-center space-y-2">
          <Target size={24} style={{ color: theme.secondary }} className="mx-auto" />
          <div className="text-2xl font-bold" style={{ color: theme.text }}>
            {getPointsToNextLevel()}
          </div>
          <div className="text-sm" style={{ color: theme.textSecondary }}>
            Points to Next Level
          </div>
        </Card>

        <Card className="text-center space-y-2">
          <Sprout size={24} style={{ color: '#4CAF50' }} className="mx-auto" />
          <div className="text-2xl font-bold" style={{ color: theme.text }}>
            {gardenItems.length}
          </div>
          <div className="text-sm" style={{ color: theme.textSecondary }}>
            Garden Items
          </div>
        </Card>
      </div>

      {/* Garden Area */}
      <Card className="relative overflow-hidden" style={{ minHeight: '500px' }}>
        <div
          className="absolute inset-0 transition-all duration-1000"
          style={{ background: getGardenBackground() }}
        >
          {/* Garden Grid */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Garden Items */}
          {gardenItems.map(renderGardenItem)}

          {/* Placement Mode */}
          {placingItem && (
            <div
              className="absolute inset-0 cursor-crosshair"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                handlePlaceItem(x, y);
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="mb-2">{placingItem.icon}</div>
                  <p>Click to place your {placingItem.name}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlacingItem(null);
                    }}
                    className="mt-2"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Empty Garden Message */}
          {gardenItems.length === 0 && !placingItem && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Sprout size={64} style={{ color: theme.primary }} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2" style={{ color: theme.text }}>
                  Your garden awaits
                </h3>
                <p className="mb-4" style={{ color: theme.textSecondary }}>
                  Start planting by visiting the garden shop
                </p>
                <Button onClick={() => setShowShop(true)}>
                  Visit Shop
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Garden Shop Modal */}
      <AnimatePresence>
        {showShop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowShop(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <Card className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold" style={{ color: theme.text }}>
                    Garden Shop 🛍️
                  </h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Flower size={20} style={{ color: theme.accent }} />
                      <span className="font-semibold" style={{ color: theme.text }}>
                        {profile?.garden_points || 0} points
                      </span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowShop(false)}>
                      Close
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {shopItems.map((item) => {
                    const canAfford = (profile?.garden_points || 0) >= item.cost;
                    const levelUnlocked = getUserLevel() >= item.unlockLevel;
                    const canPurchase = canAfford && levelUnlocked;

                    return (
                      <motion.div
                        key={item.id}
                        whileHover={canPurchase ? { scale: 1.02 } : undefined}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          canPurchase ? 'cursor-pointer' : 'opacity-50'
                        }`}
                        style={{
                          borderColor: canPurchase ? theme.primary : theme.textSecondary,
                          backgroundColor: theme.surface,
                        }}
                        onClick={() => canPurchase && handlePurchaseItem(item)}
                      >
                        <div className="text-center space-y-3">
                          <div style={{ color: theme.primary }}>
                            {item.icon}
                          </div>
                          <div>
                            <h3 className="font-semibold" style={{ color: theme.text }}>
                              {item.name}
                            </h3>
                            <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>
                              {item.description}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-center space-x-1">
                              <Flower size={16} style={{ color: theme.accent }} />
                              <span className="font-semibold" style={{ color: theme.text }}>
                                {item.cost} points
                              </span>
                            </div>
                            {!levelUnlocked && (
                              <p className="text-xs" style={{ color: theme.textSecondary }}>
                                Unlocks at level {item.unlockLevel}
                              </p>
                            )}
                            {!canAfford && levelUnlocked && (
                              <p className="text-xs text-red-500">
                                Need {item.cost - (profile?.garden_points || 0)} more points
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: `${theme.primary}10` }}>
                  <h3 className="font-semibold mb-2" style={{ color: theme.text }}>
                    How to earn points
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong>Daily mood check-in:</strong> 5 points
                    </div>
                    <div>
                      <strong>Journal entry:</strong> 10 points
                    </div>
                    <div>
                      <strong>Chat session:</strong> 2 points
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Details Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card className="text-center space-y-4">
                <div style={{ color: theme.primary }}>
                  {selectedItem.icon}
                </div>
                <h3 className="text-xl font-semibold" style={{ color: theme.text }}>
                  {selectedItem.name}
                </h3>
                <p style={{ color: theme.textSecondary }}>
                  {selectedItem.description}
                </p>
                <Button onClick={() => setSelectedItem(null)}>
                  Close
                </Button>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};