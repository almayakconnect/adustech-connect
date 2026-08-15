import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Send, Image, Mic, Check, CheckCheck, Loader2, ArrowLeft, X } from 'lucide-react';

export default function Messenger({ session, onBack }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch active conversations for user
  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations (
            id, updated_at,
            conversation_participants (
              user_id,
              profiles:user_id ( full_name, avatar_url )
            )
          )
        `)
        .eq('user_id', session.user.id);

      if (error) throw error;

      const formatted = (data || []).map((item) => {
        const otherParticipant = item.conversations?.conversation_participants?.find(
          (p) => p.user_id !== session.user.id
        );
        return {
          id: item.conversation_id,
          partnerName: otherParticipant?.profiles?.full_name || 'ADUSTECH Peer',
          partnerAvatar: otherParticipant?.profiles?.avatar_url,
          updatedAt: item.conversations?.updated_at
        };
      });

      setConversations(formatted);
      if (formatted.length > 0 && !activeConversation) {
        setActiveConversation(formatted[0]);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for active conversation
  const fetchMessages = async (convId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);

      // Subscribe to Realtime message inserts for active conversation
      const channel = supabase
        .channel(`messages:${activeConversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${activeConversation.id}`
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeConversation]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !activeConversation) return;

    try {
      let publicMediaUrl = null;
      let mediaType = null;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('post-media')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('post-media')
          .getPublicUrl(fileName);

        publicMediaUrl = urlData.publicUrl;
        mediaType = fileType;
      }

      const { error } = await supabase.from('messages').insert([
        {
          conversation_id: activeConversation.id,
          sender_id: session.user.id,
          content: newMessage,
          media_url: publicMediaUrl,
          media_type: mediaType
        }
      ]);

      if (error) throw error;

      setNewMessage('');
      setSelectedFile(null);
      setFileType(null);
    } catch (err) {
      alert(err.message || 'Error sending message');
    }
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] rounded-xl border border-[#e4e6eb] bg-white shadow-xs overflow-hidden">
      {/* Conversations Sidebar */}
      <div className={`w-full md:w-80 border-r border-[#e4e6eb] flex flex-col ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-3 border-b border-[#e4e6eb]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#65676b]" />
            <input
              type="text"
              placeholder="Search chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full bg-[#f0f2f5] pl-9 pr-4 py-1.5 text-sm focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-[#006837]" /></div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#65676b]">No chats available yet.</div>
          ) : (
            conversations
              .filter((c) => c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveConversation(chat)}
                  className={`w-full flex items-center gap-3 p-3 text-left hover:bg-[#f0f2f5] transition-colors border-b border-gray-100 ${
                    activeConversation?.id === chat.id ? 'bg-[#e7f3ed]' : ''
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#006837] text-white font-bold">
                    {chat.partnerName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{chat.partnerName}</h4>
                    <p className="text-xs text-[#65676b] truncate">Tap to open messages</p>
                  </div>
                </button>
              ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-[#efeae2] ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 p-3 bg-white border-b border-[#e4e6eb]">
              <button onClick={() => setActiveConversation(null)} className="md:hidden text-gray-600">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#006837] text-white font-bold">
                {activeConversation.partnerName[0]}
              </div>
              <div>
                <h3 className="font-semibold text-sm">{activeConversation.partnerName}</h3>
                <span className="text-[11px] text-green-600">Active now</span>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMe = msg.sender_id === session.user.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-lg p-2.5 shadow-xs text-sm ${isMe ? 'bg-[#d9fdd3] text-gray-900' : 'bg-white text-gray-900'}`}>
                      {msg.content && <p className="whitespace-pre-line">{msg.content}</p>}
                      {msg.media_url && msg.media_type === 'image' && (
                        <img src={msg.media_url} alt="Attachment" className="mt-1 rounded max-h-60 object-cover" />
                      )}
                      {msg.media_url && msg.media_type === 'audio' && (
                        <audio controls className="mt-1 w-full">
                          <source src={msg.media_url} />
                        </audio>
                      )}
                      <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-gray-500">
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && (msg.is_read ? <CheckCheck className="h-3 w-3 text-blue-500" /> : <Check className="h-3 w-3" />)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Selected File Badge */}
            {selectedFile && (
              <div className="bg-white px-4 py-2 border-t border-gray-200 flex items-center justify-between text-xs">
                <span>Attached: {selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)} className="text-red-500"><X className="h-4 w-4" /></button>
              </div>
            )}

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-[#e4e6eb] flex items-center gap-2">
              <label className="cursor-pointer text-gray-500 hover:text-green-600">
                <Image className="h-5 w-5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { setSelectedFile(e.target.files[0]); setFileType('image'); }}
                />
              </label>
              <label className="cursor-pointer text-gray-500 hover:text-blue-600">
                <Mic className="h-5 w-5" />
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => { setSelectedFile(e.target.files[0]); setFileType('audio'); }}
                />
              </label>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-full border border-[#e4e6eb] bg-[#f0f2f5] px-4 py-2 text-sm focus:outline-none"
              />
              <button type="submit" className="rounded-full bg-[#006837] p-2 text-white hover:bg-[#004d28]">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-[#65676b]">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
