"use client";

import { useTheme } from '@/contexts/ThemeContext';

export default function CommunityStats({ stats }) {
  const { theme } = useTheme();

  const StatCard = ({ icon, title, value, description, color }) => (
    <div className={`p-4 rounded-lg border transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-full ${color}`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div>
          <p className={`text-2xl font-bold transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {value}
          </p>
          <p className={`text-sm font-medium transition-colors duration-300 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {title}
          </p>
          {description && (
            <p className={`text-xs transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="📝"
          title="Total Posts"
          value={stats.total_posts}
          description="Community discussions"
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon="💬"
          title="Comments"
          value={stats.total_comments}
          description="Engaged conversations"
          color="bg-green-100 text-green-600"
        />
        <StatCard
          icon="⚡"
          title="Reactions"
          value={stats.total_reactions}
          description="Community feedback"
          color="bg-yellow-100 text-yellow-600"
        />
        <StatCard
          icon="👥"
          title="Active Teachers"
          value={stats.total_users}
          description="Contributing members"
          color="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Recent Activity and Popular Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Tags */}
        {stats.popular_tags && stats.popular_tags.length > 0 && (
          <div className={`p-6 rounded-lg border transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <h3 className={`font-semibold mb-4 flex items-center gap-2 transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              🔥 Popular Tags
            </h3>
            <div className="space-y-2">
              {stats.popular_tags.slice(0, 8).map((tag, index) => (
                <div key={tag._id} className="flex items-center justify-between">
                  <span className={`text-sm transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    #{tag._id}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 rounded-full transition-colors duration-300 ${
                      theme === 'dark' ? 'bg-blue-400' : 'bg-blue-500'
                    }`} style={{
                      width: `${Math.max(20, (tag.count / stats.popular_tags[0].count) * 100)}px`
                    }}></div>
                    <span className={`text-xs transition-colors duration-300 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {tag.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Discussions */}
        {stats.active_discussions && stats.active_discussions.length > 0 && (
          <div className={`p-6 rounded-lg border transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <h3 className={`font-semibold mb-4 flex items-center gap-2 transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              🔥 Hot Discussions
            </h3>
            <div className="space-y-3">
              {stats.active_discussions.map((discussion) => (
                <div key={discussion.id} className={`p-3 rounded border transition-all duration-300 hover:bg-opacity-50 cursor-pointer ${
                  theme === 'dark' 
                    ? 'border-gray-600 hover:bg-gray-700' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <h4 className={`font-medium text-sm mb-1 line-clamp-2 transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {discussion.title}
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs transition-colors duration-300 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      💬 {discussion.comment_count} comments
                    </span>
                    <span className={`text-xs transition-colors duration-300 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {new Date(discussion.latest_comment).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity Indicator */}
      {stats.recent_activity > 0 && (
        <div className={`p-4 rounded-lg border-l-4 transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-green-900 border-green-400 text-green-200' 
            : 'bg-green-50 border-green-400 text-green-700'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">🟢</span>
            <span className="font-medium">
              {stats.recent_activity} new post{stats.recent_activity !== 1 ? 's' : ''} in the last 24 hours
            </span>
          </div>
        </div>
      )}
    </div>
  );
}