"use client";

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import Navbar from '@/components/Navbar';
import { resourceAPI } from '@/lib/resourceAPI';
import { lessonAPI } from '@/lib/lessonAPI';

// Import page components
import ResourcesPage from './resources/page';
import AIAssistantPage from './ai-assistant/page';
import MultilingualPage from './multilingual/page';
import OfflinePage from './offline-mode/page';

// Import new AI components
import ComprehensiveAIAssistant from '@/components/ComprehensiveAIAssistant';
import EnhancedResourceBrowser from '@/components/EnhancedResourceBrowser';
import ProfileManagement from '@/components/ProfileManagement';
import Community from '@/components/Community';

export default function Dashboard() {
  const { theme } = useTheme();
  const [activeRoute, setActiveRoute] = useState('/dashboard');
  const [stats, setStats] = useState(null);
  const [aiStats, setAiStats] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchAIStats();
  }, []);

  const fetchStats = async () => {
    try {
      const statsData = await resourceAPI.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchAIStats = async () => {
    try {
      const aiStatsData = await lessonAPI.getLessonStats();
      setAiStats(aiStatsData);
    } catch (error) {
      console.error('Failed to fetch AI stats:', error);
      // Set default stats if the call fails
      setAiStats({
        success: true,
        total_lessons: 0,
        recent_lessons: 0,
        lessons_by_subject: [],
        notes_count: 0,
        error: "Stats temporarily unavailable"
      });
    }
  };

  const handleNavigation = (route) => {
    setActiveRoute(route);
  };

  const StatsCard = ({ title, value, icon, color, description, gradient }) => (
    <div className={`group relative p-6 rounded-xl border transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
        : 'bg-white border-gray-200 hover:border-blue-300'
    }`}>
      <div className="flex items-center space-between">
        <div className="flex-1">
          <p className={`text-sm font-medium transition-colors duration-300 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {title}
          </p>
          <p className={`text-3xl font-bold mt-2 transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {value || '0'}
          </p>
          {description && (
            <p className={`text-xs mt-1 transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              {description}
            </p>
          )}
        </div>
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
          gradient || (theme === 'dark' ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600')
        }`}>
          {icon}
        </div>
      </div>
      <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-r from-blue-600/5 to-purple-600/5' 
          : 'bg-gradient-to-r from-blue-50/50 to-purple-50/50'
      }`}></div>
    </div>
  );

  const FeatureCard = ({ icon, title, description, route, featured = false }) => (
    <div 
      className={`group relative p-6 rounded-xl border transition-all duration-300 cursor-pointer hover:shadow-xl hover:scale-[1.02] ${
        featured
          ? theme === 'dark'
            ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/30'
            : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'
          : theme === 'dark' 
            ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
            : 'bg-white border-gray-200 hover:border-blue-300'
      }`}
      onClick={() => handleNavigation(route)}
    >
      <div className="text-center relative z-10">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center text-3xl transition-transform duration-300 group-hover:scale-110 ${
          featured
            ? theme === 'dark'
              ? 'bg-blue-600/30 text-blue-400'
              : 'bg-blue-100 text-blue-600'
            : theme === 'dark'
              ? 'bg-gray-700 text-gray-300'
              : 'bg-gray-100 text-gray-600'
        }`}>
          {icon}
        </div>
        <h3 className={`text-lg font-semibold mb-3 transition-colors duration-300 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          {title}
        </h3>
        <p className={`text-sm leading-relaxed transition-colors duration-300 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {description}
        </p>
      </div>
      <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-r from-blue-600/5 to-purple-600/5' 
          : 'bg-gradient-to-r from-blue-50/30 to-purple-50/30'
      }`}></div>
    </div>
  );

  const renderContent = () => {
    switch (activeRoute) {
      case '/dashboard/resources':
        return <ResourcesPage />;
      case '/dashboard/ai-assistant':
        return <ComprehensiveAIAssistant />;
      case '/dashboard/ai-resource-notes':
        return <EnhancedResourceBrowser />;
      case '/dashboard/multilingual':
        return <MultilingualPage />;
      case '/dashboard/community':
        return <Community />;
      case '/dashboard/offline-mode':
        return <OfflinePage />;
      case '/dashboard/profile':
        return (
          <div className={`min-h-screen transition-colors duration-300 ${
            theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
          }`}>
            <ProfileManagement />
          </div>
        );
      case '/dashboard/settings':
        return (
          <div className={`min-h-screen transition-colors duration-300 ${
            theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-slate-50'
          }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className={`text-center py-16 rounded-lg border transition-colors duration-300 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="text-8xl mb-6">⚙️</div>
                <h2 className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Settings - Coming Soon!
                </h2>
              </div>
            </div>
          </div>
        );
      default:
        // Enhanced Dashboard Home
        const userName = JSON.parse(localStorage.getItem('user') || '{}')?.name || 'Teacher';
        
        return (
          <div className={`min-h-screen transition-colors duration-300 ${
            theme === 'dark' 
              ? 'bg-gray-900' 
              : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30'
          }`}>
            <div className="max-w-7xl mx-auto px-8 py-8">
              {/* Enhanced Welcome Hero Section */}
              <div className="relative mb-12 p-12 rounded-2xl overflow-hidden">
                {/* Background with animated elements */}
                <div className={`absolute inset-0 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700'
                    : 'bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600'
                }`}></div>
                
                {/* Animated background circles */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full animate-pulse"></div>
                  <div className="absolute top-1/2 -left-20 w-60 h-60 bg-white/5 rounded-full animate-pulse delay-1000"></div>
                  <div className="absolute bottom-10 right-1/3 w-32 h-32 bg-white/10 rounded-full animate-pulse delay-500"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 text-center text-white">
                  <div className="text-7xl mb-6 animate-bounce">👋</div>
                  <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                    Welcome back, {userName}!
                  </h1>
                  <p className="text-xl lg:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
                    Ready to empower minds and transform education? Your AI-powered teaching platform awaits.
                  </p>
                  <button
                    onClick={() => handleNavigation('/dashboard/resources')}
                    className="inline-flex items-center gap-3 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:bg-blue-50"
                  >
                    <span>🚀</span>
                    Explore Resources
                  </button>
                </div>
              </div>

              {/* Enhanced Stats Dashboard Grid */}
              <div className="mb-12">
                <h2 className={`text-2xl font-bold mb-6 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  📊 Platform Analytics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats ? (
                    <>
                      <StatsCard
                        title="Educational Resources"
                        value={stats.total_resources}
                        icon="📚"
                        gradient={theme === 'dark' ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'}
                        description="Available resources"
                      />
                      <StatsCard
                        title="Total Downloads"
                        value={stats.total_downloads}
                        icon="⬇️"
                        gradient={theme === 'dark' ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600'}
                        description="Community engagement"
                      />
                      <StatsCard
                        title="Community Likes"
                        value={stats.total_likes}
                        icon="❤️"
                        gradient={theme === 'dark' ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600'}
                        description="Resource appreciation"
                      />
                      <StatsCard
                        title="Recent Activity"
                        value={stats.recent_uploads}
                        icon="🆕"
                        gradient={theme === 'dark' ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-600'}
                        description="New this week"
                      />
                    </>
                  ) : (
                    // Loading skeleton
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className={`p-6 rounded-xl border animate-pulse ${
                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}>
                        <div className="flex items-center space-between">
                          <div className="flex-1">
                            <div className={`h-4 rounded w-3/4 mb-3 ${
                              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                            <div className={`h-8 rounded w-1/2 ${
                              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                            }`}></div>
                          </div>
                          <div className={`w-14 h-14 rounded-xl ${
                            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                          }`}></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* AI Stats Row */}
                {aiStats && (
                  <div className="mt-6">
                    <StatsCard
                      title="AI Lessons Generated"
                      value={aiStats.total_lessons}
                      icon="🤖"
                      gradient={theme === 'dark' ? 'bg-indigo-600/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}
                      description="AI-powered lessons"
                    />
                  </div>
                )}
              </div>

              {/* Enhanced Quick Access Features */}
              <div className="mb-12">
                <h2 className={`text-2xl font-bold mb-8 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  🚀 Core Platform Features
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FeatureCard
                    icon="📚"
                    title="Resource Library"
                    description="Upload, discover, and share educational materials with teachers worldwide"
                    route="/dashboard/resources"
                    featured={true}
                  />
                  <FeatureCard
                    icon="🤖"
                    title="AI Teaching Suite"
                    description="Complete AI assistance: lesson generation, smart notes, and interactive chat support"
                    route="/dashboard/ai-assistant"
                    featured={true}
                  />
                  <FeatureCard
                    icon="💬"
                    title="Teacher Community"
                    description="Connect, collaborate, and share experiences with fellow educators"
                    route="/dashboard/community"
                  />
                  <FeatureCard
                    icon="🌍"
                    title="Multilingual Tools"
                    description="Break language barriers with advanced translation capabilities"
                    route="/dashboard/multilingual"
                  />
                  <FeatureCard
                    icon="📱"
                    title="Offline Access"
                    description="Download resources for teaching without internet connectivity"
                    route="/dashboard/offline-mode"
                  />
                  <FeatureCard
                    icon="👤"
                    title="Profile & Settings"
                    description="Manage your account, preferences, and teaching profile"
                    route="/dashboard/profile"
                  />
                </div>
              </div>

              {/* Enhanced Getting Started Guide */}
              <div className={`p-8 rounded-2xl border transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-gradient-to-r from-blue-50/50 via-white to-purple-50/50 border-gray-200'
              }`}>
                <div className="text-center mb-8">
                  <h3 className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    🎯 Your Teaching Journey Starts Here
                  </h3>
                  <p className={`text-lg transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Follow these simple steps to make the most of Teachers Connect
                  </p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className={`group p-6 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer ${
                    theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:shadow-lg'
                  }`}
                  onClick={() => handleNavigation('/dashboard/resources')}>
                    <div className="text-center">
                      <div className="text-4xl mb-4 transition-transform duration-300 group-hover:scale-110">🔍</div>
                      <div className={`w-8 h-8 mx-auto mb-3 rounded-full flex items-center justify-center text-sm font-bold ${
                        theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        1
                      </div>
                      <h4 className={`font-semibold mb-3 transition-colors duration-300 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Explore Resources
                      </h4>
                      <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Browse thousands of educational materials shared by teachers worldwide. Find lessons, worksheets, and teaching guides.
                      </p>
                    </div>
                  </div>
                  
                  <div className={`group p-6 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer ${
                    theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:shadow-lg'
                  }`}
                  onClick={() => handleNavigation('/dashboard/ai-assistant')}>
                    <div className="text-center">
                      <div className="text-4xl mb-4 transition-transform duration-300 group-hover:scale-110">🤖</div>
                      <div className={`w-8 h-8 mx-auto mb-3 rounded-full flex items-center justify-center text-sm font-bold ${
                        theme === 'dark' ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                      }`}>
                        2
                      </div>
                      <h4 className={`font-semibold mb-3 transition-colors duration-300 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Try AI Features
                      </h4>
                      <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Experience our AI teaching assistant. Generate lessons, create smart notes, and get personalized teaching support.
                      </p>
                    </div>
                  </div>
                  
                  <div className={`group p-6 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer ${
                    theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:shadow-lg'
                  }`}
                  onClick={() => handleNavigation('/dashboard/community')}>
                    <div className="text-center">
                      <div className="text-4xl mb-4 transition-transform duration-300 group-hover:scale-110">🤝</div>
                      <div className={`w-8 h-8 mx-auto mb-3 rounded-full flex items-center justify-center text-sm font-bold ${
                        theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
                      }`}>
                        3
                      </div>
                      <h4 className={`font-semibold mb-3 transition-colors duration-300 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Join the Community
                      </h4>
                      <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Connect with fellow educators, share your experiences, and collaborate on teaching strategies and resources.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <Navbar activeRoute={activeRoute} onNavigate={handleNavigation} />
      {renderContent()}
    </div>
  );
}