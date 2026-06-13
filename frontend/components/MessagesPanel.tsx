'use client';

import React, { useEffect, useState, useRef } from 'react';
import courseService from '@/services/courseService';
import { UserProfile } from './AuthProvider';
import { supabase } from '@/utils/supabase';
import { formatTimeString } from '@/utils/date';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface Member {
  userId: string;
  user: User;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: User;
}

interface Conversation {
  id: string;
  createdAt: string;
  participants: Member[];
  lastMessage: Message | null;
}

interface MessagesPanelProps {
  user: UserProfile;
}

export function MessagesPanel({ user }: MessagesPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipients, setRecipients] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [newMsgContent, setNewMsgContent] = useState('');
  const [messageError, setMessageError] = useState<string | null>(null);
  
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [mobileActiveView, setMobileActiveView] = useState<'list' | 'chat'>('list');

  // Initial load
  useEffect(() => {
    loadConversations();
    loadRecipients();
  }, []);

  // Real-time message subscription for the selected conversation
  useEffect(() => {
    if (!selectedConvId) return;

    const channel = supabase
      .channel(`realtime-messages:${selectedConvId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message',
          filter: `conversationId=eq.${selectedConvId}`
        },
        async (payload) => {
          // Re-load the messages to get sender join profile
          const res = await courseService.getMessages(selectedConvId);
          if (res.success && res.data) {
            setMessages(res.data);
          }
          // Also reload conversations to show latest message in thread pane
          const convRes = await courseService.getConversations();
          if (convRes.success && convRes.data) {
            setConversations(convRes.data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConvId]);

  // Real-time conversation thread subscription to listen for new conversations started with the user
  useEffect(() => {
    const channel = supabase
      .channel(`user-conversations:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ConversationParticipant',
          filter: `userId=eq.${user.id}`
        },
        async () => {
          const res = await courseService.getConversations();
          if (res.success && res.data) {
            setConversations(res.data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  // Polling fallback for new messages and conversation list updates every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      pollConversationsAndMessages();
    }, 8000);

    return () => clearInterval(interval);
  }, [selectedConvId]);

  // Scroll to bottom when messages list changes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function pollConversationsAndMessages() {
    try {
      const res = await courseService.getConversations();
      if (res.success && res.data) {
        setConversations(res.data);
      }

      if (selectedConvId) {
        const msgRes = await courseService.getMessages(selectedConvId);
        if (msgRes.success && msgRes.data) {
          // Only update state if length or last message timestamp changed to prevent unnecessary re-renders
          if (msgRes.data.length !== messages.length || 
              (msgRes.data.length > 0 && messages.length > 0 && 
               msgRes.data[msgRes.data.length - 1].id !== messages[messages.length - 1].id)) {
            setMessages(msgRes.data);
          }
        }
      }
    } catch (err) {
      console.error('Failed to poll messages', err);
    }
  }

  // Reload messages when selection changes
  useEffect(() => {
    if (selectedConvId) {
      setMessageError(null);
      setMessages([]);
      loadMessages(selectedConvId);
    } else {
      setMessages([]);
    }
  }, [selectedConvId]);

  async function loadConversations() {
    try {
      setLoadingConvs(true);
      const res = await courseService.getConversations();
      if (res.success && res.data) {
        setConversations(res.data);
        const firstConversationId = res.data[0]?.id || null;
        const conversationList = res.data as { id: string }[];
        if (conversationList.length > 0 && (!selectedConvId || !conversationList.some((c) => c.id === selectedConvId))) {
          setSelectedConvId(firstConversationId);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoadingConvs(false);
    }
  }

  async function loadRecipients() {
    try {
      const res = await courseService.getRecipients();
      if (res.success && res.data) {
        setRecipients(res.data);
      }
    } catch (err) {
      console.error('Failed to load recipients', err);
    }
  }

  async function loadMessages(convId: string) {
    try {
      setMessageError(null);
      setLoadingMsgs(true);
      const res = await courseService.getMessages(convId);
      if (res.success && res.data) {
        setMessages(res.data);
      } else {
        setMessages([]);
        setMessageError(res.error || 'Failed to load messages.');
      }
    } catch (err: any) {
      console.error('Failed to load messages', err);
      setMessageError(err.message || 'Failed to load messages.');
    } finally {
      setLoadingMsgs(false);
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessageError(null);
    if (!newMsgContent.trim() || !selectedConvId) return;

    try {
      setSendingMsg(true);
      const contentToSend = newMsgContent;
      setNewMsgContent('');

      const res = await courseService.sendMessage(selectedConvId, contentToSend);
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
        
        // Update last message in local state instantly
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConvId ? { ...c, lastMessage: res.data } : c
          )
        );
        setTimeout(scrollToBottom, 50);
        await loadMessages(selectedConvId);
      } else {
        setMessageError(res.error || 'Failed to send message.');
      }
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleStartChat = async (recipientId: string) => {
    setMessageError(null);
    try {
      const res = await courseService.startConversation(recipientId);
      if (res.success && res.data?.conversationId) {
        const newId = res.data.conversationId;
        setShowNewChatModal(false);
        setSelectedConvId(newId);
        setMobileActiveView('chat');
        setSearchQuery('');
        await loadConversations();
        await loadMessages(newId);
      } else {
        setMessageError(res.error || 'Failed to start chat session.');
      }
    } catch (err: any) {
      console.error('Failed to start chat session', err);
      setMessageError(err.message || 'Failed to start chat session.');
    }
  };

  // Helper to extract the other participant's profile
  const getRecipientProfile = (conv: Conversation) => {
    const member = conv.participants.find((p) => p.userId !== user?.id);
    return member?.user || { fullName: 'Unknown User', role: 'STUDENT', email: '' };
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConvId);
  const activeRecipient = selectedConversation ? getRecipientProfile(selectedConversation) : null;

  // Filtered recipients inside modal search
  const filteredRecipients = recipients.filter((r) =>
    r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex gap-6 items-stretch overflow-hidden h-[calc(100vh-150px)] md:h-[calc(100vh-170px)] pb-4 md:pb-2 animate-fade-in">
      {/* Left pane: Conversations List */}
      <div className={`${mobileActiveView === 'list' ? 'flex' : 'hidden'} md:flex w-full md:w-80 bg-white border border-slate-200/60 rounded-2xl flex flex-col shadow-sm overflow-hidden flex-shrink-0`}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-extrabold text-sm text-[#0f112e] uppercase tracking-wider">Inbox Messages</h2>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-100 text-[#0d9488] hover:bg-teal-100/50 flex items-center justify-center text-sm font-bold cursor-pointer transition"
          >
            +
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loadingConvs ? (
            <div className="p-6 text-center text-slate-400 text-xs animate-pulse">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              ✉️ No message threads. Click "+" to start a new chat.
            </div>
          ) : (
            conversations.map((conv) => {
              const recipient = getRecipientProfile(conv);
              const isActive = conv.id === selectedConvId;
              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConvId(conv.id);
                    setMobileActiveView('chat');
                  }}
                  className={`w-full p-4 flex gap-3 text-left items-start hover:bg-slate-50/50 transition duration-200 ${
                    isActive ? 'bg-teal-50/30 border-l-4 border-[#0d9488]' : ''
                  }`}
                >
                  <div className="h-9 w-9 rounded-full bg-teal-100/80 text-[#0d9488] font-black flex items-center justify-center text-xs uppercase flex-shrink-0">
                    {recipient.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-bold text-xs text-slate-800 truncate">{recipient.fullName}</h3>
                      <span className="text-[8px] font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded leading-none">
                        {recipient.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-1">
                      {conv.lastMessage ? conv.lastMessage.content : 'No messages yet.'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right pane: Chat Area */}
      <div className={`${mobileActiveView === 'chat' ? 'flex' : 'hidden'} md:flex flex-1 bg-white border border-slate-200/60 rounded-2xl flex flex-col shadow-sm overflow-hidden relative`}>
        {selectedConvId && activeRecipient ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setMobileActiveView('list')}
                className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 font-bold transition cursor-pointer text-sm"
              >
                ←
              </button>
              <div className="h-9 w-9 rounded-full bg-teal-100/80 text-[#0d9488] font-black flex items-center justify-center text-xs uppercase">
                {activeRecipient.fullName.charAt(0)}
              </div>
              <div className="text-left min-w-0 flex-1">
                <h2 className="font-extrabold text-sm text-[#0f112e] truncate max-w-[150px] sm:max-w-[250px] md:max-w-none">{activeRecipient.fullName}</h2>
                <span className="text-[8px] font-bold text-teal-500 uppercase tracking-wider bg-teal-50 border border-teal-100/60 px-1.5 py-0.5 rounded whitespace-nowrap">
                  {activeRecipient.role}
                </span>
              </div>
            </div>
            {messageError ? (
              <div className="px-6 py-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs">
                {messageError}
              </div>
            ) : null}

            {/* Messages Timeline */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
              {loadingMsgs && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs animate-pulse">
                  Loading messages...
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl p-3 px-4 shadow-sm text-left ${
                          isOwn
                            ? 'bg-[#0d9488] text-white rounded-tr-none'
                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                        }`}
                      >
                        {!isOwn && (
                          <span className="text-[8px] font-black text-teal-400 uppercase tracking-wider block mb-1">
                            {msg.sender?.fullName || activeRecipient.fullName}
                          </span>
                        )}
                        <p className="text-xs leading-relaxed break-words whitespace-pre-wrap">
                          {msg.content}
                        </p>
                        <span
                          className={`text-[8px] block mt-1.5 text-right font-medium ${
                            isOwn ? 'text-white/70' : 'text-slate-400'
                          }`}
                        >
                          {formatTimeString(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex gap-3 items-center">
              <input
                type="text"
                value={newMsgContent}
                onChange={(e) => setNewMsgContent(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 text-xs text-slate-800 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#0d9488]/25 focus:border-[#0d9488] transition"
                disabled={sendingMsg}
              />
              <button
                type="submit"
                disabled={sendingMsg || !newMsgContent.trim()}
                className="px-3.5 py-2.5 sm:px-5 sm:py-3 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold rounded-xl disabled:opacity-50 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-teal-600/10 whitespace-nowrap"
              >
                <span className="hidden sm:inline">Send</span>
                <span className="sm:hidden">➤</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <span className="text-4xl mb-3">💬</span>
            <h3 className="font-extrabold text-sm text-slate-800">Your Inbox Workspace</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs text-center leading-relaxed">
              Select a conversation thread on the left pane or click "+" to start messaging.
            </p>
          </div>
        )}
      </div>

      {/* New Chat Modal Dialog */}
      {showNewChatModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-slate-950/20 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-fade-in">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-extrabold text-sm text-[#0f112e] uppercase tracking-wider">Start New Chat</h3>
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setSearchQuery('');
                }}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 border-b border-slate-100">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#0d9488]/25 focus:border-[#0d9488] transition"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[40vh]">
              {filteredRecipients.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No eligible contacts found matching "{searchQuery}".
                </div>
              ) : (
                filteredRecipients.map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => handleStartChat(rec.id)}
                    className="w-full p-4 flex gap-3 text-left items-center hover:bg-slate-50/50 transition cursor-pointer"
                  >
                    <div className="h-9 w-9 rounded-full bg-teal-100/80 text-[#0d9488] font-black flex items-center justify-center text-xs uppercase flex-shrink-0">
                      {rec.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-xs text-slate-800 truncate">{rec.fullName}</h4>
                        <span className="text-[8px] font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                          {rec.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{rec.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
