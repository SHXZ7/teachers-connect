/**
 * Offline Mode Utilities for Teachers Connect
 * Handles data caching and offline action queuing using localforage
 */

import localforage from 'localforage';

// Configure localforage stores
const cacheStore = localforage.createInstance({
  name: 'teachers-connect-cache',
  storeName: 'data_cache',
  description: 'Cached data for offline access'
});

const actionsStore = localforage.createInstance({
  name: 'teachers-connect-actions',
  storeName: 'offline_actions',
  description: 'Queued actions for sync when online'
});

// Connection status management
export const connectionStatus = {
  isOnline: () => navigator.onLine,
  
  addListener: (callback) => {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  },
  
  removeListener: (callback) => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  }
};

// Data caching functions
export const cacheData = async (key, data) => {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      version: '1.0'
    };
    await cacheStore.setItem(key, cacheEntry);
    console.log(`✅ Cached data for key: ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to cache data for key: ${key}`, error);
    return false;
  }
};

export const getCachedData = async (key, maxAge = 24 * 60 * 60 * 1000) => { // 24 hours default
  try {
    const cacheEntry = await cacheStore.getItem(key);
    if (!cacheEntry) {
      console.log(`📭 No cached data found for key: ${key}`);
      return null;
    }
    
    const age = Date.now() - cacheEntry.timestamp;
    if (age > maxAge) {
      console.log(`⏰ Cached data expired for key: ${key}`);
      await cacheStore.removeItem(key);
      return null;
    }
    
    console.log(`✅ Retrieved cached data for key: ${key}`);
    return cacheEntry.data;
  } catch (error) {
    console.error(`❌ Failed to get cached data for key: ${key}`, error);
    return null;
  }
};

export const clearCache = async () => {
  try {
    await cacheStore.clear();
    console.log('✅ Cache cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear cache', error);
    return false;
  }
};

export const getCacheInfo = async () => {
  try {
    const keys = await cacheStore.keys();
    const info = [];
    
    for (const key of keys) {
      const entry = await cacheStore.getItem(key);
      info.push({
        key,
        timestamp: entry?.timestamp,
        size: JSON.stringify(entry?.data || {}).length
      });
    }
    
    return info;
  } catch (error) {
    console.error('❌ Failed to get cache info', error);
    return [];
  }
};

// Get all cached files for offline access
export const getCachedFiles = async () => {
  try {
    const keys = await cacheStore.keys();
    const cachedFiles = [];
    
    for (const key of keys) {
      if (key.startsWith('uploaded-file-')) {
        const cacheEntry = await cacheStore.getItem(key);
        
        if (cacheEntry && cacheEntry.data) {
          // cacheEntry.data contains our file data
          const fileData = cacheEntry.data;
          if (fileData.name) {
            cachedFiles.push({
              key,
              name: fileData.name,
              type: fileData.type,
              size: fileData.size,
              metadata: fileData.metadata,
              uploadedAt: fileData.uploadedAt,
              cachedAt: cacheEntry.timestamp
            });
          }
        }
      }
    }
    
    return cachedFiles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  } catch (error) {
    console.error('❌ Failed to get cached files', error);
    return [];
  }
};

// Get a specific cached file by key
export const getCachedFile = async (key) => {
  try {
    const fileData = await cacheStore.getItem(key);
    if (fileData && fileData.data) {
      return fileData.data;
    }
    return null;
  } catch (error) {
    console.error(`❌ Failed to get cached file: ${key}`, error);
    return null;
  }
};

// Offline actions management
export const saveOfflineAction = async (action) => {
  try {
    const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const actionEntry = {
      id: actionId,
      type: action.type,
      data: action.data,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    };
    
    await actionsStore.setItem(actionId, actionEntry);
    console.log(`✅ Saved offline action: ${action.type}`, actionEntry);
    return actionId;
  } catch (error) {
    console.error('❌ Failed to save offline action', error);
    return null;
  }
};

export const getOfflineActions = async () => {
  try {
    const keys = await actionsStore.keys();
    const actions = [];
    
    for (const key of keys) {
      const action = await actionsStore.getItem(key);
      if (action && action.status === 'pending') {
        actions.push(action);
      }
    }
    
    // Sort by timestamp (oldest first)
    actions.sort((a, b) => a.timestamp - b.timestamp);
    console.log(`✅ Retrieved ${actions.length} pending offline actions`);
    return actions;
  } catch (error) {
    console.error('❌ Failed to get offline actions', error);
    return [];
  }
};

