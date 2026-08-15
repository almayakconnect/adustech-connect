import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User, Camera, Save, Loader2, FileText } from 'lucide-react';

export default function UserProfile({ session }) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [fullName, setFullName] = useState('');
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('100');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [userPosts, setUserPosts] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  const avatarInputRef = useRef(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFullName(data.full_name || '');
        setFaculty(data.faculty || '');
        setDepartment(data.department || '');
        setLevel(data.level || '100');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
      }

      const { data: postsData } = await supabase
        .from('posts')
        .select('*, likes(count), comments(count)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      setUserPosts(postsData || []);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchProfile();
  }, [session]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUpdating(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/avatar_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('post-media')
        .getPublicUrl(fileName);

      setAvatarUrl(urlData.publicUrl);
    } catch (err) {
      alert(err.message || 'Error uploading image.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setSuccessMessage('');

    try {
      const updates = {
        id: session.user.id,
        full_name: fullName,
        faculty,
        department,
        level,
        bio,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      alert(err.message || 'Error saving profile.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#006837]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-xl border border-[#e4e6eb] bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#006837] text-3xl font-bold text-white shadow-inner">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                fullName?.[0]?.toUpperCase() || session.user.email?.[0].toUpperCase()
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#006837] text-white shadow-md hover:bg-[#004d28]"
              title="Upload Avatar"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              type="file"
              ref={avatarInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          <div className="text-center sm:text-left flex-1">
            <h2 className="text-xl font-bold text-gray-900">{fullName || 'ADUSTECH Student'}</h2>
            <p className="text-xs text-gray-500">{session.user.email}</p>
            <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2 text-[11px] font-semibold text-[#006837]">
              {department && <span className="rounded-md bg-green-50 px-2 py-0.5">{department}</span>}
              {level && <span className="rounded-md bg-green-50 px-2 py-0.5">{level} Level</span>}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="rounded-xl border border-[#e4e6eb] bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <User className="h-4 w-4 text-[#006837]" /> Edit Profile Details
        </h3>

        {successMessage && (
          <div className="rounded-lg bg-green-50 p-3 text-xs font-semibold text-[#006837]">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-[#e4e6eb] p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#006837]"
              placeholder="e.g. Ibrahim Musa"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Faculty</label>
            <input
              type="text"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              className="w-full rounded-lg border border-[#e4e6eb] p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#006837]"
              placeholder="e.g. Computing & Mathematical Sciences"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-lg border border-[#e4e6eb] p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#006837]"
              placeholder="e.g. Computer Science"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Academic Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded-lg border border-[#e4e6eb] p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#006837]"
            >
              <option value="100">100 Level</option>
              <option value="200">200 Level</option>
              <option value="300">300 Level</option>
              <option value="400">400 Level</option>
              <option value="500">500 Level</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Bio / Status</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-[#e4e6eb] p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#006837]"
            placeholder="Share a short intro about yourself..."
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={updating}
            className="flex items-center gap-2 rounded-lg bg-[#006837] px-5 py-2 text-xs font-semibold text-white hover:bg-[#004d28] disabled:opacity-50"
          >
            {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Profile
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-[#e4e6eb] bg-white p-6 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#006837]" /> Your Posts ({userPosts.length})
        </h3>

        {userPosts.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">You haven't posted anything on the feed yet.</p>
        ) : (
          <div className="space-y-2">
            {userPosts.map((post) => (
              <div key={post.id} className="rounded-lg border border-[#e4e6eb] p-3 text-xs bg-[#f8f9fa]">
                <p className="text-gray-800 line-clamp-2">{post.content || '[Media Post]'}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500">
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  <span>{post.likes?.[0]?.count || 0} Likes • {post.comments?.[0]?.count || 0} Comments</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
