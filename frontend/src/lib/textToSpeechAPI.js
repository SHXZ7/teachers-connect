// Text-to-Speech API using Hugging Face TTS models
const HF_API_BASE = 'https://api-inference.huggingface.co/models';

// Use simple, well-tested TTS models that are known to work with Inference API
const TTS_MODELS = [
  'espnet/kan-bayashi_ljspeech_vits',  // Known working model
  'facebook/fastspeech2-en-ljspeech',  // Facebook model
  'microsoft/speecht5_tts'              // Microsoft model
];

// Get HF token from environment or fallback
const getHFToken = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use next public env var
    return process.env.NEXT_PUBLIC_HF_API_TOKEN;
  }
  return process.env.NEXT_PUBLIC_HF_API_TOKEN;
};

export const textToSpeechAPI = {
  // Primary TTS function - now uses Web Speech API first, HF as enhancement
  async generateSpeech(text, options = {}) {
    const { useHuggingFace = true, language = 'en' } = options;
    
    // If HF is requested, try it first
    if (useHuggingFace) {
      try {
        return await this.generateSpeechWithHF(text, options);
      } catch (error) {
        console.log('Hugging Face TTS failed, falling back to Web Speech API:', error.message);
        // Fall through to Web Speech API
      }
    }
    
    // Use Web Speech API (reliable fallback)
    return await this.generateSpeechWithWebAPI(text, options);
  },

  // Hugging Face TTS (experimental/enhanced quality)
  async generateSpeechWithHF(text, options = {}) {
    const { language = 'en' } = options;
    const token = getHFToken();
    
    console.log('TTS Debug - Token available:', !!token);
    console.log('TTS Debug - Token length:', token ? token.length : 0);
    console.log('TTS Debug - Token starts with hf_:', token ? token.startsWith('hf_') : false);
    
    if (!token || token === 'your_hf_token_here') {
      throw new Error('Hugging Face API token not configured. Please set NEXT_PUBLIC_HF_API_TOKEN in your .env.local file.');
    }

    console.log('Attempting TTS with Hugging Face models...');
    console.log('Available models:', TTS_MODELS);
    
    // Try each model until one works
    for (let i = 0; i < TTS_MODELS.length; i++) {
      const modelName = TTS_MODELS[i];
      try {
        console.log(`[${i+1}/${TTS_MODELS.length}] Trying TTS model: ${modelName}`);
        const response = await this.tryTTSModel(modelName, text, token);
        
        console.log(`Model ${modelName} response status: ${response.status}`);
        
        if (response.ok) {
          console.log(`✅ Success with model: ${modelName}`);
          const audioBlob = await response.blob();
          console.log('Audio blob size:', audioBlob.size, 'bytes');
          return audioBlob;
        } else {
          const errorText = await response.text();
          console.log(`❌ Model ${modelName} failed:`, response.status, errorText);
        }
      } catch (modelError) {
        console.log(`❌ Model ${modelName} exception:`, modelError.message);
        continue; // Try next model
      }
    }
    
    // If all models fail, throw error
    throw new Error('All Hugging Face TTS models failed. Check console for details.');
  },

  // Web Speech API - reliable primary option
  async generateSpeechWithWebAPI(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Web Speech API not supported in this browser'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const { rate = 1, pitch = 1, lang = 'en-US' } = options;
      
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.lang = lang;
      
      // Create audio blob from speech
      let audioChunks = [];
      
      utterance.onstart = () => {
        console.log('Web Speech synthesis started');
      };
      
      utterance.onend = () => {
        console.log('Web Speech synthesis completed');
        // For Web Speech API, we'll create a simple success indicator
        // Note: Web Speech API doesn't return audio data directly
        const successBlob = new Blob(['speech-completed'], { type: 'text/plain' });
        resolve(successBlob);
      };
      
      utterance.onerror = (event) => {
        reject(new Error(`Web Speech synthesis failed: ${event.error}`));
      };
      
      window.speechSynthesis.speak(utterance);
    });
  },

  // Helper method to try different TTS models
  async tryTTSModel(modelName, text, token) {
    const url = `${HF_API_BASE}/${modelName}`;
    console.log(`Making request to: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text
        }),
      });

      console.log(`Response for ${modelName}:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Handle specific model responses
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Error response body for ${modelName}:`, errorText);
        
        if (response.status === 503) {
          console.log(`Model ${modelName} is loading... This is normal for first use.`);
        } else if (response.status === 404) {
          console.log(`Model ${modelName} not found`);
        } else if (response.status === 401) {
          console.log(`Authentication failed for ${modelName} - check your token`);
        } else if (response.status === 400) {
          console.log(`Bad request for ${modelName}:`, errorText);
        }
      }

      return response;
    } catch (fetchError) {
      console.error(`Network error for ${modelName}:`, fetchError);
      throw fetchError;
    }
  },

  // Test backend connectivity
  async testBackendConnection() {
    try {
      console.log('Testing backend connection...');
      
      // Try the base API endpoint first
      let response = await fetch('https://shxz7-backend.hf.space/api', {
        method: 'GET',
      });
      
      if (!response.ok) {
        // Try root endpoint if API endpoint fails
        response = await fetch('https://shxz7-backend.hf.space/', {
          method: 'GET',
        });
      }
      
      console.log('Backend connection test response:', response.status);
      
      if (response.ok) {
        return { connected: true, status: response.status };
      } else {
        return { connected: false, status: response.status, error: 'Backend not responding correctly' };
      }
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return { connected: false, error: error.message };
    }
  },

  // Test the extract-text endpoint specifically
  async testExtractEndpoint(resourceId) {
    try {
      console.log('Testing extract-text endpoint...');
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      const response = await fetch(`https://shxz7-backend.hf.space/api/multilingual/extract-text/${resourceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Extract endpoint test - Status:', response.status);
      console.log('Extract endpoint test - Headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Extract endpoint test - Error response:', errorText);
        return {
          success: false,
          status: response.status,
          error: errorText
        };
      }
      
      const data = await response.json();
      console.log('Extract endpoint test - Success:', data);
      return {
        success: true,
        status: response.status,
        data: data
      };
    } catch (error) {
      console.error('Extract endpoint test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Extract text from PDF using backend
  async extractTextFromPdf(resourceId) {
    try {
      console.log('=== EXTRACT TEXT FROM PDF DEBUG ===');
      console.log('Resource ID received:', resourceId);
      console.log('Resource ID type:', typeof resourceId);
      
      // Get auth token - check for both possible keys for compatibility
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      console.log('Auth token available:', !!token);
      console.log('Auth token length:', token ? token.length : 0);
      
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const apiUrl = `https://shxz7-backend.hf.space/api/multilingual/extract-text/${resourceId}`;
      console.log('Making request to:', apiUrl);
      console.log('Request headers:', {
        'Authorization': `Bearer ${token.substring(0, 10)}...`,
        'Content-Type': 'application/json',
      });

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response status text:', response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to access this resource.');
        } else if (response.status === 404) {
          throw new Error('Resource not found.');
        }
        
        try {
          const errorData = await response.json();
          console.log('Error response data:', errorData);
          errorMessage = errorData.detail || errorMessage;
        } catch (jsonError) {
          console.log('Could not parse error response as JSON');
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data.extracted_text;
    } catch (error) {
      console.error('Error extracting text:', error);
      throw error;
    }
  },

  // Simple connectivity test
  async testConnectivity() {
    try {
      console.log('Testing basic connectivity to Hugging Face...');
      const response = await fetch('https://huggingface.co/api/models/microsoft/speecht5_tts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getHFToken()}`,
        },
      });
      
      console.log('Connectivity test response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      
      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      console.error('Connectivity test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Test function to validate Hugging Face API token
  async validateHFToken() {
    const token = getHFToken();
    
    if (!token) {
      return { valid: false, error: 'No token found' };
    }
    
    if (!token.startsWith('hf_')) {
      return { valid: false, error: 'Token should start with "hf_"' };
    }
    
    try {
      // Test with a simple API call that doesn't require model loading
      const response = await fetch('https://huggingface.co/api/whoami', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        return { valid: true, user: userData.name };
      } else {
        return { valid: false, error: `Token validation failed: ${response.status}` };
      }
    } catch (error) {
      return { valid: false, error: `Network error: ${error.message}` };
    }
  },

  // Web Speech API fallback for local TTS
  async speakWithWebAPI(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const {
        voice = null,
        rate = 1,
        pitch = 1,
        volume = 1,
        lang = 'en-US'
      } = options;

      const utterance = new SpeechSynthesisUtterance(text);
      
      if (voice) utterance.voice = voice;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      utterance.lang = lang;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(event.error));

      speechSynthesis.speak(utterance);
    });
  },

  // Stop current speech
  stopSpeech() {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  },

  // Check if speech synthesis is supported
  isSpeechSupported() {
    return 'speechSynthesis' in window;
  },

  // Language mapping for TTS
  getLanguageCode(translationLangCode) {
    const languageMap = {
      'en': 'en',
      'es': 'es',
      'fr': 'fr', 
      'de': 'de',
      'it': 'it',
      'pt': 'pt',
      'ru': 'ru',
      'ja': 'ja',
      'ko': 'ko',
      'zh': 'zh',
      'ar': 'ar',
      'hi': 'hi',
      'tr': 'tr',
      'pl': 'pl',
      'nl': 'nl',
      'cs': 'cs',
      'hu': 'hu'
    };
    
    return languageMap[translationLangCode] || 'en';
  }
};