export const markActionCompleted = async (actionId) => {
  try {
    const action = await actionsStore.getItem(actionId);
    if (action) {
      action.status = 'completed';
      action.completedAt = Date.now();
      await actionsStore.setItem(actionId, action);
    }
    console.log(`✅ Marked action as completed: ${actionId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to mark action as completed: ${actionId}`, error);
    return false;
  }
};

export const markActionFailed = async (actionId, error) => {
  try {
    const action = await actionsStore.getItem(actionId);
    if (action) {
      action.retryCount = (action.retryCount || 0) + 1;
      action.lastError = error;
      action.lastAttempt = Date.now();
      
      // Mark as failed if too many retries
      if (action.retryCount >= 3) {
        action.status = 'failed';
      }
      
      await actionsStore.setItem(actionId, action);
    }
    console.log(`❌ Marked action as failed: ${actionId}`, error);
    return true;
  } catch (storeError) {
    console.error(`❌ Failed to mark action as failed: ${actionId}`, storeError);
    return false;
  }
};

export const clearOfflineActions = async () => {
  try {
    await actionsStore.clear();
    console.log('✅ Offline actions cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear offline actions', error);
    return false;
  }
};

export const getActionsStats = async () => {
  try {
    const keys = await actionsStore.keys();
    const stats = {
      total: 0,
      pending: 0,
      completed: 0,
      failed: 0
    };
    
    for (const key of keys) {
      const action = await actionsStore.getItem(key);
      if (action) {
        stats.total++;
        stats[action.status] = (stats[action.status] || 0) + 1;
      }
    }
    
    return stats;
  } catch (error) {
    console.error('❌ Failed to get actions stats', error);
    return { total: 0, pending: 0, completed: 0, failed: 0 };
  }
};

// Sync functionality
export const syncOfflineActions = async () => {
  if (!connectionStatus.isOnline()) {
    console.log('📡 Cannot sync - currently offline');
    return { success: false, reason: 'offline' };
  }
  
  try {
    const actions = await getOfflineActions();
    if (actions.length === 0) {
      console.log('✅ No actions to sync');
      return { success: true, synced: 0 };
    }
    
    console.log(`🔄 Starting sync of ${actions.length} actions...`);
    
    let syncedCount = 0;
    let failedCount = 0;
    
    for (const action of actions) {
      try {
        if (action.type === 'UPLOAD_RESOURCE') {
          // Handle file upload separately
          const uploadResult = await syncFileUpload(action);
          if (uploadResult.success) {
            await markActionCompleted(action.id);
            syncedCount++;
          } else {
            await markActionFailed(action.id, uploadResult.error);
            failedCount++;
          }
        } else {
          // Handle other actions with generic sync
          const syncResult = await syncGenericAction(action);
          if (syncResult.success) {
            await markActionCompleted(action.id);
            syncedCount++;
          } else {
            await markActionFailed(action.id, syncResult.error);
            failedCount++;
          }
        }
      } catch (error) {
        console.error(`❌ Failed to sync action ${action.id}:`, error);
        await markActionFailed(action.id, error.message);
        failedCount++;
      }
    }
    
    console.log(`✅ Sync completed: ${syncedCount} successful, ${failedCount} failed`);
    return {
      success: true,
      synced: syncedCount,
      failed: failedCount
    };
    
  } catch (error) {
    console.error('❌ Sync failed', error);
    return { success: false, error: error.message };
  }
};

