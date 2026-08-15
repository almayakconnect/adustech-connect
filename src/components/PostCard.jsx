import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Send } from 'lucide-react';

export default function PostCard({ post, session, onPostUpdated }) {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [loadingComment, setLoadingComment] = useState(false);

  const isLiked = post.likes?.some((like) => like.user_id === session.user.id);
  const likesCount = post.likes?.length || 0;
  const commentsCount = post.comments?.length || 0;

  const handleToggleLike = async () => {
    try {
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', session.user.id);
      } else {
        await supabase
          .from('likes')
          .insert([{ post_id: post.id, user_id: session.user.id }]);
      }
      if (onPostUpdated) onPostUpdated();
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setLoadingComment(true);
    try {
      const { error } = await supabase.from('comments').insert([
        {
          post_id: post.id,
          user_id: session.user.id,
          content: commentText.trim(),
        },
      ]);

      if (error) throw error;

      setCommentText('');
      if (onPostUpdated) onPostUpdated();
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setLoadingComment(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#e4e6eb] bg-white p-4 shadow-xs">
      {/* Post Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877f2] font-bold text-white">
            {post.profiles?.full_name ? post.profiles.full_name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#050505]">
              {post.profiles?.full_name || 'ADUSTECH Student'}
            </h3>
            <p className="text-[10px] text-[#65676b]">
              {post.profiles?.department || 'Campus Community'} •{' '}
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button className="rounded-full p-2 text-[#65676b] hover:bg-[#f0f2f5]">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Post Body */}
      <p className="py-1 text-xs text-[#050505] leading-relaxed whitespace-pre-line">
        {post.content}
      </p>

      {/* Post Image */}
      {post.image_url && (
        <div className="mt-3 overflow-hidden rounded-xl border border-[#e4e6eb]">
          <img
            src={post.image_url}
            alt="Post content"
            className="max-h-96 w-full object-cover"
          />
        </div>
      )}

      {/* Like / Comment Counters */}
      <div className="flex items-center justify-between border-b border-[#e4e6eb] py-2 text-[11px] text-[#65676b]">
        <div className="flex items-center gap-1">
          {likesCount > 0 && (
            <>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1877f2] text-[9px] text-white">
                👍
              </span>
              <span>{likesCount}</span>
            </>
          )}
        </div>
        <button
          onClick={() => setShowComments(!showComments)}
          className="hover:underline"
        >
          {commentsCount} comments
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-1 text-xs font-semibold text-[#65676b]">
        <button
          onClick={handleToggleLike}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 transition-colors hover:bg-[#f0f2f5] ${
            isLiked ? 'text-[#1877f2]' : ''
          }`}
        >
          <ThumbsUp className="h-4 w-4" />
          <span>Like</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 transition-colors hover:bg-[#f0f2f5]"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Comment</span>
        </button>

        <button className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 transition-colors hover:bg-[#f0f2f5]">
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-3 border-t border-[#e4e6eb] pt-3 space-y-3">
          {post.comments?.map((comment) => (
            <div key={comment.id} className="flex gap-2 text-xs">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e4e6eb] text-[10px] font-bold text-[#050505]">
                {comment.profiles?.full_name ? comment.profiles.full_name[0].toUpperCase() : 'U'}
              </div>
              <div className="rounded-2xl bg-[#f0f2f5] px-3 py-2 text-[#050505]">
                <span className="block font-bold text-[11px]">
                  {comment.profiles?.full_name || 'Student'}
                </span>
                <p className="text-xs">{comment.content}</p>
              </div>
            </div>
          ))}

          {/* Add Comment Input */}
          <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 rounded-full bg-[#f0f2f5] px-4 py-1.5 text-xs text-[#050505] placeholder-[#65676b] outline-hidden"
            />
            <button
              type="submit"
              disabled={loadingComment || !commentText.trim()}
              className="rounded-full bg-[#1877f2] p-2 text-white hover:bg-[#166fe5] disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
