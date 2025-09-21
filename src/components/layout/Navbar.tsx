import React from 'react';
import { motion } from 'framer-motion';
import { Home, MessageCircle, BookOpen, Flower, Users, Wrench, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../ui/ThemeProvider';
import { Button } from '../ui/Button';

interface NavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onPageChange }) => {
  const { signOut, profile } = useAuthStore();
  const { theme } = useTheme();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'garden', label: 'Garden', icon: Flower },
    { id: 'feed', label: 'Feed', icon: Users },
    { id: 'toolkit', label: 'Toolkit', icon: Wrench },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 backdrop-blur-md border-b-2"
      style={{
        backgroundColor: `${theme.surface}f0`,
        borderColor: theme.primary,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2"
          >
            <Flower size={32} style={{ color: theme.primary }} />
            <span className="text-xl font-bold" style={{ color: theme.text }}>
              WellnessGarden
            </span>
          </motion.div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onPageChange(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                    isActive ? 'font-semibold' : 'hover:bg-opacity-50'
                  }`}
                  style={{
                    color: isActive ? theme.primary : theme.textSecondary,
                    backgroundColor: isActive ? `${theme.primary}20` : 'transparent',
                  }}
                >
                  <Icon size={18} />
                  <span className="text-sm">{item.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <User size={20} style={{ color: theme.textSecondary }} />
              <span className="text-sm font-medium" style={{ color: theme.text }}>
                {profile?.display_name || 'User'}
              </span>
              <div className="flex items-center space-x-1">
                <Flower size={16} style={{ color: theme.accent }} />
                <span className="text-sm font-bold" style={{ color: theme.accent }}>
                  {profile?.garden_points || 0}
                </span>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t" style={{ borderColor: `${theme.primary}30` }}>
        <div className="flex justify-around py-2">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPageChange(item.id)}
                className="flex flex-col items-center space-y-1 p-2 rounded-lg"
                style={{
                  color: isActive ? theme.primary : theme.textSecondary,
                }}
              >
                <Icon size={20} />
                <span className="text-xs">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};