/**
 * Authentication utility functions for Teachers Connect
 */

/**
 * Logout function that clears all authentication data and redirects to login
 * @param {Function} router - Next.js router instance (from useRouter hook)
 * @param {Function} onSuccess - Optional callback function to execute on successful logout
 */
export const logout = (router, onSuccess) => {
  try {
    // Clear all authentication-related data from localStorage
    const authKeys = [
      'auth_token',
      'token', 
      'user', 
      'profile',
      'community_preferences',
      'group_preferences'
    ];
    
    authKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear session storage as well
    sessionStorage.clear();
    
    // Execute success callback if provided
    if (onSuccess && typeof onSuccess === 'function') {
      onSuccess();
    }
    
    // Redirect to login page
    if (router) {
      router.push('/login');
    } else {
      // Fallback for cases where router is not available
      window.location.href = '/login';
    }
    
    return { success: true, message: 'Logged out successfully' };
  } catch (error) {
    console.error('Error during logout:', error);
    return { success: false, message: 'Error during logout', error };
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} - True if user is authenticated, false otherwise
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  return !!(token && user);
};

/**
 * Get current user data from localStorage
 * @returns {Object|null} - User object or null if not authenticated
 */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Get authentication token
 * @returns {string|null} - Auth token or null if not available
 */
export const getAuthToken = () => {
  return localStorage.getItem('auth_token') || localStorage.getItem('token');
};

/**
 * Clear authentication data without redirect (useful for expired sessions)
 */
export const clearAuthData = () => {
  const authKeys = [
    'auth_token',
    'token', 
    'user', 
    'profile',
    'community_preferences',
    'group_preferences'
  ];
  
  authKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  sessionStorage.clear();
};

/**
 * Handle authentication errors (like 401 responses)
 * This can be called from API error handlers
 * @param {Error} error - The error object
 * @param {Function} router - Next.js router instance (optional)
 */
export const handleAuthError = (error, router) => {
  if (error.message && error.message.includes('401')) {
    console.warn('Authentication failed, clearing auth data');
    clearAuthData();
    
    // Redirect to login if router is available
    if (router) {
      router.push('/login?message=session_expired');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/login?message=session_expired';
    }
    
    return true; // Indicates auth error was handled
  }
  
  return false; // Not an auth error
};