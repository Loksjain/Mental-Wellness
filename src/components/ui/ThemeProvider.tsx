import React, { createContext, useContext, useEffect } from 'react';
import { useMoodStore } from '../../store/useMoodStore';

interface ThemeContextType {
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getMoodTheme = useMoodStore((state) => state.getMoodTheme);
  const theme = getMoodTheme();

  useEffect(() => {
    // Apply CSS custom properties for dynamic theming
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-secondary', theme.secondary);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-background', theme.background);
    root.style.setProperty('--color-surface', theme.surface);
    root.style.setProperty('--color-text', theme.text);
    root.style.setProperty('--color-text-secondary', theme.textSecondary);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme }}>
      <div 
        className="min-h-screen transition-colors duration-1000 ease-in-out"
        style={{ backgroundColor: theme.background }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};