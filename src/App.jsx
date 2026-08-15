import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { 
  Home, 
  MessageSquare, 
  BookOpen, 
  FileText, 
  User, 
  LogOut, 
  GraduationCap, 
  Menu, 
  X 
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
  const [activeTab, setActiveTab] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        <div className="flex flex-col items-center gap-3">
          <GraduationCap className="h-12 w-12 animate-pulse text-[#006837]" />
          <p className="text-xs font-semibold text-gray-600">Loading ADUSTECH Connect...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const navItems = [
    { id: 'feed', label: 'Feed', icon: Home },
    { id: 'messenger', label: 'Messenger', icon: MessageSquare },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'settings', label: 'Profile & Settings', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#e4e6eb] bg-white px-4 shadow-xs">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-[#006837]" />
          <span className="text-base font-extrabold text-[#006837]">ADUSTECH Connect</span>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <NotificationsPopover session={session} />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>

        {/* Mobile Header Actions */}
        <div className="flex items-center gap-2 sm:hidden">
          <NotificationsPopover session={session} />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Main App Layout */}
      <div className="mx-auto flex max-w-6xl gap-6 p-4">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden w-64 shrink-0 sm:block">
          <div className="sticky top-18 rounded-xl border border-[#e4e6eb] bg-white p-3 shadow-xs">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-green-50 text-[#006837]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-[#006837]' : 'text-gray-500'}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-4 border-t border-gray-100 pt-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-white p-4 sm:hidden">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-[#006837]" />
                <span className="font-bold text-[#006837]">Menu</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            <nav className="mt-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg p-3 text-sm font-semibold ${
                      active ? 'bg-green-50 text-[#006837]' : 'text-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <button
              onClick={handleLogout}
              className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1">
          {activeTab === 'messenger' ? (
            <Messenger session={session} />
          ) : activeTab === 'resources' ? (
            <AcademicHub session={session} defaultCategory="all" />
          ) : activeTab === 'assignments' ? (
            <AcademicHub session={session} defaultCategory="assignment" />
          ) : activeTab === 'settings' ? (
            <UserProfile session={session} />
          ) : (
            /* Main Community Feed */
            <div className="mx-auto max-w-xl space-y-4">
              <CreatePost session={session} onPostCreated={fetchPosts} />
              
              {posts.length === 0 ? (
                <div className="rounded-xl border border-[#e4e6eb] bg-white p-8 text-center text-xs text-gray-500 shadow-xs">
                  No posts yet. Be the first to share something with ADUSTECH!
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
      </div>
    </div>
  );
}
