// API client for Teachers Connect Resource Management
import offlineUtils from '../utils/offline.js';

const API_BASE_URL = 'https://shxz7-backend.hf.space/api';

// Helper function to get auth token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Helper function to create headers
const createHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    // Handle different types of error messages
    let errorMessage = 'API request failed';
    
    if (data.detail) {
      if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (typeof data.detail === 'object') {
        errorMessage = JSON.stringify(data.detail);
      }
    } else if (data.message) {
      errorMessage = data.message;
    } else if (data.error) {
      errorMessage = data.error;
    }
    
    throw new Error(errorMessage);
  }
  
  return data;
};

// Resource API functions
export const resourceAPI = {
  // Upload a new resource
  uploadResource: async (file, metadata) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title);
    formData.append('description', metadata.description || '');
    formData.append('subject_area', metadata.subject_area);
    formData.append('grade_level', metadata.grade_level);
    formData.append('resource_type', metadata.resource_type);
    formData.append('tags', JSON.stringify(metadata.tags || []));
    formData.append('is_public', metadata.is_public || true);
    formData.append('language', metadata.language || 'en');

    // Cache the file locally for offline access
    console.log('💾 Caching file for offline access:', file.name);
    const fileBlob = await file.arrayBuffer();
    const fileData = {
      name: file.name,
      type: file.type,
      size: file.size,
      data: fileBlob,
      metadata: metadata,
      uploadedAt: new Date().toISOString()
    };
    
    // Store file in local cache
    const cacheKey = `uploaded-file-${file.name}-${Date.now()}`;
    console.log('🔑 Cache key:', cacheKey);
    await offlineUtils.cacheData(cacheKey, fileData);
    console.log('✅ File cached successfully');

    return offlineUtils.offlineCapableRequest({
      url: `${API_BASE_URL}/resources/upload`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      data: formData,
      isFormData: true,
      actionType: 'UPLOAD_RESOURCE',
      actionData: { 
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        metadata: metadata
      },
      fallbackData: {
        id: 'offline_' + Date.now(),
        title: metadata.title,
        description: metadata.description,
        subject_area: metadata.subject_area,
        grade_level: metadata.grade_level,
        resource_type: metadata.resource_type,
        tags: metadata.tags,
        is_public: metadata.is_public,
        language: metadata.language,
        filename: file.name,
        status: 'offline_pending',
        created_at: new Date().toISOString(),
        message: 'File cached locally - will upload when online'
      }
    });
  },

  // Get all resources with optional filters
  getResources: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const url = `${API_BASE_URL}/resources?${queryParams}`;
    return offlineUtils.offlineCapableRequest({
      url,
      method: 'GET',
      headers: createHeaders(false),
      cacheKey: `resources-${queryParams.toString()}`,
      fallbackData: { resources: [], total: 0, page: 1, per_page: 12, total_pages: 0 }
    });
  },

  // Get specific resource by ID
  getResource: async (resourceId) => {
    const url = `${API_BASE_URL}/resources/${resourceId}`;
    return offlineUtils.offlineCapableRequest({
      url,
      method: 'GET',
      headers: createHeaders(false),
      cacheKey: `resource-${resourceId}`,
      fallbackData: null
    });
  },

  // Get current user's resources
  getMyResources: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const url = `${API_BASE_URL}/my-resources?${queryParams}`;
    return offlineUtils.offlineCapableRequest({
      url,
      method: 'GET',
      headers: createHeaders(true),
      cacheKey: `my-resources-${queryParams.toString()}`,
      fallbackData: { resources: [], total: 0, page: 1, per_page: 12, total_pages: 0 }
    });
  },

  // Update resource
  updateResource: async (resourceId, updates) => {
    const url = `${API_BASE_URL}/resources/${resourceId}`;
    return offlineUtils.offlineCapableRequest({
      url,
      method: 'PUT',
      headers: createHeaders(true),
      data: updates,
      actionType: 'UPDATE_RESOURCE',
      actionData: { resource_id: resourceId, ...updates }
    });
  },

  // Delete resource
  deleteResource: async (resourceId) => {
    const url = `${API_BASE_URL}/resources/${resourceId}`;
    return offlineUtils.offlineCapableRequest({
      url,
      method: 'DELETE',
      headers: createHeaders(true),
      actionType: 'DELETE_RESOURCE',
      actionData: { resource_id: resourceId }
    });
  },

  // Rate a resource
  rateResource: async (resourceId, rating, comment = '') => {
    const url = `${API_BASE_URL}/resources/${resourceId}/rate`;
    return offlineUtils.offlineCapableRequest({
      url,
      method: 'POST',
      headers: createHeaders(true),
      data: { rating, comment },
      actionType: 'RATE_RESOURCE',
      actionData: { resource_id: resourceId, rating, comment }
    });
  },

  // Get resource ratings
  getResourceRatings: async (resourceId) => {
    const url = `${API_BASE_URL}/resources/${resourceId}/ratings`;
    return offlineUtils.offlineCapableRequest({
      url,
      method: 'GET',
      headers: createHeaders(false),
      cacheKey: `resource-ratings-${resourceId}`,
      fallbackData: []
    });
  },

  // Like/unlike a resource
  toggleLike: async (resourceId) => {
    const url = `${API_BASE_URL}/resources/${resourceId}/like`;
    return offlineUtils.offlineCapableRequest({
      url,
      method: 'POST',
      headers: createHeaders(true),
      actionType: 'LIKE_RESOURCE',
      actionData: { resource_id: resourceId }
    });
  },

  // Get like status
  getLikeStatus: async (resourceId) => {
    const url = `${API_BASE_URL}/resources/${resourceId}/like-status`;
    return offlineUtils.offlineCapableRequest({
      url,
      method: 'GET',
      headers: createHeaders(true),
      cacheKey: `like-status-${resourceId}`,
      fallbackData: { liked: false }
    });
  },

  // Get resource statistics
  getStats: async () => {
    const url = `${API_BASE_URL}/resources/stats/overview`;
    return offlineUtils.offlineCapableRequest({
      url,
      method: 'GET',
      headers: createHeaders(false),
      cacheKey: 'resource-stats',
      fallbackData: { 
        total_resources: 0,
        total_downloads: 0,
        average_rating: 0,
        subject_distribution: {}
      }
    });
  },

  // Download file
  downloadFile: (filename) => {
    return `${API_BASE_URL}/resources/files/${filename}`;
  },

  // Get cached files for offline access
  getCachedFiles: async () => {
    return offlineUtils.getCachedFiles();
  },

  // Get specific cached file
  getCachedFile: async (key) => {
    return offlineUtils.getCachedFile(key);
  }
};

