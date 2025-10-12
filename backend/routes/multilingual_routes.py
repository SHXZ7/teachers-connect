"""
Multilingual Translation Routes for Teachers Connect
Provides endpoints for text translation and language detection
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict
import logging
import os
import tempfile
from datetime import datetime

# Import our translation service
try:
    from services.translation_service import translation_service
    HF_AVAILABLE = True
except ImportError:
    translation_service = None
    HF_AVAILABLE = False

# Import document processing libraries
try:
    import PyPDF2
    from docx import Document as DocxDocument
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.units import inch
    DOC_PROCESSING_AVAILABLE = True
except ImportError:
    DOC_PROCESSING_AVAILABLE = False

# Try to import pdfplumber as fallback for better PDF text extraction
try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False

# Import database and auth dependencies
from database import get_database
from routes.auth_routes import get_current_user
from bson import ObjectId

logger = logging.getLogger(__name__)

router = APIRouter()

class TranslationRequest(BaseModel):
    text: str
    target_language: str
    source_language: str = "auto"

class LanguageDetectionRequest(BaseModel):
    text: str

class TranslationResponse(BaseModel):
    success: bool
    translated_text: str = ""
    source_language: Optional[str] = None
    target_language: str
    source_language_name: Optional[str] = None
    target_language_name: Optional[str] = None
    confidence: float = 0.0
    original_text: str = ""
    error: Optional[str] = None

class LanguageResponse(BaseModel):
    code: str
    name: str

@router.get("/languages", response_model=List[LanguageResponse])
async def get_supported_languages():
    """Get list of all supported languages"""
    try:
        if not translation_service or not HF_AVAILABLE:
            raise HTTPException(
                status_code=500, 
                detail="Translation service not available. Please install required dependencies."
            )
        
        # Initialize the service if needed
        if not translation_service.is_initialized:
            await translation_service.initialize()
        
        languages = translation_service.get_popular_languages()
        return languages
    except Exception as e:
        logger.error(f"Error getting languages: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve languages")

@router.get("/languages/popular", response_model=List[LanguageResponse])
async def get_popular_languages():
    """Get list of popular languages for quick selection"""
    try:
        if not translation_service or not HF_AVAILABLE:
            raise HTTPException(
                status_code=500, 
                detail="Translation service not available. Please install required dependencies."
            )
        
        # Initialize the service if needed
        if not translation_service.is_initialized:
            await translation_service.initialize()
        
        popular_languages = translation_service.get_popular_languages()
        return popular_languages[:30]  # Return top 30 most popular
    except Exception as e:
        logger.error(f"Error getting popular languages: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve popular languages")

@router.post("/detect", response_model=Dict[str, str])
async def detect_language(request: LanguageDetectionRequest):
    """Detect the language of the provided text"""
    try:
        if not translation_service or not HF_AVAILABLE:
            raise HTTPException(
                status_code=500, 
                detail="Translation service not available. Please install required dependencies."
            )
        
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Initialize the service if needed
        if not translation_service.is_initialized:
            await translation_service.initialize()
        
        detected_lang = await translation_service.detect_language(request.text)
        
        if not detected_lang:
            return {
                "language_code": "unknown",
                "language_name": "Unknown",
                "confidence": "low"
            }
        
        supported_languages = translation_service.get_supported_languages()
        language_name = supported_languages.get(detected_lang, "Unknown")
        
        return {
            "language_code": detected_lang,
            "language_name": language_name,
            "confidence": "high"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error detecting language: {str(e)}")
        raise HTTPException(status_code=500, detail="Language detection failed")

@router.post("/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    """Translate text from source language to target language"""
    try:
        if not translation_service or not HF_AVAILABLE:
            raise HTTPException(
                status_code=500, 
                detail="Translation service not available. Please install required dependencies."
            )
        
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        if not request.target_language:
            raise HTTPException(status_code=400, detail="Target language is required")
        
        # Initialize the service if needed
        if not translation_service.is_initialized:
            await translation_service.initialize()
        
        # Validate target language
        supported_languages = translation_service.get_supported_languages()
        if request.target_language not in supported_languages:
            raise HTTPException(
                status_code=400, 
                detail=f"Target language '{request.target_language}' is not supported"
            )
        
        # Perform translation
        result = await translation_service.translate_text(
            text=request.text,
            target_language=request.target_language,
            source_language=request.source_language
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Translation failed"))
        
        return TranslationResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error translating text: {str(e)}")
        raise HTTPException(status_code=500, detail="Translation failed")

@router.get("/health")
async def health_check():
    """Health check endpoint for translation service"""
    try:
        if not translation_service or not HF_AVAILABLE:
            return {
                "status": "error",
                "message": "Translation service not available. Please install transformers and torch.",
                "service": "multilingual"
            }
        
        # Initialize the service if needed
        if not translation_service.is_initialized:
            try:
                await translation_service.initialize()
            except Exception as e:
                return {
                    "status": "error",
                    "message": f"Failed to initialize NLLB model: {str(e)}",
                    "service": "multilingual"
                }
        
        # Test basic functionality
        test_languages = translation_service.get_popular_languages()
        
        return {
            "status": "healthy",
            "message": "Hugging Face NLLB translation service is operational",
            "service": "multilingual",
            "model": "facebook/nllb-200-distilled-600M",
            "available_languages": len(test_languages),
            "initialized": translation_service.is_initialized
        }
        
    except Exception as e:
        logger.error(f"Translation service health check failed: {str(e)}")
        return {
            "status": "error",
            "message": f"Translation service error: {str(e)}",
            "service": "multilingual"
        }

@router.get("/test")
async def test_translation():
    """Simple test endpoint to verify translation service"""
    try:
        if not translation_service or not HF_AVAILABLE:
            return {
                "status": "error",
                "message": "Translation service not available. Please install required dependencies.",
                "transformers_available": False
            }
        
        # Try to initialize
        if not translation_service.is_initialized:
            await translation_service.initialize()
        
        if translation_service.initialization_error:
            return {
                "status": "error", 
                "message": f"Model initialization failed: {translation_service.initialization_error}",
                "transformers_available": True,
                "initialized": False
            }
        
        # Try a simple translation
        try:
            result = await translation_service.translate_text("Hello", "es", "en")
            return {
                "status": "success",
                "message": "Translation service is working",
                "test_translation": result,
                "transformers_available": True,
                "initialized": True
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Translation test failed: {str(e)}",
                "transformers_available": True,
                "initialized": translation_service.is_initialized
            }
            
    except Exception as e:
        return {
            "status": "error",
            "message": f"Test endpoint error: {str(e)}",
            "transformers_available": False
        }

# Educational content translation endpoints for teachers
@router.post("/translate/educational", response_model=TranslationResponse)
async def translate_educational_content(request: TranslationRequest):
    """
    Specialized endpoint for translating educational content
    Handles longer texts and maintains educational formatting
    """
    try:
        if not translation_service or not HF_AVAILABLE:
            raise HTTPException(
                status_code=500, 
                detail="Translation service not available. Please install required dependencies."
            )
        
        # Validate input
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Educational content cannot be empty")
        
        if len(request.text) > 5000:  # Limit for educational content
            raise HTTPException(
                status_code=400, 
                detail="Educational content too long. Maximum 5000 characters."
            )
        
        # Initialize the service if needed
        if not translation_service.is_initialized:
            await translation_service.initialize()
        
        # Perform translation
        result = await translation_service.translate_text(
            text=request.text,
            target_language=request.target_language,
            source_language=request.source_language
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Educational content translation failed"))
        
        return TranslationResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error translating educational content: {str(e)}")
        raise HTTPException(status_code=500, detail="Educational content translation failed")

# Document translation endpoint
@router.post("/translate-document")
async def translate_document(
    request: Dict[str, str],
    current_user: dict = Depends(get_current_user)
):
    """
    Translate an entire PDF or DOC document from uploaded resources
    """
    try:
        if not DOC_PROCESSING_AVAILABLE:
            raise HTTPException(
                status_code=500,
                detail="Document processing libraries not available. Please install PyPDF2, python-docx, and reportlab."
            )
            
        if not translation_service or not HF_AVAILABLE:
            raise HTTPException(
                status_code=500, 
                detail="Translation service not available. Please install required dependencies."
            )
        
        db = get_database()
        
        resource_id = request.get("resource_id")
        target_language = request.get("target_language")
        source_language = request.get("source_language", "auto")
        
        if not resource_id or not target_language:
            raise HTTPException(
                status_code=400,
                detail="Resource ID and target language are required"
            )
        
        # Get the resource from database
        db = get_database()
        
        # Debug logging
        logger.info(f"Looking for resource with ID: {resource_id}")
        logger.info(f"Current user ID: {current_user['id']}")
        
        # Validate ObjectId format
        try:
            object_id = ObjectId(resource_id)
        except Exception as e:
            logger.error(f"Invalid ObjectId format: {resource_id}, error: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"Invalid resource ID format: {resource_id}"
            )
        
        # First try to find the resource by ID only to see if it exists
        resource_exists = db.resources.find_one({"_id": object_id})
        if not resource_exists:
            logger.error(f"Resource with ID {resource_id} does not exist in database")
            raise HTTPException(
                status_code=404,
                detail="Resource not found in database"
            )
        
        logger.info(f"Resource found: {resource_exists.get('title', 'Unknown')} by {resource_exists.get('created_by', resource_exists.get('author_id', 'unknown'))}")
        
        # Check different possible field names for the author
        resource = db.resources.find_one({
            "_id": object_id,
            "$or": [
                {"created_by": current_user["id"]},
                {"author_id": current_user["id"]},
                {"user_id": current_user["id"]}
            ]
        })
        
        if not resource:
            logger.error(f"Resource {resource_id} exists but user {current_user['id']} doesn't have access")
            logger.info(f"Resource owner: {resource_exists.get('created_by', resource_exists.get('author_id', resource_exists.get('user_id', 'unknown')))}")
            raise HTTPException(
                status_code=403,
                detail="Access denied to this resource"
            )
        
        # Check if it's a supported document type
        mime_type = resource.get("mime_type", "").lower()
        file_name = resource.get("file_name", "").lower()
        filename = resource.get("filename", "").lower()
        
        is_supported = (
            "pdf" in mime_type or 
            "document" in mime_type or 
            "word" in mime_type or
            file_name.endswith(('.pdf', '.doc', '.docx')) or
            filename.endswith(('.pdf', '.doc', '.docx'))
        )
        
        if not is_supported:
            logger.error(f"Unsupported file type. MIME: {mime_type}, File: {file_name or filename}")
            raise HTTPException(
                status_code=400,
                detail="Only PDF, DOC, and DOCX files are supported for translation"
            )
        
        # Get the file path
        # Check multiple possible filename fields and patterns
        potential_filenames = [
            resource.get("filename"),
            resource.get("file_name"), 
            resource.get("stored_filename"),
            resource.get("file_path"),
        ]
        
        # Also try to extract from file_url if available
        if resource.get("file_url"):
            potential_filenames.append(resource.get("file_url").split("/")[-1])
        
        # Try the resource ID as filename (common pattern for UUID-based storage)
        potential_filenames.extend([
            f"{resource_id}.pdf",
            f"{resource_id}.doc", 
            f"{resource_id}.docx"
        ])
        
        # Filter out None values
        potential_filenames = [f for f in potential_filenames if f]
        
        if not potential_filenames:
            logger.error(f"No potential filenames found. Resource fields: {list(resource.keys())}")
            raise HTTPException(
                status_code=400,
                detail="Resource filename not found"
            )
        
        uploads_dir = "uploads"
        file_path = None
        actual_filename = None
        
        # Try each potential filename
        for filename in potential_filenames:
            test_path = os.path.join(uploads_dir, filename)
            if os.path.exists(test_path):
                file_path = test_path
                actual_filename = filename
                logger.info(f"Found file at: {file_path}")
                break
        
        # If no direct match, try to find by file extension
        if not file_path and os.path.exists(uploads_dir):
            logger.info(f"No direct filename match. Searching uploads directory...")
            uploaded_files = os.listdir(uploads_dir)
            logger.info(f"Available files: {uploaded_files}")
            
            # Get the expected file extension from the original filename
            original_filename = potential_filenames[0] if potential_filenames else ""
            expected_extension = os.path.splitext(original_filename)[1].lower()
            
            # Look for files with the correct extension
            matching_files = [f for f in uploaded_files if f.lower().endswith(expected_extension)]
            
            if matching_files:
                # Use the first matching file (could be improved with better matching logic)
                actual_filename = matching_files[0]
                file_path = os.path.join(uploads_dir, actual_filename)
                logger.info(f"Using matching file: {actual_filename}")
            else:
                logger.error(f"No files found with extension: {expected_extension}")
                raise HTTPException(
                    status_code=404,
                    detail=f"No {expected_extension} files found in uploads directory"
                )
        
        if not file_path:
            logger.error(f"File not found. Tried: {potential_filenames}")
            raise HTTPException(
                status_code=404,
                detail=f"Document file not found. Tried: {potential_filenames}"
            )
        
        # Determine file type for processing
        actual_extension = os.path.splitext(actual_filename)[1].lower()
        if actual_extension == '.pdf':
            file_type = "pdf"
        elif actual_extension in ['.doc', '.docx']:
            file_type = "docx"
        else:
            # Fallback to mime_type or filename checks
            if "pdf" in mime_type or file_name.endswith('.pdf') or filename.endswith('.pdf'):
                file_type = "pdf"
            elif ("document" in mime_type or "word" in mime_type or 
                  file_name.endswith(('.doc', '.docx')) or filename.endswith(('.doc', '.docx'))):
                file_type = "docx"
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type: {actual_extension}"
                )
        
        logger.info(f"Processing file as type: {file_type}")
        
        # Extract text from document
        extracted_text = ""
        pages_count = 0
        
        try:
            if file_type == "pdf":
                logger.info(f"Extracting text from PDF: {actual_filename}")
                with open(file_path, 'rb') as file:
                    try:
                        pdf_reader = PyPDF2.PdfReader(file)
                        pages_count = len(pdf_reader.pages)
                        logger.info(f"PDF has {pages_count} pages")
                        
                        if pages_count == 0:
                            raise HTTPException(
                                status_code=400,
                                detail="PDF file appears to be empty (0 pages)"
                            )
                        
                        for i, page in enumerate(pdf_reader.pages):
                            try:
                                page_text = page.extract_text()
                                if page_text.strip():
                                    extracted_text += page_text + "\n\n"
                                    logger.info(f"Extracted {len(page_text)} characters from page {i+1}")
                                else:
                                    logger.warning(f"Page {i+1} appears to be empty or image-based")
                            except Exception as page_error:
                                logger.warning(f"Error extracting text from page {i+1}: {str(page_error)}")
                                continue
                        
                    except Exception as pdf_error:
                        logger.error(f"Error reading PDF with PyPDF2: {str(pdf_error)}")
                        
                        # Try fallback with pdfplumber if available
                        if PDFPLUMBER_AVAILABLE and not extracted_text.strip():
                            logger.info("Trying fallback PDF extraction with pdfplumber...")
                            try:
                                with pdfplumber.open(file_path) as pdf:
                                    pages_count = len(pdf.pages)
                                    logger.info(f"pdfplumber: PDF has {pages_count} pages")
                                    
                                    for i, page in enumerate(pdf.pages):
                                        try:
                                            page_text = page.extract_text()
                                            if page_text and page_text.strip():
                                                extracted_text += page_text + "\n\n"
                                                logger.info(f"pdfplumber: Extracted {len(page_text)} characters from page {i+1}")
                                        except Exception as page_error:
                                            logger.warning(f"pdfplumber: Error extracting from page {i+1}: {str(page_error)}")
                                            continue
                                            
                            except Exception as plumber_error:
                                logger.error(f"pdfplumber also failed: {str(plumber_error)}")
                        
                        # If still no text extracted, raise the original error
                        if not extracted_text.strip():
                            raise HTTPException(
                                status_code=400,
                                detail=f"Cannot read PDF file: {str(pdf_error)}. The file might be corrupted, password-protected, or contain only images."
                            )
            
            elif file_type in ["doc", "docx"]:
                logger.info(f"Extracting text from Word document: {actual_filename}")
                try:
                    doc = DocxDocument(file_path)
                    pages_count = len(doc.paragraphs)
                    logger.info(f"Document has {pages_count} paragraphs")
                    
                    for i, paragraph in enumerate(doc.paragraphs):
                        if paragraph.text.strip():
                            extracted_text += paragraph.text + "\n\n"
                            
                except Exception as doc_error:
                    logger.error(f"Error reading Word document: {str(doc_error)}")
                    raise HTTPException(
                        status_code=400,
                        detail=f"Cannot read Word document: {str(doc_error)}. The file might be corrupted."
                    )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error during text extraction: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Text extraction failed: {str(e)}"
            )
        
        # Check if we extracted any meaningful text
        extracted_text = extracted_text.strip()
        if not extracted_text:
            logger.error(f"No text extracted from {actual_filename}. File might be image-based or corrupted.")
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from document. The file might contain only images, be password-protected, or be corrupted. Please ensure the document contains extractable text."
            )
        
        logger.info(f"Successfully extracted {len(extracted_text)} characters of text")
        
        # Initialize translation service if needed
        if not translation_service.is_initialized:
            await translation_service.initialize()
        
        # Intelligent text chunking based on token limits
        def smart_chunk_text(text, max_chars=1000):
            """
            Split text into chunks that are safe for the translation model.
            Uses character count as a proxy for token count with safety margin.
            """
            chunks = []
            
            # Split by paragraphs first
            paragraphs = text.split('\n\n')
            current_chunk = ""
            
            for paragraph in paragraphs:
                paragraph = paragraph.strip()
                if not paragraph:
                    continue
                    
                # If adding this paragraph would exceed limit, save current chunk
                if len(current_chunk + paragraph) > max_chars:
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                        current_chunk = ""
                    
                    # If paragraph itself is too long, split by sentences
                    if len(paragraph) > max_chars:
                        sentences = paragraph.split('. ')
                        for sentence in sentences:
                            sentence = sentence.strip()
                            if not sentence:
                                continue
                                
                            if len(current_chunk + sentence) > max_chars:
                                if current_chunk:
                                    chunks.append(current_chunk.strip())
                                    current_chunk = ""
                                
                                # If sentence is still too long, split by words
                                if len(sentence) > max_chars:
                                    words = sentence.split()
                                    for word in words:
                                        if len(current_chunk + word) > max_chars:
                                            if current_chunk:
                                                chunks.append(current_chunk.strip())
                                                current_chunk = ""
                                        current_chunk += word + " "
                                else:
                                    current_chunk += sentence + ". "
                            else:
                                current_chunk += sentence + ". "
                    else:
                        current_chunk += paragraph + "\n\n"
                else:
                    current_chunk += paragraph + "\n\n"
            
            # Add the last chunk
            if current_chunk.strip():
                chunks.append(current_chunk.strip())
            
            return chunks
        
        # Split text into safe chunks (800 chars to leave room for tokenization overhead)
        text_chunks = smart_chunk_text(extracted_text, max_chars=800)
        logger.info(f"Split document into {len(text_chunks)} chunks for translation")
        
        # Translate each chunk
        translated_chunks = []
        for i, chunk in enumerate(text_chunks):
            if chunk.strip():
                logger.info(f"Translating chunk {i+1}/{len(text_chunks)} ({len(chunk)} chars)")
                try:
                    result = await translation_service.translate_text(
                        text=chunk,
                        target_language=target_language,
                        source_language=source_language
                    )
                    
                    if result["success"]:
                        translated_chunks.append(result["translated_text"])
                    else:
                        logger.warning(f"Translation failed for chunk {i+1}: {result.get('error', 'Unknown error')}")
                        translated_chunks.append(chunk)  # Fallback to original text
                except Exception as chunk_error:
                    logger.error(f"Error translating chunk {i+1}: {str(chunk_error)}")
                    translated_chunks.append(chunk)  # Fallback to original text
        
        # Combine translated chunks
        translated_text = "\n\n".join(translated_chunks)
        
        # Create new translated document
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        original_name = os.path.splitext(resource["title"])[0]
        target_lang_name = translation_service.get_language_name(target_language)
        translated_filename = f"{original_name}_translated_to_{target_lang_name}_{timestamp}.pdf"
        translated_file_path = os.path.join("uploads", "translated", translated_filename)
        
        # Create translated directory if it doesn't exist
        os.makedirs(os.path.dirname(translated_file_path), exist_ok=True)
        
        # Create PDF with translated content
        doc = SimpleDocTemplate(translated_file_path, pagesize=letter)
        styles = getSampleStyleSheet()
        
        # Create custom style for better text formatting
        custom_style = ParagraphStyle(
            'CustomStyle',
            parent=styles['Normal'],
            fontSize=12,
            spaceAfter=12,
            leftIndent=0.5*inch,
            rightIndent=0.5*inch
        )
        
        story = []
        
        # Add title
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Title'],
            fontSize=16,
            spaceAfter=30,
            alignment=1  # Center alignment
        )
        
        story.append(Paragraph(f"Translated Document: {resource['title']}", title_style))
        story.append(Paragraph(f"Original Language: {source_language}", styles['Normal']))
        story.append(Paragraph(f"Target Language: {target_lang_name}", styles['Normal']))
        story.append(Paragraph(f"Translated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
        story.append(Spacer(1, 0.5*inch))
        
        # Add translated content
        paragraphs = translated_text.split('\n\n')
        for paragraph in paragraphs:
            if paragraph.strip():
                story.append(Paragraph(paragraph.strip(), custom_style))
                story.append(Spacer(1, 6))
        
        doc.build(story)
        
        # Verify the PDF was created successfully
        if os.path.exists(translated_file_path):
            file_size = os.path.getsize(translated_file_path)
            logger.info(f"PDF created successfully: {translated_filename} ({file_size} bytes)")
        else:
            logger.error(f"PDF creation failed: {translated_filename}")
            raise HTTPException(
                status_code=500,
                detail="Failed to create translated PDF file"
            )
        
        # Save translation record to database
        translation_record = {
            "original_resource_id": resource_id,
            "original_filename": actual_filename,
            "translated_filename": translated_filename,
            "source_language": source_language,
            "target_language": target_language,
            "target_language_name": target_lang_name,
            "created_by": current_user["id"],
            "created_at": datetime.utcnow(),
            "pages_count": pages_count,
            "original_text_length": len(extracted_text),
            "translated_text_length": len(translated_text)
        }
        
        db.document_translations.insert_one(translation_record)
        
        return {
            "success": True,
            "message": "Document translated successfully",
            "filename": translated_filename,
            "pages": pages_count,
            "download_url": f"/api/multilingual/download-translated/{translated_filename}",
            "target_language": target_lang_name,
            "original_title": resource["title"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error translating document: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Document translation failed: {str(e)}"
        )

@router.get("/download-translated/{filename}")
async def download_translated_document(
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """Download a translated document"""
    try:
        from fastapi.responses import FileResponse
        import os
        
        logger.info(f"Download request for: {filename} by user: {current_user['id']}")
        
        file_path = os.path.join("uploads", "translated", filename)
        logger.info(f"Looking for file at: {file_path}")
        
        if not os.path.exists(file_path):
            logger.error(f"File not found at: {file_path}")
            # List files in the translated directory for debugging
            translated_dir = os.path.join("uploads", "translated")
            if os.path.exists(translated_dir):
                available_files = os.listdir(translated_dir)
                logger.info(f"Available files in translated directory: {available_files}")
            else:
                logger.error(f"Translated directory does not exist: {translated_dir}")
            raise HTTPException(
                status_code=404,
                detail="Translated document not found"
            )
        
        # Verify user has access to this translation
        db = get_database()
        translation = db.document_translations.find_one({
            "translated_filename": filename,
            "created_by": current_user["id"]
        })
        
        if not translation:
            logger.error(f"Access denied for {filename} to user {current_user['id']}")
            raise HTTPException(
                status_code=403,
                detail="Access denied to this translated document"
            )
        
        logger.info(f"Serving file: {file_path}")
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type='application/pdf'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading translated document: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to download translated document"
        )

# Debug endpoint to list translated files
@router.get("/debug/translated-files")
async def list_translated_files(
    current_user: dict = Depends(get_current_user)
):
    """Debug endpoint to list all translated files for the current user"""
    try:
        import os
        
        translated_dir = os.path.join("uploads", "translated")
        
        # Check if directory exists
        if not os.path.exists(translated_dir):
            return {
                "error": "Translated directory does not exist",
                "directory": translated_dir
            }
        
        # List all files in directory
        all_files = os.listdir(translated_dir)
        
        # Get user's translations from database
        db = get_database()
        user_translations = list(db.document_translations.find({
            "created_by": current_user["id"]
        }))
        
        return {
            "user_id": current_user["id"],
            "translated_directory": translated_dir,
            "all_files_in_directory": all_files,
            "user_translation_records": len(user_translations),
            "user_translations": [
                {
                    "filename": t.get("translated_filename"),
                    "original": t.get("original_filename"),
                    "created_at": str(t.get("created_at"))
                }
                for t in user_translations
            ]
        }
        
    except Exception as e:
        return {
            "error": f"Debug endpoint error: {str(e)}",
            "user_id": current_user.get("id", "unknown")
        }

# Debug endpoint to check resource access
@router.get("/debug/resource/{resource_id}")
async def debug_resource_access(
    resource_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Debug endpoint to check if a resource can be accessed by the current user"""
    try:
        db = get_database()
        
        # Validate ObjectId format
        try:
            object_id = ObjectId(resource_id)
        except Exception as e:
            return {
                "error": f"Invalid ObjectId format: {resource_id}",
                "details": str(e)
            }
        
        # Check if resource exists
        resource_exists = db.resources.find_one({"_id": object_id})
        if not resource_exists:
            return {
                "error": "Resource not found",
                "resource_id": resource_id,
                "user_id": current_user["id"]
            }
        
        # Check if user has access
        user_resource = db.resources.find_one({
            "_id": object_id,
            "$or": [
                {"created_by": current_user["id"]},
                {"author_id": current_user["id"]},
                {"user_id": current_user["id"]}
            ]
        })
        
        return {
            "resource_exists": True,
            "resource_title": resource_exists.get("title", "Unknown"),
            "resource_owner": resource_exists.get("created_by", resource_exists.get("author_id", resource_exists.get("user_id", "unknown"))),
            "current_user": current_user["id"],
            "user_has_access": user_resource is not None,
            "mime_type": resource_exists.get("mime_type"),
            "file_name": resource_exists.get("file_name"),
            "filename": resource_exists.get("filename"),
            "file_url": resource_exists.get("file_url"),
            "available_fields": list(resource_exists.keys())
        }
        
    except Exception as e:
        return {
            "error": f"Debug endpoint error: {str(e)}",
            "resource_id": resource_id,
            "user_id": current_user.get("id", "unknown")
        }

