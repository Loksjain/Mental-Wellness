import React from 'react';
import { useTheme } from './ThemeProvider';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ 
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
      <textarea
        className={`w-full px-4 py-3 rounded-xl border-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none ${className}`}
        style={{
          borderColor: error ? '#EF4444' : theme.primary,
          backgroundColor: theme.background,
          color: theme.text,
        }}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};