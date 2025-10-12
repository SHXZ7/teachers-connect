"use client";

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

const AuthLayout = ({ 
  children, 
  title, 
  subtitle, 
  type = 'login',
  rightPanelContent 
}) => {
  const { theme } = useTheme();

  const FloatingElements = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient mesh */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-teal-400/20 to-green-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-500" />
      
      {/* Floating icons */}
      <div className="absolute top-1/4 left-1/4 text-4xl opacity-20 animate-float">🎓</div>
      <div className="absolute top-1/3 right-1/4 text-3xl opacity-20 animate-float delay-1000">🧠</div>
      <div className="absolute bottom-1/3 left-1/3 text-3xl opacity-20 animate-float delay-2000">🌐</div>
      <div className="absolute bottom-1/4 right-1/3 text-4xl opacity-20 animate-float delay-1500">📚</div>
    </div>
  );

  const FeatureHighlights = () => (
    <div className="space-y-6 mb-12">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
          <span className="text-2xl">🧠</span>
        </div>
        <div>
          <h4 className="text-white font-semibold">AI-Powered Learning</h4>
          <p className="text-blue-200 text-sm">Intelligent lesson generation and Q&A assistance</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
          <span className="text-2xl">🌐</span>
        </div>
        <div>
          <h4 className="text-white font-semibold">Offline Access</h4>
          <p className="text-blue-200 text-sm">Works seamlessly in low-connectivity areas</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
          <span className="text-2xl">🌍</span>
        </div>
        <div>
          <h4 className="text-white font-semibold">Multilingual Support</h4>
          <p className="text-blue-200 text-sm">Content in local languages for better accessibility</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
          <span className="text-2xl">🤝</span>
        </div>
        <div>
          <h4 className="text-white font-semibold">Teacher Community</h4>
          <p className="text-blue-200 text-sm">Connect and collaborate with fellow educators</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      theme === 'dark' 
        ? 'bg-gray-900' 
        : 'bg-gray-50'
    }`}>
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Panel - Form Section */}
        <div className={`flex flex-col transition-all duration-500 ${
          theme === 'dark' ? 'bg-gray-900' : 'bg-white'
        }`}>
          {/* Header */}
          <div className="p-6 md:p-10">
            <Link href="/" className="flex items-center space-x-3 font-bold text-xl">
              <div className="text-3xl">🎓</div>
              <span className={`transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Teachers<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Connect</span>
              </span>
            </Link>
          </div>

          {/* Form Container */}
          <div className="flex-1 flex items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-md">
              {/* Title Section */}
              <div className="text-center mb-8">
                <h1 className={`text-3xl md:text-4xl font-bold mb-3 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {title}
                </h1>
                <p className={`text-lg transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {subtitle}
                </p>
              </div>

              {/* Form Content */}
              <div className={`p-8 rounded-2xl backdrop-blur-lg border transition-all duration-500 ${
                theme === 'dark' 
                  ? 'bg-gray-800/50 border-gray-700/50' 
                  : 'bg-white/80 border-gray-200/50 shadow-xl'
              }`}>
                {children}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Visual Section */}
        <div className="relative hidden lg:block overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-teal-600">
            <FloatingElements />
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-center items-center p-12 text-white">
            {/* Main Illustration */}
            <div className="mb-12 text-center">
              <div className="text-8xl mb-6 animate-bounce">
                {type === 'login' ? '👨‍🏫' : '🌟'}
              </div>
              <h2 className="text-4xl font-bold mb-4">
                {type === 'login' ? 'Welcome Back!' : 'Join Our Mission'}
              </h2>
              <p className="text-xl text-blue-100 max-w-md">
                {type === 'login' 
                  ? 'Continue your journey in transforming rural education with AI-powered tools'
                  : 'Be part of the global movement to democratize quality education for all'
                }
              </p>
            </div>

            {/* Feature Highlights */}
            <FeatureHighlights />

            {/* Tagline */}
            <div className="text-center">
              <div className="text-2xl font-bold mb-2 bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Empowering Rural Education
              </div>
              <div className="text-lg text-blue-200">
                Connect • Collaborate • Transform
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      </div>

      {/* Mobile Visual Section */}
      <div className="lg:hidden relative overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-4xl mb-2">🎓</div>
            <div className="font-bold">Empowering Rural Education</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;