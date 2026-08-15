import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Messenger from './components/Messenger';
import { 
  Home, Users, MessageCircle, PlaySquare, Bell, Store, 
  Plus, Search, Menu, Image as ImageIcon, ThumbsUp, MessageSquare, Share2, MoreHorizontal, X 
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    await supabase.from('posts').insert([{ content: newPost, user_id: session?.user?.id }]);
    setNewPost('');
    fetchPosts();
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#18191a] text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-[#1877f2] mb-4">facebook</h1>
        <button 
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} 
          className="bg-[#1877f2] text-white px-6 py-2.5 rounded-lg font-bold text-sm"
        >
          Log In with Google
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#f0f2f5] min-h-screen">
      {/* Facebook Top Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-between">
          <h1 className="text-2xl font-black text-[#1877f2] tracking-tight">facebook</h1>
          <div className="flex items-center gap-2">
            <button className="p-2 bg-gray-100 rounded-full text-black"><Plus className="w-5 h-5" /></button>
            <button className="p-2 bg-gray-100 rounded-full text-black"><Search className="w-5 h-5" /></button>
            <button className="p-2 bg-gray-100 rounded-full text-black"><Menu className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-md mx-auto flex justify-around border-t border-gray-100 text-gray-500">
          <button onClick={() => setActiveTab('feed')} className={`p-3 relative ${activeTab === 'feed' ? 'text-[#1877f2] border-b-2 border-[#1877f2]' : ''}`}>
            <Home className="w-6 h-6" />
            <span className="absolute top-1 right-2 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full">15+</span>
          </button>
          <button className="p-3"><Users className="w-6 h-6" /></button>
          <button onClick={() => setActiveTab('messenger')} className={`p-3 relative ${activeTab === 'messenger' ? 'text-[#1877f2] border-b-2 border-[#1877f2]' : ''}`}>
            <MessageCircle className="w-6 h-6" />
          </button>
          <button className="p-3 relative">
            <PlaySquare className="w-6 h-6" />
            <span className="absolute top-1 right-2 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full">15+</span>
          </button>
          <button className="p-3"><Bell className="w-6 h-6" /></button>
          <button className="p-3"><Store className="w-6 h-6" /></button>
        </div>
      </header>

      {/* Main Content Area */}
      {activeTab === 'messenger' ? (
        <Messenger session={session} />
      ) : (
        <main className="max-w-md mx-auto pb-12">
          {/* Post Composer */}
          <div className="bg-white p-3 border-b border-gray-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-300 overflow-hidden flex-shrink-0">
              <img src="https://via.placeholder.com/40" alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <form onSubmit={handleCreatePost} className="flex-1 flex gap-2">
              <input
                type="text"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full text-xs text-black outline-none"
              />
            </form>
            <button className="flex items-center gap-1 text-green-600 text-xs font-semibold">
              <ImageIcon className="w-5 h-5" /> Photo
            </button>
          </div>

          {/* Stories Tray */}
          <div className="bg-white py-3 px-2 border-b border-gray-200 overflow-x-auto flex gap-2">
            <div className="w-24 h-40 rounded-xl bg-gray-200 flex-shrink-0 relative overflow-hidden flex flex-col justify-end p-2 border border-gray-300">
              <div className="absolute top-2 left-2 bg-[#1877f2] text-white p-1 rounded-full"><Plus className="w-4 h-4" /></div>
              <span className="text-[10px] font-bold text-gray-800 leading-tight">Create story</span>
            </div>
            <div className="w-24 h-40 rounded-xl bg-slate-800 flex-shrink-0 relative overflow-hidden p-2 flex flex-col justify-between">
              <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md w-max">5</span>
              <span className="text-[10px] font-bold text-white leading-tight">Hajiya Mariam</span>
            </div>
            <div className="w-24 h-40 rounded-xl bg-slate-700 flex-shrink-0 relative overflow-hidden p-2 flex flex-col justify-between">
              <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md w-max">3</span>
              <span className="text-[10px] font-bold text-white leading-tight">Lawal Shaibu</span>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-2 mt-2">
            {/* Campus Header Demo Post */}
            <div className="bg-white border-y border-gray-200">
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">AD</div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 leading-tight">ADUSTECH WUDIL -ASPIRANTS 2022/2023 AND CAMPUS GIST</h4>
                    <p className="text-[10px] text-gray-500">Sarki Fahad Ungogo • 2h • 🌐</p>
                  </div>
                </div>
                <div className="flex gap-2 text-gray-500"><MoreHorizontal className="w-4 h-4" /><X className="w-4 h-4" /></div>
              </div>
              <p className="px-3 pb-2 text-xs text-gray-800">Duk wanda ya gane abinda ake nufi ya sakamin a kwament section 🤣🤣🤣🤣🤣🤣</p>
            </div>

            {/* Dynamic Supabase Posts */}
            {posts.map((post) => (
              <div key={post.id} className="bg-white border-y border-gray-200 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">U</div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">ADUSTECH Student</h4>
                    <p className="text-[9px] text-gray-400">{new Date(post.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-800">{post.content}</p>
                <div className="flex justify-around border-t border-gray-100 pt-2 text-gray-500 text-xs">
                  <button className="flex items-center gap-1"><ThumbsUp className="w-4 h-4" /> Like</button>
                  <button className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> Comment</button>
                  <button className="flex items-center gap-1"><Share2 className="w-4 h-4" /> Share</button>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}
    </div>
  );
}
