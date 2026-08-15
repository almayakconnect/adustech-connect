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
  Trash2, Send, Menu, X, LogOut, Users, Bookmark, 
  ThumbsUp, MoreHorizontal, Smile, Film, Sparkles,
  GraduationCap, Building2, CheckCircle2
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Post creation state
  const [postText, setPostText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState(null); 
  const [uploading, setUploading] = useState(false);

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
    <div className="min-h-screen bg-[#f0f2f5] text-slate-900 font-sans">
      
      {/* Top Header - Facebook/University Clean Hybrid */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/80">
        <div className="max-w-[1440px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
          
          {/* Logo & Search */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('feed')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center font-black text-white text-xl shadow-md shadow-emerald-900/10 tracking-tight">
                A
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">ADUSTECH</h1>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Connect</span>
              </div>
            </div>

            <div className="relative flex items-center bg-slate-100/80 hover:bg-slate-100 transition rounded-full px-3.5 py-1.5 w-48 sm:w-64 border border-slate-200/60 focus-within:border-emerald-500 focus-within:bg-white">
              <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Search ADUSTECH..." 
                className="bg-transparent border-none outline-none text-xs w-full placeholder-slate-400 font-medium"
              />
            </div>
          </div>

          {/* Central Navigation Tabs */}
          <nav className="hidden md:flex items-center justify-center h-full max-w-md w-full">
            <button 
              onClick={() => setActiveTab('feed')} 
              className={`flex items-center justify-center h-full px-6 border-b-[3px] transition-all ${activeTab === 'feed' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
              title="Feed"
            >
              <Home className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveTab('messenger')} 
              className={`flex items-center justify-center h-full px-6 border-b-[3px] transition-all ${activeTab === 'messenger' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
              title="Messenger"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveTab('academics')} 
              className={`flex items-center justify-center h-full px-6 border-b-[3px] transition-all ${activeTab === 'academics' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
              title="Academic Hub"
            >
              <BookOpen className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveTab('profile')} 
              className={`flex items-center justify-center h-full px-6 border-b-[3px] transition-all ${activeTab === 'profile' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
              title="Profile"
            >
              <User className="w-5 h-5" />
            </button>
          </nav>

          {/* User & Controls */}
          <div className="flex items-center gap-2">
            <NotificationsPopover />
            <button 
              onClick={() => supabase.auth.signOut()} 
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-slate-600 transition" 
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button className="md:hidden p-2 text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b px-4 py-3 space-y-1 shadow-lg">
            <button onClick={() => { setActiveTab('feed'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-sm font-semibold ${activeTab === 'feed' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}>
              <Home className="w-5 h-5" /> Feed
            </button>
            <button onClick={() => { setActiveTab('messenger'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-sm font-semibold ${activeTab === 'messenger' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}>
              <MessageSquare className="w-5 h-5" /> Messenger
            </button>
            <button onClick={() => { setActiveTab('academics'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-sm font-semibold ${activeTab === 'academics' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}>
              <BookOpen className="w-5 h-5" /> Academics & Resources
            </button>
            <button onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-sm font-semibold ${activeTab === 'profile' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}>
              <User className="w-5 h-5" /> My Profile
            </button>
          </div>
        )}
      </header>

      {/* Main Layout Grid */}
      <div className="max-w-[1280px] mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4 sticky top-20 h-fit">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 space-y-3">
            <div 
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                {profile?.full_name ? profile.full_name[0] : 'U'}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-slate-800 text-sm truncate">{profile?.full_name || 'Student'}</h3>
                <p className="text-[11px] text-slate-500 truncate">{profile?.matric_number || 'ADUSTECH'}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                <Building2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="truncate">{profile?.department || 'Department'}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                <GraduationCap className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Level: {profile?.level || 'N/A'}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Main Feed */}
        <main className="col-span-1 md:col-span-8 lg:col-span-6 space-y-5">
          {activeTab === 'messenger' && <Messenger session={session} />}
          {activeTab === 'academics' && <AcademicHub session={session} />}
          {activeTab === 'profile' && <UserProfile session={session} profile={profile} onUpdate={() => fetchProfile(session.user.id)} />}

          {activeTab === 'feed' && (
            <div className="space-y-5">
              
              {/* Stories Component */}
              <StatusStories session={session} />

              {/* Enhanced Facebook-style Composer */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4">
                <form onSubmit={handleCreatePost}>
                  <div className="flex gap-3 items-center pb-3 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                      {profile?.full_name ? profile.full_name[0] : 'U'}
                    </div>
                    <input
                      type="text"
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      placeholder={`What's on your mind, ${profile?.full_name?.split(' ')[0] || 'student'}?`}
                      className="bg-slate-100/80 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition w-full rounded-full py-2.5 px-4 outline-none text-xs text-slate-800 placeholder-slate-400 font-medium"
                    />
                  </div>

                  {mediaFile && (
                    <div className="mt-3 text-xs bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-xl flex justify-between items-center text-emerald-800">
                      <span className="font-medium truncate max-w-[250px]">Attached: {mediaFile.name}</span>
                      <button type="button" onClick={() => { setMediaFile(null); setMediaType(null); }} className="text-red-500 hover:text-red-700 font-bold ml-2">Remove</button>
                    </div>
                  )}

                  {/* Attachment Actions */}
                  <div className="flex items-center justify-between pt-3">
                    <label className="flex items-center justify-center gap-2 flex-1 hover:bg-slate-50 py-2 rounded-xl cursor-pointer transition text-slate-600">
                      <Image className="w-5 h-5 text-emerald-500" />
                      <span className="text-xs font-semibold">Photo</span>
                      <input type="file" accept="image/*" onChange={(e) => handleMediaSelect(e, 'image')} className="hidden" />
                    </label>

                    <label className="flex items-center justify-center gap-2 flex-1 hover:bg-slate-50 py-2 rounded-xl cursor-pointer transition text-slate-600">
                      <Mic className="w-5 h-5 text-blue-500" />
                      <span className="text-xs font-semibold">Audio</span>
                      <input type="file" accept="audio/*" onChange={(e) => handleMediaSelect(e, 'audio')} className="hidden" />
                    </label>

                    <label className="flex items-center justify-center gap-2 flex-1 hover:bg-slate-50 py-2 rounded-xl cursor-pointer transition text-slate-600">
                      <Film className="w-5 h-5 text-purple-500" />
                      <span className="text-xs font-semibold">Video</span>
                      <input type="file" accept="video/*" onChange={(e) => handleMediaSelect(e, 'video')} className="hidden" />
                    </label>
                  </div>

                  {(postText.trim() || mediaFile) && (
                    <button
                      type="submit"
                      disabled={uploading}
                      className="w-full mt-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold py-2 rounded-xl text-xs shadow-md shadow-emerald-900/10 transition"
                    >
                      {uploading ? 'Publishing...' : 'Post to Feed'}
                    </button>
                  )}
                </form>
              </div>

              {/* Posts Feed Cards */}
              {loadingPosts ? (
                <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs font-medium border border-slate-200/80 shadow-sm">Loading campus feed...</div>
              ) : posts.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center text-slate-500 border border-slate-200/80 shadow-sm space-y-2">
                  <Sparkles className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-sm font-semibold">No posts yet</p>
                  <p className="text-xs text-slate-400">Share news or ask a study question above!</p>
                </div>
              ) : (
                posts.map((post) => {
                  const isLiked = post.likes?.some(l => l.user_id === session.user.id);

                  return (
                    <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden transition hover:shadow-md">
                      
                      {/* Post Header */}
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-700 to-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                            {post.profiles?.full_name ? post.profiles.full_name[0] : 'U'}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900">{post.profiles?.full_name || 'ADUSTECH Student'}</h4>
                            <p className="text-[10px] font-medium text-slate-400">{new Date(post.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                          </div>
                        </div>

                        {post.user_id === session.user.id && (
                          <button onClick={() => handleDeletePost(post.id)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-slate-100 transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Content */}
                      {post.content && (
                        <div className="px-4 pb-3 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {post.content}
                        </div>
                      )}

                      {/* Media Display */}
                      {post.media_url && post.media_type === 'image' && (
                        <div className="bg-slate-900 max-h-[420px] overflow-hidden flex items-center justify-center">
                          <img src={post.media_url} alt="Post content" className="w-full object-cover max-h-[420px]" />
                        </div>
                      )}
                      {post.media_url && post.media_type === 'audio' && (
                        <div className="p-3 bg-slate-50 border-t border-b border-slate-100">
                          <audio controls className="w-full">
                            <source src={post.media_url} />
                          </audio>
                        </div>
                      )}
                      {post.media_url && post.media_type === 'video' && (
                        <div className="bg-black">
                          <video controls className="w-full max-h-[400px]">
                            <source src={post.media_url} />
                          </video>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="px-4 py-2 flex items-center justify-between border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-emerald-600 p-1 rounded-full text-white">
                            <ThumbsUp className="w-2.5 h-2.5" />
                          </span>
                          <span>{post.likes?.length || 0} Likes</span>
                        </div>
                        <span>{post.comments?.length || 0} Comments</span>
                      </div>

                      {/* Action Bar */}
                      <div className="grid grid-cols-3 border-t border-slate-100 p-1 text-slate-600 text-xs font-semibold">
                        <button 
                          onClick={() => handleLike(post.id)} 
                          className={`flex items-center justify-center gap-1.5 py-2 hover:bg-slate-50 rounded-xl transition ${isLiked ? 'text-emerald-700 font-bold' : ''}`}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span>Like</span>
                        </button>

                        <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-slate-50 rounded-xl transition">
                          <MessageCircle className="w-4 h-4" />
                          <span>Comment</span>
                        </button>

                        <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-slate-50 rounded-xl transition">
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          )}
        </main>

        {/* Right Info Sidebar */}
        <aside className="hidden md:block md:col-span-4 lg:col-span-3 space-y-4 sticky top-20 h-fit">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Campus Updates</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Welcome to the upgraded ADUSTECH Connect digital portal. Share updates, check resources, and connect with fellow students across faculties!
            </p>
          </div>
        </aside>

      </div>
    </div>
  );
}
