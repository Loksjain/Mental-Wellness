import React, { useEffect, useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { AuthForm } from './components/auth/AuthForm';
import MainApp from './MainApp';
import { supabase } from './lib/supabase';
import { ThemeProvider } from './components/ui/ThemeProvider';
import { Session } from '@supabase/supabase-js';

const AppContent: React.FC = () => {
  const { session, setSession, setProfile } = useAuthStore();
  const [loading, setLoading] = useState(true);

  const updateUserProfile = (currentSession: Session | null) => {
    if (currentSession?.user) {
      supabase
        .from('users')
        .select('*')
        .eq('id', currentSession.user.id)
        .single()
        .then(({ data }) => setProfile(data));
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    // Set initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      updateUserProfile(session);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        updateUserProfile(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [setSession, setProfile]);

  if (loading) {
    // You can replace this with a more sophisticated loading spinner
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  if (!session) {
    return <AuthForm onSuccess={() => {}} />;
  }

  return <MainApp />;
};

const App: React.FC = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

export default App;