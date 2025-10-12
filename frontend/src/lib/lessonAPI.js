// API endpoints and utilities for AI Lesson Generation
import { offlineCapableRequest } from '../utils/offline.js';

const API_BASE_URL = 'https://shxz7-backend.hf.space/api';

// Get auth token from localStorage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Common headers for API requests
const getHeaders = () => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const lessonAPI = {
  // Generate a new lesson plan
  generateLesson: async (lessonData) => {
    const url = `${API_BASE_URL}/lessons/generate`;
    return offlineCapableRequest({
      url,
      method: 'POST',
      headers: getHeaders(),
      data: lessonData,
      actionType: 'CREATE_LESSON',
      actionData: lessonData,
      fallbackData: { message: 'Lesson will be generated when online' }
    });
  },

  // Get all lessons for the current user
  getLessons: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);
    if (params.grade_level) queryParams.append('grade_level', params.grade_level);
    if (params.subject_area) queryParams.append('subject_area', params.subject_area);

    const url = `${API_BASE_URL}/lessons?${queryParams}`;
    return offlineCapableRequest({
      url,
      method: 'GET',
      headers: getHeaders(),
      cacheKey: `lessons-${queryParams.toString()}`,
      fallbackData: { lessons: [], total: 0, page: 1, per_page: 10 }
    });
  },

  // Get a specific lesson by ID
  getLesson: async (lessonId) => {
    const url = `${API_BASE_URL}/lessons/${lessonId}`;
    return offlineCapableRequest({
      url,
      method: 'GET',
      headers: getHeaders(),
      cacheKey: `lesson-${lessonId}`,
      fallbackData: null
    });
  },

  // Delete a lesson
  deleteLesson: async (lessonId) => {
    const url = `${API_BASE_URL}/lessons/${lessonId}`;
    return offlineCapableRequest({
      url,
      method: 'DELETE',
      headers: getHeaders(),
      actionType: 'DELETE_LESSON',
      actionData: { lesson_id: lessonId }
    });
  },

  // Ask AI assistant a question
  askQuestion: async (questionData) => {
    const url = `${API_BASE_URL}/ai/ask`;
    return offlineCapableRequest({
      url,
      method: 'POST',
      headers: getHeaders(),
      data: questionData,
      actionType: 'ASK_QUESTION',
      actionData: questionData,
      fallbackData: { message: 'Question will be processed when online' }
    });
  },

  // Get resource suggestions from AI
  getResourceSuggestions: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.topic) queryParams.append('topic', params.topic);
    if (params.grade_level) queryParams.append('grade_level', params.grade_level);
    if (params.subject_area) queryParams.append('subject_area', params.subject_area);

    const url = `${API_BASE_URL}/ai/suggestions/resources?${queryParams}`;
    return offlineCapableRequest({
      url,
      method: 'GET',
      headers: getHeaders(),
      cacheKey: `resource-suggestions-${queryParams.toString()}`,
      fallbackData: { suggestions: [] }
    });
  },

  // Get lesson statistics
  getLessonStats: async () => {
    const url = `${API_BASE_URL}/lessons/stats`;
    return offlineCapableRequest({
      url,
      method: 'GET',
      headers: getHeaders(),
      cacheKey: 'lesson-stats',
      fallbackData: {
        total_lessons: 0,
        lessons_this_week: 0,
        average_generation_time: 0,
        subject_distribution: {}
      }
    });
  }
};

// Constants for form options
export const LESSON_CONSTANTS = {
  LESSON_TYPES: [
    { value: 'lecture', label: 'Lecture' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'discussion', label: 'Discussion' },
    { value: 'practical', label: 'Practical' },
    { value: 'assessment', label: 'Assessment' },
    { value: 'review', label: 'Review' }
  ],

  DIFFICULTY_LEVELS: [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ],

  GRADE_LEVELS: [
    { value: 'elementary', label: 'Elementary' },
    { value: 'middle_school', label: 'Middle School' },
    { value: 'high_school', label: 'High School' },
    { value: 'primary_1', label: 'Primary 1' },
    { value: 'primary_2', label: 'Primary 2' },
    { value: 'primary_3', label: 'Primary 3' },
    { value: 'primary_4', label: 'Primary 4' },
    { value: 'primary_5', label: 'Primary 5' },
    { value: 'primary_6', label: 'Primary 6' },
    { value: 'secondary_1', label: 'Secondary 1' },
    { value: 'secondary_2', label: 'Secondary 2' },
    { value: 'secondary_3', label: 'Secondary 3' },
    { value: 'secondary_4', label: 'Secondary 4' }
  ],

  SUBJECT_AREAS: [
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'science', label: 'Science' },
    { value: 'language_arts', label: 'Language Arts' },
    { value: 'social_studies', label: 'Social Studies' },
    { value: 'history', label: 'History' },
    { value: 'geography', label: 'Geography' },
    { value: 'arts', label: 'Arts' },
    { value: 'physical_education', label: 'Physical Education' },
    { value: 'technology', label: 'Technology' },
    { value: 'music', label: 'Music' },
    { value: 'other', label: 'Other' }
  ],

  DURATIONS: [
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' }
  ]
};