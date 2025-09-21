import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Heart, Sparkles, MessageCircle, Wind } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useMoodStore } from '../../store/useMoodStore';
import { useTheme } from '../ui/ThemeProvider';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { getAIResponse } from '../../lib/ai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mood?: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface ChatPageProps {
  onPageChange: (page: string) => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ onPageChange }) => {
  const { user, profile } = useAuthStore();
  const { currentMood } = useMoodStore();
  const { theme } = useTheme();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedExercise, setSuggestedExercise] = useState<{ id: string; name: string } | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setConversations(data);
      if (data.length > 0 && !currentConversationId) {
        setCurrentConversationId(data[0].id);
        fetchMessages(data[0].id);
      }
    }
  };

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (data && !error) {
      const formattedMessages = data.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at),
      }));
      setMessages(formattedMessages);
    }
  };

  const createNewConversation = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('conversations')
      .insert([{
        user_id: user.id,
        title: 'New Conversation',
      }])
      .select()
      .single();

    if (data && !error) {
      setConversations(prev => [data, ...prev]);
      setCurrentConversationId(data.id);
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user || !currentConversationId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setSuggestedExercise(null);
    setIsTyping(true);

    // Save user message to database
    await supabase
      .from('messages')
      .insert([{
        conversation_id: currentConversationId,
        role: 'user',
        content: userMessage.content,
      }]);

    // Get AI response
    const { text: aiResponse, suggestion } = await getAIResponse(userMessage.content, 'chat', { mood: currentMood });
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
      mood: currentMood || undefined,
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);

    if (suggestion) {
      setSuggestedExercise({ id: suggestion, name: suggestion.replace(/-/g, ' ') });
    }

    // Save AI message to database

      // Save AI message to database
      await supabase
        .from('messages')
        .insert([{
          conversation_id: currentConversationId,
          role: 'assistant',
          content: assistantMessage.content,
        }]);

      // Award points for engagement
      if (profile) {
        await supabase
          .from('users')
          .update({
            garden_points: (profile.garden_points || 0) + 2,
          })
          .eq('id', user.id);
      }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex-1 flex flex-col">
      <div className="grid grid-cols-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-rows-none lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Conversations Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold" style={{ color: theme.text }}>
              Conversations
            </h2>
            <Button size="sm" onClick={createNewConversation}>
              New Chat
            </Button>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {conversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  setCurrentConversationId(conversation.id);
                  fetchMessages(conversation.id);
                }}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  currentConversationId === conversation.id ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: currentConversationId === conversation.id 
                    ? `${theme.primary}20` 
                    : theme.surface,
                  ringColor: theme.primary,
                }}
              >
                <div className="flex items-center space-x-2">
                  <MessageCircle size={16} style={{ color: theme.primary }} />
                  <span className="text-sm font-medium truncate" style={{ color: theme.text }}>
                    {conversation.title}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>
                  {new Date(conversation.created_at).toLocaleDateString()}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b" style={{ borderColor: `${theme.primary}30` }}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                     style={{ backgroundColor: theme.primary }}>
                  <Bot size={20} color="white" />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: theme.text }}>
                    WellnessGarden Assistant
                  </h3>
                  <p className="text-sm" style={{ color: theme.textSecondary }}>
                    Your supportive companion
                  </p>
                </div>
                {currentMood && (
                  <div className="ml-auto flex items-center space-x-2">
                    <Heart size={16} style={{ color: theme.accent }} />
                    <span className="text-sm capitalize" style={{ color: theme.text }}>
                      {currentMood} mood
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <Sparkles size={48} style={{ color: theme.primary }} className="mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2" style={{ color: theme.text }}>
                    Welcome to your safe space
                  </h3>
                  <p style={{ color: theme.textSecondary }}>
                    I'm here to listen, support, and help you on your wellness journey.
                    What's on your mind today?
                  </p>
                </motion.div>
              )}

              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-3 max-w-xs md:max-w-md lg:max-w-lg ${
                      message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                           style={{ 
                             backgroundColor: message.role === 'user' ? theme.accent : theme.primary 
                           }}>
                        {message.role === 'user' ? 
                          <User size={16} color="white" /> : 
                          <Bot size={16} color="white" />
                        }
                      </div>
                      <div className={`p-3 rounded-2xl ${
                        message.role === 'user' 
                          ? 'rounded-tr-sm' 
                          : 'rounded-tl-sm'
                      }`}
                      style={{
                        backgroundColor: message.role === 'user' 
                          ? theme.accent 
                          : theme.surface,
                        color: message.role === 'user' ? 'white' : theme.text,
                      }}>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                         style={{ backgroundColor: theme.primary }}>
                      <Bot size={16} color="white" />
                    </div>
                    <div className="p-3 rounded-2xl rounded-tl-sm" 
                         style={{ backgroundColor: theme.surface }}>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full animate-pulse" 
                             style={{ backgroundColor: theme.primary }}></div>
                        <div className="w-2 h-2 rounded-full animate-pulse" 
                             style={{ backgroundColor: theme.primary, animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 rounded-full animate-pulse" 
                             style={{ backgroundColor: theme.primary, animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Exercise */}
            <AnimatePresence>
              {suggestedExercise && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="p-4 border-t"
                  style={{ borderColor: `${theme.primary}30` }}
                >
                  <Card className="p-3 flex items-center justify-between" style={{ backgroundColor: `${theme.primary}10` }}>
                    <div className="flex items-center space-x-3">
                      <Wind size={20} style={{ color: theme.primary }} />
                      <div>
                        <p className="font-semibold" style={{ color: theme.text }}>Suggested for you:</p>
                        <p className="text-sm capitalize" style={{ color: theme.textSecondary }}>{suggestedExercise.name}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => onPageChange('toolkit')}>Go to Toolkit</Button>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Input Area */}
            <div className="p-4 border-t" style={{ borderColor: `${theme.primary}30` }}>
              <div className="flex space-x-3">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Share what's on your mind..."
                  className="flex-1"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="px-4"
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};