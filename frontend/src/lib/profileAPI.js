const API_BASE_URL = 'https://shxz7-backend.hf.space/api';

// Local storage keys for fallback
const PROFILE_STORAGE_KEY = 'user_profile';

export const profileAPI = {
  // Get user profile from backend or localStorage fallback
  async getProfile() {
    try {
      const token = localStorage.getItem('auth_token');
      
      // If no token, use demo mode
      if (!token) {
        return this.getDemoProfile();
      }

      // Try to fetch from backend first
      try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const profileData = await response.json();
          // Cache in localStorage for offline use
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
          return profileData;
        }
      } catch (backendError) {
        console.warn('Backend not available, using fallback:', backendError.message);
      }

      // Fallback to localStorage or demo data
      const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (storedProfile) {
        return JSON.parse(storedProfile);
      }

      return this.getDemoProfile();
    } catch (error) {
      console.error('Error fetching profile:', error);
      return this.getDemoProfile();
    }
  },

  // Get demo profile data
  getDemoProfile() {
    const defaultProfile = {
      name: 'Demo User',
      email: 'demo@teachersconnect.com',
      bio: 'Welcome to Teachers Connect! Please update your profile.',
      school: '',
      subject: '',
      experience: '',
      location: '',
      phone: ''
    };
    
    // Save default to localStorage for consistency
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(defaultProfile));
    return defaultProfile;
  },

  // Update user profile - try backend first, fallback to localStorage
  async updateProfile(profileData) {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Try backend update if authenticated
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData),
          });

          if (response.ok) {
            const result = await response.json();
            // Cache updated profile
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(result.profile));
            return result;
          }
        } catch (backendError) {
          console.warn('Backend update failed, using localStorage:', backendError.message);
        }
      }

      // Fallback to localStorage update
      const currentProfile = await this.getProfile();
      const updatedProfile = {
        ...currentProfile,
        ...profileData
      };

      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
      return {
        message: "Profile updated successfully (local storage)",
        profile: updatedProfile
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Clear user profile - try backend first, fallback to localStorage
  async clearProfile() {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Try backend clear if authenticated
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const result = await response.json();
            // Update localStorage to reflect cleared profile
            const clearedProfile = await this.getProfile();
            return result;
          }
        } catch (backendError) {
          console.warn('Backend clear failed, using localStorage:', backendError.message);
        }
      }

      // Fallback to localStorage clear
      const defaultProfile = this.getDemoProfile();
      return { message: "Profile cleared successfully (local storage)" };
    } catch (error) {
      console.error('Error clearing profile:', error);
      throw error;
    }
  }
};