// Sync file upload action
const syncFileUpload = async (action) => {
  try {
    console.log('📁 Syncing file upload:', action.data);
    
    // Find the cached file for this upload
    const fileName = action.data.fileName;
    const cachedFiles = await getCachedFiles();
    const cachedFile = cachedFiles.find(file => file.name === fileName);
    
    if (!cachedFile) {
      throw new Error(`Cached file not found: ${fileName}`);
    }
    
    // Get the actual file data
    const fileData = await getCachedFile(cachedFile.key);
    if (!fileData) {
      throw new Error(`File data not found: ${fileName}`);
    }
    
    // Reconstruct the file
    const blob = new Blob([fileData.data], { type: fileData.type });
    const file = new File([blob], fileData.name, { type: fileData.type });
    
    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', fileData.metadata.title);
    formData.append('description', fileData.metadata.description || '');
    formData.append('subject_area', fileData.metadata.subject_area);
    formData.append('grade_level', fileData.metadata.grade_level);
    formData.append('resource_type', fileData.metadata.resource_type);
    formData.append('tags', JSON.stringify(fileData.metadata.tags || []));
    formData.append('is_public', fileData.metadata.is_public || true);
    formData.append('language', fileData.metadata.language || 'en');
    
    // Upload to backend
    const API_BASE_URL = 'https://shxz7-backend.hf.space/api';
    const response = await fetch(`${API_BASE_URL}/resources/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload response error:', response.status, errorText);
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ File upload synced successfully:', result);
    
    // Remove the cached file after successful sync (optional)
    // await cacheStore.removeItem(cachedFile.key);
    
    return { success: true, result };
    
  } catch (error) {
    console.error('❌ File upload sync failed:', error);
    return { success: false, error: error.message };
  }
};

// Sync generic action (non-file uploads)
const syncGenericAction = async (action) => {
  try {
    console.log('🔄 Syncing generic action:', action.type);
    
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ actions: [action] })
    });
    
    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return { success: true, result };
    
  } catch (error) {
    console.error('❌ Generic action sync failed:', error);
    return { success: false, error: error.message };
  }
};

// Auto-sync when coming online
let autoSyncEnabled = false;

export const enableAutoSync = () => {
  if (autoSyncEnabled) return;
  
  const handleOnline = async () => {
    console.log('📡 Connection restored - checking for pending actions...');
    const stats = await getActionsStats();
    
    if (stats.pending > 0) {
      console.log(`🔄 Auto-syncing ${stats.pending} pending actions...`);
      const result = await syncOfflineActions();
      
      if (result.success && result.synced > 0) {
        // Trigger a custom event for UI notifications
        window.dispatchEvent(new CustomEvent('offline-sync-completed', {
          detail: { synced: result.synced, failed: result.failed }
        }));
      }
    }
  };
  
  window.addEventListener('online', handleOnline);
  autoSyncEnabled = true;
  
  console.log('✅ Auto-sync enabled');
};

export const disableAutoSync = () => {
  window.removeEventListener('online', syncOfflineActions);
  autoSyncEnabled = false;
  console.log('✅ Auto-sync disabled');
};

// Individual API request wrapper with offline support
export const offlineCapableRequest = async (config) => {
  const { url, method = 'GET', headers = {}, data, cacheKey, fallbackData, actionType, actionData, isFormData = false } = config;
  
  if (method.toUpperCase() === 'GET') {
    // GET requests with caching
    const cacheKeyToUse = cacheKey || `api_${url.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    if (connectionStatus.isOnline()) {
      try {
        const response = await fetch(url, {
          method,
          headers,
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const responseData = await response.json();
        // Cache successful responses
        await cacheData(cacheKeyToUse, responseData);
        return responseData;
      } catch (error) {
        // If online request fails, try to return cached data
        console.log('🔄 Online request failed, trying cache...');
        const cachedData = await getCachedData(cacheKeyToUse);
        if (cachedData) {
          console.log('✅ Returning cached data due to request failure');
          return cachedData;
        }
        // If no cached data and we have fallback data, return that
        if (fallbackData !== undefined) {
          console.log('📱 Using fallback data');
          return fallbackData;
        }
        throw error;
      }
    } else {
      // Offline - return cached data or fallback
      const cachedData = await getCachedData(cacheKeyToUse);
      if (cachedData) {
        console.log('📱 Offline mode - returning cached data');
        return cachedData;
      }
      if (fallbackData !== undefined) {
        console.log('📱 Offline mode - using fallback data');
        return fallbackData;
      }
      throw new Error('No cached data available for offline use');
    }
  } else {
    // POST/PUT/DELETE requests with offline queuing
    if (connectionStatus.isOnline()) {
      try {
        const requestOptions = {
          method,
          headers,
        };
        
        // Handle different data types
        if (data) {
          if (isFormData) {
            // For FormData, don't set Content-Type (let browser set it)
            requestOptions.body = data;
          } else {
            // For JSON data
            requestOptions.body = JSON.stringify(data);
            if (!headers['Content-Type']) {
              requestOptions.headers = { ...headers, 'Content-Type': 'application/json' };
            }
          }
        }
        
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        // If we have action data, save it for later sync
        if (actionType && actionData) {
          const actionId = await saveOfflineAction({
            type: actionType,
            data: actionData
          });
          console.log(`💾 Saved action for later sync: ${actionType}`);
        }
        throw error;
      }
    } else {
      // Offline - queue the action
      if (actionType && actionData) {
        const actionId = await saveOfflineAction({
          type: actionType,
          data: actionData
        });
        
        return {
          success: true,
          offline: true,
          actionId,
          message: 'Action queued for sync when online',
          ...(fallbackData || {})
        };
      } else {
        if (fallbackData !== undefined) {
          return fallbackData;
        }
        throw new Error('Cannot perform this action while offline');
      }
    }
  }
};

// Enhanced API wrapper with offline support
export const offlineCapableAPI = (originalAPI) => {
  return {
    // GET requests with caching
    get: async (url, options = {}) => {
      const cacheKey = `api_${url.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      if (connectionStatus.isOnline()) {
        try {
          const response = await originalAPI.get(url, options);
          // Cache successful responses
          await cacheData(cacheKey, response);
          return response;
        } catch (error) {
          // If online request fails, try to return cached data
          console.log('🔄 Online request failed, trying cache...');
          const cachedData = await getCachedData(cacheKey);
          if (cachedData) {
            console.log('✅ Returning cached data due to request failure');
            return cachedData;
          }
          throw error;
        }
      } else {
        // Offline - return cached data
        const cachedData = await getCachedData(cacheKey);
        if (cachedData) {
          console.log('📱 Offline mode - returning cached data');
          return cachedData;
        }
        throw new Error('No cached data available for offline use');
      }
    },
    
    // POST/PUT/DELETE requests with offline queuing
    post: async (url, data, options = {}) => {
      if (connectionStatus.isOnline()) {
        try {
          return await originalAPI.post(url, data, options);
        } catch (error) {
          // Queue for offline sync if request fails
          await saveOfflineAction({
            type: 'POST',
            data: { url, data, options }
          });
          throw error;
        }
      } else {
        // Offline - queue the action
        const actionId = await saveOfflineAction({
          type: 'POST',
          data: { url, data, options }
        });
        
        // Return a mock response for offline mode
        return {
          success: true,
          offline: true,
          actionId,
          message: 'Action queued for sync when online'
        };
      }
    },
    
    put: async (url, data, options = {}) => {
      if (connectionStatus.isOnline()) {
        try {
          return await originalAPI.put(url, data, options);
        } catch (error) {
          await saveOfflineAction({
            type: 'PUT',
            data: { url, data, options }
          });
          throw error;
        }
      } else {
        const actionId = await saveOfflineAction({
          type: 'PUT',
          data: { url, data, options }
        });
        
        return {
          success: true,
          offline: true,
          actionId,
          message: 'Action queued for sync when online'
        };
      }
    },
    
    delete: async (url, options = {}) => {
      if (connectionStatus.isOnline()) {
        try {
          return await originalAPI.delete(url, options);
        } catch (error) {
          await saveOfflineAction({
            type: 'DELETE',
            data: { url, options }
          });
          throw error;
        }
      } else {
        const actionId = await saveOfflineAction({
          type: 'DELETE',
          data: { url, options }
        });
        
        return {
          success: true,
          offline: true,
          actionId,
          message: 'Action queued for sync when online'
        };
      }
    }
  };
};

const offlineUtils = {
  connectionStatus,
  cacheData,
  getCachedData,
  clearCache,
  getCacheInfo,
  getCachedFiles,
  getCachedFile,
  saveOfflineAction,
  getOfflineActions,
  markActionCompleted,
  markActionFailed,
  clearOfflineActions,
  getActionsStats,
  syncOfflineActions,
  enableAutoSync,
  disableAutoSync,
  offlineCapableAPI,
  offlineCapableRequest
};

export default offlineUtils;