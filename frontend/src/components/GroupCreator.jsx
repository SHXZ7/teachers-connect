"use client";

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { groupAPI } from '@/lib/groupAPI';

export default function GroupCreator({ onClose, onGroupCreated }) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject_area: '',
    group_type: 'general',
    grade_level: '',
    is_private: false,
    color: 'bg-blue-500'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const groupTypes = [
    { value: 'general', label: '💬 General Discussion' },
    { value: 'subject', label: '📚 Subject-based' },
    { value: 'grade', label: '🎓 Grade Level' },
    { value: 'school', label: '🏫 School-specific' },
    { value: 'project', label: '📊 Project-based' }
  ];

  const colorOptions = [
    { name: 'Blue', value: 'bg-blue-500' },
    { name: 'Green', value: 'bg-green-500' },
    { name: 'Purple', value: 'bg-purple-500' },
    { name: 'Red', value: 'bg-red-500' },
    { name: 'Yellow', value: 'bg-yellow-500' },
    { name: 'Indigo', value: 'bg-indigo-500' },
    { name: 'Pink', value: 'bg-pink-500' },
    { name: 'Teal', value: 'bg-teal-500' }
  ];

  const subjectAreas = [
    { value: 'mathematics', label: '🔢 Mathematics' },
    { value: 'science', label: '🔬 Science' },
    { value: 'english', label: '📖 English' },
    { value: 'history', label: '🏛️ History' },
    { value: 'geography', label: '🌍 Geography' },
    { value: 'art', label: '🎨 Art' },
    { value: 'physical_education', label: '⚽ Physical Education' },
    { value: 'music', label: '🎵 Music' },
    { value: 'other', label: '📚 Other' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await groupAPI.createGroup({
        name: formData.name.trim(),
        description: formData.description.trim(),
        subject_area: formData.subject_area || null,
        group_type: formData.group_type,
        grade_level: formData.grade_level || null,
        is_private: formData.is_private,
        color: formData.color,
        settings: {
          allow_member_posts: true,
          allow_member_assignments: false,
          auto_approve_members: true,
          post_approval_required: false,
          assignment_notifications: true
        }
      });

      if (response.success) {
        onGroupCreated(response.group);
        onClose();
      } else {
        setError(response.message || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      setError('An error occurred while creating the group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-lg transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`p-6 border-b transition-colors duration-300 ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-semibold transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Create New Group
            </h2>
            <button
              onClick={onClose}
              className={`text-gray-400 hover:text-gray-600 transition-colors duration-200 ${
                theme === 'dark' ? 'hover:text-gray-200' : ''
              }`}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Group Name */}
          <div>
            <Label className={`text-sm font-medium transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Group Name *
            </Label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter group name"
              className={`mt-1 transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300'
              }`}
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label className={`text-sm font-medium transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Description
            </Label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of the group"
              rows={3}
              className={`mt-1 w-full p-2 rounded-md border transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300'
              }`}
            />
          </div>

          {/* Group Type */}
          <div>
            <Label className={`text-sm font-medium transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Group Type
            </Label>
            <select
              name="group_type"
              value={formData.group_type}
              onChange={handleInputChange}
              className={`mt-1 w-full p-2 rounded-md border transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
            >
              {groupTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Area */}
          <div>
            <Label className={`text-sm font-medium transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Subject Area
            </Label>
            <select
              name="subject_area"
              value={formData.subject_area}
              onChange={handleInputChange}
              className={`mt-1 w-full p-2 rounded-md border transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
            >
              <option value="">Select Subject Area</option>
              {subjectAreas.map(subject => (
                <option key={subject.value} value={subject.value}>
                  {subject.label}
                </option>
              ))}
            </select>
          </div>

          {/* Grade Level */}
          <div>
            <Label className={`text-sm font-medium transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Grade Level (Optional)
            </Label>
            <Input
              name="grade_level"
              value={formData.grade_level}
              onChange={handleInputChange}
              placeholder="e.g., Grade 5, High School, etc."
              className={`mt-1 transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300'
              }`}
            />
          </div>

          {/* Privacy Setting */}
          <div>
            <Label className={`text-sm font-medium transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Privacy Setting
            </Label>
            <div className="mt-2 flex items-center space-x-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="is_private"
                  value="false"
                  checked={!formData.is_private}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_private: false }))}
                  className="mr-2"
                />
                <span className={`text-sm transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  🌐 Public - Anyone can join
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="is_private"
                  value="true"
                  checked={formData.is_private}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_private: true }))}
                  className="mr-2"
                />
                <span className={`text-sm transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  🔒 Private - Invite only
                </span>
              </label>
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <Label className={`text-sm font-medium transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Group Color
            </Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {colorOptions.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                  className={`w-8 h-8 rounded-lg ${color.value} ${
                    formData.color === color.value 
                      ? 'ring-2 ring-offset-2 ring-blue-500' 
                      : 'hover:scale-110'
                  } transition-all duration-200`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className={`p-3 rounded-lg border transition-colors duration-300 ${
            theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <Label className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Preview
            </Label>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold ${
                formData.color
              }`}>
                {formData.name ? formData.name.charAt(0).toUpperCase() : 'G'}
              </div>
              <div>
                <p className={`font-medium transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {formData.name || 'Group Name'}
                </p>
                <p className={`text-sm transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {formData.description || 'No description'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className={`flex-1 transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </div>
              ) : (
                'Create Group'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}