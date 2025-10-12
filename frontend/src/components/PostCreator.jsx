"use client";

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { communityAPI } from '@/lib/communityAPI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PostCreator({ onClose, onPostCreated }) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    post_type: 'text',
    tags: '',
    subject_area: '',
    grade_level: ''
  });
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = files.map(file => communityAPI.uploadFile(file));
      const results = await Promise.all(uploadPromises);
      
      const newAttachments = results.map(result => result.attachment);
      setAttachments(prev => [...prev, ...newAttachments]);
    } catch (error) {
      console.error('Error uploading files:', error);
      setError('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      setError('Content is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const postData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        attachments
      };

      const response = await communityAPI.createPost(postData);
      
      if (response.success) {
        onPostCreated(response);
      } else {
        setError('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              ✍️ Create New Post
            </h2>
            <Button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              ✕
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Post Type */}
            <div>
              <Label className={`text-sm font-medium transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Post Type
              </Label>
              <select
                value={formData.post_type}
                onChange={(e) => handleInputChange('post_type', e.target.value)}
                className={`mt-1 w-full p-3 rounded-md border transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="text">💬 Discussion</option>
                <option value="question">❓ Question</option>
                <option value="resource_share">📚 Resource Share</option>
                <option value="announcement">📢 Announcement</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <Label className={`text-sm font-medium transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Title {formData.post_type !== 'text' && <span className="text-red-500">*</span>}
              </Label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter a descriptive title..."
                className={`mt-1 transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>

            {/* Content */}
            <div>
              <Label className={`text-sm font-medium transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Content <span className="text-red-500">*</span>
              </Label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Share your thoughts, ask a question, or start a discussion..."
                rows={6}
                className={`mt-1 w-full p-3 rounded-md border resize-none transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 placeholder-gray-500'
                }`}
                required
              />
            </div>

            {/* Subject Area and Grade Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={`text-sm font-medium transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Subject Area
                </Label>
                <select
                  value={formData.subject_area}
                  onChange={(e) => handleInputChange('subject_area', e.target.value)}
                  className={`mt-1 w-full p-3 rounded-md border transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">Select subject...</option>
                  <option value="mathematics">🔢 Mathematics</option>
                  <option value="science">🔬 Science</option>
                  <option value="english">📖 English</option>
                  <option value="history">🏛️ History</option>
                  <option value="geography">🌍 Geography</option>
                  <option value="art">🎨 Art</option>
                  <option value="physical_education">⚽ Physical Education</option>
                  <option value="other">📚 Other</option>
                </select>
              </div>

              <div>
                <Label className={`text-sm font-medium transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Grade Level
                </Label>
                <select
                  value={formData.grade_level}
                  onChange={(e) => handleInputChange('grade_level', e.target.value)}
                  className={`mt-1 w-full p-3 rounded-md border transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">Select grade...</option>
                  <option value="k-2">K-2</option>
                  <option value="3-5">3-5</option>
                  <option value="6-8">6-8</option>
                  <option value="9-12">9-12</option>
                  <option value="adult">Adult Education</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label className={`text-sm font-medium transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Tags
              </Label>
              <Input
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="Enter tags separated by commas (e.g., lesson planning, assessment, technology)"
                className={`mt-1 transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
              <p className={`text-xs mt-1 transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Tags help others discover your post
              </p>
            </div>

            {/* File Upload */}
            <div>
              <Label className={`text-sm font-medium transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Attachments
              </Label>
              <div className={`mt-1 border-2 border-dashed rounded-lg p-4 transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'border-gray-600 bg-gray-700' 
                  : 'border-gray-300 bg-gray-50'
              }`}>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={`cursor-pointer flex flex-col items-center transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-2">📁</div>
                  <p className="text-sm text-center">
                    Click to upload images or documents
                  </p>
                  <p className={`text-xs mt-1 transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Max 10MB per file
                  </p>
                </label>
              </div>

              {/* Show uploaded attachments */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded border transition-colors duration-300 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {attachment.type === 'image' ? '🖼️' : '📄'}
                        </span>
                        <span className={`text-sm transition-colors duration-300 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {attachment.filename}
                        </span>
                      </div>
                      <Button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {uploading && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className={`text-sm transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Uploading files...
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                onClick={onClose}
                className={`px-6 py-2 rounded-lg transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || uploading || !formData.content.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </div>
                ) : (
                  'Create Post'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}