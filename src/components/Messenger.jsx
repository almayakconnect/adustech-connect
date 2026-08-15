import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Image, Mic, Square, Paperclip, CheckCheck, Loader2 } from 'lucide-react';

export default function Messenger({ session }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
      
      // Realtime subscription for instant messaging
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

  const handleMediaSelect = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaType(type);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        setMediaFile(file);
        setMediaType('audio');
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access is required to record voice notes.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !mediaFile) || !selectedUser) return;

    setUploading(true);
    let mediaUrl = null;

    try {
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, mediaFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName);

        mediaUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase.from('messages').insert([
        {
          sender_id: session.user.id,
          receiver_id: selectedUser.id,
          content: newMessage,
          media_url: mediaUrl,
          media_type: mediaType,
        },
      ]);

      if (error) throw error;

      setNewMessage('');
      setMediaFile(null);
      setMediaType(null);
      fetchMessages(selectedUser.id);
    } catch (err) {
      alert('Failed to send message: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 h-[650px] flex overflow-hidden">
      
      {/* WhatsApp Sidebar - User List */}
      <div className="w-full md:w-1/3 border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="font-bold text-sm text-slate-800">Messages</h2>
          <p className="text-[11px] text-slate-500">Connect with ADUSTECH students</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelectedUser(u)}
              className={`w-full p-3.5 flex items-center gap-3 transition text-left hover:bg-slate-100/80 ${
                selectedUser?.id === u.id ? 'bg-emerald-50/80 border-l-4 border-emerald-600' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {u.full_name ? u.full_name[0] : 'U'}
              </div>
              <div className="overflow-hidden flex-1">
                <h4 className="font-semibold text-xs text-slate-800 truncate">{u.full_name || 'Student'}</h4>
                <p className="text-[10px] text-slate-500 truncate">{u.department || 'ADUSTECH Student'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Stream */}
      <div className="hidden md:flex flex-1 flex-col bg-[#efeae2]/30">
        {selectedUser ? (
          <>
            {/* Active Contact Header */}
            <div className="p-3 bg-white border-b border-slate-200 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                {selectedUser.full_name ? selectedUser.full_name[0] : 'U'}
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-800">{selectedUser.full_name}</h3>
                <p className="text-[10px] text-emerald-600 font-medium">{selectedUser.department || 'Active now'}</p>
              </div>
            </div>

            {/* Conversation Window */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMe = msg.sender_id === session.user.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl p-3 text-xs shadow-sm space-y-1.5 ${
                        isMe ? 'bg-emerald-700 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/60'
                      }`}
                    >
                      {msg.content && <p className="leading-relaxed">{msg.content}</p>}

                      {msg.media_url && msg.media_type === 'image' && (
                        <img src={msg.media_url} alt="Attachment" className="rounded-lg max-h-48 object-cover w-full" />
                      )}

                      {msg.media_url && msg.media_type === 'audio' && (
                        <audio controls className="w-full min-w-[200px]">
                          <source src={msg.media_url} />
                        </audio>
                      )}

                      <div className={`text-[9px] flex items-center justify-end gap-1 ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && <CheckCheck className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Media Preview Attachment Banner */}
            {mediaFile && (
              <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-200 flex justify-between items-center text-xs text-emerald-800">
                <span className="font-medium truncate max-w-[250px]">Attached: {mediaFile.name}</span>
                <button onClick={() => { setMediaFile(null); setMediaType(null); }} className="text-red-500 font-bold ml-2">Remove</button>
              </div>
            )}

            {/* Message Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <label className="p-2 text-slate-500 hover:text-emerald-600 rounded-full hover:bg-slate-100 cursor-pointer transition">
                <Image className="w-5 h-5" />
                <input type="file" accept="image/*" onChange={(e) => handleMediaSelect(e, 'image')} className="hidden" />
              </label>

              {isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-full animate-pulse transition flex items-center gap-1 text-xs font-bold"
                >
                  <Square className="w-4 h-4 fill-red-600" />
                  <span>Recording...</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="p-2 text-slate-500 hover:text-emerald-600 rounded-full hover:bg-slate-100 transition"
                  title="Voice Note"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}

              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-slate-100 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 border border-slate-200 rounded-full px-4 py-2 text-xs text-slate-800 outline-none transition"
              />

              <button
                type="submit"
                disabled={uploading || (!newMessage.trim() && !mediaFile)}
                className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white p-2.5 rounded-full transition flex items-center justify-center"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <p className="text-sm font-semibold">Select a student from the sidebar to begin chatting</p>
          </div>
        )}
      </div>

    </div>
  );
}
