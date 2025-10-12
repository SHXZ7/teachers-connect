"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { logout, isAuthenticated } from '@/utils/auth';

const Navbar = ({ activeRoute, onNavigate }) => {
  const router = useRouter();
  const { theme } = useTheme();
  const { isOnline, pendingActions } = useOfflineStatus();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userIsAuthenticated = isAuthenticated();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout(router);
    }
  };

  const navigationItems = [
    {
      icon: '🏠',
      name: 'Dashboard',
      route: '/dashboard',
      description: 'Main overview and statistics'
    },
    {
      icon: '📚',
      name: 'Resources',
      route: '/dashboard/resources',
      description: 'Upload and browse educational resources'
    },
    {
      icon: '🤖',
      name: 'AI Assistant',
      route: '/dashboard/ai-assistant',
      description: 'Complete AI teaching suite with lesson generation & notes'
    },
    {
      icon: '🌍',
      name: 'Multilingual',
      route: '/dashboard/multilingual',
      description: 'Multi-language content support'
    },
    {
      icon: '💬',
      name: 'Community',
      route: '/dashboard/community',
      description: 'Connect with other teachers'
    },
    {
      icon: '📶',
      name: 'Offline Mode',
      route: '/dashboard/offline-mode',
      description: 'Download content for offline use'
    },
    {
      icon: '👤',
      name: 'Profile',
      route: '/dashboard/profile',
      description: 'Manage your account settings'
    },
    {
      icon: '⚙️',
      name: 'Settings',
      route: '/dashboard/settings',
      description: 'Application preferences'
    }
  ];

  const handleNavigation = (route) => {
    onNavigate(route);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={`border-b sticky top-0 z-50 transition-all duration-300 backdrop-blur-md ${
      theme === 'dark' 
        ? 'border-gray-800 bg-gray-950/85 shadow-sm shadow-black/30' 
        : 'border-gray-200 bg-white/85 shadow-sm shadow-gray-900/5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo Section - Compact */}
          <div className="flex items-center gap-2.5 min-w-fit flex-shrink-0">
            <div className={`text-2xl p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
              theme === 'dark' ? 'bg-gradient-to-br from-blue-600/30 to-purple-600/30' : 'bg-gradient-to-br from-blue-100 to-purple-100'
            }`}>
              🎓
            </div>
            <div className="hidden sm:block">
              <h1 className={`text-sm font-bold leading-tight ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Teachers Connect
              </h1>
              <p className={`text-xs leading-tight ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`}>
                Education Platform
              </p>
            </div>
          </div>

          {/* Desktop Navigation - Horizontal Tabs */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {navigationItems.slice(0, 6).map((item) => (
              <button
                key={item.route}
                onClick={() => handleNavigation(item.route)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                  activeRoute === item.route
                    ? theme === 'dark'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/25'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md shadow-blue-400/25'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="hidden xl:inline text-xs font-medium">{item.name}</span>
              </button>
            ))}

            {/* More Dropdown */}
            <div className="relative group ml-1">
              <button className={`px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-1 ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}>
                <span className="text-lg">⋯</span>
              </button>
              
              {/* Dropdown Menu */}
              <div className={`absolute right-0 mt-1 w-56 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 backdrop-blur-md z-50 ${
                theme === 'dark' 
                  ? 'bg-gray-900/95 border border-gray-700 shadow-black/40' 
                  : 'bg-white/95 border border-gray-200 shadow-gray-900/10'
              }`}>
                <div className="py-1.5">
                  {navigationItems.slice(6).map((item) => (
                    <button
                      key={item.route}
                      onClick={() => handleNavigation(item.route)}
                      className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 transition-all duration-200 mx-1 rounded-lg my-0.5 ${
                        activeRoute === item.route
                          ? theme === 'dark'
                            ? 'bg-gradient-to-r from-blue-600/80 to-purple-600/80 text-white'
                            : 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                            : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <div className="flex-1">
                        <div className="text-xs font-medium">{item.name}</div>
                        <div className={`text-xs opacity-75 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {item.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Utilities */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Online Status */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
              isOnline
                ? theme === 'dark'
                  ? 'bg-green-900/40 text-green-400 border border-green-700/50'
                  : 'bg-green-100/60 text-green-700 border border-green-300/50'
                : theme === 'dark'
                  ? 'bg-orange-900/40 text-orange-400 border border-orange-700/50'
                  : 'bg-orange-100/60 text-orange-700 border border-orange-300/50'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`}></span>
              <span>{isOnline ? 'Online' : 'Offline'}</span>
              {pendingActions > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded text-xs font-bold ${
                  theme === 'dark' ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                }`}>
                  {pendingActions}
                </span>
              )}
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Logout Button */}
            {userIsAuthenticated && (
              <button
                onClick={handleLogout}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 border ${
                  theme === 'dark'
                    ? 'text-red-400 hover:text-red-300 border-red-700/50 hover:bg-red-900/30'
                    : 'text-red-600 hover:text-red-700 border-red-300/50 hover:bg-red-100/50'
                }`}
              >
                <span className="text-sm">🚪</span>
                <span>Logout</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg transition-all duration-300 ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span className={`text-lg transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-180' : ''}`}>
                {isMobileMenuOpen ? '✕' : '☰'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className={`lg:hidden border-t py-3 px-2 space-y-1 transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
            theme === 'dark' ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50/50'
          }`}>
            <div className="grid grid-cols-2 gap-1">
              {navigationItems.map((item) => (
                <button
                  key={item.route}
                  onClick={() => handleNavigation(item.route)}
                  className={`p-3 text-xs flex flex-col items-center gap-1.5 rounded-lg transition-all duration-300 ${
                    activeRoute === item.route
                      ? theme === 'dark'
                        ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-md'
                        : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md'
                      : theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-800/60'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium leading-tight">{item.name}</span>
                </button>
              ))}
            </div>

            {/* Mobile Logout */}
            {userIsAuthenticated && (
              <button
                onClick={handleLogout}
                className={`w-full p-3 mt-2 text-xs font-medium rounded-lg transition-all duration-300 border-t pt-4 ${
                  theme === 'dark'
                    ? 'text-red-400 hover:bg-red-900/30 border-gray-800'
                    : 'text-red-600 hover:bg-red-100/50 border-gray-200'
                }`}
              >
                🚪 Logout
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;