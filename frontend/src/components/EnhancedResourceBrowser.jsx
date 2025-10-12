"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';
import { resourceAPI, SUBJECT_AREAS, GRADE_LEVELS } from '@/lib/resourceAPI';
import { lessonAPI } from '@/lib/lessonAPI';

const EnhancedResourceBrowser = () => {
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState(null);
  const [noteGenerationSettings, setNoteGenerationSettings] = useState({
    note_type: 'summary',
    grade_level: '',
    subject_area: '',
    focus_areas: [],
    additional_instructions: ''
  });
  const [filters, setFilters] = useState({
    search: '',
    subject_area: '',
    grade_level: '',
    resource_type: ''
  });
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    loadResources();
  }, [filters]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const response = await resourceAPI.getMyResources(filters);
      setResources(response.resources || []);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNotesFromResource = async (resource) => {
    setIsGeneratingNotes(true);
    setGeneratedNotes(null);
    
    try {
      const requestData = {
        resource_id: resource.id,
        notes_type: "detailed",
        focus_areas: noteGenerationSettings.focus_areas || [],
        additional_instructions: noteGenerationSettings.additional_instructions || ""
      };

      const response = await fetch('https://shxz7-backend.hf.space/api/notes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`Failed to generate notes: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setGeneratedNotes(result.notes);
      } else {
        throw new Error(result.message || 'Failed to generate notes');
      }
    } catch (error) {
      console.error('Error generating notes:', error);
      alert('Failed to generate notes. Please try again.');
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const ResourceCard = ({ resource, onSelectForNotes }) => {
    const getResourceIcon = (type) => {
      switch (type) {
        case 'pdf': return '📄';
        case 'docx': return '📝';
        case 'txt': return '📋';
        case 'video': return '🎥';
        case 'audio': return '🎵';
        case 'image': return '🖼️';
        default: return '📁';
      }
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getResourceIcon(resource.resource_type)}</span>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {resource.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {resource.subject_area} • {resource.grade_level}
              </p>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {resource.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              onClick={() => onSelectForNotes(resource)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              🤖 Generate Notes
            </Button>
            <Button
              onClick={() => window.open(resource.file_url, '_blank')}
              size="sm"
              variant="outline"
            >
              📖 View
            </Button>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(resource.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    );
  };

  const NotesGenerationPanel = ({ resource, onGenerate, isGenerating, settings, onSettingsChange }) => (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        🤖 AI Notes Generation Settings
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Resource: {resource.title}
          </label>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {resource.resource_type.toUpperCase()} • {resource.subject_area}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes Type
            </label>
            <select
              value={settings.note_type}
              onChange={(e) => onSettingsChange('note_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="summary">Summary Notes</option>
              <option value="detailed">Detailed Study Notes</option>
              <option value="key_points">Key Points Only</option>
              <option value="questions">Study Questions</option>
              <option value="outline">Content Outline</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Grade Level
            </label>
            <select
              value={settings.grade_level}
              onChange={(e) => onSettingsChange('grade_level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Use Resource Grade Level</option>
              {GRADE_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Focus Areas (comma-separated)
          </label>
          <Input
            value={settings.focus_areas.join(', ')}
            onChange={(e) => onSettingsChange('focus_areas', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
            placeholder="e.g., main concepts, historical dates, formulas"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Additional Instructions
          </label>
          <textarea
            value={settings.additional_instructions}
            onChange={(e) => onSettingsChange('additional_instructions', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Any specific requirements for the notes..."
          />
        </div>

        <Button
          onClick={() => onGenerate(resource)}
          disabled={isGenerating}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          {isGenerating ? '🤖 Generating Notes...' : '✨ Generate AI Notes'}
        </Button>
      </div>
    </div>
  );

  const NotesDisplay = ({ notes }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          {notes.title}
        </h3>
        <div className="flex space-x-2">
          <Button
            onClick={() => {
              const text = JSON.stringify(notes, null, 2);
              navigator.clipboard.writeText(text);
              alert('Notes copied to clipboard!');
            }}
            size="sm"
            variant="outline"
          >
            📋 Copy
          </Button>
          <Button
            onClick={() => {
              const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `notes-${notes.resource_info?.title || 'resource'}.json`;
              a.click();
            }}
            size="sm"
            variant="outline"
          >
            💾 Download
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {notes.resource_info && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📚 Resource Information
            </h4>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p><strong>Source:</strong> {notes.resource_info.title}</p>
              <p><strong>Type:</strong> {notes.resource_info.type?.toUpperCase()}</p>
              <p><strong>Subject:</strong> {notes.resource_info.subject}</p>
              <p><strong>Grade Level:</strong> {notes.resource_info.grade_level}</p>
            </div>
          </div>
        )}

        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            📝 Summary
          </h4>
          <p className="text-gray-700 dark:text-gray-300">{notes.summary}</p>
        </div>

        {notes.key_points && notes.key_points.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              🎯 Key Points
            </h4>
            <ul className="space-y-2">
              {notes.key_points.map((point, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span className="text-gray-700 dark:text-gray-300">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {notes.vocabulary && notes.vocabulary.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              📖 Vocabulary
            </h4>
            <div className="flex flex-wrap gap-2">
              {notes.vocabulary.map((word, index) => (
                <span key={index} className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm">
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}

        {notes.questions && notes.questions.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              ❓ Study Questions
            </h4>
            <ul className="space-y-2">
              {notes.questions.map((question, index) => (
                <li key={index} className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border-l-4 border-yellow-300 dark:border-yellow-600">
                  <span className="text-gray-700 dark:text-gray-300">{question}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {notes.detailed_content && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              📄 Extracted Content
            </h4>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded border max-h-60 overflow-y-auto">
              <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {notes.detailed_content}
              </pre>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-4 border-t border-gray-200 dark:border-gray-600">
          Generated by {notes.ai_model} • {new Date(notes.generated_at).toLocaleString()}
        </div>
      </div>
    </div>
  );

  const handleSettingsChange = (field, value) => {
    setNoteGenerationSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          📚 Resource Browser with AI Notes Generation
        </h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Input
            placeholder="Search resources..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full"
          />
          
          <select
            value={filters.subject_area}
            onChange={(e) => setFilters(prev => ({ ...prev, subject_area: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">All Subjects</option>
            {SUBJECT_AREAS.map(subject => (
              <option key={subject.value} value={subject.value}>{subject.label}</option>
            ))}
          </select>

          <select
            value={filters.grade_level}
            onChange={(e) => setFilters(prev => ({ ...prev, grade_level: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">All Grade Levels</option>
            {GRADE_LEVELS.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>

          <select
            value={filters.resource_type}
            onChange={(e) => setFilters(prev => ({ ...prev, resource_type: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">All Types</option>
            <option value="pdf">PDF Documents</option>
            <option value="docx">Word Documents</option>
            <option value="txt">Text Files</option>
            <option value="video">Videos</option>
            <option value="audio">Audio Files</option>
          </select>
        </div>

        {/* Resources Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading resources...</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No resources found. Upload some resources to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map(resource => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onSelectForNotes={setSelectedResource}
              />
            ))}
          </div>
        )}
      </div>

      {/* Notes Generation Panel */}
      {selectedResource && !generatedNotes && (
        <NotesGenerationPanel
          resource={selectedResource}
          onGenerate={generateNotesFromResource}
          isGenerating={isGeneratingNotes}
          settings={noteGenerationSettings}
          onSettingsChange={handleSettingsChange}
        />
      )}

      {/* Generated Notes Display */}
      {generatedNotes && (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => {
                setGeneratedNotes(null);
                setSelectedResource(null);
              }}
              variant="outline"
            >
              ← Back to Resources
            </Button>
            <Button
              onClick={() => generateNotesFromResource(selectedResource)}
              disabled={isGeneratingNotes}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              🔄 Regenerate Notes
            </Button>
          </div>
          <NotesDisplay notes={generatedNotes} />
        </div>
      )}
    </div>
  );
};

export default EnhancedResourceBrowser;