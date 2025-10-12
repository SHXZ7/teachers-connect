'use client';

import React, { useState, useEffect } from 'react';
import { resourceAPI } from '@/lib/resourceAPI';
import { lessonAPI } from '@/lib/lessonAPI';
import { getAuthToken, handleAuthError } from '@/utils/auth';

const ComprehensiveAIAssistant = () => {
  const [activeTab, setActiveTab] = useState('lesson-generator');
  const [resources, setResources] = useState([]);
  const [selectedResources, setSelectedResources] = useState([]);
  const [myLessons, setMyLessons] = useState([]);
  
  // Lesson Generation State
  const [lessonForm, setLessonForm] = useState({
    topic: '',
    grade_level: '',
    subject_area: '',
    duration_minutes: 60,
    lesson_type: 'lecture',
    difficulty: 'intermediate',
    learning_objectives: [],
    additional_instructions: ''
  });
  const [generatedLesson, setGeneratedLesson] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Notes Generation State
  const [selectedResourceForNotes, setSelectedResourceForNotes] = useState(null);
  const [noteGenerationSettings, setNoteGenerationSettings] = useState({
    note_type: 'comprehensive',
    grade_level: '',
    subject_area: '',
    focus_areas: [],
    additional_instructions: '',
    // Enhanced settings for better AI generation
    detail_level: 'detailed',
    include_examples: true,
    include_exercises: true,
    include_vocabulary: true,
    include_questions: true,
    include_key_concepts: true,
    enable_rag: true,
    connect_to_curriculum: true
  });
  const [generatedNotes, setGeneratedNotes] = useState(null);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  // Loading States
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadResources(),
        loadMyLessons()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResources = async () => {
    try {
      // Use both my resources and general resources to ensure all user uploads are visible
      const [myResourcesResponse, allResourcesResponse] = await Promise.all([
        resourceAPI.getMyResources(),
        resourceAPI.getResources({ author_filter: 'mine' }) // Filter to show only user's resources
      ]);
      
      // Combine and deduplicate resources
      const myResources = myResourcesResponse.resources || [];
      const allResources = allResourcesResponse.resources || [];
      
      // Create a map to avoid duplicates
      const resourceMap = new Map();
      
      // Add my resources first
      myResources.forEach(resource => {
        resourceMap.set(resource.id, resource);
      });
      
      // Add any additional resources from general endpoint
      allResources.forEach(resource => {
        if (!resourceMap.has(resource.id)) {
          resourceMap.set(resource.id, resource);
        }
      });
      
      const combinedResources = Array.from(resourceMap.values());
      console.log('Loaded resources for AI Assistant:', combinedResources);
      setResources(combinedResources);
    } catch (error) {
      console.error('Error loading resources:', error);
      // Fallback to just getting general resources
      try {
        const response = await resourceAPI.getResources();
        setResources(response.resources || []);
      } catch (fallbackError) {
        console.error('Fallback resource loading also failed:', fallbackError);
        setResources([]);
      }
    }
  };

  const loadMyLessons = async () => {
    try {
      const response = await lessonAPI.getLessons({ per_page: 20 });
      setMyLessons(response.lessons || []);
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  const handleResourceSelect = (resourceId) => {
    setSelectedResources(prev => 
      prev.includes(resourceId) 
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const handleFormChange = (field, value) => {
    setLessonForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addLearningObjective = () => {
    const objective = prompt('Enter a learning objective:');
    if (objective) {
      setLessonForm(prev => ({
        ...prev,
        learning_objectives: [...prev.learning_objectives, objective]
      }));
    }
  };

  const removeLearningObjective = (index) => {
    setLessonForm(prev => ({
      ...prev,
      learning_objectives: prev.learning_objectives.filter((_, i) => i !== index)
    }));
  };

  const generateLesson = async () => {
    if (!lessonForm.topic.trim()) {
      alert('Please enter a lesson topic');
      return;
    }

    setIsGenerating(true);
    try {
      const requestData = {
        ...lessonForm,
        selected_resources: selectedResources
      };

      const response = await lessonAPI.generateLesson(requestData);
      setGeneratedLesson(response.lesson);
      
      // Add initial AI message to chat
      setChatMessages([{
        type: 'ai',
        content: `I've generated a lesson plan on "${lessonForm.topic}" using ${selectedResources.length} selected resources. Feel free to ask me any questions about the lesson!`,
        timestamp: new Date()
      }]);

      // Refresh lessons list
      await loadMyLessons();
    } catch (error) {
      console.error('Error generating lesson:', error);
      alert('Failed to generate lesson. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateNotesFromResource = async (resource) => {
    setIsGeneratingNotes(true);
    setGeneratedNotes(null);
    
    try {
      // Enhanced request data with better parameters for comprehensive notes
      const requestData = {
        resource_id: resource._id || resource.id, // Use MongoDB ObjectId
        notes_type: noteGenerationSettings.note_type || "comprehensive",
        focus_areas: noteGenerationSettings.focus_areas || [],
        additional_instructions: noteGenerationSettings.additional_instructions || ""
      };

      console.log('🤖 Generating comprehensive notes for:', resource.title, requestData);

      // Get auth token using utility function
      const authToken = getAuthToken();
      
      console.log('🔐 Auth token exists:', !!authToken);
      console.log('🔐 Token length:', authToken ? authToken.length : 0);
      
      if (!authToken) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await fetch('https://shxz7-backend.hf.space/api/notes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 404) {
          throw new Error('Notes generation service not available. Please try again later.');
        } else {
          throw new Error(errorData.message || `Failed to generate notes: ${response.status}`);
        }
      }

      const result = await response.json();
      
      if (result.success) {
        // Enhanced notes with better structure
        const enhancedNotes = {
          ...result.notes,
          resource_info: {
            title: resource.title,
            type: resource.resource_type,
            subject: resource.subject_area,
            grade_level: resource.grade_level,
            description: resource.description
          },
          generation_metadata: {
            generated_at: new Date().toISOString(),
            ai_model: result.ai_model || 'Advanced AI',
            content_extracted: result.content_extracted || false,
            rag_enabled: result.rag_enabled || false,
            confidence_score: result.confidence_score || 0.8
          }
        };

        setGeneratedNotes(enhancedNotes);
        
        // Add to chat context for integrated AI assistance
        setChatMessages(prev => [...prev, {
          type: 'system',
          content: `📝 Generated comprehensive notes for "${resource.title}". You can now ask me questions about this content or request lesson plans based on these notes.`,
          timestamp: new Date(),
          resource_id: resource._id || resource.id,
          notes_id: result.notes?.id
        }]);
        
        // Check if notes were generated from actual content or just metadata
        if (!result.content_extracted) {
          console.warn('⚠️ Notes generated from metadata only - file content was not accessible');
          // Show user-friendly message
          alert('Note: AI generated notes from resource metadata. For more detailed analysis, ensure the file is properly uploaded and accessible.');
        } else {
          console.log('✅ Notes generated from extracted file content with RAG analysis');
        }
      } else {
        throw new Error(result.message || 'Failed to generate notes');
      }
    } catch (error) {
      console.error('❌ Error generating notes:', error);
      
      // Enhanced error messaging
      let errorMessage = 'Failed to generate notes. ';
      
      if (error.message.includes('Authentication')) {
        errorMessage += 'Please log in again to continue.';
        // Optional: redirect to login
        // window.location.href = '/login';
      } else if (error.message.includes('not available')) {
        errorMessage += 'The AI service is temporarily unavailable. Please try again later.';
      } else {
        errorMessage += 'Please check your connection and try again.';
      }
      
      alert(errorMessage);
      
      // Add error message to chat for context
      setChatMessages(prev => [...prev, {
        type: 'error',
        content: `❌ Failed to generate notes for "${resource.title}": ${error.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const askAIQuestion = async () => {
    if (!currentQuestion.trim()) return;

    setIsAsking(true);
    const userMessage = {
      type: 'user',
      content: currentQuestion,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const questionToAsk = currentQuestion;
    setCurrentQuestion('');

    try {
      const response = await lessonAPI.askQuestion({
        question: questionToAsk,
        lesson_id: generatedLesson?.id,
        context: {
          lesson_topic: lessonForm.topic,
          selected_resources: selectedResources
        }
      });

      const aiMessage = {
        type: 'ai',
        content: response.answer,
        confidence: response.confidence_score,
        sources: response.sources || [],
        suggestions: response.suggestions || [],
        contextUsed: response.context_used || false,
        modelUsed: response.model_used || 'AI',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error asking AI question:', error);
      const errorMessage = {
        type: 'ai',
        content: 'Sorry, I encountered an error while processing your question. Please try again. Make sure you have uploaded resources and generated notes for better responses.',
        timestamp: new Date(),
        isError: true
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleSettingsChange = (field, value) => {
    setNoteGenerationSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const TabButton = ({ id, label, icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
        isActive 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );

  const ResourceCard = ({ resource, onSelect, onGenerateNotes, isSelected }) => {
    const getResourceIcon = (type) => {
      switch (type) {
        case 'pdf': return '📄';
        case 'docx': return '📝';
        case 'txt': return '📋';
        case 'video': return '🎥';
        case 'audio': return '🎵';
        default: return '📁';
      }
    };

    return (
      <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getResourceIcon(resource.resource_type)}</span>
            <div>
              <h4 className="font-medium text-gray-800 truncate">{resource.title}</h4>
              <p className="text-sm text-gray-600">{resource.subject_area} • {resource.grade_level}</p>
            </div>
          </div>
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={() => onSelect(resource.id)}
            className="ml-2"
          />
        </div>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{resource.description}</p>
        
        <div className="flex space-x-2">
          <button
            onClick={() => onGenerateNotes(resource)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
          >
            📖 Generate Notes
          </button>
          <button
            onClick={() => window.open(resource.file_url, '_blank')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            👁️ View
          </button>
        </div>
      </div>
    );
  };

  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonDetailsLoading, setLessonDetailsLoading] = useState(false);

  const viewLessonDetails = async (lessonId) => {
    setLessonDetailsLoading(true);
    try {
      const response = await lessonAPI.getLesson(lessonId);
      setSelectedLesson(response.lesson);
    } catch (error) {
      console.error('Error fetching lesson details:', error);
      alert('Failed to load lesson details. Please try again.');
    } finally {
      setLessonDetailsLoading(false);
    }
  };

  const downloadLesson = (lesson) => {
    const content = generateLessonDocument(lesson);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lesson.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_lesson_plan.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const deleteLesson = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      return;
    }

    try {
      await lessonAPI.deleteLesson(lessonId);
      alert('Lesson deleted successfully!');
      // Refresh lessons list
      await loadMyLessons();
      // Close modal if the deleted lesson was being viewed
      if (selectedLesson && selectedLesson.id === lessonId) {
        setSelectedLesson(null);
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Failed to delete lesson. Please try again.');
    }
  };

  const generateLessonDocument = (lesson) => {
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatList = (items, prefix = '• ') => {
      if (!items || items.length === 0) return 'None specified';
      return items.map(item => `${prefix}${item}`).join('\n');
    };

    return `
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                                   LESSON PLAN                                        ║
║                              ${lesson.title.toUpperCase()}                              ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝

Generated by: Teachers Connect AI Assistant
Created on: ${formatDate(lesson.created_at)}
Generated with: OpenRouter AI (Claude-3.5-Sonnet)

═══════════════════════════════════════════════════════════════════════════════════════

📋 LESSON INFORMATION
═══════════════════════════════════════════════════════════════════════════════════════

Topic:          ${lesson.topic}
Subject Area:   ${lesson.subject_area.replace(/_/g, ' ').toUpperCase()}
Grade Level:    ${lesson.grade_level.replace(/_/g, ' ').toUpperCase()}
Duration:       ${lesson.duration_minutes} minutes
Lesson Type:    ${lesson.lesson_type.replace(/_/g, ' ').toUpperCase()}
Difficulty:     ${lesson.difficulty.replace(/_/g, ' ').toUpperCase()}

═══════════════════════════════════════════════════════════════════════════════════════

📖 LESSON OVERVIEW
═══════════════════════════════════════════════════════════════════════════════════════

${lesson.lesson_overview || 'No overview provided'}

═══════════════════════════════════════════════════════════════════════════════════════

🎯 LEARNING OBJECTIVES
═══════════════════════════════════════════════════════════════════════════════════════

${formatList(lesson.learning_objectives)}

═══════════════════════════════════════════════════════════════════════════════════════

📚 LESSON SECTIONS
═══════════════════════════════════════════════════════════════════════════════════════

${lesson.sections?.map((section, index) => `
${index + 1}. ${section.title.toUpperCase()}
   Duration: ${section.duration_minutes} minutes

   Content:
   ${section.content}

   Activities:
   ${formatList(section.activities, '   • ')}

   Materials Needed:
   ${formatList(section.materials_needed, '   • ')}

${'─'.repeat(85)}
`).join('\n') || 'No sections specified'}

═══════════════════════════════════════════════════════════════════════════════════════

📊 ASSESSMENT METHODS
═══════════════════════════════════════════════════════════════════════════════════════

${formatList(lesson.assessment_methods)}

═══════════════════════════════════════════════════════════════════════════════════════

📝 HOMEWORK SUGGESTIONS
═══════════════════════════════════════════════════════════════════════════════════════

${formatList(lesson.homework_suggestions)}

═══════════════════════════════════════════════════════════════════════════════════════

🔗 ADDITIONAL RESOURCES
═══════════════════════════════════════════════════════════════════════════════════════

${formatList(lesson.additional_resources)}

═══════════════════════════════════════════════════════════════════════════════════════

📄 DOCUMENT INFORMATION
═══════════════════════════════════════════════════════════════════════════════════════

This lesson plan was generated using Teachers Connect AI Assistant.
AI Model: Claude-3.5-Sonnet via OpenRouter
Generated from: ${lesson.generated_from_resources?.length > 0 ? `${lesson.generated_from_resources.length} uploaded resource(s)` : 'AI knowledge base'}

For more information, visit: https://teachersconnect.ai

═══════════════════════════════════════════════════════════════════════════════════════
`.trim();
  };

  const LessonCard = ({ lesson }) => (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <h4 className="font-medium text-gray-800 mb-2">{lesson.title}</h4>
      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
        <span>📚 {lesson.subject_area}</span>
        <span>🎓 {lesson.grade_level}</span>
        <span>⏱️ {lesson.duration_minutes}min</span>
      </div>
      <p className="text-sm text-gray-600 line-clamp-2">{lesson.topic}</p>
      <div className="mt-3 text-xs text-gray-500">
        Created: {new Date(lesson.created_at).toLocaleDateString()}
      </div>
      
      {/* Action Buttons */}
      <div className="mt-4 flex space-x-2">
        <button
          onClick={() => viewLessonDetails(lesson.id)}
          disabled={lessonDetailsLoading}
          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          👁️ View Details
        </button>
        <button
          onClick={() => downloadLesson(lesson)}
          className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 transition-colors"
        >
          💾 Download
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading AI Assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🤖 Comprehensive AI Teaching Assistant
        </h1>
        <p className="text-gray-600 mb-6">
          ✨ Powered by Real AI: Using OpenRouter with Claude-3, GPT-4, and other advanced models to create comprehensive lesson plans from your uploaded resources, and provide intelligent teaching support! 🧠
        </p>

        {/* Auth Status Debug (temporary) */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          🔐 Auth Status: {getAuthToken() ? '✅ Authenticated' : '❌ Not authenticated'}
          {getAuthToken() && <span className="ml-2">Token length: {getAuthToken().length}</span>}
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-3">
          <TabButton
            id="lesson-generator"
            label="AI Lesson Generator"
            icon="📝"
            isActive={activeTab === 'lesson-generator'}
            onClick={setActiveTab}
          />
          <TabButton
            id="smart-notes"
            label="Smart Notes Generator"
            icon="📖"
            isActive={activeTab === 'smart-notes'}
            onClick={setActiveTab}
          />
          <TabButton
            id="my-lessons"
            label="My AI Lessons"
            icon="📚"
            isActive={activeTab === 'my-lessons'}
            onClick={setActiveTab}
          />
          <TabButton
            id="chat-assistant"
            label="AI Chat Assistant"
            icon="💬"
            isActive={activeTab === 'chat-assistant'}
            onClick={setActiveTab}
          />
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'lesson-generator' && (
        <div className="space-y-6">
          {/* Resource Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              📚 Select Resources for AI Lesson Generation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
              {resources.map(resource => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onSelect={handleResourceSelect}
                  onGenerateNotes={() => {
                    setSelectedResourceForNotes(resource);
                    setActiveTab('smart-notes');
                  }}
                  isSelected={selectedResources.includes(resource.id)}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-4">
              📋 Selected {selectedResources.length} resource(s) for AI lesson generation
            </p>
          </div>

          {/* Lesson Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">🎯 Lesson Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Topic *</label>
                <input
                  type="text"
                  value={lessonForm.topic}
                  onChange={(e) => handleFormChange('topic', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the main topic for your lesson"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
                <select
                  value={lessonForm.grade_level}
                  onChange={(e) => handleFormChange('grade_level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Grade Level</option>
                  <option value="elementary">Elementary</option>
                  <option value="middle_school">Middle School</option>
                  <option value="high_school">High School</option>
                  <option value="primary_1">Primary 1</option>
                  <option value="primary_2">Primary 2</option>
                  <option value="primary_3">Primary 3</option>
                  <option value="primary_4">Primary 4</option>
                  <option value="primary_5">Primary 5</option>
                  <option value="primary_6">Primary 6</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Area</label>
                <select
                  value={lessonForm.subject_area}
                  onChange={(e) => handleFormChange('subject_area', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Subject</option>
                  <option value="mathematics">Mathematics</option>
                  <option value="science">Science</option>
                  <option value="language_arts">Language Arts</option>
                  <option value="social_studies">Social Studies</option>
                  <option value="history">History</option>
                  <option value="geography">Geography</option>
                  <option value="arts">Arts</option>
                  <option value="technology">Technology</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                <select
                  value={lessonForm.duration_minutes}
                  onChange={(e) => handleFormChange('duration_minutes', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateLesson}
              disabled={isGenerating || !lessonForm.topic.trim()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isGenerating ? '🤖 Generating Lesson with AI...' : '🚀 Generate AI Lesson Plan'}
            </button>
          </div>

          {/* Generated Lesson Display */}
          {generatedLesson && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">✅ Generated Lesson Plan</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">📋 Overview</h4>
                  <p className="text-gray-600 mb-4">{generatedLesson.lesson_overview || 'Lesson plan generated successfully!'}</p>
                  
                  <h4 className="font-semibold text-gray-700 mb-2">🎯 Topic</h4>
                  <p className="text-gray-600">{generatedLesson.topic}</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">✅ Success!</h4>
                  <p className="text-green-700 text-sm">
                    Your AI lesson plan has been generated and saved. You can view it in the "My AI Lessons" tab or continue chatting with the AI assistant about this lesson.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Smart Notes Tab */}
      {activeTab === 'smart-notes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">📖 AI-Powered Notes Generation</h3>
            
            {!selectedResourceForNotes ? (
              <div>
                <p className="text-gray-600 mb-4">Select a resource to generate AI-powered study notes:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resources.map(resource => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      onSelect={() => {}}
                      onGenerateNotes={setSelectedResourceForNotes}
                      isSelected={false}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">📄 Selected Resource</h4>
                  <p className="text-blue-700">{selectedResourceForNotes.title}</p>
                  <p className="text-blue-600 text-sm">{selectedResourceForNotes.resource_type.toUpperCase()}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🎯 Notes Type</label>
                    <select
                      value={noteGenerationSettings.note_type}
                      onChange={(e) => handleSettingsChange('note_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="comprehensive">📚 Comprehensive Analysis</option>
                      <option value="detailed">📝 Detailed Study Notes</option>
                      <option value="summary">📄 Summary Notes</option>
                      <option value="key_points">🎯 Key Points Only</option>
                      <option value="questions">❓ Study Questions</option>
                      <option value="vocabulary">📖 Vocabulary & Terms</option>
                      <option value="concepts">💡 Core Concepts</option>
                      <option value="examples">🔍 Examples & Applications</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📊 Detail Level</label>
                    <select
                      value={noteGenerationSettings.detail_level}
                      onChange={(e) => handleSettingsChange('detail_level', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="basic">📝 Basic Overview</option>
                      <option value="detailed">📚 Detailed Analysis</option>
                      <option value="comprehensive">🎓 Comprehensive Study</option>
                      <option value="expert">🔬 Expert Level</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🎯 Focus Areas</label>
                    <input
                      type="text"
                      value={noteGenerationSettings.focus_areas.join(', ')}
                      onChange={(e) => handleSettingsChange('focus_areas', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., main concepts, formulas, applications"
                    />
                  </div>
                </div>

                {/* Enhanced Options */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-3">🚀 Enhanced AI Features</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={noteGenerationSettings.include_examples}
                        onChange={(e) => handleSettingsChange('include_examples', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-blue-700">📋 Examples</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={noteGenerationSettings.include_exercises}
                        onChange={(e) => handleSettingsChange('include_exercises', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-blue-700">✏️ Exercises</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={noteGenerationSettings.include_vocabulary}
                        onChange={(e) => handleSettingsChange('include_vocabulary', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-blue-700">📖 Vocabulary</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={noteGenerationSettings.enable_rag}
                        onChange={(e) => handleSettingsChange('enable_rag', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-blue-700">🤖 RAG Analysis</span>
                    </label>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => generateNotesFromResource(selectedResourceForNotes)}
                    disabled={isGeneratingNotes}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md disabled:bg-gray-400 transition-colors"
                  >
                    {isGeneratingNotes ? '🤖 Generating Notes...' : '✨ Generate AI Notes'}
                  </button>
                  <button
                    onClick={() => setSelectedResourceForNotes(null)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md transition-colors"
                  >
                    ← Back to Resources
                  </button>
                </div>

                {generatedNotes && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-4">{generatedNotes.title}</h4>
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">📝 Summary</h5>
                        <p className="text-gray-600">{generatedNotes.summary}</p>
                      </div>
                      
                      {generatedNotes.key_points && generatedNotes.key_points.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">🎯 Key Points</h5>
                          <ul className="space-y-1">
                            {generatedNotes.key_points.map((point, index) => (
                              <li key={index} className="text-gray-600">• {point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {generatedNotes.vocabulary && generatedNotes.vocabulary.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">📖 Vocabulary</h5>
                          <div className="flex flex-wrap gap-2">
                            {generatedNotes.vocabulary.map((word, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {generatedNotes.questions && generatedNotes.questions.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">❓ Study Questions</h5>
                          <ul className="space-y-2">
                            {generatedNotes.questions.map((question, index) => (
                              <li key={index} className="text-gray-600 bg-yellow-50 p-2 rounded border-l-4 border-yellow-300">
                                {question}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {generatedNotes.detailed_content && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">📄 Extracted Content</h5>
                          <div className="bg-white p-4 rounded border max-h-60 overflow-y-auto">
                            <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                              {generatedNotes.detailed_content}
                            </pre>
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 pt-2 border-t">
                        Generated by {generatedNotes.ai_model} • {new Date(generatedNotes.generated_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Lessons Tab */}
      {activeTab === 'my-lessons' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">📚 My AI-Generated Lessons</h3>
          
          {myLessons.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-gray-600">No lessons generated yet. Create your first AI lesson!</p>
              <button
                onClick={() => setActiveTab('lesson-generator')}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Generate First Lesson
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myLessons.map(lesson => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat Assistant Tab */}
      {activeTab === 'chat-assistant' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">💬 AI Teaching Assistant Chat</h3>
          
          {/* Chat Messages */}
          <div className="h-80 overflow-y-auto border border-gray-200 rounded-md p-4 mb-4 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">🤖✨</div>
                <p className="font-medium">Enhanced AI Teaching Assistant with RAG</p>
                <p className="text-sm mt-2">I can answer questions using your uploaded resources and generated notes!</p>
                <div className="mt-4 text-xs space-y-1">
                  <p>💡 I analyze your uploaded PDFs, documents, and generated notes</p>
                  <p>🔍 I provide answers with sources and confidence scores</p>
                  <p>📚 I reference your specific content to give personalized responses</p>
                </div>
              </div>
            ) : (
              chatMessages.map((message, index) => (
                <div 
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : message.isError 
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : 'bg-gray-50 text-gray-800 border'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Enhanced AI message features */}
                    {message.type === 'ai' && !message.isError && (
                      <div className="mt-3 space-y-2">
                        {/* Confidence and Context Used */}
                        <div className="flex items-center space-x-4 text-xs">
                          {message.confidence && (
                            <span className={`px-2 py-1 rounded-full ${
                              message.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                              message.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {Math.round(message.confidence * 100)}% confidence
                            </span>
                          )}
                          {message.contextUsed && (
                            <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                              📚 Used your content
                            </span>
                          )}
                          {message.modelUsed && (
                            <span className="text-gray-500">
                              {message.modelUsed}
                            </span>
                          )}
                        </div>

                        {/* Sources */}
                        {message.sources && message.sources.length > 0 && (
                          <div className="border-t pt-2">
                            <p className="text-xs font-medium text-gray-600 mb-1">📂 Sources:</p>
                            <div className="space-y-1">
                              {message.sources.map((source, idx) => (
                                <div key={idx} className="text-xs text-gray-600">
                                  <span className="font-medium">
                                    {source.type === 'note' ? '📝' : 
                                     source.type === 'resource' ? '📄' : '📚'} 
                                    {source.title}
                                  </span>
                                  {source.subject && (
                                    <span className="text-gray-500 ml-1">({source.subject})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Suggestions */}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="border-t pt-2">
                            <p className="text-xs font-medium text-gray-600 mb-1">💡 Try asking:</p>
                            <div className="space-y-1">
                              {message.suggestions.slice(0, 3).map((suggestion, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setCurrentQuestion(suggestion)}
                                  className="block text-xs text-blue-600 hover:text-blue-800 hover:underline text-left"
                                >
                                  • {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <span className="text-xs opacity-70 mt-2 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
            {isAsking && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                  <p className="text-sm">AI is thinking...</p>
                </div>
              </div>
            )}
          </div>

          {/* Question Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && askAIQuestion()}
              placeholder="Ask me about your uploaded content, generated notes, or any educational topic..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={askAIQuestion}
              disabled={isAsking || !currentQuestion.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Lesson Details Modal */}
      {selectedLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">{selectedLesson.title}</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => downloadLesson(selectedLesson)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  💾 Download
                </button>
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                >
                  ✕ Close
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Lesson Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-600">Subject:</span>
                  <p className="text-gray-800">{selectedLesson.subject_area}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Grade Level:</span>
                  <p className="text-gray-800">{selectedLesson.grade_level}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Duration:</span>
                  <p className="text-gray-800">{selectedLesson.duration_minutes} minutes</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Difficulty:</span>
                  <p className="text-gray-800">{selectedLesson.difficulty}</p>
                </div>
              </div>

              {/* Overview */}
              {selectedLesson.lesson_overview && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">📋 Overview</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedLesson.lesson_overview}</p>
                </div>
              )}

              {/* Learning Objectives */}
              {selectedLesson.learning_objectives && selectedLesson.learning_objectives.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">🎯 Learning Objectives</h3>
                  <ul className="space-y-2">
                    {selectedLesson.learning_objectives.map((objective, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span className="text-gray-700">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lesson Sections */}
              {selectedLesson.sections && selectedLesson.sections.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">📚 Lesson Sections</h3>
                  <div className="space-y-4">
                    {selectedLesson.sections.map((section, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-gray-800">{section.title}</h4>
                          <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {section.duration_minutes} min
                          </span>
                        </div>
                        <p className="text-gray-700 mb-3">{section.content}</p>
                        
                        {section.activities && section.activities.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-gray-600 mb-2">Activities:</h5>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {section.activities.map((activity, actIndex) => (
                                <li key={actIndex} className="flex items-start">
                                  <span className="text-green-500 mr-2">•</span>
                                  {activity}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {section.materials_needed && section.materials_needed.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-600 mb-2">Materials Needed:</h5>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {section.materials_needed.map((material, matIndex) => (
                                <li key={matIndex} className="flex items-start">
                                  <span className="text-orange-500 mr-2">•</span>
                                  {material}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assessment Methods */}
              {selectedLesson.assessment_methods && selectedLesson.assessment_methods.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">📊 Assessment Methods</h3>
                  <ul className="space-y-2">
                    {selectedLesson.assessment_methods.map((method, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-purple-500 mr-2">•</span>
                        <span className="text-gray-700">{method}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Homework Suggestions */}
              {selectedLesson.homework_suggestions && selectedLesson.homework_suggestions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">📝 Homework Suggestions</h3>
                  <ul className="space-y-2">
                    {selectedLesson.homework_suggestions.map((homework, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        <span className="text-gray-700">{homework}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Additional Resources */}
              {selectedLesson.additional_resources && selectedLesson.additional_resources.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">🔗 Additional Resources</h3>
                  <ul className="space-y-2">
                    {selectedLesson.additional_resources.map((resource, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span className="text-gray-700">{resource}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComprehensiveAIAssistant;