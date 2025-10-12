"use client";

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { groupAPI } from '@/lib/groupAPI';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GroupList from './GroupList';
import GroupChat from './GroupChat';
import GroupCreator from './GroupCreator';
import AssignmentCreator from './AssignmentCreator';

export default function Groups() {
  const { theme } = useTheme();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [stats, setStats] = useState(null);

  // Get current user for WebSocket connection
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  const { isConnected, lastMessage, connectionError } = useWebSocket(currentUser.id);

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (currentUser.id && token) {
      fetchGroups();
      fetchStats();
    } else {
      setError('Please log in to access groups');
      setLoading(false);
    }
  }, [currentUser.id, token]);

  // Handle real-time WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      handleWebSocketMessage(lastMessage);
    }
  }, [lastMessage]);

  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'group_created':
        // Add new group to list if user is a member
        if (message.data.members.some(member => member.user_id === currentUser.id)) {
          setGroups(prev => [message.data, ...prev]);
        }
        break;

      case 'group_message':
        // Update group with latest message timestamp for sorting
        if (selectedGroup && selectedGroup.id === message.group_id) {
          // The GroupChat component will handle this message
        }
        
        // Update groups list to show latest activity
        setGroups(prev => prev.map(group => {
          if (group.id === message.group_id) {
            return {
              ...group,
              last_message: message.data,
              last_activity: message.timestamp
            };
          }
          return group;
        }));
        break;

      case 'assignment_created':
        // Show notification
        if (message.group_id !== selectedGroup?.id) {
          showNotification('📋 New Assignment', `Assignment created in ${message.data.group_name}`);
        }
        break;

      default:
        console.log('Unknown group message type:', message.type);
    }
  };

  const showNotification = (title, message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/favicon.ico' });
    }
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching groups with user:', currentUser.id, 'token exists:', !!token);
      const response = await groupAPI.getUserGroups();
      setGroups(response);
    } catch (error) {
      console.error('Error fetching groups:', error);
      if (error.message.includes('401')) {
        setError('Authentication failed. Please log in again.');
        // Clear invalid authentication data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      } else {
        setError('Failed to load groups. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await groupAPI.getGroupStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      if (error.message.includes('401')) {
        console.warn('Authentication failed for stats');
      }
    }
  };

  const handleGroupCreated = (newGroup) => {
    setGroups(prev => [newGroup.group, ...prev]);
    setShowCreateGroup(false);
    fetchStats();
  };

  const handleGroupSelected = (group) => {
    setSelectedGroup(group);
  };

  const handleAssignmentCreated = () => {
    setShowCreateAssignment(false);
    fetchStats();
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-6 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className={`text-3xl font-bold transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  👥 Teacher Groups
                </h1>
                {/* Connection Status */}
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                  isConnected 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  {isConnected ? 'Live' : 'Offline'}
                </div>
              </div>
              <p className={`text-lg transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Collaborate with teachers in subject and grade-specific groups
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCreateGroup(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
              >
                <span>➕</span>
                Create Group
              </Button>
              {selectedGroup && (
                <Button
                  onClick={() => setShowCreateAssignment(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                >
                  <span>📋</span>
                  New Assignment
                </Button>
              )}
            </div>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <span className="text-blue-600 text-xl">👥</span>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold transition-colors duration-300 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {stats.total_groups}
                    </p>
                    <p className={`text-sm transition-colors duration-300 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Groups
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <span className="text-green-600 text-xl">📋</span>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold transition-colors duration-300 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {stats.active_assignments}
                    </p>
                    <p className={`text-sm transition-colors duration-300 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Active Assignments
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <span className="text-purple-600 text-xl">👨‍🏫</span>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold transition-colors duration-300 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {stats.total_members}
                    </p>
                    <p className={`text-sm transition-colors duration-300 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Total Members
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <span className="text-yellow-600 text-xl">💬</span>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold transition-colors duration-300 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {stats.messages_today}
                    </p>
                    <p className={`text-sm transition-colors duration-300 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Messages Today
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content - WhatsApp-like Layout */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-300px)] rounded-lg border overflow-hidden ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          {/* Groups List - Left Sidebar */}
          <div className="lg:col-span-1 border-r">
            <GroupList
              groups={groups}
              selectedGroup={selectedGroup}
              onGroupSelect={handleGroupSelected}
              onRefresh={fetchGroups}
            />
          </div>

          {/* Chat Area - Main Content */}
          <div className="lg:col-span-2">
            {selectedGroup ? (
              <GroupChat
                group={selectedGroup}
                currentUser={currentUser}
              />
            ) : (
              <div className={`h-full flex items-center justify-center transition-colors duration-300 ${
                theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'
              }`}>
                <div className="text-center">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Select a Group
                  </h3>
                  <p className={`transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Choose a group to start chatting and managing assignments
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="fixed bottom-4 right-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-sm">
            <p className="text-red-700">{error}</p>
            <Button
              onClick={() => {
                setError(null);
                fetchGroups();
              }}
              className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateGroup && (
          <GroupCreator
            onClose={() => setShowCreateGroup(false)}
            onGroupCreated={handleGroupCreated}
          />
        )}

        {/* Create Assignment Modal */}
        {showCreateAssignment && selectedGroup && (
          <AssignmentCreator
            group={selectedGroup}
            onClose={() => setShowCreateAssignment(false)}
            onAssignmentCreated={handleAssignmentCreated}
          />
        )}
      </div>
    </div>
  );
}