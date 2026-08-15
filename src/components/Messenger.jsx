import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  Send, 
  Phone, 
  Video, 
  Info, 
  Bot, 
  Image as ImageIcon, 
  Smile, 
  ThumbsUp,
  MoreHorizontal,
  Edit
} from 'lucide-react';

export default function Messenger({ session }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAiMode, setIsAiMode] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser && !isAiMode) {
      fetchMessages(selectedUser.id);

      const subscription = supabase
        .channel(`chat:${session.user.id}-${selectedUser.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          if (
            (payload.new.sender_id === selectedUser.id && payload.new.receiver_id === session.user.id) ||
            (payload.new.sender_id === session.user.id && payload.new.receiver_id === selectedUser.id)
          ) {
            setMessages((prev) => [...prev, payload.new]);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [selectedUser, isAiMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', session.user.id);
    if (data) setUsers(data);
  };

  const fetchMessages = async (receiverId) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${session.user.id})`)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  };

  const selectUserChat = (user) => {
    setIsAiMode(false);
    setSelectedUser(user);
  };

  const selectAiChat = () => {
    setIsAiMode(true);
    setSelectedUser({ id: 'meta-ai', full_name: 'Meta AI', department: 'Campus AI Assistant' });
    setMessages([
      {
        id: 'ai-welcome',
        sender_id: 'meta-ai',
        content: 'Hi! I am Meta AI for ADUSTECH Connect. How can I help you with your courses or campus information today?',
        created_at: new Date().toISOString()
      }
    ]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const userText = newMessage.trim();
    setNewMessage('');

    if (isAiMode) {
      const userMsg = {
        id: Date.now().toString(),
        sender_id: session.user.id,
        content: userText,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, userMsg]);

      // Simulated Meta AI Response
      setTimeout(() => {
        const aiMsg = {
          id: (Date.now() + 1).toString(),
          sender_id: 'meta-ai',
          content: `I received your prompt: "${userText}". How else can I assist you with ADUSTECH resources?`,
          created_at: new Date().toISOString()
        };
        setMessages((prev) => [...prev, aiMsg]);
      }, 800);
      return;
    }

    setUploading(true);
    try {
      const payload = {
        sender_id: session.user.id,
        receiver_id: selectedUser.id,
        content: userText,
      };

      const { error } = await supabase.from('messages').insert([payload]);
      if (error) throw error;

      fetchMessages(selectedUser.id);
    } catch (err) {
      alert('Failed to send message: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const filteredUsers = users.filter((u) => 
    (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white text-[#050505] h-[calc(100vh-80px)] flex rounded-2xl border border-[#e4e6eb] overflow-hidden shadow-xs">
      {/* Left Column: Facebook Messenger Sidebar */}
      <div className={`w-full md:w-80 border-r border-[#e4e6eb] flex flex-col bg-white ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#e4e6eb] flex items-center justify-between">
          <h1 className="text-xl font-black tracking-tight text-[#050505]">Chats</h1>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full bg-[#f0f2f5] hover:bg-[#e4e6eb] text-[#050505] transition-colors">
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messenger Search Bar */}
        <div className="px-3 py-2">
          <div className="bg-[#f0f2f5] rounded-full flex items-center px-3 py-2 gap-2 text-[#65676b]">
            <Search className="w-4 h-4 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Messenger"
              className="bg-transparent text-xs text-[#050505] placeholder-[#65676b] outline-none w-full"
            />
          </div>
        </div>

        {/* Contacts & AI List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {/* Facebook Meta AI Section */}
          <div
            onClick={selectAiChat}
            className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
              isAiMode ? 'bg-[#e7f3ff]' : 'hover:bg-[#f0f2f5]'
            }`}
          >
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 via-[#1877f2] to-cyan-400 p-[2px]">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-[#1877f2]" />
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-[#050505] truncate">Meta AI</h3>
                <span className="text-[10px] text-[#1877f2] font-semibold">AI Assistant</span>
              </div>
              <p className="text-[11px] text-[#65676b] truncate">Ask Meta AI anything...</p>
            </div>
          </div>

          <div className="my-2 border-t border-[#e4e6eb] px-2 pt-2">
            <span className="text-[11px] font-bold text-[#65676b]">Direct Messages</span>
          </div>

          {/* User Conversations List */}
          {filteredUsers.map((u) => {
            const isSelected = selectedUser?.id === u.id && !isAiMode;
            return (
              <div
                key={u.id}
                onClick={() => selectUserChat(u)}
                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                  isSelected ? 'bg-[#e7f3ff]' : 'hover:bg-[#f0f2f5]'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-[#1877f2] text-white flex items-center justify-center font-bold text-base shrink-0">
                  {u.full_name ? u.full_name[0].toUpperCase() : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h3 className={`text-xs truncate ${isSelected ? 'font-bold text-[#1877f2]' : 'font-semibold text-[#050505]'}`}>
                      {u.full_name || 'ADUSTECH Student'}
                    </h3>
                  </div>
                  <p className="text-[11px] text-[#65676b] truncate">{u.department || 'Student'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Active Conversation Pane */}
      <div className={`flex-1 flex flex-col bg-white ${selectedUser ? 'flex' : 'hidden md:flex'}`}>
        {selectedUser ? (
          <>
            {/* Facebook Messenger Header */}
            <div className="h-14 px-4 border-b border-[#e4e6eb] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  onClick={() => { setSelectedUser(null); setIsAiMode(false); }} 
                  className="md:hidden text-[#1877f2] font-bold text-sm mr-1"
                >
                  ←
                </button>

                {isAiMode ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 via-[#1877f2] to-cyan-400 p-[2px] shrink-0">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5 text-[#1877f2]" />
                    </div>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#1877f2] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {selectedUser.full_name ? selectedUser.full_name[0].toUpperCase() : 'U'}
                  </div>
                )}

                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-[#050505] truncate">{selectedUser.full_name || 'Student'}</h3>
                  <p className="text-[10px] text-[#65676b] truncate">{selectedUser.department || 'Active now'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[#1877f2]">
                <button className="p-2 rounded-full hover:bg-[#f0f2f5] transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-[#f0f2f5] transition-colors">
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-[#f0f2f5] transition-colors">
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Body (Facebook Blue & Gray Bubbles) */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white">
              {messages.map((msg) => {
                const isMe = msg.sender_id === session.user.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-xs shadow-2xs leading-relaxed ${
                        isMe 
                          ? 'bg-[#1877f2] text-white rounded-br-xs' 
                          : 'bg-[#f0f2f5] text-[#050505] rounded-bl-xs'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <span className={`text-[9px] mt-1 block text-right ${isMe ? 'text-blue-100' : 'text-[#65676b]'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Messenger Input Footer */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-[#e4e6eb] bg-white flex items-center gap-2">
              <div className="flex items-center gap-1 text-[#1877f2]">
                <button type="button" className="p-2 rounded-full hover:bg-[#f0f2f5] transition-colors">
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button type="button" className="p-2 rounded-full hover:bg-[#f0f2f5] transition-colors">
                  <Smile className="w-5 h-5" />
                </button>
              </div>

              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isAiMode ? "Ask Meta AI..." : "Aa"}
                className="flex-1 bg-[#f0f2f5] text-[#050505] placeholder-[#65676b] rounded-full px-4 py-2 text-xs outline-none"
              />

              {newMessage.trim() ? (
                <button
                  type="submit"
                  disabled={uploading}
                  className="p-2 text-[#1877f2] hover:bg-[#f0f2f5] rounded-full transition-colors disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              ) : (
                <button type="button" className="p-2 text-[#1877f2] hover:bg-[#f0f2f5] rounded-full transition-colors">
                  <ThumbsUp className="w-5 h-5" />
                </button>
              )}
            </form>
          </>
        ) : (
          /* Empty Chat View */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
            <div className="w-16 h-16 rounded-full bg-[#e7f3ff] flex items-center justify-center text-[#1877f2] mb-3">
              <Bot className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-[#050505]">Select a conversation or ask Meta AI</h2>
            <p className="text-xs text-[#65676b] mt-1 max-w-xs">
              Choose a contact from the left sidebar or start a prompt with Meta AI.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
