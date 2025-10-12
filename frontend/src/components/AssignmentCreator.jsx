"use client";

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { groupAPI } from '@/lib/groupAPI';

export default function AssignmentCreator({ group, onClose, onAssignmentCreated }) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_area: group?.subject_area || '',
    due_date: '',
    points: 100,
    assignment_type: 'homework'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const assignmentTypes = [
    { value: 'homework', label: '📝 Homework' },
    { value: 'quiz', label: '❓ Quiz' },
    { value: 'project', label: '📊 Project' },
    { value: 'reading', label: '📖 Reading' },
    { value: 'research', label: '🔍 Research' },
    { value: 'presentation', label: '🎤 Presentation' },
    { value: 'lab', label: '🧪 Lab Work' },
    { value: 'other', label: '📚 Other' }
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
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? parseInt(value) || 0 : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Assignment title is required');
      return;
    }

    if (!formData.due_date) {
      setError('Due date is required');
      return;
    }

    // Check if due date is in the future
    const dueDate = new Date(formData.due_date);
    const now = new Date();
    if (dueDate <= now) {
      setError('Due date must be in the future');
      return;
    }

    setLoading(true);
    try {
      const response = await groupAPI.createAssignment(group._id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        subject_area: formData.subject_area,
        due_date: formData.due_date,
        points: formData.points,
        assignment_type: formData.assignment_type
      });

      if (response.success) {
        onAssignmentCreated(response.assignment);
        onClose();
      } else {
        setError(response.message || 'Failed to create assignment');
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      setError('An error occurred while creating the assignment');
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-lg rounded-lg transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`p-6 border-b transition-colors duration-300 ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-semibold transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Create Assignment
              </h2>
              <p className={`text-sm mt-1 transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                For group: {group?.name}
              </p>
            </div>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <Label className={`text-sm font-medium transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Assignment Title *
            </Label>
            <Input
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter assignment title"
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
              placeholder="Assignment instructions and details"
              rows={4}
              className={`mt-1 w-full p-2 rounded-md border transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300'
              }`}
            />
          </div>

          {/* Type and Subject Area Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className={`text-sm font-medium transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Assignment Type
              </Label>
              <select
                name="assignment_type"
                value={formData.assignment_type}
                onChange={handleInputChange}
                className={`mt-1 w-full p-2 rounded-md border transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                {assignmentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

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
                <option value="">Select Subject</option>
                {subjectAreas.map(subject => (
                  <option key={subject.value} value={subject.value}>
                    {subject.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date and Points Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className={`text-sm font-medium transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Due Date *
              </Label>
              <Input
                type="datetime-local"
                name="due_date"
                value={formData.due_date}
                onChange={handleInputChange}
                min={getMinDate()}
                className={`mt-1 transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                required
              />
            </div>

            <div>
              <Label className={`text-sm font-medium transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Points
              </Label>
              <Input
                type="number"
                name="points"
                value={formData.points}
                onChange={handleInputChange}
                min="1"
                max="1000"
                className={`mt-1 transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className={`font-medium transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {formData.title || 'Assignment Title'}
                </h3>
                <span className={`text-sm px-2 py-1 rounded transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                }`}>
                  {formData.points} pts
                </span>
              </div>
              
              {formData.description && (
                <p className={`text-sm transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {formData.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span className={`transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Type: {assignmentTypes.find(t => t.value === formData.assignment_type)?.label || 'Not selected'}
                </span>
                {formData.due_date && (
                  <span className={`transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Due: {new Date(formData.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Actions */}
        <div className={`p-6 border-t flex space-x-3 transition-colors duration-300 ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
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
            onClick={handleSubmit}
            disabled={loading || !formData.title.trim() || !formData.due_date}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </div>
            ) : (
              'Create Assignment'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}