// Constants for form options
export const SUBJECT_AREAS = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'science', label: 'Science' },
  { value: 'english', label: 'English' },
  { value: 'history', label: 'History' },
  { value: 'geography', label: 'Geography' },
  { value: 'art', label: 'Art' },
  { value: 'music', label: 'Music' },
  { value: 'physical_education', label: 'Physical Education' },
  { value: 'computer_science', label: 'Computer Science' },
  { value: 'languages', label: 'Languages' },
  { value: 'other', label: 'Other' }
];

export const GRADE_LEVELS = [
  { value: 'preschool', label: 'Preschool' },
  { value: 'kindergarten', label: 'Kindergarten' },
  { value: 'grade_1', label: 'Grade 1' },
  { value: 'grade_2', label: 'Grade 2' },
  { value: 'grade_3', label: 'Grade 3' },
  { value: 'grade_4', label: 'Grade 4' },
  { value: 'grade_5', label: 'Grade 5' },
  { value: 'grade_6', label: 'Grade 6' },
  { value: 'grade_7', label: 'Grade 7' },
  { value: 'grade_8', label: 'Grade 8' },
  { value: 'grade_9', label: 'Grade 9' },
  { value: 'grade_10', label: 'Grade 10' },
  { value: 'grade_11', label: 'Grade 11' },
  { value: 'grade_12', label: 'Grade 12' },
  { value: 'mixed', label: 'Mixed Grades' }
];

export const RESOURCE_TYPES = [
  { value: 'lesson_plan', label: 'Lesson Plan' },
  { value: 'worksheet', label: 'Worksheet' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'image', label: 'Image' },
  { value: 'pdf', label: 'PDF Document' },
  { value: 'document', label: 'Document' },
  { value: 'other', label: 'Other' }
];