// Community API functions for Teachers Connect
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://shxz7-backend.hf.space';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function to get auth headers for file uploads
const getAuthHeadersForUpload = () => {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  return {
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const communityAPI = {
  // ============= POSTS API =============
  
  async getPosts(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.skip) queryParams.append('skip', params.skip);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.post_type) queryParams.append('post_type', params.post_type);
      if (params.subject_area) queryParams.append('subject_area', params.subject_area);
      if (params.search) queryParams.append('search', params.search);
      
      const response = await fetch(
        `${API_BASE_URL}/api/community/posts?${queryParams}`,
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  },

  async getPost(postId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/community/posts/${postId}`,
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  },

  async createPost(postData) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/community/posts`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(postData)
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  async updatePost(postId, updateData) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/community/posts/${postId}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(updateData)
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  async deletePost(postId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/community/posts/${postId}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  // ============= REACTIONS API =============
  
  async toggleReaction(postId, reactionType) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/community/posts/${postId}/reactions`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ reaction_type: reactionType })
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error toggling reaction:', error);
      throw error;
    }
  },

  // ============= COMMENTS API =============
  
  async addComment(postId, commentData) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/community/posts/${postId}/comments`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(commentData)
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // ============= STATS API =============
  
  async getCommunityStats() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/community/stats`,
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching community stats:', error);
      throw error;
    }
  },

  // ============= FILE UPLOAD API =============
  
  async uploadFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(
        `${API_BASE_URL}/api/community/upload`,
        {
          method: 'POST',
          headers: getAuthHeadersForUpload(),
          body: formData
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // ============= UTILITY FUNCTIONS =============
  
  getReactionEmoji(reactionType) {
    const reactions = {
      like: '👍',
      love: '❤️',
      helpful: '💡',
      thinking: '🤔',
      celebrate: '🎉'
    };
    return reactions[reactionType] || '👍';
  },

  getPostTypeIcon(postType) {
    const icons = {
      text: '📝',
      question: '❓',
      resource_share: '📚',
      announcement: '📢'
    };
    return icons[postType] || '📝';
  },

  getPostTypeColor(postType) {
    const colors = {
      text: 'bg-blue-50 text-blue-700 border-blue-200',
      question: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      resource_share: 'bg-green-50 text-green-700 border-green-200',
      announcement: 'bg-purple-50 text-purple-700 border-purple-200'
    };
    return colors[postType] || 'bg-gray-50 text-gray-700 border-gray-200';
  },

  formatTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return past.toLocaleDateString();
  }
};