"use client";

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

export default function AIAssistant() {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [insights, setInsights] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  useEffect(() => {
    // Initialize with some default insights
    setInsights([
      {
        id: 1,
        type: 'trending',
        title: 'Trending Topic',
        content: 'Teachers are actively discussing remote learning strategies and digital tools for engagement.',
        icon: '📈',
        color: 'bg-blue-50 text-blue-700 border-blue-200'
      },
      {
        id: 2,
        type: 'popular',
        title: 'Popular Resource',
        content: 'Math visualization tools are getting positive feedback from elementary teachers.',
        icon: '⭐',
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200'
      },
      {
        id: 3,
        type: 'discussion',
        title: 'Hot Discussion',
        content: 'Assessment strategies debate has 15+ teachers sharing their experiences.',
        icon: '🔥',
        color: 'bg-red-50 text-red-700 border-red-200'
      }
    ]);

    setSuggestions([
      {
        id: 1,
        title: 'Interactive Science Lab Simulations',
        description: 'Based on recent physics discussions',
        type: 'resource',
        relevance: 95
      },
      {
        id: 2,
        title: 'Classroom Management Templates',
        description: 'Trending in elementary education',
        type: 'template',
        relevance: 88
      },
      {
        id: 3,
        title: 'Digital Assessment Tools',
        description: 'Popular among math teachers',
        type: 'tool',
        relevance: 82
      }
    ]);
  }, []);

  const generateSummary = async () => {
    setLoading(true);
    setAiMessage('');
    
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const summaries = [
        "🤖 Community Pulse: This week, teachers are focusing on student engagement techniques, with particular interest in gamification and interactive learning. The most discussed topics include project-based learning and assessment strategies.",
        
        "📊 Key Insights: Mathematics and Science teachers are actively sharing digital tools, while Elementary educators are discussing classroom management. There's growing interest in multilingual teaching resources.",
        
        "💡 Trending Now: AI-assisted lesson planning is gaining traction, with teachers sharing their experiences using technology to personalize education. Remote learning best practices continue to be a hot topic.",
        
        "🎯 Action Items: Consider exploring the new collaborative learning strategies being discussed. Several teachers have mentioned successful implementation of peer review systems."
      ];
      
      const randomSummary = summaries[Math.floor(Math.random() * summaries.length)];
      setAiMessage(randomSummary);
      
    } catch (error) {
      console.error('Error generating summary:', error);
      setAiMessage('❌ Unable to generate summary. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`sticky top-6 space-y-6`}>
      {/* AI Assistant Header */}
      <div className={`p-6 rounded-lg border transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
              <span className="text-white text-sm">🤖</span>
            </div>
            <h3 className={`font-semibold transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              AI Community Assistant
            </h3>
          </div>
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {isExpanded ? '🔼' : '🔽'}
          </Button>
        </div>

        <p className={`text-sm mb-4 transition-colors duration-300 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Get AI-powered insights about community discussions and personalized resource recommendations.
        </p>

        <Button
          onClick={generateSummary}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Analyzing...
            </div>
          ) : (
            '✨ Generate Community Summary'
          )}
        </Button>

        {/* AI Message */}
        {aiMessage && (
          <div className={`mt-4 p-4 rounded-lg border transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-gray-700 border-gray-600' 
              : 'bg-purple-50 border-purple-200'
          }`}>
            <p className={`text-sm transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-300' : 'text-purple-800'
            }`}>
              {aiMessage}
            </p>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <>
          {/* Community Insights */}
          <div className={`p-6 rounded-lg border transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <h4 className={`font-semibold mb-4 transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              🧠 Community Insights
            </h4>
            
            <div className="space-y-3">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className={`p-3 rounded-lg border transition-all duration-300 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : insight.color
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{insight.icon}</span>
                    <div>
                      <h5 className={`font-medium text-sm mb-1 transition-colors duration-300 ${
                        theme === 'dark' ? 'text-white' : ''
                      }`}>
                        {insight.title}
                      </h5>
                      <p className={`text-xs transition-colors duration-300 ${
                        theme === 'dark' ? 'text-gray-300' : ''
                      }`}>
                        {insight.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Resources */}
          <div className={`p-6 rounded-lg border transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <h4 className={`font-semibold mb-4 transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              📚 Suggested Resources
            </h4>
            
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`p-3 rounded-lg border transition-all duration-300 hover:shadow-md cursor-pointer ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className={`font-medium text-sm mb-1 transition-colors duration-300 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {suggestion.title}
                      </h5>
                      <p className={`text-xs mb-2 transition-colors duration-300 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {suggestion.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded transition-colors duration-300 ${
                          theme === 'dark' 
                            ? 'bg-blue-900 text-blue-200' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {suggestion.type}
                        </span>
                        <span className={`text-xs transition-colors duration-300 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {suggestion.relevance}% match
                        </span>
                      </div>
                    </div>
                    <div className={`ml-2 w-2 h-2 rounded-full transition-colors duration-300 ${
                      suggestion.relevance > 90 ? 'bg-green-500' :
                      suggestion.relevance > 80 ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              className={`w-full mt-4 transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
              }`}
            >
              View All Suggestions
            </Button>
          </div>

          {/* Quick Actions */}
          <div className={`p-6 rounded-lg border transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <h4 className={`font-semibold mb-4 transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              ⚡ Quick Actions
            </h4>
            
            <div className="space-y-2">
              <Button className={`w-full justify-start text-sm py-2 transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}>
                🔍 Find Similar Discussions
              </Button>
              
              <Button className={`w-full justify-start text-sm py-2 transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}>
                📋 Generate Discussion Topics
              </Button>
              
              <Button className={`w-full justify-start text-sm py-2 transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}>
                💡 Get Teaching Tips
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}