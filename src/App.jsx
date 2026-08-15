import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import Messenger from './components/Messenger';
import StatusStories from './components/StatusStories';
import AcademicHub from './components/AcademicHub';
import UserProfile from './components/UserProfile';
import NotificationsPopover from './components/NotificationsPopover';
import { 
  Home, MessageSquare, BookOpen, User, Search, Bell, 
  Image, Mic, Video, Heart, MessageCircle, Share2, 
  Trash2, Send, Menu, X, Bot, LogOut 
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // New post form state
  const [postText, setPostText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image', 'audio', 'video'
  const [uploading, setUploading] = useState(false);

  // Comment state per post
  const [comments, setComments] = useState({});
  const [commentInput, setCommentInput] = useState({});
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchPosts();
    }
  }, [session]);

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const fetchPosts = async () => {
    setLoadingPosts(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles:user_id(full_name, avatar_url, matric_number), likes(*), comments(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPosts(data);
    }
    setLoadingPosts(false);
  };

  const handleMediaSelect = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaType(type);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postText.trim() && !mediaFile) return;

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

      const { error: postError } = await supabase.from('posts').insert([
        {
          user_id: session.user.id,
          content: postText,
          media_url: mediaUrl,
          media_type: mediaType,
        }
      ]);

      if (postError) throw postError;

      setPostText('');
      setMediaFile(null);
      setMediaType(null);
      fetchPosts();
    } catch (err) {
      alert('Error creating post: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (postId) => {
    const post = posts.find(p => p.id === postId);
    const existingLike = post?.likes?.find(l => l.user_id === session.user.id);

    if (existingLike) {
      await supabase.from('likes').delete().eq('id', existingLike.id);
    } else {
      await supabase.from('likes').insert([{ post_id: postId, user_id: session.user.id }]);
    }
    fetchPosts();
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    await supabase.from('posts').delete().eq('id', postId);
    fetchPosts();
  };

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-emerald-800 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-wide">ADUSTECH Connect</h1>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex items-center bg-emerald-900/60 text-white rounded-full px-3 py-1.5 w-64 border border-emerald-700">
            <Search className="w-4 h-4 text-emerald-200 mr-2" />
            <input 
              type="text" 
              placeholder="Search ADUSTECH Connect..." 
              className="bg-transparent border-none outline-none text-sm w-full placeholder-emerald-300"
            />
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => setActiveTab('feed')} className={`flex items-center gap-1 font-medium hover:text-emerald-200 ${activeTab === 'feed' ? 'border-b-2 border-white pb-1' : ''}`}>
              <Home className="w-5 h-5" /> Feed
            </button>
            <button onClick={() => setActiveTab('messenger')} className={`flex items-center gap-1 font-medium hover:text-emerald-200 ${activeTab === 'messenger' ? 'border-b-2 border-white pb-1' : ''}`}>
              <MessageSquare className="w-5 h-5" /> Messenger
            </button>
            <button onClick={() => setActiveTab('academics')} className={`flex items-center gap-1 font-medium hover:text-emerald-200 ${activeTab === 'academics' ? 'border-b-2 border-white pb-1' : ''}`}>
              <BookOpen className="w-5 h-5" /> Academics
            </button>
            <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-1 font-medium hover:text-emerald-200 ${activeTab === 'profile' ? 'border-b-2 border-white pb-1' : ''}`}>
              <User className="w-5 h-5" /> Profile
            </button>
          </nav>

          {/* User Controls */}
          <div className="flex items-center gap-3">
            <NotificationsPopover />
            <button onClick={() => supabase.auth.signOut()} className="p-2 rounded-full hover:bg-emerald-700 text-emerald-100" title="Sign Out">
              <LogOut className="w-5 h-5" />
            </button>
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-emerald-900 border-t border-emerald-700 px-4 py-3 space-y-2">
            <button onClick={() => { setActiveTab('feed'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 font-medium">Feed</button>
            <button onClick={() => { setActiveTab('messenger'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 font-medium">Messenger</button>
            <button onClick={() => { setActiveTab('academics'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 font-medium">Academics</button>
            <button onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 font-medium">Profile</button>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Sidebar */}
        <aside className="hidden md:block md:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
                {profile?.full_name ? profile.full_name[0] : 'S'}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">{profile?.full_name || 'Student'}</h3>
                <p className="text-xs text-slate-500">{profile?.matric_number || 'ADUSTECH Student'}</p>
              </div>
            </div>
            <div className="text-xs text-slate-600 border-t pt-2 space-y-1">
              <p><span className="font-semibold">Dept:</span> {profile?.department || 'N/A'}</p>
              <p><span className="font-semibold">Level:</span> {profile?.level || 'N/A'}</p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="col-span-1 md:col-span-3 space-y-6">
          {activeTab === 'messenger' && <Messenger session={session} />}
          {activeTab === 'academics' && <AcademicHub session={session} />}
          {activeTab === 'profile' && <UserProfile session={session} profile={profile} onUpdate={() => fetchProfile(session.user.id)} />}

          {activeTab === 'feed' && (
            <div className="space-y-6">
              {/* Stories Bar */}
              <StatusStories session={session} />

              {/* Post Composer */}
              <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
                <form onSubmit={handleCreatePost} className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      {profile?.full_name ? profile.full_name[0] : 'S'}
                    </div>
                    <textarea
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      placeholder="What's on your mind?"
                      className="w-full border-none focus:ring-0 resize-none text-slate-700 outline-none text-sm min-h-[60px]"
                    />
                  </div>

                  {mediaFile && (
                    <div className="text-xs bg-slate-100 p-2 rounded flex justify-between items-center text-slate-600">
                      <span>Attached: {mediaFile.name} ({mediaType})</span>
                      <button type="button" onClick={() => { setMediaFile(null); setMediaType(null); }} className="text-red-500 font-bold">Remove</button>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer text-slate-500 hover:text-emerald-700 flex items-center gap-1 text-xs font-medium bg-slate-50 px-2.5 py-1.5 rounded-lg border">
                        <Image className="w-4 h-4 text-emerald-600" /> Photo
                        <input type="file" accept="image/*" onChange={(e) => handleMediaSelect(e, 'image')} className="hidden" />
                      </label>
                      <label className="cursor-pointer text-slate-500 hover:text-emerald-700 flex items-center gap-1 text-xs font-medium bg-slate-50 px-2.5 py-1.5 rounded-lg border">
                        <Mic className="w-4 h-4 text-blue-600" /> Audio
                        <input type="file" accept="audio/*" onChange={(e) => handleMediaSelect(e, 'audio')} className="hidden" />
                      </label>
                      <label className="cursor-pointer text-slate-500 hover:text-emerald-700 flex items-center gap-1 text-xs font-medium bg-slate-50 px-2.5 py-1.5 rounded-lg border">
                        <Video className="w-4 h-4 text-purple-600" /> Video
                        <input type="file" accept="video/*" onChange={(e) => handleMediaSelect(e, 'video')} className="hidden" />
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={uploading || (!postText.trim() && !mediaFile)}
                      className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                    >
                      {uploading ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Posts Feed */}
              {loadingPosts ? (
                <div className="text-center py-8 text-slate-500 text-sm">Loading feed...</div>
              ) : posts.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-slate-500 border">No posts yet. Be the first to share something!</div>
              ) : (
                posts.map((post) => {
                  const isLiked = post.likes?.some(l => l.user_id === session.user.id);

                  return (
                    <article key={post.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
                      {/* Post Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                            {post.profiles?.full_name ? post.profiles.full_name[0] : 'S'}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-800">{post.profiles?.full_name || 'Anonymous Student'}</h4>
                            <p className="text-xs text-slate-400">{new Date(post.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        {post.user_id === session.user.id && (
                          <button onClick={() => handleDeletePost(post.id)} className="text-slate-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Post Content */}
                      {post.content && <p className="text-sm text-slate-700 whitespace-pre-wrap">{post.content}</p>}

                      {/* Media Rendering */}
                      {post.media_url && post.media_type === 'image' && (
                        <img src={post.media_url} alt="Post media" className="rounded-lg w-full max-h-96 object-cover border" />
                      )}
                      {post.media_url && post.media_type === 'audio' && (
                        <audio controls className="w-full mt-2">
                          <source src={post.media_url} />
                        </audio>
                      )}
                      {post.media_url && post.media_type === 'video' && (
                        <video controls className="w-full max-h-96 rounded-lg border mt-2">
                          <source src={post.media_url} />
                        </video>
                      )}

                      {/* Action Bar */}
                      <div className="flex items-center justify-between border-t border-b py-2 text-xs text-slate-500">
                        <button onClick={() => handleLike(post.id)} className={`flex items-center gap-1 ${isLiked ? 'text-red-500 font-bold' : 'hover:text-slate-800'}`}>
                          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                          <span>{post.likes?.length || 0} Likes</span>
                        </button>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {post.comments?.length || 0} Comments
                        </span>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
