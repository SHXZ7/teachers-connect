'use client';

import React, { useState, useEffect } from 'react';

const AuthDebugger = () => {
  const [authStatus, setAuthStatus] = useState({
    token: null,
    tokenExists: false,
    tokenLength: 0,
    isLoggedIn: false
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      setAuthStatus({
        token: token ? token.substring(0, 50) + '...' : null,
        tokenExists: !!token,
        tokenLength: token ? token.length : 0,
        isLoggedIn: !!token
      });
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('auth_token');
    checkAuthStatus();
  };

  const testAPI = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('No token found. Please log in first.');
      return;
    }

    try {
      const response = await fetch('https://shxz7-backend.hf.space/api/lessons', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = {
        status: response.status,
        statusText: response.statusText,
        data: response.ok ? await response.json() : await response.text()
      };

      alert(`API Test Result:\nStatus: ${result.status}\nData: ${JSON.stringify(result.data, null, 2)}`);
    } catch (error) {
      alert(`API Test Error: ${error.message}`);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-bold mb-4">🔐 Authentication Debug Info</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Token Exists:</span>
          <span className={`px-2 py-1 rounded text-xs ${authStatus.tokenExists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {authStatus.tokenExists ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Token Length:</span>
          <span className="text-sm">{authStatus.tokenLength}</span>
        </div>
        
        {authStatus.token && (
          <div>
            <span className="text-sm font-medium">Token Preview:</span>
            <div className="text-xs bg-gray-100 p-2 rounded mt-1 break-all">
              {authStatus.token}
            </div>
          </div>
        )}
        
        <div className="flex space-x-2 pt-4">
          <button
            onClick={checkAuthStatus}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Refresh
          </button>
          <button
            onClick={testAPI}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Test API
          </button>
          <button
            onClick={clearAuth}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Clear Auth
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthDebugger;