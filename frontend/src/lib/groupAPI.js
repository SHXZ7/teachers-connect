// Groups API functions for Teachers Connect
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://shxz7-backend.hf.space';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const groupAPI = {
  // ============= GROUP MANAGEMENT =============
  
  async getUserGroups() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/groups/groups`,
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
      console.error('Error fetching user groups:', error);
      throw error;
    }
  },

  async createGroup(groupData) {
    try {
      console.log('Creating group with data:', groupData);
      const response = await fetch(
        `${API_BASE_URL}/api/groups/groups`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(groupData)
        }
      );
      
      console.log('Create group response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Create group error response:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  },

  async getGroup(groupId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/groups/groups/${groupId}`,
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
      console.error('Error fetching group:', error);
      throw error;
    }
  },

  async addGroupMember(groupId, userEmail, role = 'member') {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/groups/groups/${groupId}/members?user_email=${userEmail}&role=${role}`,
        {
          method: 'POST',
          headers: getAuthHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding group member:', error);
      throw error;
    }
  },

  // ============= GROUP MESSAGES =============
  
  async getGroupMessages(groupId, skip = 0, limit = 50) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/groups/groups/${groupId}/messages?skip=${skip}&limit=${limit}`,
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
      console.error('Error fetching group messages:', error);
      throw error;
    }
  },

  async sendGroupMessage(groupId, messageData) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/groups/groups/${groupId}/messages`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(messageData)
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending group message:', error);
      throw error;
    }
  },

  // ============= ASSIGNMENTS =============
  
  async createAssignment(groupId, assignmentData) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/groups/groups/${groupId}/assignments`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ...assignmentData,
            group_id: groupId
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  },

  async getGroupAssignments(groupId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/groups/groups/${groupId}/assignments`,
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
      console.error('Error fetching group assignments:', error);
      throw error;
    }
  },

  async getGroupStats() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/groups/stats`,
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
      console.error('Error fetching group stats:', error);
      throw error;
    }
  },

  // ============= UTILITY FUNCTIONS =============
  
  getGroupTypeIcon(groupType) {
    const icons = {
      subject: '📚',
      grade: '🎓',
      school: '🏫',
      project: '📋',
      general: '💬'
    };
    return icons[groupType] || '💬';
  },

  getAssignmentTypeIcon(assignmentType) {
    const icons = {
      homework: '📝',
      project: '📊',
      quiz: '❓',
      reading: '📖',
      practice: '✏️'
    };
    return icons[assignmentType] || '📝';
  },

  getMemberRoleColor(role) {
    const colors = {
      admin: 'bg-red-100 text-red-700 border-red-200',
      moderator: 'bg-blue-100 text-blue-700 border-blue-200',
      member: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200';
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
  },

  formatDueDate(dueDate) {
    if (!dueDate) return null;
    
    const due = new Date(dueDate);
    const now = new Date();
    const diffInHours = Math.floor((due - now) / (1000 * 60 * 60));
    
    if (diffInHours < 0) return { text: 'Overdue', color: 'text-red-600' };
    if (diffInHours < 24) return { text: `Due in ${diffInHours}h`, color: 'text-orange-600' };
    if (diffInHours < 48) return { text: 'Due tomorrow', color: 'text-yellow-600' };
    
    return { text: `Due ${due.toLocaleDateString()}`, color: 'text-gray-600' };
  }
};