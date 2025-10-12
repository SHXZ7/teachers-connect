"""
Translation Service for Teachers Connect using Hugging Face NLLB
Provides multilingual translation capabilities using Meta's No Language Left Behind model
"""

import asyncio
import functools
import logging
from typing import Dict, Optional, List
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline

logger = logging.getLogger(__name__)

class HuggingFaceTranslationService:
    def __init__(self):
        self.model_name = "facebook/nllb-200-distilled-600M"  # Smaller, faster model
        self.tokenizer = None
        self.model = None
        self.translator = None
        self.language_detector = None
        self.is_initialized = False
        self.initialization_error = None
        
        # NLLB language codes mapping
        self.nllb_languages = {
            'en': 'eng_Latn',
            'es': 'spa_Latn',
            'fr': 'fra_Latn',
            'de': 'deu_Latn',
            'it': 'ita_Latn',
            'pt': 'por_Latn',
            'ru': 'rus_Cyrl',
            'ja': 'jpn_Jpan',
            'ko': 'kor_Hang',
            'zh': 'zho_Hans',
            'ar': 'arb_Arab',
            'hi': 'hin_Deva',
            'bn': 'ben_Beng',
            'ur': 'urd_Arab',
            'sw': 'swh_Latn',
            'am': 'amh_Ethi',
            'yo': 'yor_Latn',
            'ig': 'ibo_Latn',
            'ha': 'hau_Latn',
            'zu': 'zul_Latn',
            'af': 'afr_Latn',
            'nl': 'nld_Latn',
            'sv': 'swe_Latn',
            'no': 'nob_Latn',
            'da': 'dan_Latn',
            'fi': 'fin_Latn',
            'pl': 'pol_Latn',
            'cs': 'ces_Latn',
            'hu': 'hun_Latn',
            'ro': 'ron_Latn',
            'bg': 'bul_Cyrl',
            'hr': 'hrv_Latn',
            'sr': 'srp_Cyrl',
            'sk': 'slk_Latn',
            'sl': 'slv_Latn',
            'et': 'est_Latn',
            'lv': 'lav_Latn',
            'lt': 'lit_Latn',
            'uk': 'ukr_Cyrl',
            'be': 'bel_Cyrl',
            'mk': 'mkd_Cyrl',
            'sq': 'als_Latn',
            'mt': 'mlt_Latn',
            'is': 'isl_Latn',
            'ga': 'gle_Latn',
            'cy': 'cym_Latn',
            'eu': 'eus_Latn',
            'ca': 'cat_Latn',
            'gl': 'glg_Latn',
            'th': 'tha_Thai',
            'vi': 'vie_Latn',
            'id': 'ind_Latn',
            'ms': 'zsm_Latn',
            'tl': 'tgl_Latn',
            'ta': 'tam_Taml',
            'te': 'tel_Telu',
            'ml': 'mal_Mlym',
            'kn': 'kan_Knda',
            'gu': 'guj_Gujr',
            'pa': 'pan_Guru',
            'mr': 'mar_Deva',
            'ne': 'npi_Deva',
            'si': 'sin_Sinh',
            'my': 'mya_Mymr',
            'km': 'khm_Khmr',
            'lo': 'lao_Laoo',
            'ka': 'kat_Geor',
            'hy': 'hye_Armn',
            'az': 'azj_Latn',
            'kk': 'kaz_Cyrl',
            'ky': 'kir_Cyrl',
            'uz': 'uzn_Latn',
            'tj': 'tgk_Cyrl',
            'mn': 'khk_Cyrl',
            'fa': 'pes_Arab',
            'ps': 'pbt_Arab',
            'he': 'heb_Hebr',
            'tr': 'tur_Latn',
            'el': 'ell_Grek'
        }
        
        # Reverse mapping for language detection
        self.nllb_to_simple = {v: k for k, v in self.nllb_languages.items()}
        
    async def initialize(self):
        """Initialize the models asynchronously"""
        if self.is_initialized:
            return
            
        try:
            logger.info("Initializing Hugging Face NLLB translation model...")
            
            # Initialize in a thread to avoid blocking
            loop = asyncio.get_event_loop()
            
            def _init_models():
                # Check if CUDA is available
                device = 0 if torch.cuda.is_available() else -1
                
                # Initialize tokenizer and model for NLLB
                self.tokenizer = AutoTokenizer.from_pretrained(
                    self.model_name,
                    use_fast=True,
                    trust_remote_code=True
                )
                self.model = AutoModelForSeq2SeqLM.from_pretrained(
                    self.model_name,
                    trust_remote_code=True
                )
                
                # Move model to GPU if available
                if torch.cuda.is_available():
                    self.model = self.model.cuda()
                
                # Initialize language identification pipeline (separate model)
                try:
                    self.language_detector = pipeline(
                        "text-classification",
                        model="papluca/xlm-roberta-base-language-detection",
                        device=device
                    )
                except Exception as e:
                    logger.warning(f"Could not initialize language detector: {e}")
                    self.language_detector = None
                
                return True
            
            await loop.run_in_executor(None, _init_models)
            self.is_initialized = True
            logger.info("NLLB translation model initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize translation models: {str(e)}")
            self.initialization_error = str(e)
            # Don't raise the error, just log it and set the error state
            self.is_initialized = False
    
    def get_supported_languages(self) -> Dict[str, str]:
        """Get all supported languages with their codes and names"""
        language_names = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'ja': 'Japanese',
            'ko': 'Korean',
            'zh': 'Chinese',
            'ar': 'Arabic',
            'hi': 'Hindi',
            'bn': 'Bengali',
            'ur': 'Urdu',
            'sw': 'Swahili',
            'am': 'Amharic',
            'yo': 'Yoruba',
            'ig': 'Igbo',
            'ha': 'Hausa',
            'zu': 'Zulu',
            'af': 'Afrikaans',
            'nl': 'Dutch',
            'sv': 'Swedish',
            'no': 'Norwegian',
            'da': 'Danish',
            'fi': 'Finnish',
            'pl': 'Polish',
            'cs': 'Czech',
            'hu': 'Hungarian',
            'ro': 'Romanian',
            'bg': 'Bulgarian',
            'hr': 'Croatian',
            'sr': 'Serbian',
            'sk': 'Slovak',
            'sl': 'Slovenian',
            'et': 'Estonian',
            'lv': 'Latvian',
            'lt': 'Lithuanian',
            'uk': 'Ukrainian',
            'be': 'Belarusian',
            'mk': 'Macedonian',
            'sq': 'Albanian',
            'mt': 'Maltese',
            'is': 'Icelandic',
            'ga': 'Irish',
            'cy': 'Welsh',
            'eu': 'Basque',
            'ca': 'Catalan',
            'gl': 'Galician',
            'th': 'Thai',
            'vi': 'Vietnamese',
            'id': 'Indonesian',
            'ms': 'Malay',
            'tl': 'Filipino',
            'ta': 'Tamil',
            'te': 'Telugu',
            'ml': 'Malayalam',
            'kn': 'Kannada',
            'gu': 'Gujarati',
            'pa': 'Punjabi',
            'mr': 'Marathi',
            'ne': 'Nepali',
            'si': 'Sinhala',
            'my': 'Myanmar',
            'km': 'Khmer',
            'lo': 'Lao',
            'ka': 'Georgian',
            'hy': 'Armenian',
            'az': 'Azerbaijani',
            'kk': 'Kazakh',
            'ky': 'Kyrgyz',
            'uz': 'Uzbek',
            'tj': 'Tajik',
            'mn': 'Mongolian',
            'fa': 'Persian',
            'ps': 'Pashto',
            'he': 'Hebrew',
            'tr': 'Turkish',
            'el': 'Greek'
        }
        return language_names
    
    def get_language_name(self, language_code: str) -> str:
        """Get the human-readable name for a language code"""
        language_names = self.get_popular_languages()
        for lang in language_names:
            if lang['code'] == language_code:
                return lang['name']
        return language_code.capitalize()
    
    async def detect_language(self, text: str) -> Optional[str]:
        """Detect the language of the given text using Hugging Face model"""
        try:
            if not text or not text.strip():
                return None
            
            if not self.is_initialized:
                await self.initialize()
            
            if not self.language_detector:
                # Fallback: try to detect based on common patterns
                return self._simple_language_detection(text)
            
            # Truncate text for language detection to avoid token limit issues
            # Take first 300 characters for language detection (well within 512 token limit)
            detection_text = text[:300].strip()
            if not detection_text:
                return 'en'  # Default fallback
            
            # Use Hugging Face language detection
            loop = asyncio.get_event_loop()
            
            def _detect():
                result = self.language_detector(detection_text)
                if result and len(result) > 0:
                    detected_lang = result[0]['label'].lower()
                    # Map to our simple codes if needed
                    return detected_lang if detected_lang in self.nllb_languages else 'en'
                return 'en'
            
            detected_lang = await loop.run_in_executor(None, _detect)
            return detected_lang
            
        except Exception as e:
            logger.error(f"Error detecting language: {str(e)}")
            return 'en'  # Default to English
    
    def _simple_language_detection(self, text: str) -> str:
        """Simple language detection fallback"""
        # Very basic detection based on character patterns
        text_lower = text.lower()
        
        # Arabic script
        if any('\u0600' <= char <= '\u06FF' for char in text):
            return 'ar'
        # Chinese characters
        elif any('\u4e00' <= char <= '\u9fff' for char in text):
            return 'zh'
        # Japanese characters
        elif any('\u3040' <= char <= '\u309f' or '\u30a0' <= char <= '\u30ff' for char in text):
            return 'ja'
        # Korean characters
        elif any('\uac00' <= char <= '\ud7af' for char in text):
            return 'ko'
        # Cyrillic script
        elif any('\u0400' <= char <= '\u04ff' for char in text):
            return 'ru'
        # Common Spanish words
        elif any(word in text_lower for word in ['el', 'la', 'de', 'que', 'y', 'es', 'en', 'un', 'se', 'no']):
            return 'es'
        # Common French words
        elif any(word in text_lower for word in ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir']):
            return 'fr'
        else:
            return 'en'  # Default to English
    
    async def translate_text(self, text: str, target_language: str, source_language: str = 'auto') -> Dict:
        """
        Translate text using NLLB model
        
        Args:
            text: Text to translate
            target_language: Target language code
            source_language: Source language code ('auto' for auto-detection)
            
        Returns:
            Dictionary with translation result
        """
        try:
            if not text or not text.strip():
                return {
                    "success": False,
                    "error": "Text cannot be empty",
                    "translated_text": "",
                    "source_language": None,
                    "target_language": target_language,
                    "confidence": 0
                }
            
            # Try to initialize if not already done
            if not self.is_initialized:
                await self.initialize()
            
            # If initialization failed, return fallback response
            if not self.is_initialized or self.initialization_error:
                return {
                    "success": False,
                    "error": f"NLLB model not available: {self.initialization_error or 'Initialization failed'}",
                    "translated_text": text,  # Return original text as fallback
                    "source_language": source_language,
                    "target_language": target_language,
                    "confidence": 0
                }
            
            # Validate target language
            if target_language not in self.nllb_languages:
                return {
                    "success": False,
                    "error": f"Target language '{target_language}' is not supported",
                    "translated_text": "",
                    "source_language": source_language,
                    "target_language": target_language,
                    "confidence": 0
                }
            
            # Detect source language if auto
            if source_language == 'auto':
                source_language = await self.detect_language(text)
                if not source_language:
                    source_language = 'en'
            
            # Skip translation if source and target are the same
            if source_language == target_language:
                return {
                    "success": True,
                    "translated_text": text,
                    "source_language": source_language,
                    "target_language": target_language,
                    "source_language_name": self.get_supported_languages().get(source_language, "Unknown"),
                    "target_language_name": self.get_supported_languages().get(target_language, "Unknown"),
                    "confidence": 1.0,
                    "original_text": text
                }
            
            # Get NLLB language codes
            src_lang_code = self.nllb_languages.get(source_language)
            tgt_lang_code = self.nllb_languages.get(target_language)
            
            if not src_lang_code or not tgt_lang_code:
                return {
                    "success": False,
                    "error": "Language not supported by NLLB model",
                    "translated_text": "",
                    "source_language": source_language,
                    "target_language": target_language,
                    "confidence": 0
                }
            
            # Perform translation
            loop = asyncio.get_event_loop()
            translated_text = await loop.run_in_executor(None, self._translate_sync, text, src_lang_code, tgt_lang_code)
            
            # Get language names
            language_names = self.get_supported_languages()
            
            return {
                "success": True,
                "translated_text": translated_text,
                "source_language": source_language,
                "target_language": target_language,
                "source_language_name": language_names.get(source_language, "Unknown"),
                "target_language_name": language_names.get(target_language, "Unknown"),
                "confidence": 0.9,  # NLLB generally has high confidence
                "original_text": text
            }
            
        except Exception as e:
            logger.error(f"Translation error: {str(e)}")
            
            # If it's a model-specific error, provide helpful message
            if "lang_code_to_id" in str(e) or "tokenizer" in str(e).lower():
                error_msg = "NLLB model initialization error. Please ensure transformers library is up to date."
            elif "CUDA" in str(e) or "device" in str(e).lower():
                error_msg = "GPU/Device error. Falling back to CPU mode."
            else:
                error_msg = f"Translation failed: {str(e)}"
            
            return {
                "success": False,
                "error": error_msg,
                "translated_text": "",
                "source_language": source_language,
                "target_language": target_language,
                "confidence": 0
            }
    
    def _translate_sync(self, text: str, src_lang_code: str, tgt_lang_code: str) -> str:
        """Synchronous translation method"""
        try:
            # Simple approach without complex tokenizer attributes
            # Encode the input text
            encoded = self.tokenizer(
                text, 
                return_tensors="pt", 
                padding=True, 
                truncation=True, 
                max_length=512
            )
            
            # Move to GPU if available and model is on GPU
            if torch.cuda.is_available() and next(self.model.parameters()).is_cuda:
                encoded = {k: v.cuda() for k, v in encoded.items()}
            
            # Try to get target language token ID
            target_lang_token = None
            try:
                # Try different methods to get the target language token
                if hasattr(self.tokenizer, 'lang_code_to_id'):
                    target_lang_token = self.tokenizer.lang_code_to_id.get(tgt_lang_code)
                elif hasattr(self.tokenizer, 'convert_tokens_to_ids'):
                    target_lang_token = self.tokenizer.convert_tokens_to_ids(tgt_lang_code)
                
                # If still None, try to find in vocabulary
                if target_lang_token is None and hasattr(self.tokenizer, 'get_vocab'):
                    vocab = self.tokenizer.get_vocab()
                    target_lang_token = vocab.get(tgt_lang_code)
            except Exception as e:
                logger.warning(f"Could not get target language token: {e}")
            
            # Generate translation
            generate_kwargs = {
                **encoded,
                'max_length': 512,
                'num_beams': 4,
                'length_penalty': 0.6,
                'early_stopping': True,
                'do_sample': False
            }
            
            # Add forced_bos_token_id only if we found a valid token
            if target_lang_token is not None and target_lang_token > 0:
                generate_kwargs['forced_bos_token_id'] = target_lang_token
            
            with torch.no_grad():
                generated_tokens = self.model.generate(**generate_kwargs)
            
            # Decode the translation
            translation = self.tokenizer.decode(generated_tokens[0], skip_special_tokens=True)
            
            # Clean up the translation
            # Remove source text if it appears at the beginning
            if translation.startswith(text):
                translation = translation[len(text):].strip()
            
            # If translation is empty or just the original text, return a note
            if not translation or translation == text:
                return f"[Note: Direct translation not available] {text}"
            
            return translation
            
        except Exception as e:
            logger.error(f"Translation error in _translate_sync: {str(e)}")
            # Return original text with error note
            return f"[Translation temporarily unavailable] {text}"
    
    def get_popular_languages(self) -> List[Dict[str, str]]:
        """Get a list of popular languages for quick selection"""
        popular_langs = [
            ('en', 'English'),
            ('es', 'Spanish'),
            ('fr', 'French'),
            ('de', 'German'),
            ('it', 'Italian'),
            ('pt', 'Portuguese'),
            ('ru', 'Russian'),
            ('ja', 'Japanese'),
            ('ko', 'Korean'),
            ('zh', 'Chinese'),
            ('ar', 'Arabic'),
            ('hi', 'Hindi'),
            ('bn', 'Bengali'),
            ('ur', 'Urdu'),
            ('sw', 'Swahili'),
            ('am', 'Amharic'),
            ('yo', 'Yoruba'),
            ('ig', 'Igbo'),
            ('ha', 'Hausa'),
            ('zu', 'Zulu'),
            ('af', 'Afrikaans'),
            ('nl', 'Dutch'),
            ('sv', 'Swedish'),
            ('th', 'Thai'),
            ('vi', 'Vietnamese'),
            ('id', 'Indonesian'),
            ('ta', 'Tamil'),
            ('te', 'Telugu'),
            ('ml', 'Malayalam'),
            ('fa', 'Persian'),
            ('he', 'Hebrew'),
            ('tr', 'Turkish')
        ]
        
        return [{"code": code, "name": name} for code, name in popular_langs]

# Global instance
translation_service = HuggingFaceTranslationService()