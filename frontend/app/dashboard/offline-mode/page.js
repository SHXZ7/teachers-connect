'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import offlineUtils from '@/utils/offline';

export default function OfflinePage() {
  const { theme } = useTheme();
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [offlineStats, setOfflineStats] = useState({ total: 0, pending: 0, completed: 0, failed: 0 });
  const [cacheInfo, setCacheInfo] = useState([]);
  const [cachedFiles, setCachedFiles] = useState([]);
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
      loadAllData();
    };
    
    window.addEventListener('offline-sync-completed', handleAutoSyncCompleted);
    
    // Load initial data
    loadAllData();
    
    return () => {
      offlineUtils.connectionStatus.removeListener(handleConnectionChange);
      window.removeEventListener('offline-sync-completed', handleAutoSyncCompleted);
    };
  }, [handleSync, loadAllData]);

  const loadStats = async () => {
    const stats = await offlineUtils.getActionsStats();
    setOfflineStats(stats);
  };

  const loadCacheInfo = async () => {
    const info = await offlineUtils.getCacheInfo();
    setCacheInfo(info);
  };

  const loadCachedFiles = async () => {
    try {
      const files = await offlineUtils.getCachedFiles();
      setCachedFiles(files);
    } catch (error) {
      console.error('❌ Error loading cached files:', error);
      setCachedFiles([]);
    }
  };

  const loadAllData = useCallback(async () => {
    await loadStats();
    await loadCacheInfo();
    await loadCachedFiles();
  }, []);

  const handleSync = useCallback(async () => {
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
        await loadAllData();
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
  }, [isOnline, loadAllData]);

  const clearAllData = async () => {
    if (confirm('Are you sure you want to clear all offline data? This cannot be undone.')) {
      await offlineUtils.clearCache();
      await offlineUtils.clearOfflineActions();
      setSyncMessage('All offline data cleared');
      await loadAllData();
    }
  };

  const testFileUpload = async () => {
    try {
      console.log('🧪 Testing file upload and caching...');
      
      // Create a test file
      const testContent = 'This is a test file for offline caching';
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test-file.txt', { type: 'text/plain' });
      
      const metadata = {
        title: 'Test File',
        description: 'Test file for offline caching',
        subject_area: 'technology',
        grade_level: 'grade_1',
        resource_type: 'document',
        tags: ['test'],
        is_public: true,
        language: 'en'
      };
      
      // Cache the file using the same logic as the upload function
      const fileBlob = await testFile.arrayBuffer();
      const fileData = {
        name: testFile.name,
        type: testFile.type,
        size: testFile.size,
        data: fileBlob,
        metadata: metadata,
        uploadedAt: new Date().toISOString()
      };
      
      const cacheKey = `uploaded-file-${testFile.name}-${Date.now()}`;
      await offlineUtils.cacheData(cacheKey, fileData);
      
      console.log('✅ Test file cached successfully');
      setSyncMessage('Test file cached successfully!');
      
      // Reload cached files
      await loadCachedFiles();
      
    } catch (error) {
      console.error('❌ Test file upload failed:', error);
      setSyncMessage(`Test failed: ${error.message}`);
    }
  };

  const testRealUpload = async () => {
    try {
      // Create a file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '*/*';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        console.log('🚀 Testing real upload with file:', file.name);
        setSyncMessage('Testing real upload...');
        
        const metadata = {
          title: `Real Upload Test - ${file.name}`,
          description: 'Testing real file upload with caching',
          subject_area: 'technology',
          grade_level: 'grade_1',
          resource_type: 'document',
          tags: ['test', 'real-upload'],
          is_public: true,
          language: 'en'
        };
        
        try {
          const result = await resourceAPI.uploadResource(file, metadata);
          console.log('✅ Real upload completed:', result);
          setSyncMessage(`Real upload successful: ${file.name}`);
          await loadCachedFiles();
        } catch (error) {
          console.error('❌ Real upload failed:', error);
          setSyncMessage(`Real upload failed: ${error.message}`);
        }
      };
      
      input.click();
      
    } catch (error) {
      console.error('❌ Test real upload failed:', error);
      setSyncMessage(`Test failed: ${error.message}`);
    }
  };

  const downloadCachedFile = async (fileKey, fileName) => {
    try {
      console.log('📥 Downloading cached file:', fileKey);
      const fileData = await offlineUtils.getCachedFile(fileKey);
      
      if (!fileData || !fileData.data) {
        console.error('❌ File data not found');
        setSyncMessage('File data not found');
        return;
      }
      
      // Create a blob from the cached data
      const blob = new Blob([fileData.data], { type: fileData.type });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('✅ File downloaded successfully');
      setSyncMessage(`Downloaded: ${fileName}`);
      
    } catch (error) {
      console.error('❌ Download failed:', error);
      setSyncMessage(`Download failed: ${error.message}`);
    }
  };

  const createTestUploadAction = async () => {
    try {
      console.log('🔧 Creating test upload action...');
      setSyncMessage('Creating test upload action...');
      
      // First create a test file in cache
      const testContent = 'This is a test file for sync testing';
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      const testFile = new File([testBlob], 'sync-test.txt', { type: 'text/plain' });
      
      const metadata = {
        title: 'Sync Test File',
        description: 'Test file for sync functionality',
        subject_area: 'technology',
        grade_level: 'grade_1',
        resource_type: 'document',
        tags: ['sync', 'test'],
        is_public: true,
        language: 'en'
      };
      
      // Cache the file
      const fileBlob = await testFile.arrayBuffer();
      const fileData = {
        name: testFile.name,
        type: testFile.type,
        size: testFile.size,
        data: fileBlob,
        metadata: metadata,
        uploadedAt: new Date().toISOString()
      };
      
      const cacheKey = `uploaded-file-${testFile.name}-${Date.now()}`;
      await offlineUtils.cacheData(cacheKey, fileData);
      
      // Create an upload action
      const actionId = await offlineUtils.saveOfflineAction({
        type: 'UPLOAD_RESOURCE',
        data: { 
          fileName: testFile.name,
          fileType: testFile.type,
          fileSize: testFile.size,
          metadata: metadata
        }
      });
      
      console.log('✅ Test upload action created:', actionId);
      setSyncMessage('Test upload action created! Now click Sync Now to upload to backend.');
      
      await loadAllData();
      
    } catch (error) {
      console.error('❌ Failed to create test upload action:', error);
      setSyncMessage(`Failed to create test action: ${error.message}`);
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
                onClick={loadAllData}
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

        {/* Cached Files */}
        <div className={`rounded-lg p-6 transition-colors duration-300 ${
          theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">📁 Cached Files (Available Offline)</h3>
            <button
              onClick={loadCachedFiles}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Refresh
            </button>
          </div>
          
          {cachedFiles.length > 0 ? (
            <div className="space-y-3">
              {cachedFiles.map((file, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center p-4 rounded-lg border transition-colors hover:shadow-lg cursor-pointer ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                      : 'bg-gray-50 border-gray-200 hover:bg-white hover:border-blue-300'
                  }`}
                  onClick={() => downloadCachedFile(file.key, file.name)}
                  title={`Click to download ${file.name}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {file.type.includes('pdf') ? '📄' : 
                         file.type.includes('image') ? '🖼️' :
                         file.type.includes('video') ? '🎥' :
                         file.type.includes('audio') ? '🎵' : '📎'}
                      </span>
                      <div>
                        <div className="font-medium flex items-center">
                          {file.name}
                          <span className="ml-2 text-xs text-blue-500">📥 Click to download</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {file.metadata?.title && (
                            <span className="mr-3">📝 {file.metadata.title}</span>
                          )}
                          {file.metadata?.subject_area && (
                            <span className="mr-3">📚 {file.metadata.subject_area}</span>
                          )}
                          {file.metadata?.grade_level && (
                            <span>🎓 {file.metadata.grade_level}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadCachedFile(file.key, file.name);
                      }}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors mb-2 ${
                        theme === 'dark'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      📥 Download
                    </button>
                    <div className="font-medium">{formatBytes(file.size)}</div>
                    <div className="text-gray-500">
                      Uploaded: {formatTimestamp(file.uploadedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-8 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <div className="text-4xl mb-2">📁</div>
              <div>No files cached for offline access</div>
              <div className="text-sm mt-1">Upload files to make them available offline</div>
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
                <strong>Automatic Caching:</strong> When you&apos;re online, Teachers Connect automatically caches your data so you can access it offline.
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-green-500">⚡</span>
              <div>
                <strong>Offline Actions:</strong> When offline, your actions (create, update, delete) are queued and will sync automatically when you&apos;re back online.
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