import React from 'react';
import { useTheme } from './ThemeProvider';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  className = '', 
  ...props 
}) => {
  const { theme } = useTheme();

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium" style={{ color: theme.text }}>
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 rounded-xl border-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`}
        style={{
          borderColor: error ? '#EF4444' : theme.primary,
          backgroundColor: theme.background,
          color: theme.text,
          focusRingColor: theme.primary,
        }}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};