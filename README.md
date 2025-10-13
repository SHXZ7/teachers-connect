# 🎓 Teachers-Connect - AI-Powered Teaching Assistant Platform

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-blue)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)](https://mongodb.com/)
[![OpenRouter AI](https://img.shields.io/badge/OpenRouter-AI%20Integration-purple)](https://openrouter.ai/)

> **Transform your teaching experience with AI-powered lesson generation, smart resource management, and collaborative community features.**

EduNova is a comprehensive educational platform that empowers teachers with AI-driven tools to create engaging lesson plans, manage educational resources, and connect with fellow educators. Built with modern web technologies and advanced AI integration.

## ✨ Key Features

### 🤖 AI Teaching Assistant
- **Intelligent Lesson Generation**: Create comprehensive lesson plans using OpenRouter's Claude-3.5-Sonnet integration
- **Smart Notes Generator**: Generate multiple note types (flashcards, mind maps, study guides, concept maps) from uploaded resources
- **Interactive Q&A**: Get instant answers to teaching questions with context-aware responses
- **Resource-Based Learning**: Incorporate existing materials into AI-generated content

### 📚 Resource Management
- **File Upload & Storage**: Support for PDFs, documents, images, and multimedia content
- **Content Extraction**: Automatic text extraction from uploaded files for AI processing
- **Resource Browser**: Organized view with search and filtering capabilities
- **Offline Sync**: Access materials even without internet connection

### 👥 Community Features
- **Teacher Collaboration**: Connect with educators worldwide
- **Resource Sharing**: Share and discover educational materials
- **Group Creation**: Form subject-specific or grade-level communities
- **Real-time Chat**: WebSocket-powered communication

### 🌍 Accessibility & Localization
- **Multilingual Support**: Translate lessons and resources into multiple languages
- **Offline Mode**: Full functionality without internet connectivity
- **Responsive Design**: Seamless experience across all devices
- **Dark/Light Theme**: Customizable interface preferences

## 🏗️ Architecture

### Backend (FastAPI + Python)
```
backend/
├── main.py                     # FastAPI application entry point
├── database.py                 # MongoDB connection and utilities
├── websocket_manager.py        # Real-time communication
├── config/
│   └── ai_config.py           # AI service configuration
├── models/                     # Pydantic data models
│   ├── user_model.py
│   ├── lesson_model.py
│   ├── resource_model.py
│   ├── community_model.py
│   └── group_model.py
├── routes/                     # API endpoints
│   ├── auth_routes.py
│   ├── lesson_routes.py
│   ├── resource_routes.py
│   ├── community_routes.py
│   └── multilingual_routes.py
└── services/                   # Business logic
    ├── ai_lesson_service.py
    ├── openrouter_ai_service.py
    └── translation_service.py
```

### Frontend (Next.js + React)
```
frontend/
├── app/                        # Next.js 15 App Router
│   ├── dashboard/              # Main application interface
│   │   ├── ai-assistant/       # Lesson generation & Q&A
│   │   ├── community/          # Social features
│   │   ├── resources/          # File management
│   │   ├── multilingual/       # Translation tools
│   │   └── offline-mode/       # Offline functionality
│   ├── api/                    # API routes (proxy)
│   └── globals.css             # Global styles
├── src/
│   ├── components/             # React components
│   │   ├── ComprehensiveAIAssistant.jsx
│   │   ├── AILessonGenerator.jsx
│   │   ├── ResourceBrowser.jsx
│   │   └── Community.jsx
│   ├── lib/                    # API clients
│   │   ├── lessonAPI.js
│   │   ├── resourceAPI.js
│   │   └── communityAPI.js
│   ├── hooks/                  # Custom React hooks
│   └── utils/                  # Utility functions
└── public/                     # Static assets
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (18+ recommended)
- **Python** (3.8+ required)
- **MongoDB** (local or cloud instance)
- **OpenRouter API Key** ([Get yours here](https://openrouter.ai/))

### 1. Clone the Repository
```bash
git clone https://github.com/SHXZ7/edunova.git
cd edunova
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
MONGODB_URL=mongodb://localhost:27017/edunova
OPENROUTER_API_KEY=your_openrouter_api_key_here
JWT_SECRET_KEY=your_jwt_secret_here
UPLOAD_DIRECTORY=./uploads
EOF

# Start the backend server
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_HF_API_TOKEN=your_huggingface_token_here
EOF

# Start the development server
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## � Configuration

### Environment Variables

#### Backend (.env)
```bash
MONGODB_URL=mongodb://localhost:27017/edunova
OPENROUTER_API_KEY=sk-or-v1-xxxxx
JWT_SECRET_KEY=your-256-bit-secret
UPLOAD_DIRECTORY=./uploads
CORS_ORIGINS=["http://localhost:3000"]
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_HF_API_TOKEN=hf_xxxxx
```

## 📖 API Documentation

## 🚀 Deployment

### Production Deployment

#### Using Docker
```bash
# Build and run with Docker Compose
docker-compose up --build -d
```

#### Manual Deployment
```bash
# Backend (using Gunicorn)
cd backend
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker

# Frontend (build and serve)
cd frontend
npm run build
npm start
```

#### Hugging Face Spaces
The project is configured for deployment on Hugging Face Spaces:

```dockerfile
# Dockerfile
FROM python:3.9
WORKDIR /app
COPY backend/ .
RUN pip install -r requirements.txt
EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

### API Testing
Use the interactive API documentation at http://localhost:8000/docs for testing endpoints.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- **Python**: Follow PEP 8, use type hints
- **JavaScript**: Use ESLint configuration, prefer functional components
- **Git**: Use conventional commits format

## 📊 Features in Detail

### AI Lesson Generation
- **Smart Prompting**: Context-aware prompts for educational content
- **Multiple Formats**: Support for various lesson types (lecture, interactive, lab, discussion)
- **Resource Integration**: Incorporate uploaded materials into lesson plans
- **Customization**: Adjust difficulty, duration, and learning objectives

### Note Generation Types
1. **Flashcards**: Key concepts with questions and answers
2. **Mind Maps**: Visual concept relationships
3. **Study Guides**: Comprehensive review materials
4. **Concept Maps**: Hierarchical knowledge structures
5. **Summary Notes**: Condensed key information
6. **Question Banks**: Assessment-ready questions
7. **Vocabulary Lists**: Subject-specific terminology
8. **Timeline Notes**: Chronological information
9. **Comparison Charts**: Side-by-side analysis
10. **Case Studies**: Real-world applications

### Offline Capabilities
- **Service Worker**: Cache critical resources
- **Local Storage**: Store user data and preferences
- **Sync Queue**: Queue actions for when connectivity returns
- **Background Sync**: Automatic synchronization
- **Offline Indicators**: Clear connection status

## 🔒 Security

### Authentication & Authorization
- **JWT Tokens**: Secure stateless authentication
- **Password Hashing**: Bcrypt for secure password storage
- **Role-Based Access**: Different permission levels
- **CORS Configuration**: Controlled cross-origin requests

### Data Protection
- **Input Validation**: Pydantic models for API validation
- **File Upload Security**: Type checking and size limits
- **SQL Injection Prevention**: MongoDB parameterized queries
- **XSS Protection**: React's built-in protection

## 📈 Performance Optimization

### Backend Optimizations
- **Async/Await**: Non-blocking I/O operations
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis for frequently accessed data
- **Rate Limiting**: Prevent API abuse

### Frontend Optimizations
- **Code Splitting**: Dynamic imports for large components
- **Image Optimization**: Next.js automatic optimization
- **Lazy Loading**: Load components as needed
- **Bundle Analysis**: Optimize build size

## 🛠️ Troubleshooting

### Common Issues

#### Backend Not Starting
```bash
# Check Python version
python --version  # Should be 3.8+

# Install dependencies
pip install -r requirements.txt

# Check MongoDB connection
python -c "from database import get_database; print('DB connected!')"
```

#### Frontend Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 18+
```

#### AI Service Issues
- Verify OpenRouter API key is valid
- Check rate limits and quotas
- Ensure model availability

## 📞 Support

### Get Help
- **Documentation**: Check this README and inline code comments
- **Issues**: [GitHub Issues](https://github.com/SHXZ7/edunova/issues)
- **Discussions**: [GitHub Discussions](https://github.com/SHXZ7/edunova/discussions)

### Contact
- **Email**: support@edunova.com
- **Twitter**: [@EduNovaAI](https://twitter.com/EduNovaAI)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenRouter AI** for advanced language model access
- **MongoDB** for flexible document storage
- **Next.js Team** for the excellent React framework
- **FastAPI** for the high-performance Python web framework
- **Hugging Face** for hosting and AI model access

## 🚀 Roadmap

### Upcoming Features
- [ ] **Advanced Analytics**: Detailed usage statistics and insights
- [ ] **Mobile App**: Native iOS and Android applications
- [ ] **LTI Integration**: Learning Management System compatibility
- [ ] **Advanced AI Models**: GPT-4, Gemini Pro support
- [ ] **Collaboration Tools**: Real-time lesson plan editing
- [ ] **Assessment Generator**: Automated quiz and test creation
- [ ] **Parent Portal**: Student progress tracking
- [ ] **API Webhooks**: External system integrations

### Version History
- **v1.0.0** - Initial release with core features
- **v1.1.0** - Enhanced AI integration and notes generation
- **v1.2.0** - Community features and real-time chat
- **v1.3.0** - Offline mode and multilingual support

---

<div align="center">

**Built with ❤️ by Team GreyJoy, for HackQuest(24 hr hackthon)**

</div>
