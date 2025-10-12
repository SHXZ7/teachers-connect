"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';
import { resourceAPI, SUBJECT_AREAS, GRADE_LEVELS, RESOURCE_TYPES } from '@/lib/resourceAPI';

export default function ResourceUpload({ onSuccess, onCancel }) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_area: '',
    grade_level: '',
    resource_type: '',
    tags: [],
    is_public: true,
    language: 'en'
  });
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    // Auto-detect resource type based on file type
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      const fileType = selectedFile.type;
      
      if (fileType.includes('pdf')) {
        setFormData(prev => ({ ...prev, resource_type: 'pdf' }));
      } else if (fileType.includes('image')) {
        setFormData(prev => ({ ...prev, resource_type: 'image' }));
      } else if (fileType.includes('video')) {
        setFormData(prev => ({ ...prev, resource_type: 'video' }));
      } else if (fileType.includes('audio')) {
        setFormData(prev => ({ ...prev, resource_type: 'audio' }));
      } else if (fileType.includes('presentation') || fileName.includes('ppt')) {
        setFormData(prev => ({ ...prev, resource_type: 'presentation' }));
      } else if (fileType.includes('document') || fileName.includes('doc')) {
        setFormData(prev => ({ ...prev, resource_type: 'document' }));
      }
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.subject_area) newErrors.subject_area = 'Subject area is required';
    if (!formData.grade_level) newErrors.grade_level = 'Grade level is required';
    if (!formData.resource_type) newErrors.resource_type = 'Resource type is required';
    if (!file) newErrors.file = 'Please select a file to upload';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsUploading(true);
    setErrors({});
    
    try {
      console.log('🚀 Starting file upload:', file.name, formData);
      const result = await resourceAPI.uploadResource(file, formData);
      console.log('✅ Upload completed:', result);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        subject_area: '',
        grade_level: '',
        resource_type: '',
        tags: [],
        is_public: true,
        language: 'en'
      });
      setFile(null);
      setTagInput('');
      
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error('❌ Upload failed:', error);
      setErrors({ general: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`p-6 rounded-lg border transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-semibold transition-colors duration-300 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Upload Learning Resource
        </h2>
        {onCancel && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCancel}
            className={theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
          >
            Cancel
          </Button>
        )}
      </div>

      {errors.general && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Upload */}
        <div>
          <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
          }`}>
            File *
          </label>
          <Input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.wav"
            className={`transition-all duration-300 ${
              errors.file ? 'border-red-500' : ''
            } ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300'
            }`}
          />
          {errors.file && <p className="text-red-500 text-xs mt-1">{errors.file}</p>}
          {file && (
            <p className={`text-xs mt-1 transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
          }`}>
            Title *
          </label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter resource title"
            className={`transition-all duration-300 ${
              errors.title ? 'border-red-500' : ''
            } ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300'
            }`}
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
          }`}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe your resource (optional)"
            rows={3}
            className={`w-full px-3 py-2 border rounded-md transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          />
        </div>

        {/* Subject Area */}
        <div>
          <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
          }`}>
            Subject Area *
          </label>
          <select
            value={formData.subject_area}
            onChange={(e) => handleInputChange('subject_area', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md transition-all duration-300 ${
              errors.subject_area ? 'border-red-500' : ''
            } ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          >
            <option value="">Select subject area</option>
            {SUBJECT_AREAS.map(subject => (
              <option key={subject.value} value={subject.value}>
                {subject.label}
              </option>
            ))}
          </select>
          {errors.subject_area && <p className="text-red-500 text-xs mt-1">{errors.subject_area}</p>}
        </div>

        {/* Grade Level */}
        <div>
          <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
          }`}>
            Grade Level *
          </label>
          <select
            value={formData.grade_level}
            onChange={(e) => handleInputChange('grade_level', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md transition-all duration-300 ${
              errors.grade_level ? 'border-red-500' : ''
            } ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          >
            <option value="">Select grade level</option>
            {GRADE_LEVELS.map(grade => (
              <option key={grade.value} value={grade.value}>
                {grade.label}
              </option>
            ))}
          </select>
          {errors.grade_level && <p className="text-red-500 text-xs mt-1">{errors.grade_level}</p>}
        </div>

        {/* Resource Type */}
        <div>
          <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
          }`}>
            Resource Type *
          </label>
          <select
            value={formData.resource_type}
            onChange={(e) => handleInputChange('resource_type', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md transition-all duration-300 ${
              errors.resource_type ? 'border-red-500' : ''
            } ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          >
            <option value="">Select resource type</option>
            {RESOURCE_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.resource_type && <p className="text-red-500 text-xs mt-1">{errors.resource_type}</p>}
        </div>

        {/* Tags */}
        <div>
          <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
          }`}>
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className={`flex-1 transition-all duration-300 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300'
              }`}
            />
            <Button type="button" onClick={addTag} size="sm" variant="outline">
              Add
            </Button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Privacy */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_public"
            checked={formData.is_public}
            onChange={(e) => handleInputChange('is_public', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label 
            htmlFor="is_public" 
            className={`text-sm transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            Make this resource public (visible to all teachers)
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isUploading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            {isUploading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Uploading...
              </div>
            ) : (
              'Upload Resource'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}