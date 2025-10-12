"use client";

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { communityAPI } from '@/lib/communityAPI';
import { Button } from '@/components/ui/button';

export default function PostCard({ post, onUpdate, onDelete }) {
  const { theme } = useTheme();
  const [showComments, setShowComments] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reactions, setReactions] = useState(post.reactions || []);
  const [comments, setComments] = useState(post.comments || []);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAuthor = currentUser.id === post.author_id;

  const handleReaction = async (reactionType) => {
    try {
      const response = await communityAPI.toggleReaction(post.id, reactionType);
      if (response.success) {
        // Update local reaction state
        const updated = { ...post, reactions: reactions };
        // This would normally come from the API response
        onUpdate(updated);
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await communityAPI.addComment(post.id, {
        content: newComment.trim()
      });
      
      if (response.success) {
        setComments(prev => [...prev, response.comment]);
        setNewComment('');
        setShowCommentForm(false);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatReactionCounts = () => {
    const counts = {};
    reactions.forEach(reaction => {
      counts[reaction.reaction_type] = (counts[reaction.reaction_type] || 0) + 1;
    });
    return counts;
  };

  const getUserReaction = () => {
    return reactions.find(r => r.user_id === currentUser.id)?.reaction_type;
  };

  const reactionCounts = formatReactionCounts();
  const userReaction = getUserReaction();

  return (
    <div className={`rounded-lg border transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Post Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {post.author_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {post.author_name}
                </h3>
                {post.author_school && (
                  <span className={`text-sm transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    • {post.author_school}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={`transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {communityAPI.formatTimeAgo(post.created_at)}
                </span>
                {post.is_edited && (
                  <span className={`text-xs transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    (edited)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Post Type Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
            communityAPI.getPostTypeColor(post.post_type)
          }`}>
            {communityAPI.getPostTypeIcon(post.post_type)} {post.post_type.replace('_', ' ')}
          </div>
        </div>

        {/* Post Title */}
        {post.title && (
          <h2 className={`text-xl font-bold mb-3 transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {post.title}
          </h2>
        )}

        {/* Post Content */}
        <div className={`mb-4 transition-colors duration-300 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        }`}>
          <p className="whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="mb-4 space-y-2">
            {post.attachments.map((attachment, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 p-3 rounded border transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <span className="text-lg">
                  {attachment.type === 'image' ? '🖼️' : '📄'}
                </span>
                <span className={`text-sm transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {attachment.filename}
                </span>
                {attachment.size && (
                  <span className={`text-xs transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    ({Math.round(attachment.size / 1024)} KB)
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className={`px-2 py-1 text-xs rounded-full transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'bg-blue-900 text-blue-200' 
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Subject and Grade Level */}
        {(post.subject_area || post.grade_level) && (
          <div className="mb-4 flex gap-4 text-sm">
            {post.subject_area && (
              <div className={`transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                📚 Subject: {post.subject_area}
              </div>
            )}
            {post.grade_level && (
              <div className={`transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                🎓 Grade: {post.grade_level}
              </div>
            )}
          </div>
        )}

        {/* Engagement Stats */}
        <div className={`flex items-center gap-4 text-sm border-t pt-4 transition-colors duration-300 ${
          theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'
        }`}>
          <span>👁️ {post.view_count} views</span>
          <span>💬 {comments.length} comments</span>
          <span>⚡ {reactions.length} reactions</span>
        </div>
      </div>

      {/* Action Bar */}
      <div className={`px-6 py-3 border-t flex items-center justify-between transition-colors duration-300 ${
        theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
      }`}>
        {/* Reaction Buttons */}
        <div className="flex items-center gap-2">
          {['like', 'love', 'helpful', 'thinking', 'celebrate'].map((reactionType) => (
            <Button
              key={reactionType}
              onClick={() => handleReaction(reactionType)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors duration-300 ${
                userReaction === reactionType
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>{communityAPI.getReactionEmoji(reactionType)}</span>
              {reactionCounts[reactionType] && (
                <span>{reactionCounts[reactionType]}</span>
              )}
            </Button>
          ))}
        </div>

        {/* Comment and Share Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowCommentForm(!showCommentForm)}
            className={`px-3 py-1 rounded text-sm transition-colors duration-300 ${
              theme === 'dark' 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            💬 Comment
          </Button>
          
          {comments.length > 0 && (
            <Button
              onClick={() => setShowComments(!showComments)}
              className={`px-3 py-1 rounded text-sm transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {showComments ? 'Hide' : 'Show'} Comments ({comments.length})
            </Button>
          )}
        </div>
      </div>

      {/* Comment Form */}
      {showCommentForm && (
        <div className={`px-6 py-4 border-t transition-colors duration-300 ${
          theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
        }`}>
          <form onSubmit={handleAddComment} className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              className={`w-full p-3 rounded-lg border resize-none transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 placeholder-gray-500'
              }`}
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                onClick={() => {
                  setShowCommentForm(false);
                  setNewComment('');
                }}
                className={`px-4 py-2 rounded text-sm transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
              >
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Comments Section */}
      {showComments && comments.length > 0 && (
        <div className={`px-6 py-4 border-t space-y-4 transition-colors duration-300 ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                  {comment.author_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium text-sm transition-colors duration-300 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {comment.author_name}
                    </span>
                    <span className={`text-xs transition-colors duration-300 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {communityAPI.formatTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className={`text-sm transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}