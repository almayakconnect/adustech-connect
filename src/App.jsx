import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Messenger from './components/Messenger';
import StatusStories from './components/StatusStories';
import AcademicHub from './components/AcademicHub';
import UserProfile from './components/UserProfile';
import NotificationsPopover from './components/NotificationsPopover';
import AlmayakAI from './components/AlmayakAI';
import { 
  Home, MessageSquare, BookOpen, User, Search, 
  Image, Mic, Video, ThumbsUp, MessageCircle, Share2, 
  Trash2, Menu, X, LogOut, Sparkles, Building2, 
  GraduationCap, ArrowRight, ShieldCheck, Users, Film
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);

  // Auth State (Pre-login Landing Page)
  const [isLogin, setIsLogin] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('100');

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

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').upsert([
            {
              id: data.user.id,
              full_name: fullName,
              matric_number: matricNumber,
              faculty,
              department,
              level,
              email,
            },
          ]);
          if (profileError) throw profileError;
        }
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
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

  // PRE-LOGIN WELCOME PAGE
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden z-10">
          
          <div className="bg-gradient-to-br from-emerald-800 to-teal-900 p-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-black text-2xl shadow-inner">
                  A
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white">ADUSTECH</h1>
                  <p className="text-xs font-medium text-emerald-300">Connect Network</p>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <h2 className="text-2xl font-extrabold text-white leading-tight">
                  Welcome to your campus digital community.
                </h2>
                <p className="text-sm text-emerald-100/80 leading-relaxed">
                  Connect with fellow students, access course materials, collaborate in student communities, and chat seamlessly.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-emerald-700/50">
                <div className="flex items-center gap-3 text-xs text-emerald-100">
                  <Users className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                  <span>Student feed, status updates & messaging</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-emerald-100">
                  <BookOpen className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                  <span>Academic resources & assignment hub</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-emerald-100">
                  <Sparkles className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                  <span>Almayak AI Study Assistant</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-emerald-200/60 pt-6">
              Aliko Dangote University of Science and Technology, Wudil
            </p>
          </div>

          <div className="p-8 flex flex-col justify-center bg-slate-800">
            <div className="flex bg-slate-900/60 p-1 rounded-xl mb-6 border border-slate-700">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setAuthError(''); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${isLogin ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setAuthError(''); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${!isLogin ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Create Account
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-3">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Abdulrahman Abdulmalik"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Matric Number</label>
                      <input
                        type="text"
                        required
                        value={matricNumber}
                        onChange={(e) => setMatricNumber(e.target.value)}
                        placeholder="UG25/CIVE/1112"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Level</label>
                      <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="100">100 Level</option>
                        <option value="200">200 Level</option>
                        <option value="300">300 Level</option>
                        <option value="400">400 Level</option>
                        <option value="500">500 Level</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Faculty</label>
                      <input
                        type="text"
                        required
                        value={faculty}
                        onChange={(e) => setFaculty(e.target.value)}
                        placeholder="Engineering"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Department</label>
                      <input
                        type="text"
                        required
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="Civil Engineering"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@adustech.edu.ng"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-2"
              >
                <span>{authLoading ? 'Processing...' : isLogin ? 'Sign In to ADUSTECH Connect' : 'Complete Registration'}</span>
                {!authLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD APPLICATION
  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-900 font-sans">
      
      {/* Facebook-style Main Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/80">
        <div className="max-w-[1440px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
          
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

      {/* Main Grid */}
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

        {/* Center Main View */}
        <main className="col-span-1 md:col-span-8 lg:col-span-6 space-y-5">
          {activeTab === 'messenger' && <Messenger session={session} />}
          {activeTab === 'academics' && <AcademicHub session={session} />}
          {activeTab === 'profile' && <UserProfile session={session} profile={profile} onUpdate={() => fetchProfile(session.user.id)} />}

          {activeTab === 'feed' && (
            <div className="space-y-5">
              
              <StatusStories session={session} />

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

                      {post.content && (
                        <div className="px-4 pb-3 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {post.content}
                        </div>
                      )}

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

                      <div className="px-4 py-2 flex items-center justify-between border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-emerald-600 p-1 rounded-full text-white">
                            <ThumbsUp className="w-2.5 h-2.5" />
                          </span>
                          <span>{post.likes?.length || 0} Likes</span>
                        </div>
                        <span>{post.comments?.length || 0} Comments</span>
                      </div>

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

      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-tr from-emerald-800 to-teal-600 text-white rounded-full p-3.5 shadow-xl hover:scale-105 transition flex items-center gap-2 group"
        title="Ask Almayak AI"
      >
        <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
        <span className="text-xs font-bold pr-1 hidden sm:inline">Ask Almayak AI</span>
      </button>

      <AlmayakAI 
        isOpen={aiOpen} 
        onClose={() => setAiOpen(false)} 
        userProfile={profile} 
      />
    </div>
  );
}
