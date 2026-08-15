import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Download, Upload, Search, Filter, Loader2, BookOpen, CheckCircle } from 'lucide-react';

export default function AcademicHub({ session, defaultCategory = 'all' }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  
  // Upload State
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [category, setCategory] = useState('note');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('academic_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (err) {
      console.error('Error fetching resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title || !courseCode) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/academic_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('post-media')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('academic_resources').insert([
        {
          uploader_id: session.user.id,
          title,
          course_code: courseCode.toUpperCase(),
          category,
          file_url: urlData.publicUrl
        }
      ]);

      if (dbError) throw dbError;

      setShowUpload(false);
      setTitle('');
      setCourseCode('');
      setFile(null);
      fetchResources();
    } catch (err) {
      alert(err.message || 'Error uploading document.');
    } finally {
      setUploading(false);
    }
  };

  const filteredResources = resources.filter((res) => {
    const matchesSearch = 
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.course_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || res.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl bg-[#006837] p-5 text-white shadow-xs">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" /> Academic Resource Bank
          </h2>
          <p className="text-xs text-green-100 mt-1">
            Access lecture slides, course materials, past questions, and departmental guidelines.
          </p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold text-[#006837] shadow-sm hover:bg-green-50"
        >
          <Upload className="h-4 w-4" /> Share Material
        </button>
      </div>

      {/* Upload Form Modal */}
      {showUpload && (
        <form onSubmit={handleUpload} className="rounded-xl border border-[#e4e6eb] bg-white p-4 shadow-xs space-y-3">
          <h3 className="font-semibold text-sm text-gray-800">Upload Course Material</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Material Title (e.g. MTH 111 Module 1 Note)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-[#e4e6eb] p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#006837]"
              required
            />
            <input
              type="text"
              placeholder="Course Code (e.g. CSC 201)"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="rounded-lg border border-[#e4e6eb] p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#006837]"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-[#e4e6eb] p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#006837]"
            >
              <option value="note">Lecture Note / Slide</option>
              <option value="past_question">Past Question</option>
              <option value="assignment">Assignment File</option>
              <option value="syllabus">Syllabus / Outline</option>
            </select>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="text-xs text-gray-500 file:mr-2 file:rounded-md file:border-0 file:bg-green-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#006837]"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowUpload(false)}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex items-center gap-2 rounded-lg bg-[#006837] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#004d28]"
            >
              {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Submit
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by course code or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#e4e6eb] bg-white pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#006837]"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-[#e4e6eb] bg-white px-3 py-2 text-xs focus:outline-none"
        >
          <option value="all">All Categories</option>
          <option value="note">Lecture Notes</option>
          <option value="past_question">Past Questions</option>
          <option value="assignment">Assignments</option>
        </select>
      </div>

      {/* Materials Grid */}
      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-[#006837]" /></div>
      ) : filteredResources.length === 0 ? (
        <div className="rounded-xl border border-[#e4e6eb] bg-white p-8 text-center text-xs text-gray-500">
          No resources found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredResources.map((res) => (
            <div key={res.id} className="flex items-start justify-between rounded-xl border border-[#e4e6eb] bg-white p-4 shadow-xs">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-[#006837]">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className="inline-block rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold text-[#006837]">
                    {res.course_code}
                  </span>
                  <h4 className="font-semibold text-xs text-gray-900 mt-1 truncate">{res.title}</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5 capitalize">{res.category.replace('_', ' ')}</p>
                </div>
              </div>
              <a
                href={res.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-[#006837] hover:text-white transition-colors"
                title="Download / View"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
