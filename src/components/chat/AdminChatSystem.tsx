import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  Paperclip, 
  Phone, 
  Video, 
  MoreVertical,
  X,
  Minimize2,
  Maximize2,
  Users,
  Clock,
  CheckCheck,
  AlertCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useStore } from '../../store/useStore';
import { db } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface ChatSession {
  id: string;
  user_id: string;
  admin_id?: string;
  status: 'active' | 'closed' | 'waiting';
  subject?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  closed_at?: string;
  user?: {
    full_name: string;
    email: string;
  };
  admin?: {
    full_name: string;
    email: string;
  };
  unread_count?: number;
  last_message?: ChatMessage;
}

interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  message: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  file_url?: string;
  read_at?: string;
  created_at: string;
  sender?: {
    full_name: string;
    email: string;
  };
}

interface AdminChatSystemProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onClose?: () => void;
}

export const AdminChatSystem: React.FC<AdminChatSystemProps> = ({
  isMinimized = false,
  onToggleMinimize,
  onClose
}) => {
  const { user, language, isAdmin } = useStore();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const translations = {
    en: {
      chatSupport: 'Chat Support',
      newChat: 'New Chat',
      allChats: 'All Chats',
      activeChats: 'Active Chats',
      closedChats: 'Closed Chats',
      typeMessage: 'Type your message...',
      send: 'Send',
      attachFile: 'Attach File',
      online: 'Online',
      offline: 'Offline',
      typing: 'is typing...',
      priority: 'Priority',
      status: 'Status',
      assignToMe: 'Assign to me',
      closeChat: 'Close chat',
      reopenChat: 'Reopen chat',
      noChats: 'No chat sessions',
      startNewChat: 'Start a new chat to get help',
      selectChat: 'Select a chat to start messaging',
      chatClosed: 'This chat has been closed',
      chatAssigned: 'Chat assigned successfully',
      messageSent: 'Message sent',
      fileUploaded: 'File uploaded successfully',
      priorities: {
        low: 'Low',
        normal: 'Normal',
        high: 'High',
        urgent: 'Urgent'
      },
      statuses: {
        active: 'Active',
        closed: 'Closed',
        waiting: 'Waiting'
      }
    },
    fr: {
      chatSupport: 'Support Chat',
      newChat: 'Nouveau Chat',
      allChats: 'Tous les Chats',
      activeChats: 'Chats Actifs',
      closedChats: 'Chats Fermés',
      typeMessage: 'Tapez votre message...',
      send: 'Envoyer',
      attachFile: 'Joindre un fichier',
      online: 'En ligne',
      offline: 'Hors ligne',
      typing: 'tape...',
      priority: 'Priorité',
      status: 'Statut',
      assignToMe: 'M\'assigner',
      closeChat: 'Fermer le chat',
      reopenChat: 'Rouvrir le chat',
      noChats: 'Aucune session de chat',
      startNewChat: 'Démarrez un nouveau chat pour obtenir de l\'aide',
      selectChat: 'Sélectionnez un chat pour commencer à envoyer des messages',
      chatClosed: 'Ce chat a été fermé',
      chatAssigned: 'Chat assigné avec succès',
      messageSent: 'Message envoyé',
      fileUploaded: 'Fichier téléchargé avec succès',
      priorities: {
        low: 'Faible',
        normal: 'Normal',
        high: 'Élevé',
        urgent: 'Urgent'
      },
      statuses: {
        active: 'Actif',
        closed: 'Fermé',
        waiting: 'En attente'
      }
    }
  };

  const t = translations[language];

  useEffect(() => {
    if (user) {
      loadChatSessions();
      
      // Set up real-time subscriptions
      const interval = setInterval(() => {
        if (activeSession) {
          loadMessages(activeSession.id);
        }
        loadChatSessions();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [user, activeSession?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatSessions = async () => {
    try {
      setLoading(true);
      let data;
      
      if (isAdmin()) {
        // Admin sees all sessions
        const { data: adminSessions } = await db.getAllChatSessions();
        data = adminSessions;
      } else {
        // User sees only their sessions
        const { data: userSessions } = await db.getUserChatSessions(user!.id);
        data = userSessions;
      }
      
      if (data) {
        setSessions(data);
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const { data } = await db.getChatMessages(sessionId);
      if (data) {
        setMessages(data);
        
        // Mark messages as read
        if (user) {
          await db.markMessagesAsRead(sessionId, user.id);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const createNewChatSession = async () => {
    if (!user) return;
    
    try {
      const sessionData = {
        user_id: user.id,
        status: 'waiting',
        subject: 'General Support',
        priority: 'normal'
      };
      
      const { data } = await db.createChatSession(sessionData);
      if (data) {
        await loadChatSessions();
        setActiveSession(data);
        await loadMessages(data.id);
      }
    } catch (error) {
      console.error('Error creating chat session:', error);
    }
  };

  const sendMessage = async () => {
    if (!activeSession || !newMessage.trim() || !user) return;
    
    try {
      setSending(true);
      
      const messageData = {
        session_id: activeSession.id,
        sender_id: user.id,
        message: newMessage.trim(),
        message_type: 'text'
      };
      
      const { error } = await db.sendChatMessage(messageData);
      if (error) throw error;
      
      setNewMessage('');
      await loadMessages(activeSession.id);
      
      // Update session status to active if it was waiting
      if (activeSession.status === 'waiting') {
        await db.updateChatSession(activeSession.id, { status: 'active' });
        await loadChatSessions();
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const assignChatToAdmin = async (sessionId: string) => {
    if (!user || !isAdmin()) return;
    
    try {
      await db.updateChatSession(sessionId, {
        admin_id: user.id,
        status: 'active'
      });
      await loadChatSessions();
    } catch (error) {
      console.error('Error assigning chat:', error);
    }
  };

  const closeChatSession = async (sessionId: string) => {
    try {
      await db.updateChatSession(sessionId, {
        status: 'closed',
        closed_at: new Date().toISOString()
      });
      await loadChatSessions();
      
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error closing chat:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeSession || !user) return;
    
    try {
      setSending(true);
      
      // In a real app, upload file to storage first
      // For demo, we'll simulate file upload
      const fileUrl = `https://example.com/files/${file.name}`;
      
      const messageData = {
        session_id: activeSession.id,
        sender_id: user.id,
        message: `Shared file: ${file.name}`,
        message_type: 'file',
        file_url: fileUrl
      };
      
      const { error } = await db.sendChatMessage(messageData);
      if (error) throw error;
      
      await loadMessages(activeSession.id);
      
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    setIsTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'waiting': return 'text-yellow-600 bg-yellow-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggleMinimize}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg"
        >
          <MessageCircle className="w-6 h-6" />
          {sessions.filter(s => s.unread_count && s.unread_count > 0).length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {sessions.reduce((sum, s) => sum + (s.unread_count || 0), 0)}
            </span>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border z-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5" />
          <h3 className="font-semibold">{t.chatSupport}</h3>
        </div>
        <div className="flex items-center space-x-2">
          {onToggleMinimize && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMinimize}
              className="text-white hover:bg-blue-700 p-1"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-blue-700 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sessions Sidebar */}
        <div className="w-32 bg-gray-50 border-r flex flex-col">
          <div className="p-2">
            {!isAdmin() && (
              <Button
                size="sm"
                onClick={createNewChatSession}
                className="w-full text-xs"
              >
                {t.newChat}
              </Button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-2 text-center">
                <p className="text-xs text-gray-500">{t.noChats}</p>
              </div>
            ) : (
              <div className="space-y-1 p-1">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => {
                      setActiveSession(session);
                      loadMessages(session.id);
                    }}
                    className={`p-2 rounded cursor-pointer text-xs ${
                      activeSession?.id === session.id
                        ? 'bg-blue-100 border border-blue-300'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate">
                        {session.user?.full_name || 'User'}
                      </span>
                      {session.unread_count && session.unread_count > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {session.unread_count}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <span className={`px-1 py-0.5 rounded text-xs ${getPriorityColor(session.priority)}`}>
                        {t.priorities[session.priority]}
                      </span>
                      <span className={`px-1 py-0.5 rounded text-xs ${getStatusColor(session.status)}`}>
                        {t.statuses[session.status]}
                      </span>
                    </div>
                    
                    {session.last_message && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {session.last_message.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeSession ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">
                      {activeSession.user?.full_name || 'User'}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {activeSession.subject}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {isAdmin() && activeSession.status !== 'closed' && !activeSession.admin_id && (
                      <Button
                        size="sm"
                        onClick={() => assignChatToAdmin(activeSession.id)}
                        className="text-xs"
                      >
                        {t.assignToMe}
                      </Button>
                    )}
                    
                    {(isAdmin() || user?.id === activeSession.user_id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => closeChatSession(activeSession.id)}
                        className="text-xs"
                      >
                        {activeSession.status === 'closed' ? t.reopenChat : t.closeChat}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-2 rounded-lg text-sm ${
                        message.sender_id === user?.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.message_type === 'file' ? (
                        <div className="flex items-center space-x-2">
                          <Paperclip className="w-4 h-4" />
                          <span>{message.message}</span>
                        </div>
                      ) : (
                        <p>{message.message}</p>
                      )}
                      
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-75">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                        {message.sender_id === user?.id && message.read_at && (
                          <CheckCheck className="w-3 h-3 opacity-75" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {activeSession.status !== 'closed' && (
                <div className="p-3 border-t">
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx"
                    />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending}
                      className="p-2"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder={t.typeMessage}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      disabled={sending}
                    />
                    
                    <Button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      size="sm"
                      className="p-2"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">{t.selectChat}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};