/**
 * MultilingualTranslator Component for Teachers Connect
 * Provides text translation functionality with language detection and document translation
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import translationAPI from '@/lib/translationAPI';
import { resourceAPI } from '@/lib/resourceAPI';
import { textToSpeechAPI } from '@/lib/textToSpeechAPI';
import { useTheme } from '@/contexts/ThemeContext';

const MultilingualTranslator = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('text'); // 'text', 'document', or 'voice'
  const [formData, setFormData] = useState({
    sourceText: '',
    translatedText: '',
    sourceLanguage: 'auto',
    targetLanguage: 'en'
  });
  
  // Document translation states
  const [selectedResource, setSelectedResource] = useState(null);
  const [availableResources, setAvailableResources] = useState([]);
  const [isTranslatingDocument, setIsTranslatingDocument] = useState(false);
  const [translatedDocument, setTranslatedDocument] = useState(null);
  const [documentTranslationProgress, setDocumentTranslationProgress] = useState(0);
  
  // Text-to-Speech states
  const [selectedVoiceResource, setSelectedVoiceResource] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [speechPitch, setSpeechPitch] = useState(1);
  const [speechVolume, setSpeechVolume] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [speechLanguage, setSpeechLanguage] = useState('en-US');
  
  // Reference to speech synthesis
  const speechSynthesisRef = React.useRef(null);
  
  const [languages, setLanguages] = useState([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [error, setError] = useState('');
  const [translationHistory, setTranslationHistory] = useState([]);
  const [serviceStatus, setServiceStatus] = useState('unknown');

  // Popular languages for quick selection
  const popularLanguages = [
    { code: 'auto', name: 'Auto Detect' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'bn', name: 'Bengali' },
    { code: 'ur', name: 'Urdu' },
    { code: 'sw', name: 'Swahili' },
    { code: 'am', name: 'Amharic' },
    { code: 'yo', name: 'Yoruba' },
    { code: 'ig', name: 'Igbo' },
    { code: 'ha', name: 'Hausa' },
    { code: 'zu', name: 'Zulu' },
    { code: 'af', name: 'Afrikaans' },
    { code: 'nl', name: 'Dutch' },
    { code: 'sv', name: 'Swedish' },
    { code: 'th', name: 'Thai' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'id', name: 'Indonesian' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'ml', name: 'Malayalam' }
  ];

  // Load available languages and check service status on component mount
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsInitializing(true);
        
        // Check service health first
        const healthCheck = await translationAPI.healthCheck();
        setServiceStatus(healthCheck.status);
        
        if (healthCheck.status === 'healthy') {
          const data = await translationAPI.getLanguages();
          setLanguages([{ code: 'auto', name: 'Auto Detect' }, ...data]);
        } else {
          setLanguages(popularLanguages);
          setError(healthCheck.message || 'Translation service not available');
        }
      } catch (error) {
        console.error('Error initializing service:', error);
        setLanguages(popularLanguages);
        setServiceStatus('error');
        setError('Failed to connect to translation service');
      } finally {
        setIsInitializing(false);
      }
    };

    const loadResources = async () => {
      try {
        // Use both my resources and general resources to ensure all user uploads are visible
        const [myResourcesResponse, allResourcesResponse] = await Promise.all([
          resourceAPI.getMyResources({ per_page: 50 }),
          resourceAPI.getResources({ author_filter: 'mine', per_page: 50 }) // Filter to show only user's resources
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
        console.log('Loaded resources for Multilingual Translator:', combinedResources); // Debug log
        setAvailableResources(combinedResources);
      } catch (error) {
        console.error('Error loading resources:', error);
        // Fallback to just getting general resources
        try {
          const response = await resourceAPI.getResources({ per_page: 50 });
          setAvailableResources(response.resources || []);
        } catch (fallbackError) {
          console.error('Fallback resource loading also failed:', fallbackError);
          setAvailableResources([]);
          setTimeout(() => {
            if (fallbackError.message && fallbackError.message.includes('Authentication')) {
              setError('Please log in to access your resources');
            }
          }, 100);
        }
      }
    };

    // Function to refresh resources - can be called when needed
    const refreshResources = async () => {
      console.log('Refreshing resources...');
      await loadResources();
    };

    const initializeSpeechSynthesis = () => {
      if ('speechSynthesis' in window) {
        // Load available voices
        const loadVoices = () => {
          const voices = speechSynthesis.getVoices();
          setAvailableVoices(voices);
          
          // Set default voice (prefer English)
          const defaultVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
          setSelectedVoice(defaultVoice);
        };
        
        // Load voices immediately and on voiceschanged event
        loadVoices();
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    };

    initializeService();
    loadResources();
    initializeSpeechSynthesis();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const detectLanguage = async () => {
    if (!formData.sourceText.trim()) {
      setError('Please enter text to detect language');
      return;
    }

    setIsDetecting(true);
    setError('');

    try {
      const result = await translationAPI.detectLanguage(formData.sourceText);
      setDetectedLanguage(result);
      setFormData(prev => ({
        ...prev,
        sourceLanguage: result.language_code
      }));
    } catch (error) {
      setError(error.message || 'Failed to detect language. Please check your connection.');
    } finally {
      setIsDetecting(false);
    }
  };

  const translateText = async () => {
    if (!formData.sourceText.trim()) {
      setError('Please enter text to translate');
      return;
    }

    if (!formData.targetLanguage) {
      setError('Please select a target language');
      return;
    }

    setIsTranslating(true);
    setError('');

    try {
      const result = await translationAPI.translateText(
        formData.sourceText,
        formData.targetLanguage,
        formData.sourceLanguage
      );

      if (result.success) {
        setFormData(prev => ({
          ...prev,
          translatedText: result.translated_text
        }));

        // Add to history
        const historyItem = {
          id: Date.now(),
          original: formData.sourceText,
          translated: result.translated_text,
          sourceLanguage: result.source_language_name || result.source_language,
          targetLanguage: result.target_language_name || result.target_language,
          confidence: result.confidence,
          timestamp: new Date().toLocaleString()
        };
        
        setTranslationHistory(prev => [historyItem, ...prev.slice(0, 4)]); // Keep last 5 translations
      } else {
        setError(result.error || 'Translation failed');
      }
    } catch (error) {
      setError(error.message || 'Failed to translate text. Please check your connection.');
    } finally {
      setIsTranslating(false);
    }
  };

  const swapLanguages = () => {
    if (formData.sourceLanguage === 'auto') return;
    
    setFormData(prev => ({
      ...prev,
      sourceLanguage: prev.targetLanguage,
      targetLanguage: prev.sourceLanguage,
      sourceText: prev.translatedText,
      translatedText: prev.sourceText
    }));
  };

  const clearAll = () => {
    setFormData({
      sourceText: '',
      translatedText: '',
      sourceLanguage: 'auto',
      targetLanguage: 'en'
    });
    setDetectedLanguage(null);
    setError('');
  };

  // Text-to-Speech functions
  const extractTextFromResource = async (resource) => {
    if (!resource) {
      setError('Please select a resource to extract text from');
      return;
    }

    setIsExtractingText(true);
    setError('');

    try {
      console.log('=== TEXT EXTRACTION DEBUG ===');
      console.log('Extracting text from resource:', resource);
      console.log('Resource ID:', resource.id);
      console.log('Resource object keys:', Object.keys(resource));
      console.log('Resource data:', JSON.stringify(resource, null, 2));
      
      // First try backend extraction
      try {
        console.log('Attempting backend text extraction...');
        console.log('API endpoint will be:', `https://shxz7-backend.hf.space/api/multilingual/extract-text/${resource.id}`);
        const extractedText = await textToSpeechAPI.extractTextFromPdf(resource.id);
        setExtractedText(extractedText);
        setSelectedVoiceResource(resource);
        setError('✅ Text extracted successfully from backend!');
        return;
      } catch (backendError) {
        console.log('Backend extraction failed:', backendError.message);
        console.log('Full backend error:', backendError);
        
        // Always provide fallback demo text when backend fails
        console.log('Using demo text fallback...');
        setError('⚠️ Backend unavailable - using demo text for voice generation...');
        
        // Create sample educational text based on the resource
        const demoText = `Welcome to the voice generation demo for "${resource.title}".

This is a sample text from your selected document. In the full version with a working backend, the actual PDF content would be extracted and converted to speech.

This document appears to be from the ${resource.subject_area || resource.subject || 'educational'} subject area, suitable for ${resource.grade_level || resource.grade || 'students'}.

Key features of this text-to-speech system:
• High-quality voice synthesis using AI models
• Support for multiple languages and accents
• Adjustable speech rate and pronunciation
• Accessibility features for students with reading difficulties
• Automatic fallback to reliable browser speech synthesis

You can now test the voice generation features using this sample text. The system will try advanced AI voice models first, then fall back to your browser's built-in speech synthesis for guaranteed functionality.

Thank you for testing the Teachers Connect voice output system!`;

        setExtractedText(demoText);
        setSelectedVoiceResource(resource);
        return;
      }
    } catch (error) {
      console.error('=== TEXT EXTRACTION ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      setError('Failed to extract text: ' + error.message);
    } finally {
      setIsExtractingText(false);
    }
  };

  const speakText = async (text, useHuggingFace = false) => {
    if (!text.trim()) {
      setError('No text to speak');
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    setIsSpeaking(true);
    setError('');

    try {
      if (useHuggingFace) {
        // Use Hugging Face Coqui XTTS-v2
        const language = textToSpeechAPI.getLanguageCode(speechLanguage.split('-')[0]);
        const audioBlob = await textToSpeechAPI.generateSpeech(text, { language });
        
        // Create audio element and play
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = () => {
          setIsSpeaking(false);
          setError('Failed to play generated speech');
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
      } else {
        // Use Web Speech API as fallback
        await textToSpeechAPI.speakWithWebAPI(text, {
          voice: selectedVoice,
          rate: speechRate,
          pitch: speechPitch,
          volume: speechVolume,
          lang: speechLanguage
        });
        setIsSpeaking(false);
      }
    } catch (error) {
      setError('Failed to generate speech: ' + error.message);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    textToSpeechAPI.stopSpeech();
    setIsSpeaking(false);
  };

  const speakExtractedText = () => {
    speakText(extractedText, true); // Use Hugging Face for better quality
  };

  const speakTranslatedText = () => {
    speakText(formData.translatedText, false); // Use Web API for translated text
  };

  // Test TTS function to check if Hugging Face is working
  const testTTS = async () => {
    const testText = "Hello, this is a test of the text-to-speech system.";
    setIsSpeaking(true);
    setError('');
    
    try {
      console.log('🎵 Testing TTS with automatic fallback...');
      setError('🎵 Testing TTS system...');
      
      // Try primary TTS system (HF with Web Speech fallback)
      const audioBlob = await textToSpeechAPI.generateSpeech(testText, {
        language: speechLanguage,
        useHuggingFace: true
      });
      
      console.log('TTS generation successful');
      setError('✅ TTS generation successful! Playing audio...');
      
      // For Web Speech API, we don't need to play the blob
      if (audioBlob.type === 'text/plain') {
        // This indicates Web Speech API was used
        setError('✅ Text-to-Speech successful using Web Speech API!');
        setIsSpeaking(false);
      } else {
        // This indicates Hugging Face was used
        console.log('Playing Hugging Face generated audio...');
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          setError('✅ Hugging Face TTS test successful! High-quality audio generated.');
        };
        
        audio.onerror = (error) => {
          console.error('Audio playback error:', error);
          setError('TTS generation succeeded but audio playback failed. Check your browser audio settings.');
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('TTS test error:', error);
      setIsSpeaking(false);
      setError('❌ TTS test failed: ' + error.message);
    }
  };

  // Test backend connectivity
  const testBackend = async () => {
    setError('🔍 Testing backend connection...');
    try {
      const result = await textToSpeechAPI.testBackendConnection();
      if (result.connected) {
        setError('✅ Backend connected successfully!');
      } else {
        setError(`❌ Backend connection failed: ${result.error}`);
      }
    } catch (error) {
      setError(`❌ Backend test failed: ${error.message}`);
    }
  };

  // Test specific resource extraction
  const testResourceExtraction = async () => {
    if (!selectedVoiceResource) {
      setError('❌ No resource selected. Please select a document first.');
      return;
    }
    
    setError('🔍 Testing resource extraction endpoint...');
    try {
      const result = await textToSpeechAPI.testExtractEndpoint(selectedVoiceResource.id);
      if (result.success) {
        setError(`✅ Resource extraction test successful! Extracted ${result.data.extracted_text?.length || 0} characters.`);
      } else {
        setError(`❌ Resource extraction failed: Status ${result.status} - ${result.error}`);
      }
    } catch (error) {
      setError(`❌ Resource extraction test failed: ${error.message}`);
    }
  };

  // Document translation functions
  const translateDocument = async () => {
    if (!selectedResource) {
      setError('Please select a resource to translate');
      return;
    }

    if (!formData.targetLanguage) {
      setError('Please select a target language');
      return;
    }

    setIsTranslatingDocument(true);
    setError('');
    setDocumentTranslationProgress(0);

    try {
      console.log('Selected resource for translation:', selectedResource);
      console.log('Resource ID:', selectedResource.id);
      console.log('Target language:', formData.targetLanguage);
      
      // Debug: Check resource access first
      console.log('Checking resource access...');
      const debugResult = await translationAPI.debugResourceAccess(selectedResource.id);
      console.log('Debug result:', debugResult);
      
      if (debugResult.error) {
        setError(`Resource access error: ${debugResult.error}`);
        return;
      }
      
      if (!debugResult.user_has_access) {
        setError('You do not have access to this resource');
        return;
      }
      
      const result = await translationAPI.translateDocument(
        selectedResource.id,
        formData.targetLanguage,
        formData.sourceLanguage
      );
      
      if (result.success) {
        setTranslatedDocument(result);
        setDocumentTranslationProgress(100);
      } else {
        setError(result.error || 'Document translation failed');
      }
    } catch (error) {
      setError(error.message || 'Failed to translate document. Please check your connection.');
    } finally {
      setIsTranslatingDocument(false);
    }
  };

  const downloadTranslatedDocument = async () => {
    if (!translatedDocument || !translatedDocument.filename) {
      setError('No translated document available for download');
      return;
    }

    try {
      // Use the translationAPI download function instead of direct fetch
      const response = await translationAPI.downloadTranslatedDocument(translatedDocument.filename);

      if (!response.ok) {
        throw new Error('Failed to download translated document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = translatedDocument.filename || 'translated_document.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError(error.message || 'Failed to download translated document');
    }
  };

  // Debug function to check translated files
  const debugTranslatedFiles = async () => {
    try {
      const result = await translationAPI.debugListTranslatedFiles();
      console.log('Debug translated files result:', result);
      alert(`Found ${result.all_files_in_directory?.length || 0} files in translated directory. Check console for details.`);
    } catch (error) {
      console.error('Debug error:', error);
      alert(`Debug error: ${error.message}`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could show a toast notification here
      console.log('Text copied to clipboard');
    });
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 space-y-6 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Header */}
      <div className="text-center">
        <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          🌍 Multilingual Translator
        </h1>
        <p className={`mb-4 transition-colors duration-300 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Translate educational content using Meta's NLLB AI model
        </p>
        
        {/* Tab Navigation */}
        <div className={`flex justify-center mb-6 border-b transition-colors duration-300 ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={() => setActiveTab('text')}
            className={`px-6 py-3 font-medium border-b-2 transition-all duration-300 ${
              activeTab === 'text'
                ? (theme === 'dark' 
                    ? 'border-blue-400 text-blue-400' 
                    : 'border-blue-500 text-blue-600')
                : (theme === 'dark'
                    ? 'border-transparent text-gray-400 hover:text-gray-200'
                    : 'border-transparent text-gray-500 hover:text-gray-700')
            }`}
          >
            📝 Text Translation
          </button>
          <button
            onClick={() => setActiveTab('document')}
            className={`px-6 py-3 font-medium border-b-2 transition-all duration-300 ${
              activeTab === 'document'
                ? (theme === 'dark' 
                    ? 'border-blue-400 text-blue-400' 
                    : 'border-blue-500 text-blue-600')
                : (theme === 'dark'
                    ? 'border-transparent text-gray-400 hover:text-gray-200'
                    : 'border-transparent text-gray-500 hover:text-gray-700')
            }`}
          >
            📄 Document Translation
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-6 py-3 font-medium border-b-2 transition-all duration-300 ${
              activeTab === 'voice'
                ? (theme === 'dark' 
                    ? 'border-purple-400 text-purple-400' 
                    : 'border-purple-500 text-purple-600')
                : (theme === 'dark'
                    ? 'border-transparent text-gray-400 hover:text-gray-200'
                    : 'border-transparent text-gray-500 hover:text-gray-700')
            }`}
          >
            🔊 Voice Output
          </button>
        </div>
        
        {/* Service Status Indicator */}
        {isInitializing && (
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm border transition-colors duration-300 ${
            theme === 'dark' 
              ? 'bg-blue-900 text-blue-300 border-blue-700'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-700 mr-2"></div>
            Initializing NLLB model...
          </div>
        )}
        
        {serviceStatus === 'healthy' && !isInitializing && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-50 text-green-700 border border-green-200">
            ✅ NLLB Model Ready
          </div>
        )}
        
        {serviceStatus === 'error' && !isInitializing && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-50 text-red-700 border border-red-200">
            ❌ Service Unavailable
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className={`p-4 rounded-lg border transition-colors duration-300 ${
          theme === 'dark'
            ? 'bg-red-900 border-red-700 text-red-300'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-center">
            <span className="mr-2">⚠️</span>
            {error}
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'text' ? (
        // Text Translation Tab
        <div className={`rounded-lg shadow-lg border p-6 transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          {/* Language Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="source-lang" className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Source Language
              </Label>
              <select
                id="source-lang"
                value={formData.sourceLanguage}
                onChange={(e) => handleInputChange('sourceLanguage', e.target.value)}
                className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end justify-center">
              <Button
                onClick={swapLanguages}
                variant="outline"
                size="sm"
                disabled={formData.sourceLanguage === 'auto'}
                className="px-4 py-2"
              >
                ⇄ Swap
              </Button>
            </div>

            <div>
              <Label htmlFor="target-lang" className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Target Language
              </Label>
              <select
                id="target-lang"
                value={formData.targetLanguage}
                onChange={(e) => handleInputChange('targetLanguage', e.target.value)}
                className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {languages.filter(lang => lang.code !== 'auto').map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Text Areas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Source Text */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="source-text" className={`text-sm font-medium transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Text to Translate
                </Label>
                <Button
                  onClick={detectLanguage}
                  variant="outline"
                  size="sm"
                  disabled={isDetecting || !formData.sourceText.trim()}
                  className="text-xs"
                >
                  {isDetecting ? 'Detecting...' : 'Detect Language'}
                </Button>
              </div>
              <textarea
                id="source-text"
                value={formData.sourceText}
                onChange={(e) => handleInputChange('sourceText', e.target.value)}
                placeholder="Enter text to translate..."
                rows={8}
                className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                maxLength={5000}
              />
              <div className={`flex justify-between items-center text-xs mt-1 transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <span>{formData.sourceText.length}/5000 characters</span>
                {detectedLanguage && (
                  <span className="text-green-600">
                    Detected: {detectedLanguage.language_name}
                  </span>
                )}
              </div>
            </div>

            {/* Translated Text */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="translated-text" className={`text-sm font-medium transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Translation
                </Label>
                {formData.translatedText && (
                  <Button
                    onClick={() => copyToClipboard(formData.translatedText)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    📋 Copy
                  </Button>
                )}
              </div>
              <textarea
                id="translated-text"
                value={formData.translatedText}
                readOnly
                placeholder="Translation will appear here..."
                rows={8}
                className={`w-full p-3 border rounded-md resize-vertical transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-gray-600 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={translateText}
              disabled={isTranslating || !formData.sourceText.trim() || serviceStatus !== 'healthy'}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isTranslating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Translating with NLLB...
                </>
              ) : (
                '🔄 Translate'
              )}
            </Button>
            
            <Button
              onClick={clearAll}
              variant="outline"
              className="px-6 py-2"
            >
              🗑️ Clear All
            </Button>
          </div>
        </div>
      ) : activeTab === 'document' ? (
        // Document Translation Tab
        <div className={`rounded-lg shadow-lg border p-6 transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            📄 Document Translation
          </h3>
          <p className={`mb-6 transition-colors duration-300 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Select a PDF or DOC file from your uploaded resources to translate the entire document.
          </p>

          {/* Language Selection for Documents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="doc-source-lang" className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Source Language
              </Label>
              <select
                id="doc-source-lang"
                value={formData.sourceLanguage}
                onChange={(e) => handleInputChange('sourceLanguage', e.target.value)}
                className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="doc-target-lang" className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Target Language
              </Label>
              <select
                id="doc-target-lang"
                value={formData.targetLanguage}
                onChange={(e) => handleInputChange('targetLanguage', e.target.value)}
                className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {languages.filter(lang => lang.code !== 'auto').map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Resource Selection */}
          <div className="mb-6">
            <Label className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Select Document to Translate
            </Label>
            <div className={`border rounded-lg p-4 max-h-60 overflow-y-auto transition-colors duration-300 ${
              theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
            }`}>
              {availableResources.length === 0 ? (
                <div className="text-center py-4">
                  <p className={`mb-3 transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    No documents available. Upload some PDF or DOC files first.
                  </p>
                  <Button
                    onClick={async () => {
                      console.log('Refreshing resources...');
                      try {
                        // Use both my resources and general resources to ensure all user uploads are visible
                        const [myResourcesResponse, allResourcesResponse] = await Promise.all([
                          resourceAPI.getMyResources({ per_page: 50 }),
                          resourceAPI.getResources({ author_filter: 'mine', per_page: 50 })
                        ]);
                        
                        // Combine and deduplicate resources
                        const myResources = myResourcesResponse.resources || [];
                        const allResources = allResourcesResponse.resources || [];
                        
                        const resourceMap = new Map();
                        myResources.forEach(resource => resourceMap.set(resource.id, resource));
                        allResources.forEach(resource => {
                          if (!resourceMap.has(resource.id)) {
                            resourceMap.set(resource.id, resource);
                          }
                        });
                        
                        const combinedResources = Array.from(resourceMap.values());
                        console.log('Refreshed resources:', combinedResources);
                        setAvailableResources(combinedResources);
                      } catch (error) {
                        console.error('Error refreshing resources:', error);
                      }
                    }}
                    className={`px-4 py-2 text-sm transition-colors duration-300 ${
                      theme === 'dark' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    🔄 Refresh Resources
                  </Button>
                </div>
              ) : (
                (() => {
                  const documentResources = availableResources.filter(resource => {
                    // Check if it's a PDF or Word document based on mime_type or file_name
                    const mimeType = resource.mime_type?.toLowerCase() || '';
                    const fileName = resource.file_name?.toLowerCase() || '';
                    
                    return (
                      mimeType.includes('pdf') ||
                      mimeType.includes('document') ||
                      mimeType.includes('word') ||
                      fileName.endsWith('.pdf') ||
                      fileName.endsWith('.doc') ||
                      fileName.endsWith('.docx')
                    );
                  });
                  
                  console.log('Filtered document resources:', documentResources); // Debug log
                  
                  if (documentResources.length === 0) {
                    return (
                      <div className="text-center py-4">
                        <p className={`mb-3 transition-colors duration-300 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          No PDF or DOC files found. Upload some documents first.
                        </p>
                        <Button
                          onClick={async () => {
                            console.log('Refreshing resources for documents...');
                            try {
                              const [myResourcesResponse, allResourcesResponse] = await Promise.all([
                                resourceAPI.getMyResources({ per_page: 50 }),
                                resourceAPI.getResources({ author_filter: 'mine', per_page: 50 })
                              ]);
                              
                              const myResources = myResourcesResponse.resources || [];
                              const allResources = allResourcesResponse.resources || [];
                              
                              const resourceMap = new Map();
                              myResources.forEach(resource => resourceMap.set(resource.id, resource));
                              allResources.forEach(resource => {
                                if (!resourceMap.has(resource.id)) {
                                  resourceMap.set(resource.id, resource);
                                }
                              });
                              
                              const combinedResources = Array.from(resourceMap.values());
                              console.log('Refreshed resources for documents:', combinedResources);
                              setAvailableResources(combinedResources);
                            } catch (error) {
                              console.error('Error refreshing resources:', error);
                            }
                          }}
                          className={`px-4 py-2 text-sm transition-colors duration-300 ${
                            theme === 'dark' 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          🔄 Refresh Documents
                        </Button>
                      </div>
                    );
                  }
                  
                  return (
                <div className="space-y-2">
                  {documentResources.map((resource) => (
                    <div
                      key={resource.id}
                      onClick={() => setSelectedResource(resource)}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                        selectedResource?.id === resource.id
                          ? (theme === 'dark' 
                              ? 'bg-blue-700 border-blue-500' 
                              : 'bg-blue-100 border-blue-300')
                          : (theme === 'dark'
                              ? 'bg-gray-600 border-gray-500 hover:bg-gray-500'
                              : 'bg-white border-gray-200 hover:bg-gray-50')
                      } border-2`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={`font-medium transition-colors duration-300 ${
                            selectedResource?.id === resource.id
                              ? (theme === 'dark' ? 'text-white' : 'text-blue-900')
                              : (theme === 'dark' ? 'text-white' : 'text-gray-900')
                          }`}>
                            {resource.title}
                          </h4>
                          <p className={`text-sm transition-colors duration-300 ${
                            selectedResource?.id === resource.id
                              ? (theme === 'dark' ? 'text-blue-200' : 'text-blue-700')
                              : (theme === 'dark' ? 'text-gray-300' : 'text-gray-600')
                          }`}>
                            {resource.file_type?.toUpperCase()} • {resource.subject_area} • {resource.grade_level}
                          </p>
                        </div>
                        <div className={`text-2xl ${
                          selectedResource?.id === resource.id ? 'opacity-100' : 'opacity-40'
                        }`}>
                          📄
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                  );
                })()
              )}
            </div>
          </div>

          {/* Translation Progress */}
          {documentTranslationProgress > 0 && documentTranslationProgress < 100 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Translation Progress
                </span>
                <span className={`text-sm transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {documentTranslationProgress}%
                </span>
              </div>
              <div className={`w-full bg-gray-200 rounded-full h-2 transition-colors duration-300 ${
                theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
              }`}>
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${documentTranslationProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Translated Document Result */}
          {translatedDocument && (
            <div className={`mb-6 p-4 border rounded-lg transition-colors duration-300 ${
              theme === 'dark' 
                ? 'bg-green-900 border-green-700 text-green-300'
                : 'bg-green-50 border-green-200 text-green-700'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">✅ Document Translated Successfully!</h4>
                  <p className="text-sm">
                    {translatedDocument.filename} • {translatedDocument.pages} pages translated
                  </p>
                </div>
                <Button
                  onClick={downloadTranslatedDocument}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  📥 Download
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={translateDocument}
              disabled={isTranslatingDocument || !selectedResource || serviceStatus !== 'healthy'}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isTranslatingDocument ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Translating Document...
                </>
              ) : (
                '🔄 Translate Document'
              )}
            </Button>
            
            <Button
              onClick={() => {
                setSelectedResource(null);
                setTranslatedDocument(null);
                setDocumentTranslationProgress(0);
              }}
              variant="outline"
              className="px-6 py-2"
            >
              🗑️ Clear Selection
            </Button>
            
            <Button
              onClick={debugTranslatedFiles}
              variant="outline"
              className="px-4 py-2 border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              🐛 Debug Files
            </Button>
          </div>
        </div>
      ) : activeTab === 'voice' ? (
        // Voice Output Tab
        <div className={`rounded-lg shadow-lg border p-6 transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            🔊 Voice Output
          </h3>
          <p className={`mb-4 transition-colors duration-300 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Select a PDF document to automatically extract text and generate high-quality voice output.
          </p>

          {/* Quick TTS Test */}
          <div className="mb-6 p-4 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <h4 className="font-medium text-green-800 mb-2">🧪 Test Text-to-Speech System</h4>
            <p className="text-sm text-green-700 mb-2">
              Test the TTS system with automatic fallback: Hugging Face models → Web Speech API.
            </p>
            <p className="text-xs text-green-600 mb-3">
              The system will try high-quality AI models first, then fall back to reliable browser TTS.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={testTTS}
                disabled={isSpeaking}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              >
                {isSpeaking ? 'Testing...' : '🎵 Test TTS System'}
              </Button>
              <Button
                onClick={async () => {
                  setIsSpeaking(true);
                  setError('');
                  try {
                    await textToSpeechAPI.generateSpeechWithWebAPI("Hello, this is a test of the Web Speech API.", {
                      rate: speechRate,
                      lang: speechLanguage
                    });
                    setError('✅ Web Speech API test successful!');
                  } catch (error) {
                    setError('❌ Web Speech API failed: ' + error.message);
                  }
                  setIsSpeaking(false);
                }}
                disabled={isSpeaking}
                variant="outline"
                className="px-4 py-2 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
              >
                🔊 Test Browser TTS
              </Button>
              <Button
                onClick={testBackend}
                variant="outline"
                className="px-4 py-2 border-orange-600 text-orange-600 hover:bg-orange-50"
              >
                🔍 Test Backend
              </Button>
            </div>
          </div>

          {/* Document Selection for Voice */}
          <div className="mb-6">
            <Label className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Select Document for Voice Output
            </Label>
            <div className={`border-2 border-dashed rounded-lg p-4 transition-colors duration-300 ${
              theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
            }`}>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableResources.length === 0 ? (
                  <p className={`text-center py-4 transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    No resources available. Please upload some PDF files first.
                  </p>
                ) : (
                  availableResources.map((resource) => (
                    <div
                      key={resource.id}
                      onClick={async () => {
                        setSelectedVoiceResource(resource);
                        // Automatically extract text when document is selected for voice
                        if (!isExtractingText) {
                          await extractTextFromResource(resource);
                        }
                      }}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                        selectedVoiceResource?.id === resource.id
                          ? (theme === 'dark' 
                              ? 'border-purple-500 bg-purple-900/20' 
                              : 'border-purple-500 bg-purple-50')
                          : (theme === 'dark'
                              ? 'border-gray-600 hover:border-purple-400 bg-gray-700'
                              : 'border-gray-200 hover:border-purple-300 bg-gray-50')
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">
                            {selectedVoiceResource?.id === resource.id ? '🔊' : '📄'}
                          </span>
                          <div>
                            <h4 className={`font-medium transition-colors duration-300 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-800'
                            }`}>
                              {resource.title}
                            </h4>
                            <p className={`text-sm transition-colors duration-300 ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              📄 PDF • {resource.subject} • {resource.grade}
                            </p>
                          </div>
                        </div>
                        {selectedVoiceResource?.id === resource.id && extractedText && (
                          <span className="text-green-600 text-sm font-medium">✅ Ready for Voice</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Auto Text Extraction Status */}
          {isExtractingText && (
            <div className="mb-6 p-4 border rounded-lg bg-blue-50 border-blue-200">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-800">Extracting text from "{selectedVoiceResource?.title}"...</span>
              </div>
            </div>
          )}

          {/* Voice Generation Section - Only show when text is ready */}
          {extractedText && !isExtractingText && selectedVoiceResource && (
            <div className="mb-6 p-6 border rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <h4 className="font-medium text-purple-800 mb-4 flex items-center">
                🎵 Generate Voice from "{selectedVoiceResource.title}"
              </h4>
              
              <div className="mb-4">
                <p className="text-sm text-purple-700 mb-2">
                  ✅ Text extracted successfully ({extractedText.length} characters)
                </p>
                <div className="bg-white p-3 rounded border max-h-32 overflow-y-auto text-sm text-gray-700">
                  {extractedText.substring(0, 200)}...
                </div>
              </div>

              {/* Voice Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block text-purple-700">
                    Voice Language: {speechLanguage}
                  </Label>
                  <select
                    value={speechLanguage}
                    onChange={(e) => setSpeechLanguage(e.target.value)}
                    className="w-full p-2 border rounded-md bg-white"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                    <option value="it-IT">Italian</option>
                    <option value="pt-PT">Portuguese</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block text-purple-700">
                    Speech Rate: {speechRate}x
                  </Label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Voice Generation Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={speakExtractedText}
                  disabled={!extractedText || isSpeaking}
                  className={`px-6 py-2 text-white rounded-lg transition-colors ${
                    isSpeaking
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  } disabled:opacity-50`}
                >
                  {isSpeaking ? (
                    <>
                      <div className="animate-pulse mr-2">🔊</div>
                      Stop Speaking
                    </>
                  ) : (
                    '🎵 Generate High-Quality Voice'
                  )}
                </Button>

                <Button
                  onClick={stopSpeaking}
                  disabled={!isSpeaking}
                  variant="outline"
                  className="px-4 py-2"
                >
                  ⏹️ Stop
                </Button>

                <Button
                  onClick={testTTS}
                  disabled={isSpeaking}
                  variant="outline"
                  className="px-4 py-2 border-green-600 text-green-600 hover:bg-green-50"
                >
                  🧪 Test TTS
                </Button>
              </div>
            </div>
          )}

          {/* Debug Tools - Only show if no text extracted yet */}
          {!extractedText && selectedVoiceResource && !isExtractingText && (
            <div className="mb-6 p-4 border rounded-lg bg-orange-50 border-orange-200">
              <h4 className="font-medium text-orange-800 mb-2">🔧 Demo & Debug Options</h4>
              <p className="text-sm text-orange-700 mb-3">
                Choose how to proceed with your selected document:
              </p>
              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={() => {
                    // Trigger demo mode directly
                    const demoText = `Demo text for "${selectedVoiceResource.title}". This is a sample educational text that demonstrates the voice generation features. In a production environment, this would be the actual extracted content from your PDF document. You can now test all voice generation features with this sample text.`;
                    setExtractedText(demoText);
                    setError('✅ Demo text loaded - voice generation ready!');
                  }}
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-700"
                >
                  📝 Use Demo Text
                </Button>
                <Button
                  onClick={testResourceExtraction}
                  variant="outline"
                  className="px-4 py-2 border-orange-600 text-orange-600 hover:bg-orange-50"
                >
                  🔧 Debug Backend
                </Button>
                <Button
                  onClick={() => extractTextFromResource(selectedVoiceResource)}
                  variant="outline"
                  className="px-4 py-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  🔄 Retry Backend
                </Button>
              </div>
            </div>
          )}

          {/* Extracted Text Display */}
          {extractedText && (
            <div className="mb-6">
              <Label className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Extracted Text
              </Label>
              <div className={`p-4 border rounded-lg max-h-60 overflow-y-auto transition-colors duration-300 ${
                theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
              }`}>
                <p className={`text-sm whitespace-pre-wrap transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {extractedText.substring(0, 1000)}{extractedText.length > 1000 ? '...' : ''}
                </p>
              </div>
            </div>
          )}

          {/* Speech Settings */}
          {extractedText && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Speech Language
                </Label>
                <select
                  value={speechLanguage}
                  onChange={(e) => setSpeechLanguage(e.target.value)}
                  className={`w-full p-3 border rounded-lg transition-colors duration-300 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                  <option value="it-IT">Italian</option>
                  <option value="pt-PT">Portuguese</option>
                  <option value="ru-RU">Russian</option>
                  <option value="ja-JP">Japanese</option>
                  <option value="ko-KR">Korean</option>
                  <option value="zh-CN">Chinese</option>
                  <option value="ar-SA">Arabic</option>
                  <option value="hi-IN">Hindi</option>
                </select>
              </div>

              <div>
                <Label className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Speech Rate: {speechRate}x
                </Label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Voice Output Controls */}
          {extractedText && (
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={speakExtractedText}
                disabled={!extractedText || isExtractingText}
                className={`px-6 py-2 text-white rounded-lg transition-colors ${
                  isSpeaking
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                } disabled:opacity-50`}
              >
                {isSpeaking ? (
                  <>
                    <div className="animate-pulse mr-2">🔊</div>
                    Stop Speaking
                  </>
                ) : (
                  '🎵 Generate Voice (Hugging Face)'
                )}
              </Button>

              <Button
                onClick={speakTranslatedText}
                disabled={!formData.translatedText}
                variant="outline"
                className="px-6 py-2"
              >
                🔊 Speak Translated Text
              </Button>

              <Button
                onClick={stopSpeaking}
                disabled={!isSpeaking}
                variant="outline"
                className="px-6 py-2"
              >
                ⏹️ Stop All Speech
              </Button>

              <Button
                onClick={testTTS}
                disabled={isSpeaking}
                variant="outline"
                className="px-4 py-2 border-green-600 text-green-600 hover:bg-green-50"
              >
                🧪 Test TTS
              </Button>
            </div>
          )}

          {/* Voice Output Info */}
          <div className={`mt-6 p-4 rounded-lg transition-colors duration-300 ${
            theme === 'dark' ? 'bg-purple-900/20 border border-purple-700' : 'bg-purple-50 border border-purple-200'
          }`}>
            <h4 className={`font-medium mb-2 transition-colors duration-300 ${
              theme === 'dark' ? 'text-purple-300' : 'text-purple-700'
            }`}>
              🤖 Powered by Hugging Face TTS Models
            </h4>
            <p className={`text-sm transition-colors duration-300 ${
              theme === 'dark' ? 'text-purple-200' : 'text-purple-600'
            }`}>
              High-quality neural text-to-speech using Microsoft SpeechT5, Meta MMS-TTS, and Suno Bark models.
              Perfect for creating accessible educational content with automatic fallback to Web Speech API.
            </p>
          </div>
        </div>
      ) : null}

      {/* Translation History - Only show for text tab */}
      {activeTab === 'text' && translationHistory.length > 0 && (
        <div className={`rounded-lg shadow-lg border p-6 transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            📝 Recent Translations
          </h3>
          <div className="space-y-3">
            {translationHistory.map((item) => (
              <div key={item.id} className={`border-l-4 border-blue-500 pl-4 py-2 transition-colors duration-300 ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm mb-1 transition-colors duration-300 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {item.sourceLanguage} → {item.targetLanguage}
                    </p>
                    <p className={`transition-colors duration-300 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                      {item.original}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm mb-1 transition-colors duration-300 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Translation (Confidence: {Math.round(item.confidence * 100)}%)
                    </p>
                    <p className={`transition-colors duration-300 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                      {item.translated}
                    </p>
                  </div>
                </div>
                <p className={`text-xs mt-2 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  {item.timestamp}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Educational Use Cases */}
      <div className={`rounded-lg p-6 border transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-blue-900 to-indigo-900 border-blue-700'
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-3 transition-colors duration-300 ${
          theme === 'dark' ? 'text-white' : 'text-gray-800'
        }`}>
          📚 Powered by Meta's NLLB AI
        </h3>
        <div className={`mb-4 text-sm transition-colors duration-300 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          <p className="mb-2">
            <strong>No Language Left Behind (NLLB)</strong> is Meta's state-of-the-art multilingual AI model 
            that supports 200+ languages with high-quality translations, especially for low-resource languages.
          </p>
          <p>
            Perfect for educational contexts in diverse, multilingual communities.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className={`p-3 rounded-md shadow-sm transition-colors duration-300 ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-white'
          }`}>
            <h4 className="font-medium text-blue-700 mb-1">📖 Curriculum Translation</h4>
            <p className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Translate lesson plans and educational materials for multilingual classrooms.
            </p>
          </div>
          <div className={`p-3 rounded-md shadow-sm transition-colors duration-300 ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-white'
          }`}>
            <h4 className="font-medium text-green-700 mb-1">👨‍👩‍👧‍👦 Parent Communication</h4>
            <p className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Communicate with parents in their preferred language about student progress.
            </p>
          </div>
          <div className={`p-3 rounded-md shadow-sm transition-colors duration-300 ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-white'
          }`}>
            <h4 className="font-medium text-purple-700 mb-1">🌍 Cultural Exchange</h4>
            <p className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Facilitate international classroom collaborations and cultural learning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultilingualTranslator;