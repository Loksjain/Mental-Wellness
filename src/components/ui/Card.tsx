import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = false,
  onClick 
}) => {
  const { theme } = useTheme();

  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      className={`rounded-2xl p-6 shadow-lg transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      style={{
        backgroundColor: theme.surface,
        color: theme.text,
        boxShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`,
      }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};