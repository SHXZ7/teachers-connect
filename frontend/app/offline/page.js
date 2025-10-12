'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import offlineUtils from '@/utils/offline';

export default function OfflinePage() {
  const { theme } = useTheme();
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [offlineStats, setOfflineStats] = useState({ total: 0, pending: 0, completed: 0, failed: 0 });
  const [cacheInfo, setCacheInfo] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncMessage, setSyncMessage] = useState('');

  // Initialize connection status and auto-sync
  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);
    
    // Enable auto-sync
    offlineUtils.enableAutoSync();
    
    // Add connection listeners
    const handleConnectionChange = (online) => {
      setIsOnline(online);
      if (online) {
        setSyncMessage('Connection restored! Checking for pending actions...');
        handleSync();
      } else {
        setSyncMessage('You\'re now offline. Actions will be queued for sync.');
      }
    };
    
    offlineUtils.connectionStatus.addListener(handleConnectionChange);
    
    // Listen for auto-sync completion
    const handleAutoSyncCompleted = (event) => {
      const { synced, failed } = event.detail;
      setSyncMessage(`Auto-sync completed: ${synced} actions synced${failed > 0 ? `, ${failed} failed` : ''}`);
      loadStats();
    };
    
    window.addEventListener('offline-sync-completed', handleAutoSyncCompleted);
    
    // Load initial stats
    loadStats();
    loadCacheInfo();
    
    return () => {
      offlineUtils.connectionStatus.removeListener(handleConnectionChange);
      window.removeEventListener('offline-sync-completed', handleAutoSyncCompleted);
    };
  }, []);

  const loadStats = async () => {
    const stats = await offlineUtils.getActionsStats();
    setOfflineStats(stats);
  };

  const loadCacheInfo = async () => {
    const info = await offlineUtils.getCacheInfo();
    setCacheInfo(info);
  };

  const handleSync = async () => {
    if (!isOnline) {
      setSyncMessage('Cannot sync while offline');
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('Syncing offline actions...');
    
    try {
      const result = await offlineUtils.syncOfflineActions();
      
      if (result.success) {
        setSyncStatus('success');
        setSyncMessage(
          result.synced > 0
            ? `Successfully synced ${result.synced} actions${result.failed > 0 ? `, ${result.failed} failed` : ''}`
            : 'No actions to sync'
        );
        setLastSyncTime(new Date());
        await loadStats();
      } else {
        setSyncStatus('error');
        setSyncMessage(result.reason === 'offline' ? 'Cannot sync while offline' : `Sync failed: ${result.error}`);
      }
    } catch (error) {
      setSyncStatus('error');
      setSyncMessage(`Sync error: ${error.message}`);
    }
    
    // Reset status after 3 seconds
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const clearAllData = async () => {
    if (confirm('Are you sure you want to clear all offline data? This cannot be undone.')) {
      await offlineUtils.clearCache();
      await offlineUtils.clearOfflineActions();
      setSyncMessage('All offline data cleared');
      await loadStats();
      await loadCacheInfo();
    }
  };

  const getConnectionIcon = () => {
    if (isOnline) return '✅';
    return '⚡';
  };

  const getConnectionMessage = () => {
    if (isOnline) {
      return 'You\'re Online — all data will sync automatically';
    }
    return 'Offline Mode — you can keep working offline, changes will sync when online';
  };

  const getSyncButtonText = () => {
    switch (syncStatus) {
      case 'syncing': return '🔄 Syncing...';
      case 'success': return '✅ Synced';
      case 'error': return '❌ Retry Sync';
      default: return '🔄 Sync Now';
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            📱 Offline Mode
          </h1>
          <p className={`text-lg transition-colors duration-300 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Manage your offline experience and sync status
          </p>
        </div>

        {/* Connection Status Card */}
        <div className={`rounded-lg p-6 border-2 transition-all duration-300 ${
          isOnline
            ? theme === 'dark'
              ? 'bg-green-900/20 border-green-500 text-green-100'
              : 'bg-green-50 border-green-300 text-green-800'
            : theme === 'dark'
              ? 'bg-orange-900/20 border-orange-500 text-orange-100'
              : 'bg-orange-50 border-orange-300 text-orange-800'
        }`}>
          <div className="flex items-center justify-center space-x-3 mb-4">
            <span className="text-4xl">{getConnectionIcon()}</span>
            <div className="text-center">
              <h2 className="text-xl font-semibold">
                {isOnline ? 'Connected' : 'Offline'}
              </h2>
              <p className="text-sm opacity-90">
                {getConnectionMessage()}
              </p>
            </div>
          </div>
          
          {syncMessage && (
            <div className={`mt-4 p-3 rounded text-center text-sm ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              {syncMessage}
            </div>
          )}
        </div>

        {/* Sync Controls */}
        <div className={`rounded-lg p-6 transition-colors duration-300 ${
          theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold mb-4">Sync Control</h3>
          
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{offlineStats.pending}</div>
                  <div className="text-sm text-gray-500">Pending</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{offlineStats.completed}</div>
                  <div className="text-sm text-gray-500">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{offlineStats.failed}</div>
                  <div className="text-sm text-gray-500">Failed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600">{offlineStats.total}</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleSync}
                disabled={!isOnline || syncStatus === 'syncing'}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  !isOnline || syncStatus === 'syncing'
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : syncStatus === 'success'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : syncStatus === 'error'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {getSyncButtonText()}
              </button>
              
              <button
                onClick={loadStats}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                🔄 Refresh
              </button>
            </div>
          </div>
          
          {lastSyncTime && (
            <div className="mt-4 text-sm text-gray-500 text-center">
              Last sync: {lastSyncTime.toLocaleString()}
            </div>
          )}
        </div>

        {/* Cache Information */}
        <div className={`rounded-lg p-6 transition-colors duration-300 ${
          theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Cached Data</h3>
            <button
              onClick={loadCacheInfo}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Refresh
            </button>
          </div>
          
          {cacheInfo.length > 0 ? (
            <div className="space-y-2">
              {cacheInfo.map((item, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center p-3 rounded transition-colors ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}
                >
                  <div>
                    <div className="font-medium">{item.key}</div>
                    <div className="text-sm text-gray-500">
                      {formatTimestamp(item.timestamp)}
                    </div>
                  </div>
                  <div className="text-sm">
                    {formatBytes(item.size)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-8 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No cached data found
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className={`rounded-lg p-6 border-2 border-red-300 transition-colors duration-300 ${
          theme === 'dark' ? 'bg-red-900/10' : 'bg-red-50'
        }`}>
          <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
          <p className={`text-sm mb-4 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Clear all offline data including cached content and pending actions. This action cannot be undone.
          </p>
          <button
            onClick={clearAllData}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            🗑️ Clear All Offline Data
          </button>
        </div>

        {/* Help Section */}
        <div className={`rounded-lg p-6 transition-colors duration-300 ${
          theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold mb-4">How Offline Mode Works</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3">
              <span className="text-blue-500">📱</span>
              <div>
                <strong>Automatic Caching:</strong> When you're online, Teachers Connect automatically caches your data so you can access it offline.
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-green-500">⚡</span>
              <div>
                <strong>Offline Actions:</strong> When offline, your actions (create, update, delete) are queued and will sync automatically when you're back online.
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-purple-500">🔄</span>
              <div>
                <strong>Auto-Sync:</strong> As soon as your connection is restored, pending actions will automatically sync in the background.
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-orange-500">🔒</span>
              <div>
                <strong>Secure Storage:</strong> All offline data is stored securely in your browser using IndexedDB and is only accessible to you.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}