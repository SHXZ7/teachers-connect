/**
 * Custom hook for managing offline/online status
 */

import { useState, useEffect } from 'react';

export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState(0);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    // Connection status handlers
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending actions periodically
    const checkPendingActions = async () => {
      try {
        // Dynamically import to avoid SSR issues
        const offlineUtils = await import('@/utils/offline');
        const stats = await offlineUtils.getActionsStats();
        setPendingActions(stats.pending);
      } catch (error) {
        console.warn('Could not check pending actions:', error);
      }
    };

    // Initial check
    checkPendingActions();

    // Check every 30 seconds
    const interval = setInterval(checkPendingActions, 30000);

    // Listen for sync events to update pending count
    const handleSyncCompleted = () => {
      checkPendingActions();
    };

    window.addEventListener('offline-sync-completed', handleSyncCompleted);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-sync-completed', handleSyncCompleted);
      clearInterval(interval);
    };
  }, []);

  return { isOnline, pendingActions };
};

export default useOfflineStatus;