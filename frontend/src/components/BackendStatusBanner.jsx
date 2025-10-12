"use client";

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { getBackendInstructions } from '@/utils/backend';

export default function BackendStatusBanner({ connectionError, showInstructions = false }) {
  const { theme } = useTheme();
  const [showDetails, setShowDetails] = useState(false);

  if (!connectionError) return null;

  return (
    <div className={`mb-6 rounded-lg border-l-4 transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-yellow-900/20 border-yellow-500 text-yellow-400' 
        : 'bg-yellow-50 border-yellow-400 text-yellow-800'
    }`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-lg">⚠️</span>
          </div>
          <div className="ml-3 flex-1">
            <h4 className="text-sm font-medium">Backend Server Connection Issue</h4>
            <p className="text-sm mt-1">{connectionError}</p>
            
            {showInstructions && (
              <div className="mt-3">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className={`text-sm font-medium underline transition-colors duration-200 ${
                    theme === 'dark' ? 'hover:text-yellow-300' : 'hover:text-yellow-900'
                  }`}
                >
                  {showDetails ? 'Hide' : 'Show'} setup instructions
                </button>
                
                {showDetails && (
                  <div className={`mt-3 p-3 rounded border text-xs font-mono whitespace-pre-line ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-600 text-gray-300' 
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}>
                    {getBackendInstructions()}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex-shrink-0 ml-3">
            <button
              onClick={() => window.location.reload()}
              className={`text-xs px-3 py-1 rounded transition-colors duration-200 ${
                theme === 'dark'
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-yellow-500 hover:bg-yellow-600 text-white'
              }`}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}