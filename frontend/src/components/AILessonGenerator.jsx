'use client';

import React, { useState, useEffect } from 'react';
import { resourceAPI } from '@/lib/resourceAPI';
import { lessonAPI } from '@/lib/lessonAPI';

const AILessonGenerator = () => {
  const [resources, setResources] = useState([]);
  const [selectedResources, setSelectedResources] = useState([]);
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
  const [chatMessages, setChatMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  // Load user's uploaded resources
  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const response = await resourceAPI.getMyResources();
      setResources(response.resources || []);
    } catch (error) {
      console.error('Error loading resources:', error);
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
    } catch (error) {
      console.error('Error generating lesson:', error);
      alert('Failed to generate lesson. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const askAIQuestion = async () => {
    if (!currentQuestion.trim() || !generatedLesson) return;

    setIsAsking(true);
    const userMessage = {
      type: 'user',
      content: currentQuestion,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentQuestion('');

    try {
      const response = await lessonAPI.askQuestion({
        question: currentQuestion,
        lesson_id: generatedLesson.id,
        context: {
          lesson_topic: lessonForm.topic,
          selected_resources: selectedResources
        }
      });

      const aiMessage = {
        type: 'ai',
        content: response.answer,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error asking AI question:', error);
      const errorMessage = {
        type: 'ai',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          🧠 AI Lesson Generator with Resource Integration
        </h2>
        
        {/* Resource Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Select Resources to Include in Lesson Generation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
            {resources.map(resource => (
              <div 
                key={resource.id} 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedResources.includes(resource.id) 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => handleResourceSelect(resource.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800 truncate">
                      {resource.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {resource.resource_type} • {resource.subject_area}
                    </p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={selectedResources.includes(resource.id)}
                    onChange={() => {}}
                    className="ml-2"
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Selected {selectedResources.length} resource(s) for AI lesson generation
          </p>
        </div>

        {/* Lesson Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lesson Topic *
            </label>
            <input
              type="text"
              value={lessonForm.topic}
              onChange={(e) => handleFormChange('topic', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the main topic for your lesson"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade Level
            </label>
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
              <option value="secondary_1">Secondary 1</option>
              <option value="secondary_2">Secondary 2</option>
              <option value="secondary_3">Secondary 3</option>
              <option value="secondary_4">Secondary 4</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Area
            </label>
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
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lesson Type
            </label>
            <select
              value={lessonForm.lesson_type}
              onChange={(e) => handleFormChange('lesson_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="lecture">Lecture</option>
              <option value="workshop">Workshop</option>
              <option value="discussion">Discussion</option>
              <option value="practical">Practical</option>
              <option value="assessment">Assessment</option>
              <option value="review">Review</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level
            </label>
            <select
              value={lessonForm.difficulty}
              onChange={(e) => handleFormChange('difficulty', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Learning Objectives */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Learning Objectives
          </label>
          <div className="space-y-2">
            {lessonForm.learning_objectives.map((objective, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="flex-1 text-sm text-gray-700">
                  • {objective}
                </span>
                <button
                  onClick={() => removeLearningObjective(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={addLearningObjective}
              className="text-blue-500 hover:text-blue-700 text-sm font-medium"
            >
              + Add Learning Objective
            </button>
          </div>
        </div>

        {/* Additional Instructions */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Instructions for AI
          </label>
          <textarea
            value={lessonForm.additional_instructions}
            onChange={(e) => handleFormChange('additional_instructions', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any specific requirements or preferences for the lesson plan..."
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={generateLesson}
          disabled={isGenerating || !lessonForm.topic.trim()}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {isGenerating ? '🤖 Generating Lesson with AI...' : '🚀 Generate Lesson Plan'}
        </button>
      </div>

      {/* Generated Lesson Display */}
      {generatedLesson && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lesson Content */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Generated Lesson Plan
            </h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Overview</h4>
                <p className="text-gray-600">{generatedLesson.lesson_overview}</p>
              </div>

              {generatedLesson.learning_objectives && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Learning Objectives</h4>
                  <ul className="space-y-1">
                    {generatedLesson.learning_objectives.map((objective, index) => (
                      <li key={index} className="text-gray-600">• {objective}</li>
                    ))}
                  </ul>
                </div>
              )}

              {generatedLesson.sections && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Lesson Sections</h4>
                  <div className="space-y-4">
                    {generatedLesson.sections.map((section, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4">
                        <h5 className="font-medium text-gray-800">{section.title}</h5>
                        <p className="text-gray-600 text-sm mt-1">{section.content}</p>
                        {section.duration_minutes && (
                          <span className="text-xs text-blue-600">
                            Duration: {section.duration_minutes} minutes
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {generatedLesson.materials && generatedLesson.materials.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Required Materials</h4>
                  <ul className="space-y-1">
                    {generatedLesson.materials.map((material, index) => (
                      <li key={index} className="text-gray-600">• {material}</li>
                    ))}
                  </ul>
                </div>
              )}

              {generatedLesson.assessment_methods && generatedLesson.assessment_methods.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Assessment Methods</h4>
                  <ul className="space-y-1">
                    {generatedLesson.assessment_methods.map((method, index) => (
                      <li key={index} className="text-gray-600">• {method}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* AI Chat Assistant */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              💬 AI Teaching Assistant
            </h3>
            
            {/* Chat Messages */}
            <div className="h-80 overflow-y-auto border border-gray-200 rounded-md p-4 mb-4 space-y-3">
              {chatMessages.map((message, index) => (
                <div 
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
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
                placeholder="Ask me about the lesson, teaching tips, or modifications..."
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
        </div>
      )}
    </div>
  );
};

export default AILessonGenerator;