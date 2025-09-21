import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const { theme } = useTheme();

  const baseClasses = 'rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'text-white shadow-md hover:shadow-lg active:scale-95';
      case 'secondary':
        return 'border-2 shadow-sm hover:shadow-md active:scale-95';
      case 'outline':
        return 'border-2 bg-transparent hover:shadow-md active:scale-95';
      default:
        return '';
    }
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.primary,
          color: '#ffffff',
        };
      case 'secondary':
        return {
          backgroundColor: theme.surface,
          color: theme.text,
          borderColor: theme.primary,
        };
      case 'outline':
        return {
          color: theme.text,
          borderColor: theme.primary,
        };
      default:
        return {};
    }
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${baseClasses} ${sizeClasses[size]} ${getVariantClasses()} ${className}`}
      style={getVariantStyle()}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
};