@router.get("/extract-text/{resource_id}")
async def extract_text_from_resource(
    resource_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Extract text from a PDF resource for text-to-speech functionality"""
    try:
        logger.info(f"Extracting text from resource {resource_id} for user {current_user['id']}")
        
        # Get database
        db = get_database()
        
        # Find the resource - try both _id formats
        resource_exists = None
        try:
            # Try ObjectId format first
            resource_exists = db.resources.find_one({"_id": ObjectId(resource_id)})
        except:
            # Fallback to string format
            resource_exists = db.resources.find_one({"_id": resource_id})
        
        if not resource_exists:
            logger.error(f"Resource {resource_id} not found")
            raise HTTPException(status_code=404, detail="Resource not found")
        
        # Check if user has access to this resource
        # User can access if they are the author or if resource is public
        user_can_access = (
            resource_exists.get("author_id") == current_user["id"] or
            resource_exists.get("is_public", False)
        )
        
        if not user_can_access:
            logger.error(f"User {current_user['id']} does not have access to resource {resource_id}")
            raise HTTPException(status_code=403, detail="Access denied to this resource")
        
        # Get file path
        file_url = resource_exists.get("file_url")
        if not file_url:
            raise HTTPException(status_code=400, detail="Resource has no associated file")
        
        # Convert relative path to absolute path
        if file_url.startswith("/uploads/"):
            file_path = os.path.join(os.getcwd(), file_url.lstrip("/"))
        else:
            file_path = file_url
        
        if not os.path.exists(file_path):
            logger.error(f"File not found at path: {file_path}")
            raise HTTPException(status_code=404, detail="Associated file not found")
        
        # Extract text based on file type
        extracted_text = ""
        file_extension = os.path.splitext(file_path)[1].lower()
        
        if file_extension == '.pdf':
            # Try pdfplumber first for better text extraction
            if PDFPLUMBER_AVAILABLE:
                try:
                    with pdfplumber.open(file_path) as pdf:
                        text_parts = []
                        for page in pdf.pages:
                            page_text = page.extract_text()
                            if page_text:
                                text_parts.append(page_text)
                        extracted_text = "\n".join(text_parts)
                except Exception as e:
                    logger.warning(f"pdfplumber failed: {str(e)}, falling back to PyPDF2")
            
            # Fallback to PyPDF2 if pdfplumber failed or unavailable
            if not extracted_text and DOC_PROCESSING_AVAILABLE:
                try:
                    with open(file_path, 'rb') as file:
                        pdf_reader = PyPDF2.PdfReader(file)
                        text_parts = []
                        for page in pdf_reader.pages:
                            page_text = page.extract_text()
                            if page_text:
                                text_parts.append(page_text)
                        extracted_text = "\n".join(text_parts)
                except Exception as e:
                    logger.error(f"PyPDF2 extraction failed: {str(e)}")
                    raise HTTPException(status_code=500, detail="Failed to extract text from PDF")
        
        elif file_extension in ['.doc', '.docx']:
            if DOC_PROCESSING_AVAILABLE:
                try:
                    doc = DocxDocument(file_path)
                    text_parts = []
                    for paragraph in doc.paragraphs:
                        if paragraph.text.strip():
                            text_parts.append(paragraph.text)
                    extracted_text = "\n".join(text_parts)
                except Exception as e:
                    logger.error(f"DOCX extraction failed: {str(e)}")
                    raise HTTPException(status_code=500, detail="Failed to extract text from document")
            else:
                raise HTTPException(status_code=500, detail="Document processing not available")
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type for text extraction")
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from the document")
        
        # Clean up the extracted text
        cleaned_text = extracted_text.strip()
        
        # Limit text length for TTS (max ~5000 characters for reasonable processing)
        if len(cleaned_text) > 5000:
            cleaned_text = cleaned_text[:5000] + "..."
            logger.info(f"Text truncated to 5000 characters for TTS")
        
        logger.info(f"Successfully extracted {len(cleaned_text)} characters from {file_path}")
        
        return {
            "success": True,
            "extracted_text": cleaned_text,
            "resource_title": resource_exists.get("title", "Unknown"),
            "file_type": file_extension,
            "character_count": len(cleaned_text),
            "truncated": len(extracted_text) > 5000
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in text extraction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")