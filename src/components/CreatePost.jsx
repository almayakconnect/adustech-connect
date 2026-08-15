import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Image, Video, Smile, Send, Loader2 } from 'lucide-react';

export default function CreatePost({ session, onPostCreated }) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('posts').insert([
        {
          user_id: session.user.id,
          content: content.trim(),
          image_url: imageUrl.trim() || null,
        },
      ]);

      if (error) throw error;

      setContent('');
      setImageUrl('');
      setShowImageInput(false);
      if (onPostCreated) onPostCreated();
    } catch (err) {
      alert('Error creating post: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#e4e6eb] bg-white p-4 shadow-xs">
      {/* Top Input Row */}
      <div className="flex items-center gap-3 border-b border-[#e4e6eb] pb-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1877f2] font-bold text-white">
          {session?.user?.email?.[0].toUpperCase() || 'U'}
        </div>
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`What's on your mind, ${session?.user?.email?.split('@')[0]}?`}
          className="w-full rounded-full bg-[#f0f2f5] px-4 py-2.5 text-xs text-[#050505] placeholder-[#65676b] outline-hidden hover:bg-[#e4e6eb] transition-colors"
        />
      </div>

      {/* Optional Image URL Bar */}
      {showImageInput && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Paste image URL here..."
            className="w-full rounded-lg border border-[#e4e6eb] bg-[#f0f2f5] px-3 py-1.5 text-xs text-[#050505] outline-hidden"
          />
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="mt-3 flex items-center justify-between pt-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowImageInput(!showImageInput)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#65676b] hover:bg-[#f0f2f5] transition-colors"
          >
            <Image className="h-5 w-5 text-[#45bd62]" />
            <span className="hidden sm:inline">Photo/video</span>
          </button>
          
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#65676b] hover:bg-[#f0f2f5] transition-colors"
          >
            <Video className="h-5 w-5 text-[#f3425f]" />
            <span className="hidden sm:inline">Live video</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#65676b] hover:bg-[#f0f2f5] transition-colors"
          >
            <Smile className="h-5 w-5 text-[#f7b928]" />
            <span className="hidden sm:inline">Feeling/activity</span>
          </button>
        </div>

        {(content.trim() || imageUrl.trim()) && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-[#1877f2] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#166fe5] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Post
          </button>
        )}
      </div>
    </div>
  );
}
