import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Home, Users, MessageCircle, Store, Tv, Bell, Menu, 
  Search, Plus, Send, CheckCircle2, UserPlus, Bot 
} from 'lucide-[#8696a0]' ? { Home, Users, MessageCircle, Store, Tv, Bell, Menu, Search, Plus, Send, CheckCircle2, UserPlus, Bot } : import('lucide-react');

export default function FacebookClone({ session }) {
  const [activeTab, setActiveTab] = useState('feed'); // feed, friends, messages, marketplace, reels, menu
  const [users, setUsers] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null); // profile or 'meta_ai'
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchUsers();
    fetchFriendRequests();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').neq('id', session.user.id);
    if (data) setUsers(data);
  };

  const fetchFriendRequests = async () => {
    const { data } = await supabase
      .from('friendships')
      .select('*, requester:profiles!requester_id(*)')
      .eq('receiver_id', session.user.id)
      .eq('status', 'pending');
    if (data) setFriendRequests(data);
  };

  const fetchMessages = async () => {
    if (!selectedChat) return;
    if (selectedChat === 'meta_ai') {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', session.user.id)
        .eq('is_ai', true)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    } else {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${selectedChat.id}),and(sender_id.eq.${selectedChat.id},receiver_id.eq.${session.user.id})`)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    }
  };

  const sendFriendRequest = async (targetId) => {
    await supabase.from('friendships').insert([
      { requester_id: session.user.id, receiver_id: targetId, status: 'pending' }
    ]);
    alert('Friend request sent!');
  };

  const acceptFriendRequest = async (requestId) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', requestId);
    fetchFriendRequests();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const userText = newMessage.trim();
    setNewMessage('');

    if (selectedChat === 'meta_ai') {
      // Append local user message
      const localMsg = { id: Date.now(), sender_id: session.user.id, content: userText, created_at: new Date().toISOString() };
      setMessages((prev) => [...prev, localMsg]);
      setIsAiLoading(true);

      // Simulated AI response speed
      setTimeout(async () => {
        const aiResponse = `Meta AI response: I am assisting with your query regarding "${userText}".`;
        await supabase.from('messages').insert([
          { sender_id: session.user.id, content: userText, is_ai: true },
          { sender_id: session.user.id, content: aiResponse, is_ai: true }
        ]);
        setIsAiLoading(false);
        fetchMessages();
      }, 1000);
    } else {
      await supabase.from('messages').insert([
        { sender_id: session.user.id, receiver_id: selectedChat.id, content: userText }
      ]);
      fetchMessages();
    }
  };

  return (
    <div className="bg-[#18191a] text-[#e4e6eb] min-h-screen flex flex-col max-w-md mx-auto relative border-x border-[#393a3b]">
      {/* Top Header Navigation */}
      <div className="bg-[#242526] border-b border-[#393a3b] sticky top-0 z-50">
        <div className="flex justify-between items-center px-4 pt-3 pb-1">
          <h1 className="text-2xl font-bold text-[#2d88ff] tracking-tight">facebook</h1>
          <div className="flex items-center gap-2">
            <button className="p-2 bg-[#3a3b3c] rounded-full text-white"><Plus className="w-4 h-4" /></button>
            <button className="p-2 bg-[#3a3b3c] rounded-full text-white"><Search className="w-4 h-4" /></button>
            <button className="p-2 bg-[#3a3b3c] rounded-full text-white"><Menu className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-around border-t border-[#393a3b] pt-2 pb-1 text-[#b0b3b8]">
          <button onClick={() => { setActiveTab('feed'); setSelectedChat(null); }} className={`p-2 ${activeTab === 'feed' ? 'text-[#2d88ff] border-b-2 border-[#2d88ff]' : ''}`}><Home className="w-6 h-6" /></button>
          <button onClick={() => { setActiveTab('friends'); setSelectedChat(null); }} className={`p-2 ${activeTab === 'friends' ? 'text-[#2d88ff] border-b-2 border-[#2d88ff]' : ''}`}><Users className="w-6 h-6" /></button>
          <button onClick={() => { setActiveTab('messages'); setSelectedChat(null); }} className={`p-2 ${activeTab === 'messages' ? 'text-[#2d88ff] border-b-2 border-[#2d88ff]' : ''}`}><MessageCircle className="w-6 h-6" /></button>
          <button onClick={() => { setActiveTab('marketplace'); setSelectedChat(null); }} className={`p-2 ${activeTab === 'marketplace' ? 'text-[#2d88ff] border-b-2 border-[#2d88ff]' : ''}`}><Store className="w-6 h-6" /></button>
          <button onClick={() => { setActiveTab('reels'); setSelectedChat(null); }} className={`p-2 ${activeTab === 'reels' ? 'text-[#2d88ff] border-b-2 border-[#2d88ff]' : ''}`}><Tv className="w-6 h-6" /></button>
          <button onClick={() => { setActiveTab('menu'); setSelectedChat(null); }} className={`p-2 ${activeTab === 'menu' ? 'text-[#2d88ff] border-b-2 border-[#2d88ff]' : ''}`}><Bell className="w-6 h-6" /></button>
        </div>
      </div>

      {/* Main Screen Router */}
      <div className="flex-1 overflow-y-auto">
        {selectedChat ? (
          /* Chat Screen (Direct or Meta AI) */
          <div className="flex flex-col h-[calc(100vh-105px)] bg-[#18191a]">
            <div className="bg-[#242526] px-3 py-2 flex items-center justify-between border-b border-[#393a3b]">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedChat(null)} className="text-[#b0b3b8] text-lg font-bold">←</button>
                <div className="w-8 h-8 rounded-full bg-[#2d88ff] text-white flex items-center justify-center font-bold text-xs">
                  {selectedChat === 'meta_ai' ? <Bot className="w-5 h-5" /> : (selectedChat.full_name ? selectedChat.full_name[0] : 'U')}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#e4e6eb]">
                    {selectedChat === 'meta_ai' ? 'Meta AI' : (selectedChat.full_name || 'Facebook User')}
                  </h3>
                  <p className="text-[10px] text-[#b0b3b8]">Active now</p>
                </div>
              </div>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-2">
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === session.user.id && !msg.is_ai;
                return (
                  <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs ${isMe ? 'bg-[#2d88ff] text-white' : 'bg-[#3a3b3c] text-[#e4e6eb]'}`}>
                      <p>{msg.content}</p>
                    </div>
                  </div>
                );
              })}
              {isAiLoading && <p className="text-xs text-[#b0b3b8] italic">Meta AI is thinking...</p>}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="bg-[#242526] p-2 flex items-center gap-2 border-t border-[#393a3b]">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Message..."
                className="flex-1 bg-[#3a3b3c] text-[#e4e6eb] placeholder-[#b0b3b8] rounded-full px-4 py-2 text-xs outline-none"
              />
              <button type="submit" className="p-2 bg-[#2d88ff] text-white rounded-full"><Send className="w-4 h-4" /></button>
            </form>
          </div>
        ) : (
          <>
            {/* Feed View */}
            {activeTab === 'feed' && (
              <div className="p-3 space-y-3">
                <div className="bg-[#242526] p-3 rounded-lg flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#3a3b3c]" />
                  <input placeholder="What's on your mind?" className="bg-transparent text-xs text-[#e4e6eb] outline-none flex-1" />
                </div>
                <div className="bg-[#242526] p-3 rounded-lg border border-[#393a3b]">
                  <p className="text-xs font-semibold text-[#2d88ff]">KUST WUDIL / ADUSTECH Official Feed</p>
                  <p className="text-xs text-[#e4e6eb] mt-1">Welcome to the integrated student network platform.</p>
                </div>
              </div>
            )}

            {/* Friends / Friend Requests View */}
            {activeTab === 'friends' && (
              <div className="p-3 space-y-4">
                {friendRequests.length > 0 && (
                  <div>
                    <h2 className="text-sm font-bold text-[#e4e6eb] mb-2">Friend Requests</h2>
                    {friendRequests.map((req) => (
                      <div key={req.id} className="flex items-center justify-between bg-[#242526] p-2 rounded-lg mb-2">
                        <span className="text-xs">{req.requester?.full_name || 'Student'}</span>
                        <button onClick={() => acceptFriendRequest(req.id)} className="bg-[#2d88ff] text-white text-xs px-3 py-1 rounded-md">Confirm</button>
                      </div>
                    ))}
                  </div>
                )}

                <h2 className="text-sm font-bold text-[#e4e6eb]">People You May Know</h2>
                <div className="space-y-2">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between bg-[#242526] p-2.5 rounded-lg border border-[#393a3b]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#3a3b3c] flex items-center justify-center text-xs font-bold">{u.full_name ? u.full_name[0] : 'U'}</div>
                        <div>
                          <p className="text-xs font-semibold text-[#e4e6eb]">{u.full_name || 'ADUSTECH Student'}</p>
                          <p className="text-[10px] text-[#b0b3b8]">{u.department || 'Student'}</p>
                        </div>
                      </div>
                      <button onClick={() => sendFriendRequest(u.id)} className="bg-[#3a3b3c] hover:bg-[#4e4f50] text-xs px-3 py-1.5 rounded-md flex items-center gap-1 text-white">
                        <UserPlus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages List + Meta AI View */}
            {activeTab === 'messages' && (
              <div className="p-3 space-y-2">
                <div onClick={() => setSelectedChat('meta_ai')} className="flex items-center gap-3 bg-[#242526] p-3 rounded-lg cursor-pointer border border-[#2d88ff]/40">
                  <div className="w-10 h-10 rounded-full bg-[#2d88ff] flex items-center justify-center text-white"><Bot className="w-5 h-5" /></div>
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-[#e4e6eb]">Meta AI</h3>
                    <p className="text-[10px] text-[#b0b3b8] truncate">Ask me anything or clear concepts...</p>
                  </div>
                </div>

                {users.map((u) => (
                  <div key={u.id} onClick={() => setSelectedChat(u)} className="flex items-center gap-3 bg-[#242526] p-3 rounded-lg cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-[#3a3b3c] flex items-center justify-center text-xs font-bold">{u.full_name ? u.full_name[0] : 'U'}</div>
                    <div className="flex-1">
                      <h3 className="text-xs font-semibold text-[#e4e6eb]">{u.full_name || 'Facebook User'}</h3>
                      <p className="text-[10px] text-[#b0b3b8]">Tap to open conversation</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Marketplace Grid View */}
            {activeTab === 'marketplace' && (
              <div className="p-3 grid grid-cols-2 gap-2">
                <div className="bg-[#242526] p-2 rounded-lg border border-[#393a3b]">
                  <div className="h-24 bg-[#3a3b3c] rounded mb-2 flex items-center justify-center text-xs text-[#b0b3b8]">Gas Cylinder</div>
                  <p className="text-xs font-bold text-[#e4e6eb]">NGN 16,000</p>
                  <p className="text-[10px] text-[#b0b3b8]">Gas 3kg - Wudil</p>
                </div>
                <div className="bg-[#242526] p-2 rounded-lg border border-[#393a3b]">
                  <div className="h-24 bg-[#3a3b3c] rounded mb-2 flex items-center justify-center text-xs text-[#b0b3b8]">iPhone 13</div>
                  <p className="text-xs font-bold text-[#e4e6eb]">NGN 350,000</p>
                  <p className="text-[10px] text-[#b0b3b8]">iPhone 13 Normal - Kano</p>
                </div>
              </div>
            )}

            {/* Menu View */}
            {activeTab === 'menu' && (
              <div className="p-3 grid grid-cols-2 gap-2">
                {['Messages', 'Groups', 'Friends', 'Reels', 'Marketplace', 'Meta AI', 'Pages', 'Saved'].map((item, idx) => (
                  <div key={idx} className="bg-[#242526] p-3 rounded-lg text-xs font-semibold text-[#e4e6eb] border border-[#393a3b]">
                    {item}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
