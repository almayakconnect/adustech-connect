import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { 
  Home, Users, MessageSquare, Bell, BookOpen, FileText, 
  Settings, User, Search, LogOut, Image, Mic, Send, ThumbsUp, 
  Share2, AlertCircle, Loader2, X 
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [posts, setPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(null);
  const [postContent, setPostContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState(null); // 'image' | 'audio'
  const [isPosting, setIsPosting] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // Auth Session Tracking
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Feed Posts
  const fetchPosts = async () => {
    setFeedLoading(true);
    setFeedError(null);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, content, media_url, media_type, created_at, user_id,
          profiles ( full_name, avatar_url ),
          likes ( count ),
          comments ( id, content, created_at, profiles ( full_name ) )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      setFeedError(err.message || 'Failed to load community feed.');
    } finally {
      setFeedLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchPosts();
  }, [session]);

  // Handle Local File Selection
  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileType(type);
    }
  };

  // Create Post with Optional Media Upload
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postContent.trim() && !selectedFile) return;

    setIsPosting(true);
    try {
      let publicMediaUrl = null;
      let uploadedFileType = null;

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
        uploadedFileType = fileType;
      }

      const { data, error } = await supabase.from('posts').insert([
        { 
          user_id: session.user.id, 
          content: postContent,
          media_url: publicMediaUrl,
          media_type: uploadedFileType
        }
      ]).select(`
        id, content, media_url, media_type, created_at, user_id,
        profiles ( full_name, avatar_url ),
        likes ( count ),
        comments ( id, content, created_at, profiles ( full_name ) )
      `);

      if (error) throw error;
      if (data) setPosts([data[0], ...posts]);
      
      setPostContent('');
      setSelectedFile(null);
      setFileType(null);
    } catch (err) {
      alert(err.message || 'Error posting to feed.');
    } finally {
      setIsPosting(false);
    }
  };

  // Toggle Like
  const handleToggleLike = async (postId) => {
    try {
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (existingLike) {
        await supabase.from('likes').delete().eq('id', existingLike.id);
      } else {
        await supabase.from('likes').insert([{ post_id: postId, user_id: session.user.id }]);
      }
      fetchPosts();
    } catch (err) {
      console.error('Like toggle error:', err);
    }
  };

  // Add Comment
  const handleAddComment = async (postId) => {
    if (!commentText.trim()) return;
    try {
      await supabase.from('comments').insert([
        { post_id: postId, user_id: session.user.id, content: commentText }
      ]);
      setCommentText('');
      fetchPosts();
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  // Native Share
  const handleShare = async (postId) => {
    const shareUrl = `${window.location.origin}/#post-${postId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'ADUSTECH Connect', url: shareUrl });
      } catch (err) {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f0f2f5]">
        <Loader2 className="h-10 w-10 animate-spin text-[#006837]" />
      </div>
    );
  }

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'communities', label: 'Communities', icon: Users },
    { id: 'messenger', label: 'Messenger', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-[#050505]">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-[#e4e6eb] bg-white px-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-[#006837]">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#006837] text-white font-extrabold text-lg">
              A
            </div>
            <span className="hidden sm:inline text-lg tracking-tight">ADUSTECH Connect</span>
          </div>
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-[#65676b]" />
            <input
              type="text"
              placeholder="Search ADUSTECH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-40 rounded-full bg-[#f0f2f5] pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#006837] sm:w-64"
            />
          </div>
        </div>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex h-12 w-16 items-center justify-center border-b-4 transition-colors ${
                  activeTab === item.id
                    ? 'border-[#006837] text-[#006837]'
                    : 'border-transparent text-[#65676b] hover:bg-[#f0f2f5]'
                }`}
              >
                <Icon className="h-6 w-6" />
              </button>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          title="Log Out"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e4e6eb] text-[#050505] hover:bg-[#ced0d4]"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* Main Grid Layout */}
      <div className="mx-auto flex max-w-[1280px] justify-between gap-6 px-0 sm:px-4 pt-4">
        {/* Left Sidebar */}
        <aside className="sticky top-18 hidden h-[calc(100vh-5rem)] w-64 shrink-0 overflow-y-auto lg:block">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-[#e7f3ed] text-[#006837]'
                      : 'text-[#050505] hover:bg-[#e4e6eb]'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center Feed */}
        <main className="min-w-0 flex-1 px-2 sm:px-0 mb-20 md:mb-6">
          <div className="mx-auto max-w-xl space-y-4">
            {/* Create Post Card */}
            <div className="rounded-xl border border-[#e4e6eb] bg-white p-4 shadow-xs">
              <form onSubmit={handleCreatePost}>
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#006837] text-white font-bold">
                    {session?.user?.email?.[0].toUpperCase() || 'U'}
                  </div>
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="What's on your mind, ADUSTECH student?"
                    className="w-full resize-none bg-transparent pt-2 text-sm focus:outline-none"
                    rows={2}
                  />
                </div>

                {/* Selected File Badge */}
                {selectedFile && (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-[#f0f2f5] px-3 py-2 text-xs">
                    <span className="truncate font-medium text-gray-700">
                      [{fileType?.toUpperCase()}] {selectedFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setSelectedFile(null); setFileType(null); }}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={imageInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'image')}
                />
                <input
                  type="file"
                  ref={audioInputRef}
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'audio')}
                />

                <div className="mt-3 flex items-center justify-between border-t border-[#e4e6eb] pt-3">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="flex items-center gap-1 text-xs font-medium text-[#65676b] hover:bg-[#f0f2f5] px-3 py-1.5 rounded-md"
                    >
                      <Image className="h-4 w-4 text-green-600" /> Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      className="flex items-center gap-1 text-xs font-medium text-[#65676b] hover:bg-[#f0f2f5] px-3 py-1.5 rounded-md"
                    >
                      <Mic className="h-4 w-4 text-blue-600" /> Audio
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isPosting || (!postContent.trim() && !selectedFile)}
                    className="rounded-lg bg-[#006837] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#004d28] disabled:opacity-50 flex items-center gap-2"
                  >
                    {isPosting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Post
                  </button>
                </div>
              </form>
            </div>

            {/* Feed States */}
            {feedLoading && (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#006837]" />
              </div>
            )}

            {feedError && (
              <div className="flex items-center justify-between rounded-xl bg-red-50 p-4 text-sm text-red-700">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>{feedError}</span>
                </div>
                <button onClick={fetchPosts} className="font-semibold underline">
                  Retry
                </button>
              </div>
            )}

            {!feedLoading && !feedError && posts.length === 0 && (
              <div className="rounded-xl border border-[#e4e6eb] bg-white p-8 text-center text-[#65676b]">
                No posts yet. Be the first to share something with your campus!
              </div>
            )}

            {/* Feed Posts */}
            {posts.map((post) => (
              <article key={post.id} className="rounded-xl border border-[#e4e6eb] bg-white shadow-xs overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#006837] text-white font-bold">
                      {post.profiles?.full_name?.[0] || 'A'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{post.profiles?.full_name || 'Anonymous Student'}</h4>
                      <p className="text-xs text-[#65676b]">{new Date(post.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {post.content && <p className="mt-3 text-sm text-[#050505] whitespace-pre-line">{post.content}</p>}

                  {/* Render Photo */}
                  {post.media_url && post.media_type === 'image' && (
                    <div className="mt-3 overflow-hidden rounded-lg border border-[#e4e6eb]">
                      <img src={post.media_url} alt="Post Attachment" className="max-h-96 w-full object-cover" />
                    </div>
                  )}

                  {/* Render Audio Player */}
                  {post.media_url && post.media_type === 'audio' && (
                    <div className="mt-3 rounded-lg border border-[#e4e6eb] bg-[#f8f9fa] p-3">
                      <audio controls className="w-full">
                        <source src={post.media_url} />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#e4e6eb] px-4 py-1 flex items-center justify-between text-xs text-[#65676b]">
                  <span>{post.likes?.[0]?.count || 0} Likes</span>
                  <span>{post.comments?.length || 0} Comments</span>
                </div>

                <div className="flex border-t border-[#e4e6eb] px-2 py-1">
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-[#65676b] hover:bg-[#f0f2f5]"
                  >
                    <ThumbsUp className="h-4 w-4" /> Like
                  </button>
                  <button
                    onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-[#65676b] hover:bg-[#f0f2f5]"
                  >
                    <MessageSquare className="h-4 w-4" /> Comment
                  </button>
                  <button
                    onClick={() => handleShare(post.id)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-[#65676b] hover:bg-[#f0f2f5]"
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </button>
                </div>

                {activeCommentPost === post.id && (
                  <div className="border-t border-[#e4e6eb] bg-[#f8f9fa] p-4 space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 rounded-full border border-[#e4e6eb] bg-white px-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#006837]"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="rounded-full bg-[#006837] p-2 text-white hover:bg-[#004d28]"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-2 mt-2">
                      {post.comments?.map((comment) => (
                        <div key={comment.id} className="rounded-lg bg-white p-2.5 text-xs border border-[#e4e6eb]">
                          <span className="font-semibold text-gray-900">{comment.profiles?.full_name || 'Student'}: </span>
                          <span className="text-gray-700">{comment.content}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </main>

        {/* Right Information Panel */}
        <aside className="sticky top-18 hidden h-[calc(100vh-5rem)] w-80 shrink-0 overflow-y-auto xl:block">
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-[#e4e6eb] bg-white p-4 shadow-xs">
              <h3 className="font-semibold text-gray-800">University Announcements</h3>
              <p className="mt-2 text-xs text-[#65676b]">
                Semester examinations commence shortly. Verify your registered courses on the portal.
              </p>
            </div>
            <div className="rounded-xl border border-[#e4e6eb] bg-white p-4 shadow-xs">
              <h3 className="font-semibold text-gray-800">Upcoming Events</h3>
              <div className="mt-2 text-sm">
                <p className="font-medium">ADUSTECH Tech Innovation Fair</p>
                <p className="text-xs text-[#65676b]">Main Auditorium • 10:00 AM</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 border-t border-[#e4e6eb] bg-white md:hidden">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-1 flex-col items-center justify-center transition-colors ${
                activeTab === item.id ? 'text-[#006837]' : 'text-[#65676b]'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
