"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { resourceAPI } from '@/lib/resourceAPI';

export default function ResourceDetail({ resource, onClose, onUpdate }) {
  const { theme } = useTheme();
  const [ratings, setRatings] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(resource.likes_count);
  const [loading, setLoading] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    fetchResourceData();
  }, [resource.id]);

  const fetchResourceData = async () => {
    setLoading(true);
    try {
      // Get ratings
      const ratingsData = await resourceAPI.getResourceRatings(resource.id);
      setRatings(ratingsData);

      // Get like status
      try {
        const likeStatus = await resourceAPI.getLikeStatus(resource.id);
        setIsLiked(likeStatus.is_liked);
        setLikesCount(likeStatus.likes_count);
      } catch (error) {
        // User not authenticated - ignore
      }
    } catch (error) {
      console.error('Failed to fetch resource data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await resourceAPI.toggleLike(resource.id);
      setIsLiked(response.action === 'liked');
      setLikesCount(response.likes_count);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Like failed:', error);
    }
  };

  const handleRating = async () => {
    if (userRating === 0) return;
    
    setSubmittingRating(true);
    try {
      await resourceAPI.rateResource(resource.id, userRating, userComment);
      setUserRating(0);
      setUserComment('');
      await fetchResourceData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Rating failed:', error);
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleDownload = () => {
    if (resource.file_url) {
      window.open(resourceAPI.downloadFile(resource.file_url.split('/').pop()), '_blank');
    }
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'video': return '🎥';
      case 'audio': return '🎵';
      case 'image': return '🖼️';
      case 'presentation': return '📊';
      case 'document': return '📝';
      case 'lesson_plan': return '📚';
      case 'worksheet': return '📋';
      default: return '📁';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const StarRating = ({ rating, onRatingChange, readonly = false }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onRatingChange && onRatingChange(star)}
            className={`text-xl transition-colors duration-200 ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:text-yellow-400'
            } ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
            disabled={readonly}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`p-6 border-b transition-colors duration-300 ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{getResourceIcon(resource.resource_type)}</span>
              <div>
                <h2 className={`text-xl font-semibold transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {resource.title}
                </h2>
                <p className={`text-sm transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  by {resource.author_name} • {formatDate(resource.created_at)}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {resource.description && (
            <div>
              <h3 className={`font-medium mb-2 transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Description
              </h3>
              <p className={`transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {resource.description}
              </p>
            </div>
          )}

          {/* Tags and Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className={`font-medium mb-2 transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Subject & Grade
              </h4>
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-sm transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                }`}>
                  {resource.subject_area.replace('_', ' ')}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'
                }`}>
                  {resource.grade_level.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div>
              <h4 className={`font-medium mb-2 transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                File Info
              </h4>
              <div className={`text-sm space-y-1 transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <p>Type: {resource.resource_type.replace('_', ' ')}</p>
                {resource.file_size && <p>Size: {formatFileSize(resource.file_size)}</p>}
                <p>Downloads: {resource.download_count}</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {resource.tags.length > 0 && (
            <div>
              <h4 className={`font-medium mb-2 transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className={`px-2 py-1 rounded-full text-xs transition-colors duration-300 ${
                      theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className={`flex items-center justify-between p-4 rounded-lg transition-colors duration-300 ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex gap-6">
              <div className="text-center">
                <div className={`text-lg font-semibold transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {resource.average_rating.toFixed(1)}
                </div>
                <div className={`text-xs transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Avg Rating
                </div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-semibold transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {likesCount}
                </div>
                <div className={`text-xs transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Likes
                </div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-semibold transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {resource.view_count}
                </div>
                <div className={`text-xs transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Views
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={handleDownload}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              📥 Download
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLike}
              className={`${isLiked ? 'text-red-500 border-red-300' : ''} ${
                theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''
              }`}
            >
              {isLiked ? '❤️' : '🤍'} {likesCount}
            </Button>
          </div>

          {/* Rate Resource */}
          <div className={`p-4 border rounded-lg transition-colors duration-300 ${
            theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
          }`}>
            <h4 className={`font-medium mb-3 transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Rate this Resource
            </h4>
            <div className="flex items-center gap-3 mb-3">
              <StarRating rating={userRating} onRatingChange={setUserRating} />
              <span className={`text-sm transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {userRating > 0 ? `${userRating} star${userRating !== 1 ? 's' : ''}` : 'Select rating'}
              </span>
            </div>
            <textarea
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              placeholder="Add a comment (optional)"
              className={`w-full px-3 py-2 border rounded-md mb-3 transition-all duration-300 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              rows={2}
            />
            <Button 
              onClick={handleRating}
              disabled={userRating === 0 || submittingRating}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {submittingRating ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>

          {/* Ratings */}
          <div>
            <h4 className={`font-medium mb-3 transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Reviews ({ratings.length})
            </h4>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : ratings.length === 0 ? (
              <p className={`text-sm transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                No reviews yet. Be the first to rate this resource!
              </p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {ratings.map((rating) => (
                  <div 
                    key={rating.id}
                    className={`p-3 border rounded-lg transition-colors duration-300 ${
                      theme === 'dark' ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm transition-colors duration-300 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {rating.user_name}
                        </span>
                        <StarRating rating={rating.rating} readonly />
                      </div>
                      <span className={`text-xs transition-colors duration-300 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {formatDate(rating.created_at)}
                      </span>
                    </div>
                    {rating.comment && (
                      <p className={`text-sm transition-colors duration-300 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {rating.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}