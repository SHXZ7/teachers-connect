"use client";

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import ResourceUpload from '@/components/ResourceUpload';
import ResourceBrowser from '@/components/ResourceBrowser';
import ResourceDetail from '@/components/ResourceDetail';
import { Button } from '@/components/ui/button';
import { resourceAPI } from '@/lib/resourceAPI';

export default function ResourcesPage() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedResource, setSelectedResource] = useState(null);
  const [stats, setStats] = useState(null);
  const [myResources, setMyResources] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchStats();
    fetchMyResources();
  }, [refreshTrigger]);

  const fetchStats = async () => {
    try {
      const statsData = await resourceAPI.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchMyResources = async () => {
    try {
      const response = await resourceAPI.getMyResources({ per_page: 5 });
      setMyResources(response.resources);
    } catch (error) {
      console.error('Failed to fetch my resources:', error);
    }
  };

  const handleUploadSuccess = () => {
    setActiveTab('my-resources');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleResourceSelect = (resource) => {
    setSelectedResource(resource);
  };

  const handleResourceUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const tabs = [
    { id: 'browse', label: 'Browse Resources', icon: '🔍', description: 'Discover educational resources from teachers worldwide' },
    { id: 'upload', label: 'Upload Resource', icon: '📤', description: 'Share your educational materials with the community' },
    { id: 'my-resources', label: 'My Resources', icon: '📁', description: 'Manage your uploaded resources' },
    { id: 'stats', label: 'Analytics', icon: '📊', description: 'View platform statistics and insights' }
  ];

  const StatsCard = ({ title, value, icon, color, description }) => (
    <div className={`p-6 rounded-lg border transition-all duration-300 hover:shadow-lg ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm transition-colors duration-300 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {title}
          </p>
          <p className={`text-3xl font-bold transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {value}
          </p>
          {description && (
            <p className={`text-xs mt-1 transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              {description}
            </p>
          )}
        </div>
        <div className={`text-4xl p-4 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const MyResourceCard = ({ resource }) => (
    <div 
      className={`p-4 rounded-lg border transition-all duration-300 cursor-pointer hover:shadow-md ${
        theme === 'dark' 
          ? 'bg-gray-700 border-gray-600 hover:border-gray-500' 
          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => handleResourceSelect(resource)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className={`font-medium transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {resource.title}
          </h4>
          <p className={`text-sm mt-1 transition-colors duration-300 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {resource.subject_area.replace('_', ' ')} • {resource.grade_level.replace('_', ' ')}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <span className={`text-sm transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              ❤️ {resource.likes_count}
            </span>
            <span className={`text-sm transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              ⭐ {resource.average_rating.toFixed(1)}
            </span>
            <span className={`text-sm transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              ⬇️ {resource.download_count}
            </span>
          </div>
        </div>
        <div className="text-2xl">📄</div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className={`mb-8 p-6 rounded-lg border transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">📚</div>
            <div>
              <h1 className={`text-3xl font-bold transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Educational Resources
              </h1>
              <p className={`text-lg transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Share, discover, and collaborate on educational materials
              </p>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg transition-colors duration-300 ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'
          }`}>
            <p className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-300' : 'text-blue-800'
            }`}>
              Welcome to the Teachers Connect resource sharing platform! Upload your teaching materials, 
              discover resources from educators worldwide, and build a collaborative learning community 
              for rural education. 🌍✨
            </p>
          </div>
        </div>

        {/* Quick Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Resources"
              value={stats.total_resources}
              icon="📚"
              color={theme === 'dark' ? 'bg-blue-600' : 'bg-blue-100'}
              description="Available resources"
            />
            <StatsCard
              title="Downloads"
              value={stats.total_downloads}
              icon="⬇️"
              color={theme === 'dark' ? 'bg-green-600' : 'bg-green-100'}
              description="Total downloads"
            />
            <StatsCard
              title="Community Likes"
              value={stats.total_likes}
              icon="❤️"
              color={theme === 'dark' ? 'bg-red-600' : 'bg-red-100'}
              description="Community appreciation"
            />
            <StatsCard
              title="Recent Uploads"
              value={stats.recent_uploads}
              icon="🆕"
              color={theme === 'dark' ? 'bg-purple-600' : 'bg-purple-100'}
              description="In the last 7 days"
            />
          </div>
        )}

        {/* Navigation Tabs */}
        <div className={`border-b mb-8 transition-colors duration-300 ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? theme === 'dark'
                      ? 'border-blue-400 text-blue-400'
                      : 'border-blue-500 text-blue-600'
                    : theme === 'dark'
                      ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                title={tab.description}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'browse' && (
            <div>
              <div className="mb-6">
                <h2 className={`text-2xl font-semibold mb-2 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  🔍 Discover Educational Resources
                </h2>
                <p className={`transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Browse through thousands of educational materials shared by teachers worldwide
                </p>
              </div>
              <ResourceBrowser onSelectResource={handleResourceSelect} />
            </div>
          )}

          {activeTab === 'upload' && (
            <div>
              <div className="mb-6">
                <h2 className={`text-2xl font-semibold mb-2 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  📤 Share Your Educational Resources
                </h2>
                <p className={`transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Upload your teaching materials and help educators around the world
                </p>
              </div>
              <ResourceUpload onSuccess={handleUploadSuccess} />
            </div>
          )}

          {activeTab === 'my-resources' && (
            <div className={`p-6 rounded-lg border transition-colors duration-300 ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-2xl font-semibold mb-2 transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    📁 My Uploaded Resources
                  </h2>
                  <p className={`transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Manage and track your contributions to the community
                  </p>
                </div>
                <Button 
                  onClick={() => setActiveTab('upload')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  📤 Upload New
                </Button>
              </div>
              
              {myResources.length === 0 ? (
                <div className={`text-center py-16 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-xl mb-2">No resources uploaded yet</p>
                  <p className="text-sm mb-6">Start sharing your educational materials with the global teaching community!</p>
                  <Button 
                    onClick={() => setActiveTab('upload')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    Upload Your First Resource
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myResources.map((resource) => (
                    <MyResourceCard key={resource.id} resource={resource} />
                  ))}
                  <div className="text-center pt-6">
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab('browse')}
                      className={theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
                    >
                      View All My Resources
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && stats && (
            <div>
              <div className="mb-6">
                <h2 className={`text-2xl font-semibold mb-2 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  📊 Platform Analytics
                </h2>
                <p className={`transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Insights into resource usage and community engagement
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Popular Subjects */}
                <div className={`p-6 rounded-lg border transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    📖 Popular Subjects
                  </h3>
                  <div className="space-y-3">
                    {stats.popular_subjects.map((subject, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className={`capitalize transition-colors duration-300 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {subject.subject.replace('_', ' ')}
                        </span>
                        <span className={`font-medium transition-colors duration-300 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {subject.count} resources
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popular Grades */}
                <div className={`p-6 rounded-lg border transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    🎯 Popular Grade Levels
                  </h3>
                  <div className="space-y-3">
                    {stats.popular_grades.map((grade, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className={`capitalize transition-colors duration-300 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {grade.grade.replace('_', ' ')}
                        </span>
                        <span className={`font-medium transition-colors duration-300 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {grade.count} resources
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resource Detail Modal */}
      {selectedResource && (
        <ResourceDetail
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
          onUpdate={handleResourceUpdate}
        />
      )}
    </div>
  );
}