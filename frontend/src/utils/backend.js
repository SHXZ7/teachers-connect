/**
 * Backend connectivity utilities for Teachers Connect
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://shxz7-backend.hf.space';

/**
 * Check if the backend server is running
 * @returns {Promise<{isRunning: boolean, message: string}>}
 */
export const checkBackendStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        isRunning: true,
        message: 'Backend server is running',
        data
      };
    } else {
      return {
        isRunning: false,
        message: `Backend returned status ${response.status}`,
        error: response.statusText
      };
    }
  } catch (error) {
    if (error.name === 'TimeoutError') {
      return {
        isRunning: false,
        message: 'Backend server is not responding (timeout)',
        error: 'Connection timeout'
      };
    } else if (error.message.includes('fetch')) {
      return {
        isRunning: false,
        message: 'Backend server is not running on shxz7-backend.hf.space',
        error: 'Connection refused'
      };
    } else {
      return {
        isRunning: false,
        message: 'Unable to connect to backend server',
        error: error.message
      };
    }
  }
};

/**
 * React hook to monitor backend status
 * @param {number} checkInterval - How often to check in milliseconds (default: 30000)
 * @returns {Object} - {isRunning, lastCheck, error, checkStatus}
 */
export const useBackendStatus = (checkInterval = 30000) => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const [error, setError] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await checkBackendStatus();
      setIsRunning(result.isRunning);
      setError(result.isRunning ? null : result.message);
      setLastCheck(new Date());
    } catch (error) {
      setIsRunning(false);
      setError(error.message);
      setLastCheck(new Date());
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    // Check immediately on mount
    checkStatus();

    // Set up interval for periodic checks
    const interval = setInterval(checkStatus, checkInterval);

    return () => {
      clearInterval(interval);
    };
  }, [checkStatus, checkInterval]);

  return {
    isRunning,
    lastCheck,
    error,
    isChecking,
    checkStatus
  };
};

/**
 * Display backend connection instructions
 * @returns {string} - Instructions for starting the backend
 */
export const getBackendInstructions = () => {
  return `To start the backend server:

1. Open a terminal in the backend directory
2. Run: python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
3. The server should start on https://shxz7-backend.hf.space

If you're still having issues:
- Check that Python and dependencies are installed
- Verify MongoDB is running
- Check for port conflicts on port 8000`;
};