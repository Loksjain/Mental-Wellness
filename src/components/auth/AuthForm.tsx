import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Flower } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface AuthFormProps {
  onSuccess: () => void;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              display_name: formData.displayName || formData.email.split('@')[0],
            },
          },
        });

        if (error) throw error;

        // Better handled via DB trigger: profile creation from auth metadata
      }

      onSuccess();
    } catch (error: any) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const backgroundStyle = `
    .auth-container {
      background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
      background-size: 400% 400%;
      animation: gradient 15s ease infinite;
    }

    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `;

  return (
    <>
      <style>{backgroundStyle}</style>
      <div className="min-h-screen flex items-center justify-center px-4 auth-container">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 bg-white/20"
            >
              <Flower size={40} color="white" />
            </motion.div>
            <h1 className="text-4xl font-bold mb-2 text-white drop-shadow-md">
              WellnessGarden
            </h1>
            <p className="text-lg text-white/80 drop-shadow">
              Your personal sanctuary for mental wellness
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            variants={itemVariants}
            className="p-8 rounded-2xl shadow-2xl bg-white/10 backdrop-blur-md border border-white/20"
          >
            <AnimatePresence mode="wait">
              <motion.form
                key={isLogin ? 'login' : 'signup'}
                initial={{ opacity: 0, x: isLogin ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? 30 : -30 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold text-white">
                    {isLogin ? 'Welcome Back' : 'Join WellnessGarden'}
                  </h2>
                  <p className="text-white/70">
                    {isLogin ? 'Sign in to your account' : 'Start your wellness journey'}
                  </p>
                </div>

                {errors.general && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-500/50 border border-red-500/80 rounded-lg text-white text-sm"
                  >
                    {errors.general}
                  </motion.div>
                )}

                <AnimatePresence>
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="relative overflow-hidden"
                    >
                      <User
                        size={20}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50"
                      />
                      <Input
                        type="text"
                        placeholder="Display Name"
                        value={formData.displayName}
                        onChange={e => handleInputChange('displayName', e.target.value)}
                        className="pl-12 bg-white/10 text-white placeholder-white/50 border-white/20 focus:border-white"
                        error={errors.displayName}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <Mail
                    size={20}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50"
                  />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    className="pl-12 bg-white/10 text-white placeholder-white/50 border-white/20 focus:border-white"
                    error={errors.email}
                    required
                  />
                </div>

                <div className="relative">
                  <Lock
                    size={20}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={e => handleInputChange('password', e.target.value)}
                    className="pl-12 bg-white/10 text-white placeholder-white/50 border-white/20 focus:border-white"
                    error={errors.password}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-white/90 text-gray-800 hover:bg-white"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setErrors({});
                    }}
                    className="text-sm text-white/80 hover:text-white transition-colors duration-200"
                  >
                    {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                  </button>
                </div>
              </motion.form>
            </AnimatePresence>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="text-center mt-8 text-xs text-white/70"
          >
            Your mental wellness journey starts here. 🌱
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};
