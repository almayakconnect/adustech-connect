import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Eye, X, Loader2, Image } from 'lucide-react';

export default function StatusStories({ session }) {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStory, setActiveStory] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewers, setViewers] = useState([]);
  const fileInputRef = useRef(null);

  const fetchStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('statuses')
        .select(`
          id, content, media_url, media_type, created_at, expires_at, user_id,
          profiles:user_id ( full_name, avatar_url )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStatuses(data || []);
    } catch (err) {
      console.error('Error loading stories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchStatuses();
  }, [session]);

  const handleOpenStory = async (story) => {
    setActiveStory(story);
    if (story.user_id !== session.user.id) {
      // Record story view
      await supabase.from('status_views').insert([
        { status_id: story.id, viewer_id: session.user.id }
      ]).single();
    } else {
      // Fetch view count for own story
      const { data } = await supabase
        .from('status_views')
        .select('viewer_id, viewed_at')
        .eq('status_id', story.id);
      setViewers(data || []);
    }
  };

  const handleCreateStory = async (e) => {
    e.preventDefault();
    if (!storyText.trim() && !selectedFile) return;

    setIsUploading(true);
    try {
      let publicMediaUrl = null;
      let mediaType = null;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${session.user.id}/story_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('post-media')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('post-media')
          .getPublicUrl(fileName);

        publicMediaUrl = urlData.publicUrl;
        mediaType = 'image';
      }

      const { error } = await supabase.from('statuses').insert([
        {
          user_id: session.user.id,
          content: storyText,
          media_url: publicMediaUrl,
          media_type: mediaType
        }
      ]);

      if (error) throw error;

      setIsCreating(false);
      setStoryText('');
      setSelectedFile(null);
      fetchStatuses();
    } catch (err) {
      alert(err.message || 'Failed to post story.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {/* Create Story Button */}
        <button
          onClick={() => setIsCreating(true)}
          className="relative flex h-40 w-28 shrink-0 flex-col items-center justify-end rounded-xl border border-[#e4e6eb] bg-white p-2 shadow-xs transition-transform hover:scale-[1.02]"
        >
          <div className="absolute top-8 flex h-10 w-10 items-center justify-center rounded-full bg-[#006837] text-white shadow-md">
            <Plus className="h-6 w-6" />
          </div>
          <span className="text-center font-semibold text-xs text-gray-800">Add Story</span>
        </button>

        {/* Stories List */}
        {loading ? (
          <div className="flex h-40 w-28 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-[#006837]" /></div>
        ) : (
          statuses.map((story) => (
            <button
              key={story.id}
              onClick={() => handleOpenStory(story)}
              className="relative h-40 w-28 shrink-0 overflow-hidden rounded-xl border-2 border-[#006837] bg-gray-900 p-2 text-left text-white shadow-xs transition-transform hover:scale-[1.02]"
            >
              {story.media_url ? (
                <img src={story.media_url} alt="Story" className="absolute inset-0 h-full w-full object-cover opacity-80" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-[#006837] to-emerald-900" />
              )}
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#006837] border-2 border-white font-bold text-xs">
                  {story.profiles?.full_name?.[0] || 'A'}
                </div>
                <p className="line-clamp-2 text-xs font-medium drop-shadow-md">
                  {story.content || story.profiles?.full_name}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Story View Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button onClick={() => setActiveStory(null)} className="absolute top-4 right-4 text-white hover:text-gray-300">
            <X className="h-8 w-8" />
          </button>
          <div className="relative max-w-sm w-full rounded-2xl bg-gray-900 p-4 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#006837] font-bold">
                {activeStory.profiles?.full_name?.[0] || 'A'}
              </div>
              <div>
                <h4 className="font-semibold text-sm">{activeStory.profiles?.full_name || 'Student'}</h4>
                <p className="text-[10px] text-gray-400">{new Date(activeStory.created_at).toLocaleTimeString()}</p>
              </div>
            </div>

            {activeStory.media_url && (
              <img src={activeStory.media_url} alt="Story" className="max-h-80 w-full rounded-lg object-contain mb-3" />
            )}
            {activeStory.content && <p className="text-sm font-medium mb-3">{activeStory.content}</p>}

            {activeStory.user_id === session.user.id && (
              <div className="flex items-center gap-2 border-t border-gray-700 pt-2 text-xs text-gray-400">
                <Eye className="h-4 w-4" /> {viewers.length} views
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Story Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-800">Create Campus Story</h3>
              <button onClick={() => setIsCreating(false)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCreateStory} className="mt-4 space-y-4">
              <textarea
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                placeholder="What's happening on campus?"
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006837]"
                rows={3}
              />
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Image className="h-4 w-4 text-green-600" />
                  {selectedFile ? selectedFile.name : 'Add Photo'}
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="rounded-lg bg-[#006837] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004d28] disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading && <Loader2 className="h-4 w-4 animate-spin" />} Post Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
