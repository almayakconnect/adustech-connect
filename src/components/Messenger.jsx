import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, Camera, MoreVertical, Archive, CheckCheck, 
  Send, Image as ImageIcon, Mic, MessageSquarePlus, 
  Users, Phone, CircleD触
} from 'lucide-react';

export default function Messenger({ session }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
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
  }, [selectedUser]);

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    setUploading(true);
    try {
      const payload = {
        sender_id: session.user.id,
        receiver_id: selectedUser.id,
        content: newMessage.trim(),
      };

      const { error } = await supabase.from('messages').insert([payload]);
      if (error) throw error;

      setNewMessage('');
      fetchMessages(selectedUser.id);
    } catch (err) {
      alert('Failed to send message: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-[#0b141a] text-[#e9edef] min-h-screen flex flex-col max-w-md mx-auto relative border-x border-[#222d34]">
      {selectedUser ? (
        /* Active Chat View */
        <div className="flex flex-col h-screen">
          {/* WhatsApp Chat Header */}
          <div className="bg-[#202c33] px-3 py-2 flex items-center justify-between border-b border-[#222d34]">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedUser(null)} className="text-[#8696a0] text-xl font-bold">
                ←
              </button>
              <div className="w-9 h-9 rounded-full bg-[#00a884] text-white flex items-center justify-center font-bold text-sm">
                {selectedUser.full_name ? selectedUser.full_name[0] : 'U'}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#e9edef]">{selectedUser.full_name || 'Student'}</h3>
                <p className="text-[10px] text-[#8696a0]">{selectedUser.department || 'ADUSTECH'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[#8696a0]">
              <Phone className="w-5 h-5 cursor-pointer" />
              <MoreVertical className="w-5 h-5 cursor-pointer" />
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 bg-[#0b141a] p-4 overflow-y-auto space-y-2 bg-[radial-gradient(#202c33_1px,transparent_1px)] [background-size:16px_16px]">
            {messages.map((msg) => {
              const isMe = msg.sender_id === session.user.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-1.5 text-xs shadow-sm ${
                      isMe ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none' : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.content}</p>
                    <div className="text-[9px] text-[#8696a0] flex items-center justify-end gap-1 mt-1">
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-[#53bdeb]" />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="bg-[#202c33] p-2 flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message"
              className="flex-1 bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0] rounded-full px-4 py-2 text-xs border-none outline-none"
            />
            <button
              type="submit"
              disabled={uploading || !newMessage.trim()}
              className="bg-[#00a884] text-white p-2.5 rounded-full hover:bg-[#008f6f] disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        /* WhatsApp Chat List View */
        <div className="flex flex-col h-screen">
          {/* Header */}
          <div className="bg-[#111b21] p-4 pb-2">
            <div className="flex justify-between items-center mb-3">
              <h1 className="text-xl font-bold text-[#e9edef]">WhatsApp</h1>
              <div className="flex items-center gap-5 text-[#8696a0]">
                <Camera className="w-5 h-5 cursor-pointer" />
                <MoreVertical className="w-5 h-5 cursor-pointer" />
              </div>
            </div>

            {/* Search Bar */}
            <div className="bg-[#202c33] rounded-full flex items-center px-4 py-2 gap-3 text-[#8696a0]">
              <Search className="w-4 h-4" />
              <input
                type="text"
                placeholder="Ask Meta AI or Search"
                className="bg-transparent text-xs text-[#e9edef] placeholder-[#8696a0] outline-none w-full"
              />
            </div>
          </div>

          {/* Archived Row */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#222d34] text-[#8696a0] text-xs font-medium cursor-pointer">
            <div className="flex items-center gap-4">
              <Archive className="w-4 h-4" />
              <span>Archived</span>
            </div>
            <span className="text-[#00a884] font-bold text-[11px]">8</span>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#222d34]/40">
            {users.map((u) => (
              <div
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-[#00a884] text-white flex items-center justify-center font-bold text-base flex-shrink-0">
                  {u.full_name ? u.full_name[0] : 'U'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center mb-0.5">
                    <h3 className="text-sm font-semibold text-[#e9edef] truncate">{u.full_name || 'ADUSTECH Student'}</h3>
                    <span className="text-[10px] text-[#8696a0]">10:58 AM</span>
                  </div>
                  <p className="text-xs text-[#8696a0] truncate">{u.department || 'Click to start conversation'}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Floating Action Button */}
          <button className="absolute bottom-16 right-4 bg-[#00a884] text-[#111b21] p-3.5 rounded-2xl shadow-lg font-bold">
            <MessageSquarePlus className="w-6 h-6" />
          </button>

          {/* Bottom Navigation */}
          <div className="bg-[#111b21] border-t border-[#222d34] flex justify-around py-2 text-[11px] text-[#8696a0]">
            <button className="flex flex-col items-center gap-1 text-[#00a884] font-semibold">
              <div className="bg-[#103629] px-4 py-1 rounded-full">💬</div>
              <span>Chats</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <div>⭕</div>
              <span>Updates</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <div>👥</div>
              <span>Communities</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <div>📞</div>
              <span>Calls</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
