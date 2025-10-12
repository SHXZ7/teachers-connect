"use client";

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { lessonAPI, LESSON_CONSTANTS } from '@/lib/lessonAPI';
import { resourceAPI } from '@/lib/resourceAPI';

export default function AIAssistantPage() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('generate');
  const [isLoading, setIsLoading] = useState(false);
  
  // Lesson Generation State
  const [lessonForm, setLessonForm] = useState({
    topic: '',
    grade_level: 'elementary',
    subject_area: 'mathematics',
    duration_minutes: 45,
    lesson_type: 'lecture',
    difficulty: 'intermediate',
    learning_objectives: [],
    selected_resources: [],
    additional_context: ''
  });
  
  const [generatedLesson, setGeneratedLesson] = useState(null);
  const [availableResources, setAvailableResources] = useState([]);
  const [myLessons, setMyLessons] = useState([]);
  
  // Q&A State
  const [question, setQuestion] = useState('');
  const [qaHistory, setQAHistory] = useState([]);
  const [selectedContext, setSelectedContext] = useState({
    type: 'general',
    lesson_id: null,
    resource_ids: []
  });
  
  // Stats State
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchAvailableResources();
    fetchMyLessons();
    fetchStats();
  }, []);

  const fetchAvailableResources = async () => {
    try {
      const response = await resourceAPI.getResources({ per_page: 20 });
      setAvailableResources(response.resources || []);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    }
  };

  const fetchMyLessons = async () => {
    try {
      const response = await lessonAPI.getLessons({ per_page: 10 });
      setMyLessons(response.lessons || []);
    } catch (error) {
      console.error('Failed to fetch lessons:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await lessonAPI.getLessonStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleLessonFormChange = (field, value) => {
    setLessonForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResourceSelection = (resourceId) => {
    setLessonForm(prev => {
      const isSelected = prev.selected_resources.includes(resourceId);
      return {
        ...prev,
        selected_resources: isSelected
          ? prev.selected_resources.filter(id => id !== resourceId)
          : [...prev.selected_resources, resourceId]
      };
    });
  };

  const generateLesson = async () => {
    setIsLoading(true);
    try {
      const response = await lessonAPI.generateLesson(lessonForm);
      setGeneratedLesson(response.lesson);
      await fetchMyLessons(); // Refresh lessons list
      await fetchStats(); // Refresh stats
    } catch (error) {
      console.error('Failed to generate lesson:', error);
      alert('Failed to generate lesson. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const askQuestion = async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    try {
      const questionData = {
        question: question,
        context_type: selectedContext.type,
        lesson_id: selectedContext.lesson_id,
        resource_ids: selectedContext.resource_ids
      };
      
      const response = await lessonAPI.askQuestion(questionData);
      
      const newQA = {
        id: Date.now(),
        question: question,
        answer: response.response.answer,
        confidence_score: response.response.confidence_score,
        sources: response.response.sources,
        timestamp: new Date()
      };
      
      setQAHistory(prev => [newQA, ...prev]);
      setQuestion('');
    } catch (error) {
      console.error('Failed to ask question:', error);
      alert('Failed to get answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'generate', label: 'Generate Lesson', icon: '🎓', description: 'Create AI-powered lesson plans' },
    { id: 'qa', label: 'AI Assistant', icon: '💬', description: 'Ask questions about teaching' },
    { id: 'lessons', label: 'My Lessons', icon: '📚', description: 'View generated lessons' },
    { id: 'stats', label: 'Analytics', icon: '📊', description: 'Lesson generation insights' }
  ];

  const ResourceSelector = () => (
    <div className={`p-4 rounded-lg border transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
    }`}>
      <h4 className={`font-medium mb-3 transition-colors duration-300 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        📚 Select Resources to Include (Optional)
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
        {availableResources.map((resource) => (
          <div
            key={resource.id}
            className={`p-3 rounded border cursor-pointer transition-all duration-200 ${
              lessonForm.selected_resources.includes(resource.id)
                ? theme === 'dark'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-blue-100 border-blue-300'
                : theme === 'dark'
                  ? 'bg-gray-600 border-gray-500 hover:bg-gray-500'
                  : 'bg-white border-gray-300 hover:bg-gray-100'
            }`}
            onClick={() => handleResourceSelection(resource.id)}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {lessonForm.selected_resources.includes(resource.id) ? '✅' : '📄'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{resource.title}</p>
                <p className={`text-xs truncate ${
                  lessonForm.selected_resources.includes(resource.id)
                    ? 'text-blue-100'
                    : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {resource.subject_area.replace('_', ' ')} • {resource.grade_level.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {lessonForm.selected_resources.length > 0 && (
        <p className={`text-sm mt-2 transition-colors duration-300 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {lessonForm.selected_resources.length} resource(s) selected
        </p>
      )}
    </div>
  );

  const LessonDisplay = ({ lesson }) => (
    <div className={`p-6 rounded-lg border transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className={`text-xl font-bold transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {lesson.title}
          </h3>
          <div className="flex items-center gap-4 mt-2">
            <span className={`text-sm transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              📊 {lesson.grade_level.replace('_', ' ')}
            </span>
            <span className={`text-sm transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              📚 {lesson.subject_area.replace('_', ' ')}
            </span>
            <span className={`text-sm transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              ⏱️ {lesson.duration_minutes} min
            </span>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm ${
          theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'
        }`}>
          {lesson.lesson_type}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            📋 Lesson Overview
          </h4>
          <p className={`transition-colors duration-300 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {lesson.lesson_overview}
          </p>
        </div>

        <div>
          <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            🎯 Learning Objectives
          </h4>
          <ul className={`list-disc list-inside space-y-1 transition-colors duration-300 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {lesson.learning_objectives?.map((objective, index) => (
              <li key={index}>{objective}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className={`font-semibold mb-3 transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            📖 Lesson Sections
          </h4>
          <div className="space-y-4">
            {lesson.sections?.map((section, index) => (
              <div key={index} className={`p-4 rounded-lg transition-colors duration-300 ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h5 className={`font-medium transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {section.title}
                  </h5>
                  <span className={`text-sm transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {section.duration_minutes} min
                  </span>
                </div>
                <p className={`text-sm mb-2 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {section.content}
                </p>
                {section.activities?.length > 0 && (
                  <div className="mt-2">
                    <span className={`text-xs font-medium transition-colors duration-300 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Activities: {section.activities.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              📝 Assessment Methods
            </h4>
            <ul className={`list-disc list-inside space-y-1 text-sm transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {lesson.assessment_methods?.map((method, index) => (
                <li key={index}>{method}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              🏠 Homework Suggestions
            </h4>
            <ul className={`list-disc list-inside space-y-1 text-sm transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {lesson.homework_suggestions?.map((homework, index) => (
                <li key={index}>{homework}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gray-900' 
        : 'bg-gradient-to-br from-purple-50 via-white to-blue-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className={`mb-8 p-6 rounded-lg border transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">🤖</div>
            <div>
              <h1 className={`text-3xl font-bold transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                AI Teaching Assistant
              </h1>
              <p className={`text-lg transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Generate lesson plans and get intelligent teaching support
              </p>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg transition-colors duration-300 ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-purple-50'
          }`}>
            <p className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-300' : 'text-purple-800'
            }`}>
              ✨ <strong>Powered by Real AI:</strong> Using OpenRouter with Claude-3, GPT-4, and other advanced models to create 
              comprehensive lesson plans from your uploaded resources, and provide intelligent teaching support! 🎓
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`p-4 rounded-lg border transition-colors duration-300 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Total Lessons</p>
                  <p className={`text-2xl font-bold transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{stats.total_lessons}</p>
                </div>
                <div className="text-3xl">📚</div>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg border transition-colors duration-300 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Recent Lessons</p>
                  <p className={`text-2xl font-bold transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{stats.recent_lessons}</p>
                </div>
                <div className="text-3xl">🆕</div>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg border transition-colors duration-300 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Subjects Covered</p>
                  <p className={`text-2xl font-bold transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{stats.lessons_by_subject?.length || 0}</p>
                </div>
                <div className="text-3xl">📊</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className={`border-b mb-8 transition-colors duration-300 ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? theme === 'dark'
                      ? 'border-purple-400 text-purple-400'
                      : 'border-purple-500 text-purple-600'
                    : theme === 'dark'
                      ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                title={tab.description}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'generate' && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Lesson Generation Form */}
              <div className={`p-6 rounded-lg border transition-colors duration-300 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h2 className={`text-xl font-semibold mb-6 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  🎓 Generate New Lesson Plan
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="topic">Lesson Topic *</Label>
                    <Input
                      id="topic"
                      value={lessonForm.topic}
                      onChange={(e) => handleLessonFormChange('topic', e.target.value)}
                      placeholder="e.g., Fractions, Photosynthesis, World War II"
                      className={theme === 'dark' ? 'bg-gray-700 border-gray-600' : ''}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="grade_level">Grade Level</Label>
                      <select
                        id="grade_level"
                        value={lessonForm.grade_level}
                        onChange={(e) => handleLessonFormChange('grade_level', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md transition-colors duration-300 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        {LESSON_CONSTANTS.GRADE_LEVELS.map(level => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="subject_area">Subject Area</Label>
                      <select
                        id="subject_area"
                        value={lessonForm.subject_area}
                        onChange={(e) => handleLessonFormChange('subject_area', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md transition-colors duration-300 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        {LESSON_CONSTANTS.SUBJECT_AREAS.map(subject => (
                          <option key={subject.value} value={subject.value}>
                            {subject.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="duration">Duration</Label>
                      <select
                        id="duration"
                        value={lessonForm.duration_minutes}
                        onChange={(e) => handleLessonFormChange('duration_minutes', parseInt(e.target.value))}
                        className={`w-full px-3 py-2 border rounded-md transition-colors duration-300 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        {LESSON_CONSTANTS.DURATIONS.map(duration => (
                          <option key={duration.value} value={duration.value}>
                            {duration.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="lesson_type">Lesson Type</Label>
                      <select
                        id="lesson_type"
                        value={lessonForm.lesson_type}
                        onChange={(e) => handleLessonFormChange('lesson_type', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md transition-colors duration-300 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        {LESSON_CONSTANTS.LESSON_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <select
                      id="difficulty"
                      value={lessonForm.difficulty}
                      onChange={(e) => handleLessonFormChange('difficulty', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md transition-colors duration-300 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {LESSON_CONSTANTS.DIFFICULTY_LEVELS.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <ResourceSelector />

                  <div>
                    <Label htmlFor="additional_context">Additional Context (Optional)</Label>
                    <textarea
                      id="additional_context"
                      value={lessonForm.additional_context}
                      onChange={(e) => handleLessonFormChange('additional_context', e.target.value)}
                      placeholder="Any specific requirements, learning goals, or context for this lesson..."
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-md transition-colors duration-300 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>

                  <Button
                    onClick={generateLesson}
                    disabled={!lessonForm.topic.trim() || isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    {isLoading ? '🤖 Generating Lesson...' : '🎓 Generate Lesson Plan'}
                  </Button>
                </div>
              </div>

              {/* Generated Lesson Display */}
              <div>
                {generatedLesson ? (
                  <LessonDisplay lesson={generatedLesson} />
                ) : (
                  <div className={`p-8 rounded-lg border border-dashed text-center transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'border-gray-600 text-gray-400' 
                      : 'border-gray-300 text-gray-500'
                  }`}>
                    <div className="text-6xl mb-4">📝</div>
                    <p className="text-lg font-medium mb-2">Ready to Generate</p>
                    <p className="text-sm">
                      Fill out the lesson details and click &quot;Generate Lesson Plan&quot; to create your AI-powered lesson!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'qa' && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Q&A Interface */}
              <div className={`p-6 rounded-lg border transition-colors duration-300 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h2 className={`text-xl font-semibold mb-6 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  💬 Ask AI Assistant
                </h2>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="context_type">Question Context</Label>
                    <select
                      id="context_type"
                      value={selectedContext.type}
                      onChange={(e) => setSelectedContext(prev => ({ ...prev, type: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md transition-colors duration-300 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="general">General Teaching Question</option>
                      <option value="lesson">About Specific Lesson</option>
                      <option value="resource">About Uploaded Resources</option>
                    </select>
                  </div>

                  {selectedContext.type === 'lesson' && (
                    <div>
                      <Label htmlFor="lesson_context">Select Lesson</Label>
                      <select
                        id="lesson_context"
                        value={selectedContext.lesson_id || ''}
                        onChange={(e) => setSelectedContext(prev => ({ ...prev, lesson_id: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-md transition-colors duration-300 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="">Select a lesson...</option>
                        {myLessons.map(lesson => (
                          <option key={lesson.id} value={lesson.id}>
                            {lesson.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="question">Your Question</Label>
                    <textarea
                      id="question"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask me anything about lesson planning, teaching strategies, assessment methods..."
                      rows={4}
                      className={`w-full px-3 py-2 border rounded-md transition-colors duration-300 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>

                  <Button
                    onClick={askQuestion}
                    disabled={!question.trim() || isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
                  >
                    {isLoading ? '🤔 Thinking...' : '💬 Ask Question'}
                  </Button>
                </div>
              </div>

              {/* Q&A History */}
              <div className={`p-6 rounded-lg border transition-colors duration-300 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h2 className={`text-xl font-semibold mb-6 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  📚 Q&A History
                </h2>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {qaHistory.length === 0 ? (
                    <div className={`text-center py-8 transition-colors duration-300 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <div className="text-4xl mb-2">💡</div>
                      <p>Ask your first question to get started!</p>
                    </div>
                  ) : (
                    qaHistory.map((qa) => (
                      <div key={qa.id} className={`p-4 rounded-lg transition-colors duration-300 ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                        <div className="mb-2">
                          <p className={`font-medium transition-colors duration-300 ${
                            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                          }`}>
                            ❓ {qa.question}
                          </p>
                        </div>
                        <div className="mb-2">
                          <p className={`transition-colors duration-300 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            🤖 {qa.answer}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className={`transition-colors duration-300 ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Confidence: {(qa.confidence_score * 100).toFixed(0)}%
                          </span>
                          <span className={`transition-colors duration-300 ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {qa.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lessons' && (
            <div className={`p-6 rounded-lg border transition-colors duration-300 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  📚 My Generated Lessons
                </h2>
                <Button 
                  onClick={() => setActiveTab('generate')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  🎓 Generate New
                </Button>
              </div>

              {myLessons.length === 0 ? (
                <div className={`text-center py-12 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-lg mb-2">No lessons generated yet</p>
                  <p className="text-sm mb-4">Create your first AI-powered lesson plan!</p>
                  <Button 
                    onClick={() => setActiveTab('generate')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    Get Started
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {myLessons.map((lesson) => (
                    <div key={lesson.id} className={`p-4 rounded-lg border transition-colors duration-300 ${
                      theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`font-medium transition-colors duration-300 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {lesson.title}
                          </h3>
                          <div className="flex items-center gap-4 mt-1">
                            <span className={`text-sm transition-colors duration-300 ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              📊 {lesson.grade_level.replace('_', ' ')}
                            </span>
                            <span className={`text-sm transition-colors duration-300 ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              📚 {lesson.subject_area.replace('_', ' ')}
                            </span>
                            <span className={`text-sm transition-colors duration-300 ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              ⏱️ {lesson.duration_minutes} min
                            </span>
                          </div>
                          <p className={`text-xs mt-1 transition-colors duration-300 ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            Created: {new Date(lesson.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded text-xs ${
                          theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'
                        }`}>
                          {lesson.lesson_type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && stats && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className={`p-6 rounded-lg border transition-colors duration-300 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  📊 Lessons by Subject
                </h3>
                <div className="space-y-3">
                  {stats.lessons_by_subject?.map((subject, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className={`capitalize transition-colors duration-300 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {subject.subject.replace('_', ' ')}
                      </span>
                      <span className={`font-medium transition-colors duration-300 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {subject.count} lessons
                      </span>
                    </div>
                  )) || (
                    <p className={`text-center py-4 transition-colors duration-300 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      No lesson statistics available yet
                    </p>
                  )}
                </div>
              </div>

              <div className={`p-6 rounded-lg border transition-colors duration-300 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  🎯 Quick Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`transition-colors duration-300 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Total Generated Lessons
                    </span>
                    <span className={`font-bold text-lg transition-colors duration-300 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {stats.total_lessons}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`transition-colors duration-300 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Recent Activity (7 days)
                    </span>
                    <span className={`font-bold text-lg transition-colors duration-300 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {stats.recent_lessons}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`transition-colors duration-300 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Different Subjects
                    </span>
                    <span className={`font-bold text-lg transition-colors duration-300 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {stats.lessons_by_subject?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}