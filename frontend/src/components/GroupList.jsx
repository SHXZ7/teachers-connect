"use client";

import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

export default function GroupList({ 
  groups, 
  selectedGroup, 
  onSelectGroup, 
  onCreateGroup, 
  currentUser,
  isConnected 
}) {
  const { theme } = useTheme();

  const formatLastMessage = (group) => {
    if (!group.last_message) return 'No messages yet';
    const maxLength = 50;
    const message = group.last_message.content || 'Media message';
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  return (
    <div className={`h-full border-r transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b transition-colors duration-300 ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-lg font-semibold transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Teacher Groups
          </h2>
          <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs ${
            isConnected 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            {isConnected ? 'Live' : 'Offline'}
          </div>
        </div>
        
        <Button
          onClick={onCreateGroup}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <span className="mr-2">➕</span>
          Create Group
        </Button>
      </div>

      {/* Groups List */}
      <div className="overflow-y-auto">
        {groups.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-4xl mb-3">👥</div>
            <h3 className={`font-medium mb-2 transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              No groups yet
            </h3>
            <p className={`text-sm transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Create your first teacher group to start collaborating
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group._id}
              onClick={() => onSelectGroup(group)}
              className={`p-4 border-b cursor-pointer transition-all duration-200 ${
                selectedGroup?._id === group._id
                  ? theme === 'dark'
                    ? 'bg-blue-900 border-blue-800'
                    : 'bg-blue-50 border-blue-200'
                  : theme === 'dark'
                    ? 'border-gray-700 hover:bg-gray-700'
                    : 'border-gray-100 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start space-x-3">
                {/* Group Avatar */}
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold ${
                  group.color || 'bg-blue-500'
                }`}>
                  {group.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Group Name and Time */}
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-medium truncate transition-colors duration-300 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {group.name}
                    </h3>
                    <span className={`text-xs transition-colors duration-300 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {formatTime(group.last_message?.timestamp)}
                    </span>
                  </div>

                  {/* Last Message */}
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate transition-colors duration-300 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {formatLastMessage(group)}
                    </p>
                    
                    {/* Unread Count */}
                    {group.unread_count > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {group.unread_count > 99 ? '99+' : group.unread_count}
                      </span>
                    )}
                  </div>

                  {/* Members Count */}
                  <div className={`text-xs mt-1 transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {group.members?.length || 0} members
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}