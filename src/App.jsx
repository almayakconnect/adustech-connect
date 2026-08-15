import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { 
  Search, 
  Home, 
  Users, 
  MessageCircle, 
  BookOpen, 
  Bell, 
  User, 
  LogOut, 
  Menu, 
  X,
  Bot
} from 'lucide-react';

import Auth from './components/Auth';
import CreatePost from './components/CreatePost';
import PostCard from './components/PostCard';
import Messenger from './components/Messenger';
import AcademicHub from './components/AcademicHub';
import UserProfile from './components/UserProfile';
import NotificationsPopover from './components/NotificationsPopover';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'messenger' | 'resources' | 'settings'
  const [posts, setPosts] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (full_name, avatar_url, department),
          likes (user_id),
          comments (
            id,
            content,
            created_at,
            user_id,
            profiles (full_name, avatar_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  useEffect(() => {
    if (session && activeTab === 'feed') {
      fetchPosts();
    }
  }, [session, activeTab]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f0f2f5]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1877f2] border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-[#050505] antialiased">
      {/* --- FACEBOOK TOP NAVIGATION BAR --- */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-[#e4e6eb] bg-white px-4 shadow-xs">
        {/* Left: Brand & Search Bar */}
        <div className="flex items-center gap-2">
          <div 
            onClick={() => setActiveTab('feed')}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#1877f2] font-black text-2xl text-white select-none"
          >
            a
          </div>
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#65676b]" />
            <input
              type="text"
              placeholder="Search ADUSTECH Connect"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-full bg-[#f0f2f5] pl-9 pr-4 text-xs focus:outline-hidden w-60"
            />
          </div>
        </div>

        {/* Center: Main App Tabs (Facebook Navigation Center) */}
        <nav className="hidden md:flex h-full items-center gap-1">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex h-full w-24 items-center justify-center border-b-4 transition-colors ${
              activeTab === 'feed'
                ? 'border-[#1877f2] text-[#1877f2]'
                : 'border-transparent text-[#65676b] hover:bg-[#f0f2f5]'
            }`}
            title="Home"
          >
            <Home className="h-6 w-6" />
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`flex h-full w-24 items-center justify-center border-b-4 transition-colors ${
              activeTab === 'resources'
                ? 'border-[#1877f2] text-[#1877f2]'
                : 'border-transparent text-[#65676b] hover:bg-[#f0f2f5]'
            }`}
            title="Academic Resources & Materials"
          >
            <BookOpen className="h-6 w-6" />
          </button>

          <button
            onClick={() => setActiveTab('messenger')}
            className={`flex h-full w-24 items-center justify-center border-b-4 transition-colors ${
              activeTab === 'messenger'
                ? 'border-[#1877f2] text-[#1877f2]'
                : 'border-transparent text-[#65676b] hover:bg-[#f0f2f5]'
            }`}
            title="Messenger & AI Assistant"
          >
            <MessageCircle className="h-6 w-6" />
          </button>
        </nav>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('messenger')}
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-[#e4e6eb] hover:bg-[#d8dadf] transition-colors ${
              activeTab === 'messenger' ? 'text-[#1877f2]' : 'text-[#050505]'
            }`}
            title="Messenger"
          >
            <MessageCircle className="h-5 w-5" />
          </button>

          <NotificationsPopover session={session} />

          <button
            onClick={() => setActiveTab('settings')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] transition-colors"
            title="Profile & Settings"
          >
            <User className="h-5 w-5" />
          </button>

          <button
            onClick={handleLogout}
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-[#e4e6eb] hover:bg-[#d8dadf] text-red-600 transition-colors"
            title="Log Out"
          >
            <LogOut className="h-5 w-5" />
          </button>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e4e6eb] md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* --- MOBILE NAVIGATION DRAWER --- */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-14 z-40 bg-white border-b border-[#e4e6eb] p-4 md:hidden space-y-2">
          <button
            onClick={() => { setActiveTab('feed'); setMobileMenuOpen(false); }}
            className={`flex w-full items-center gap-3 rounded-lg p-3 text-sm font-semibold ${
              activeTab === 'feed' ? 'bg-[#e7f3ff] text-[#1877f2]' : 'hover:bg-[#f0f2f5]'
            }`}
          >
            <Home className="h-5 w-5" /> Home
          </button>
          <button
            onClick={() => { setActiveTab('resources'); setMobileMenuOpen(false); }}
            className={`flex w-full items-center gap-3 rounded-lg p-3 text-sm font-semibold ${
              activeTab === 'resources' ? 'bg-[#e7f3ff] text-[#1877f2]' : 'hover:bg-[#f0f2f5]'
            }`}
          >
            <BookOpen className="h-5 w-5" /> Academic Hub
          </button>
          <button
            onClick={() => { setActiveTab('messenger'); setMobileMenuOpen(false); }}
            className={`flex w-full items-center gap-3 rounded-lg p-3 text-sm font-semibold ${
              activeTab === 'messenger' ? 'bg-[#e7f3ff] text-[#1877f2]' : 'hover:bg-[#f0f2f5]'
            }`}
          >
            <MessageCircle className="h-5 w-5" /> Messenger & AI
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
            className={`flex w-full items-center gap-3 rounded-lg p-3 text-sm font-semibold ${
              activeTab === 'settings' ? 'bg-[#e7f3ff] text-[#1877f2]' : 'hover:bg-[#f0f2f5]'
            }`}
          >
            <User className="h-5 w-5" /> Profile & Settings
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg p-3 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" /> Log Out
          </button>
        </div>
      )}

      {/* --- THREE-COLUMN FACEBOOK BODY LAYOUT --- */}
      <div className="flex justify-between px-4 pt-4 max-w-[1920px] mx-auto gap-8">
        
        {/* LEFT SIDEBAR (Desktop Facebook Navigation) */}
        <aside className="hidden xl:block w-72 shrink-0 sticky top-18 h-[calc(100vh-80px)] overflow-y-auto space-y-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('settings')}
            className="flex w-full items-center gap-3 rounded-lg p-2.5 hover:bg-[#e4e6eb] transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1877f2] text-white font-bold">
              {session.user.email?.[0].toUpperCase()}
            </div>
            <span className="truncate">{session.user.email}</span>
          </button>

          <button
            onClick={() => setActiveTab('feed')}
            className={`flex w-full items-center gap-3 rounded-lg p-2.5 transition-colors ${
              activeTab === 'feed' ? 'bg-[#e7f3ff] text-[#1877f2]' : 'hover:bg-[#e4e6eb]'
            }`}
          >
            <Home className="h-6 w-6 text-[#1877f2]" />
            <span>Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`flex w-full items-center gap-3 rounded-lg p-2.5 transition-colors ${
              activeTab === 'resources' ? 'bg-[#e7f3ff] text-[#1877f2]' : 'hover:bg-[#e4e6eb]'
            }`}
          >
            <BookOpen className="h-6 w-6 text-[#1877f2]" />
            <span>Academic Hub & Materials</span>
          </button>

          <button
            onClick={() => setActiveTab('messenger')}
            className={`flex w-full items-center gap-3 rounded-lg p-2.5 transition-colors ${
              activeTab === 'messenger' ? 'bg-[#e7f3ff] text-[#1877f2]' : 'hover:bg-[#e4e6eb]'
            }`}
          >
            <MessageCircle className="h-6 w-6 text-[#1877f2]" />
            <span>Messenger & AI Assistant</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex w-full items-center gap-3 rounded-lg p-2.5 transition-colors ${
              activeTab === 'settings' ? 'bg-[#e7f3ff] text-[#1877f2]' : 'hover:bg-[#e4e6eb]'
            }`}
          >
            <User className="h-6 w-6 text-[#65676b]" />
            <span>Profile Settings</span>
          </button>
        </aside>

        {/* CENTER COLUMN (Main Feed / Sub-views) */}
        <main className="flex-1 max-w-[680px] mx-auto min-w-0">
          {activeTab === 'messenger' ? (
            <Messenger session={session} />
          ) : activeTab === 'resources' ? (
            <AcademicHub session={session} defaultCategory="all" />
          ) : activeTab === 'settings' ? (
            <UserProfile session={session} />
          ) : (
            <div className="space-y-4">
              {/* Facebook Create Post Section */}
              <CreatePost session={session} onPostCreated={fetchPosts} />

              {/* Feed List */}
              {posts.length === 0 ? (
                <div className="rounded-xl border border-[#e4e6eb] bg-white p-8 text-center text-xs text-[#65676b] shadow-xs">
                  No posts on the campus feed yet. Share something with ADUSTECH!
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    session={session} 
                    onPostUpdated={fetchPosts} 
                  />
                ))
              )}
            </div>
          )}
        </main>

        {/* RIGHT SIDEBAR (Active Contacts & Messenger Integration) */}
        <aside className="hidden lg:block w-72 shrink-0 sticky top-18 h-[calc(100vh-80px)] overflow-y-auto space-y-3">
          <div className="border-b border-[#e4e6eb] pb-3">
            <h4 className="text-xs font-semibold text-[#65676b] mb-2">Campus Announcements</h4>
            <div className="rounded-xl border border-[#e4e6eb] bg-white p-3 text-xs space-y-1">
              <span className="font-bold text-[#050505]">ADUSTECH Portal Update</span>
              <p className="text-[#65676b] text-[11px]">Course registration for the current session remains open. Check academic hub for guidelines.</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#65676b] mb-2">
              <span>Direct Messages & AI</span>
            </div>
            <button
              onClick={() => setActiveTab('messenger')}
              className="flex w-full items-center gap-3 rounded-lg p-2 text-xs font-semibold hover:bg-[#e4e6eb] transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-purple-500 to-[#1877f2] text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="font-bold text-[#050505]">ADUSTECH AI</p>
                <p className="text-[10px] text-[#65676b]">Available in Messenger</p>
              </div>
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
}
