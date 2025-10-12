/**
 * Translation API functions for Teachers Connect
 */
import offlineUtils from '../utils/offline.js';

const API_BASE_URL = 'https://shxz7-backend.hf.space/api/multilingual';

const translationAPI = {
  // Get list of supported languages
  async getLanguages() {
    const url = `${API_BASE_URL}/languages/popular`;
    return offlineUtils.offlineCapableRequest({
      url,
      method: 'GET',
      cacheKey: 'supported-languages',
      fallbackData: [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'es', name: 'Spanish', flag: '🇪🇸' },
        { code: 'fr', name: 'French', flag: '🇫🇷' },
        { code: 'de', name: 'German', flag: '🇩🇪' },
        { code: 'sw', name: 'Swahili', flag: '🇰🇪' }
      ]
    });
  },

  // Detect language of text
  async detectLanguage(text) {
    const url = `${API_BASE_URL}/detect`;
    return offlineUtils.offlineCapableRequest({
      url,
      method: 'POST',
      data: { text },
      actionType: 'DETECT_LANGUAGE',
      actionData: { text },
      fallbackData: { 
        detected_language: 'en',
        confidence: 0.5,
        message: 'Language detection will complete when online'
      }
    });
  },

  // Translate text
  async translateText(text, targetLanguage, sourceLanguage = 'auto') {
    const url = `${API_BASE_URL}/translate`;
    return offlineUtils.offlineCapableRequest({
      url,
      method: 'POST',
      data: { text, target_language: targetLanguage, source_language: sourceLanguage },
      actionType: 'TRANSLATE_TEXT',
      actionData: { text, target_language: targetLanguage, source_language: sourceLanguage },
      fallbackData: {
        translated_text: `[Offline] Translation pending for: ${text.substring(0, 50)}...`,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        message: 'Translation will complete when online'
      }
    });
  },

  // Translate educational content (specialized endpoint)
  async translateEducationalContent(text, targetLanguage, sourceLanguage = 'auto') {
    const url = `${API_BASE_URL}/translate/educational`;
    return offlineUtils.offlineCapableRequest({
      url,
      method: 'POST',
      data: { text, target_language: targetLanguage, source_language: sourceLanguage },
      actionType: 'TRANSLATE_EDUCATIONAL',
      actionData: { text, target_language: targetLanguage, source_language: sourceLanguage },
      fallbackData: {
        translated_text: `[Offline] Educational translation pending for: ${text.substring(0, 50)}...`,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        message: 'Educational translation will complete when online'
      }
    });
  },

  // Translate document
  async translateDocument(resourceId, targetLanguage, sourceLanguage = 'auto') {
    // Get auth token
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const url = `${API_BASE_URL}/translate-document`;
    return offlineUtils.offlineCapableRequest({
      url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: {
        resource_id: resourceId,
        target_language: targetLanguage,
        source_language: sourceLanguage
      },
      actionType: 'TRANSLATE_DOCUMENT',
      actionData: { resource_id: resourceId, target_language: targetLanguage, source_language: sourceLanguage },
      fallbackData: {
        message: 'Document translation will be processed when online',
        translation_id: 'offline_' + Date.now(),
        status: 'queued'
      }
    });
  },

  // Download translated document
  async downloadTranslatedDocument(filename) {
    // Get auth token
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const url = `${API_BASE_URL}/download-translated/${filename}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Download failed');
      }
      
      // Return the response for blob processing
      return response;
    } catch (error) {
      console.error('Error downloading translated document:', error);
      throw error;
    }
  },

  // Debug function to check resource access
  async debugResourceAccess(resourceId) {
    // Get auth token
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const url = `${API_BASE_URL}/debug/resource/${resourceId}`;
    return offlineUtils.offlineCapableRequest({
      url,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cacheKey: `debug-resource-${resourceId}`,
      fallbackData: {
        status: 'offline',
        message: 'Debug information will be available when online'
      }
    });
  },

  // Debug function to list translated files
  async debugListTranslatedFiles() {
    // Get auth token
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const url = `${API_BASE_URL}/debug/translated-files`;
    return offlineUtils.offlineCapableRequest({
      url,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cacheKey: 'debug-translated-files',
      fallbackData: {
        files: [],
        message: 'File list will be available when online'
      }
    });
  },

  // Check translation service health
  async healthCheck() {
    const url = `${API_BASE_URL}/health`;
    return offlineUtils.offlineCapableRequest({
      url,
      method: 'GET',
      cacheKey: 'translation-health',
      fallbackData: {
        status: 'offline',
        message: 'Translation service offline'
      }
    });
  }
};

export default translationAPI;