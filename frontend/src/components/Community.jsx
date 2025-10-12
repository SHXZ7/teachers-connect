"use client";

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { communityAPI } from '@/lib/communityAPI';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PostCreator from './PostCreator';
import PostCard from './PostCard';
import CommunityStats from './CommunityStats';
import AIAssistant from './AIAssistant';
import Groups from './Groups';
import BackendStatusBanner from './BackendStatusBanner';

export default function Community() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('community'); // New state for tab management
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    post_type: '',
    subject_area: ''
  });
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Get current user for WebSocket connection
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const { isConnected, lastMessage, sendTypingIndicator, connectionError } = useWebSocket(currentUser.id);

  // Handle real-time WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      handleWebSocketMessage(lastMessage);
    }
  }, [lastMessage]);

  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'post_update':
        if (message.event_type === 'new_post') {
          // Add new post to the top of the list
          setPosts(prev => [message.data, ...prev]);
          // Show notification
          showNotification('📝 New Post', `${message.data.author_name} shared a new post`);
        } else if (message.event_type === 'post_updated') {
          // Update existing post
          setPosts(prev => prev.map(post => 
            post.id === message.data.id ? message.data : post
          ));
        } else if (message.event_type === 'post_deleted') {
          // Remove deleted post
          setPosts(prev => prev.filter(post => post.id !== message.data.id));
        }
        break;

      case 'comment_update':
        if (message.event_type === 'new_comment') {
          // Update post with new comment
          setPosts(prev => prev.map(post => {
            if (post.id === message.post_id) {
              return {
                ...post,
                comments: [...(post.comments || []), message.data],
                comment_count: (post.comment_count || 0) + 1
              };
            }
            return post;
          }));
          // Show notification if not own comment
          if (message.data.author_id !== currentUser.id) {
            showNotification('💬 New Comment', `${message.data.author_name} commented on a post`);
          }
        }
        break;

      case 'reaction_update':
        // Update post reactions
        setPosts(prev => prev.map(post => {
          if (post.id === message.post_id) {
            return {
              ...post,
              reaction_counts: message.data.reaction_counts
            };
          }
          return post;
        }));
        // Show notification for reactions (optional)
        if (message.data.user_name !== currentUser.name) {
          showNotification('⚡ New Reaction', `${message.data.user_name} reacted to a post`);
        }
        break;

      case 'notification':
        // Handle personal notifications
        setNotifications(prev => [message, ...prev]);
        showNotification(message.title, message.message);
        break;

      case 'typing_indicator':
        // Handle typing indicators (could be implemented in PostCard)
        console.log(`${message.user_name} is ${message.is_typing ? 'typing' : 'stopped typing'} on post ${message.post_id}`);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  };

  const showNotification = (title, message) => {
    // Simple notification - could be enhanced with toast library
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/favicon.ico' });
    }
    console.log(`Notification: ${title} - ${message}`);
  };

  useEffect(() => {
    if (activeTab === 'community') {
      fetchPosts();
      fetchStats();
    }
  }, [filters, activeTab]);

  const fetchPosts = async (loadMore = false) => {
    try {
      setLoading(true);
      const currentPage = loadMore ? page : 0;
      
      const response = await communityAPI.getPosts({
        skip: currentPage * 20,
        limit: 20,
        ...filters
      });
      
      if (loadMore) {
        setPosts(prev => [...prev, ...response]);
      } else {
        setPosts(response);
        setPage(0);
      }
      
      setHasMore(response.length === 20);
      if (loadMore) setPage(currentPage + 1);
      
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await communityAPI.getCommunityStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost.post, ...prev]);
    setShowCreatePost(false);
    fetchStats(); // Refresh stats
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(prev => prev.map(post => 
      post.id === updatedPost.id ? updatedPost : post
    ));
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
    fetchStats(); // Refresh stats
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const loadMorePosts = () => {
    fetchPosts(true);
  };

  if (loading && posts.length === 0) {
    return (
      <div className={`min-h-screen p-6 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className={`text-3xl font-bold transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  🏫 Teacher Community
                </h1>
                {/* WebSocket Connection Status */}
                <div 
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium cursor-help ${
                    isConnected 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-red-100 text-red-700 border border-red-200'
                  }`}
                  title={connectionError || (isConnected ? 'Real-time updates active' : 'Real-time updates disabled')}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  {isConnected ? 'Live' : (connectionError ? 'Server Offline' : 'Offline')}
                </div>
              </div>
              <p className={`text-lg transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Connect, share, and learn with fellow educators
              </p>
            </div>
            <div className="flex gap-3">
              {activeTab === 'community' && (
                <Button
                  onClick={() => setShowCreatePost(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                >
                  <span>✍️</span>
                  Create Post
                </Button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className={`flex space-x-1 p-1 rounded-lg border transition-colors duration-300 ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
          }`}>
            <button
              onClick={() => setActiveTab('community')}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'community'
                  ? theme === 'dark' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-white text-blue-600 shadow-sm border border-blue-200'
                  : theme === 'dark'
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>💬</span>
                Community Forum
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === 'groups'
                  ? theme === 'dark' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-white text-blue-600 shadow-sm border border-blue-200'
                  : theme === 'dark'
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>👥</span>
                Teacher Groups
              </div>
            </button>
          </div>

          {/* Stats Overview - Only for Community Tab */}
          {activeTab === 'community' && stats && <CommunityStats stats={stats} />}
        </div>

        {/* Backend Connection Status */}
        {!isConnected && connectionError && (
          <BackendStatusBanner 
            connectionError={`Real-time features disabled: ${connectionError}. You can still browse and create posts, but won't receive live updates.`}
            showInstructions={true} 
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'community' ? (
              <>
                {/* Filters */}
                <div className={`p-6 rounded-lg border mb-6 transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <h3 className={`font-semibold mb-4 transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    🔍 Filter Posts
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className={`text-sm transition-colors duration-300 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Search
                      </Label>
                      <Input
                        placeholder="Search posts..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className={`mt-1 transition-colors duration-300 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    
                    <div>
                      <Label className={`text-sm transition-colors duration-300 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Post Type
                      </Label>
                      <select
                        value={filters.post_type}
                        onChange={(e) => handleFilterChange('post_type', e.target.value)}
                        className={`mt-1 w-full p-2 rounded-md border transition-colors duration-300 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="">All Types</option>
                        <option value="text">💬 Discussion</option>
                        <option value="question">❓ Question</option>
                        <option value="resource_share">📚 Resource Share</option>
                        <option value="announcement">📢 Announcement</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label className={`text-sm transition-colors duration-300 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Subject Area
                      </Label>
                      <select
                        value={filters.subject_area}
                        onChange={(e) => handleFilterChange('subject_area', e.target.value)}
                        className={`mt-1 w-full p-2 rounded-md border transition-colors duration-300 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="">All Subjects</option>
                        <option value="mathematics">🔢 Mathematics</option>
                        <option value="science">🔬 Science</option>
                        <option value="english">📖 English</option>
                        <option value="history">🏛️ History</option>
                        <option value="geography">🌍 Geography</option>
                        <option value="art">🎨 Art</option>
                        <option value="physical_education">⚽ Physical Education</option>
                        <option value="other">📚 Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700">{error}</p>
                    <Button
                      onClick={() => {
                        setError(null);
                        fetchPosts();
                      }}
                      className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                    >
                      Try Again
                    </Button>
                  </div>
                )}

                {/* Posts Feed */}
                <div className="space-y-6">
                  {posts.length === 0 && !loading ? (
                    <div className={`text-center py-12 rounded-lg border transition-all duration-300 ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-200'
                    }`}>
                      <div className="text-6xl mb-4">🤝</div>
                      <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        No posts yet
                      </h3>
                      <p className={`transition-colors duration-300 mb-4 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Be the first to start a conversation in the community!
                      </p>
                      <Button
                        onClick={() => setShowCreatePost(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                      >
                        Create First Post
                      </Button>
                    </div>
                  ) : (
                    posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onUpdate={handlePostUpdated}
                        onDelete={handlePostDeleted}
                      />
                    ))
                  )}
                </div>

                {/* Load More Button */}
                {hasMore && posts.length > 0 && (
                  <div className="text-center mt-8">
                    <Button
                      onClick={loadMorePosts}
                      disabled={loading}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-2 rounded-lg disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Loading...
                        </div>
                      ) : (
                        'Load More Posts'
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              // Groups Tab Content
              <Groups />
            )}
          </div>

          {/* Sidebar - Only for Community Tab */}
          {activeTab === 'community' && (
            <div className="lg:col-span-1">
              <AIAssistant />
            </div>
          )}
        </div>

        {/* Create Post Modal */}
        {showCreatePost && (
          <PostCreator
            onClose={() => setShowCreatePost(false)}
            onPostCreated={handlePostCreated}
          />
        )}
      </div>
    </div>
  );
}