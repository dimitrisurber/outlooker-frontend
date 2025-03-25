import axios from 'axios';


const API_URL = process.env.VUE_APP_API_URL;

// Create axios instances with base URL
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if it exists
api.interceptors.request.use(
  config => {
    // Look for token with both possible key names
    let token = localStorage.getItem('token');
    
    if (!token) {
      // Try alternate token key as fallback
      token = localStorage.getItem('auth_token');
      // If found with alternate key, migrate it
      if (token) {
        console.log('Found token with alternate key, migrating to standard key');
        localStorage.setItem('token', token);
      }
    }
    
    if (token) {
      console.log(`Adding token to request: ${config.url}`);
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.log(`No token available for request: ${config.url}`);
    }
    return config;
  },
  error => Promise.reject(error)
);

// Handle token expiration
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message
    });

    if (error.response?.status === 401) {
      // Don't clear auth state for calendar endpoints
      if (!error.config.url.includes('/calendar/')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    if (error.response?.status === 403) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (credentials) => {
    try {
      console.log('Sending login request');
      const response = await api.post('/auth/login', credentials);
      console.log('Login response received:', response.data);
      
      // Check if we have a successful response with token
      if (!response.data.success) {
        throw new Error('Login failed: ' + (response.data.error || 'Unknown error'));
      }
      
      // Extract token and user from response
      const { token, user } = response.data;
      
      // Check if token exists
      if (!token) {
        console.error('Login response missing token!', response.data);
        throw new Error('No token received in login response');
      }
      
      console.log('Token received successfully, storing in localStorage');
      console.log('User data:', user);
      
      // Store auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set auth header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
    }
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found in localStorage');
        return false;
      }

      console.log('Checking auth with token');
      
      // Set token in header before verification
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await api.get('/auth/verify');
      console.log('Auth check response:', response.data);
      
      // Handle different response formats
      let isAuthenticated = false;
      
      if (response.data.success) {
        isAuthenticated = true;
        
        // Extract user from response
        const responseUser = response.data.user;
        
        if (responseUser) {
          const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
          // Update with fresh data from server
          localStorage.setItem('user', JSON.stringify({
            ...existingUser,
            ...responseUser
          }));
        }
      } else if (response.data.valid) {
        isAuthenticated = true;
        
        // Handle older API format
        if (response.data.user) {
          const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({
            ...existingUser,
            ...response.data.user
          }));
        }
      }
      
      if (!isAuthenticated) {
        console.log('Auth check failed despite 200 response');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
      }
      
      return isAuthenticated;
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      return false;
    }
  },

  // User management endpoints
  registerUser: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('User registration error:', error);
      throw error;
    }
  },

  getUsers: async () => {
    try {
      const response = await api.get('/auth/users');
      return response.data;
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/auth/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/auth/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }
};

export const calendarAPI = {
  // Check if Google Calendar API is available
  checkGoogleCalendarAvailability: async () => {
    try {
      const response = await api.get('/calendar/api-status');
      return response.data;
    } catch (error) {
      console.error('Failed to check Google Calendar API availability:', error);
      // If the endpoint is not found (404), the server might not have the new endpoint
      // just assume the API is available but being checked through older methods
      if (error.response && error.response.status === 404) {
        console.log('API status endpoint not found, assuming Google Calendar is available');
        return {
          success: true,
          available: true,
          credentials: true,
          message: 'API status check not implemented on server, assuming Google Calendar is available'
        };
      }
      return {
        success: false,
        available: false,
        error: error.message || 'Network error'
      };
    }
  },
  
  // Get available slots for the next two weeks at once
  getNextTwoWeeksAvailability: async (userId) => {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }
      
      console.log('Getting next two weeks availability for user:', userId);
      
      const response = await api.get('/calendar/availability/next-two-weeks', {
        params: { userId }
      });
      
      console.log('Next two weeks availability response:', response.data);
      return response.data;
    } catch (error) {
      console.error('getNextTwoWeeksAvailability error:', error);
      // Rethrow error to be handled by the component
      throw error;
    }
  },
  
  // Debug method to check schedules directly
  debugSchedules: async (userId) => {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }
      
      console.log('Debugging schedules for user:', userId);
      
      const response = await api.get('/calendar/debug-schedules', {
        params: { userId }
      });
      
      console.log('Debug schedules response:', response.data);
      return response.data;
    } catch (error) {
      console.error('debugSchedules error:', error);
      throw error;
    }
  },
  
  // Create a test schedule for all days of the week
  createTestSchedule: async (userId) => {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }
      
      console.log('Creating test schedule for user:', userId);
      
      const response = await api.post('/calendar/create-test-schedule', { userId });
      console.log('Test schedule created:', response.data);
      return response.data;
    } catch (error) {
      console.error('createTestSchedule error:', error);
      throw error;
    }
  },
  
  // Reset all schedules and create proper test schedules with lowercase days
  resetSchedules: async (userId) => {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }
      
      console.log('Resetting schedules for user:', userId);
      
      const response = await api.post('/calendar/reset-schedules', { userId });
      console.log('Schedules reset:', response.data);
      return response.data;
    } catch (error) {
      console.error('resetSchedules error:', error);
      throw error;
    }
  },
  
  getEvents: (startDate, endDate, userId = null) => {
    if (!userId) {
      const user = JSON.parse(localStorage.getItem('user'));
      userId = user?.id;
    }
    
    if (!userId) {
      return Promise.reject(new Error('userId is required'));
    }
    
    const params = { 
      startDate: startDate,
      endDate: endDate,
      userId: userId
    };
    console.log('getEvents request:', { params });
    return api.get('/calendar/events', { params });
  },
  
  // Protected endpoints that require authentication
  createEvent: (eventData) => {
    return api.post('/calendar/events', eventData);
  },
  
  connectGoogleCalendar: (userId) => {
    if (!userId) {
      throw new Error('userId is required to connect Google Calendar');
    }
    // This will redirect to Google OAuth
    window.location.href = `${API_URL}/calendar/auth?userId=${userId}`;
  },
  
  checkConnectionStatus: async (userId) => {
    if (!userId) {
      throw new Error('userId is required to check calendar connection');
    }
    try {
      const response = await api.get('/calendar/connection-status', {
        params: { userId }
      });
      return response.data.connected;
    } catch (error) {
      console.error('Calendar connection check failed:', error);
      
      // Return false for any connection issues
      if (error.message.includes('Network Error') || 
          error.message.includes('timeout') || 
          error.code === 'ECONNABORTED' ||
          error.response?.status >= 500) {
        console.log('Network connectivity issues, assuming not connected');
        return false;
      }
      
      throw error;
    }
  },
  
  getCalendarInfo: async (userId) => {
    if (!userId) {
      throw new Error('userId is required to get calendar info');
    }
    try {
      console.log('Fetching calendar info for user:', userId);
      const response = await api.get('/calendar/info', {
        params: { userId }
      });
      console.log('Calendar info response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get calendar info failed:', error);
      throw error;
    }
  },
  
  getAuthUrl: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return Promise.reject(new Error('Not authenticated'));
    }
    return api.get('/calendar/auth-url');
  },
  
  disconnect: () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return api.post('/calendar/disconnect', { userId: user.id });
  },
  
  getSchedules: async (userId) => {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }
      const response = await api.get('/calendar/schedules', { 
        params: { userId } 
      });
      return response.data;
    } catch (error) {
      console.error('getSchedules error:', error);
      throw error;
    }
  },
  
  createSchedule: async (scheduleData) => {
    try {
      if (!scheduleData.userId) {
        const user = JSON.parse(localStorage.getItem('user'));
        scheduleData.userId = user.id;
      }
      console.log('createSchedule request:', scheduleData);
      const response = await api.post('/calendar/schedules', scheduleData);
      return response.data;
    } catch (error) {
      console.error('createSchedule error:', error);
      throw error;
    }
  },
  
  deleteSchedule: (id) => {
    const user = JSON.parse(localStorage.getItem('user'));
    return api.delete(`/calendar/schedules/${id}`, { 
      params: { userId: user.id }
    });
  },
  
  updateSchedule: async (id, scheduleData) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await api.put(`/calendar/schedules/${id}`, scheduleData, {
        params: { userId: user.id }
      });
      return response.data;
    } catch (error) {
      console.error('updateSchedule error:', error);
      throw error;
    }
  },
  
  getAvailableSlots: async (date, userId) => {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }
      
      const formattedDate = typeof date === 'string' ? date : date.toISOString();
      console.log('Getting available slots:', { date: formattedDate, userId });
      
      const response = await api.get('/calendar/availability', { 
        params: { 
          date: formattedDate,
          userId 
        }
      });
      console.log('Available slots response:', response.data);
      return response.data;
    } catch (error) {
      console.error('getAvailableSlots error:', error);
      
      // Rethrow error to be handled by the component
      throw error;
    }
  },
  
  getTimeSlots: async (userId) => {
    const response = await api.get(`/api/users/${userId}/time-slots`);
    return response.data;
  },
  
  createBooking: async (bookingData) => {
    try {
      // Only check for token if reCAPTCHA is enabled
      const recaptchaEnabled = process.env.VUE_APP_RECAPTCHA_ENABLED !== 'false';
      
      if (recaptchaEnabled && bookingData.recaptchaToken) {
        // Make sure token is valid
        if (!bookingData.recaptchaToken || typeof bookingData.recaptchaToken !== 'string' || 
            bookingData.recaptchaToken.trim() === '') {
          // Remove invalid token
          delete bookingData.recaptchaToken;
          console.log('Removed invalid recaptchaToken from booking request');
        }
      }
      
      // Use the correct endpoint path
      const response = await api.post('/calendar/bookings', bookingData);
      return response.data;
    } catch (error) {
      console.error('createBooking error:', error);
      throw error;
    }
  },
  
  createBookingWithFile: async (formData) => {
    try {
      const response = await api.post('/calendar/bookings/with-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('createBookingWithFile error:', error);
      throw error;
    }
  },
};

export const bookingAPI = {
  getServices: () => api.get('/calendar/services'),
  getAvailability: (date) => api.get('/calendar/availability', { params: { date } }),
  createBooking: (bookingData) => {
    // Only check for token if reCAPTCHA is enabled
    const recaptchaEnabled = process.env.VUE_APP_RECAPTCHA_ENABLED !== 'false';
    
    if (recaptchaEnabled && bookingData.recaptchaToken) {
      // Make sure token is valid
      if (!bookingData.recaptchaToken || typeof bookingData.recaptchaToken !== 'string' || 
          bookingData.recaptchaToken.trim() === '') {
        // Remove invalid token
        delete bookingData.recaptchaToken;
        console.log('Removed invalid recaptchaToken from booking request');
      }
    }
    
    // Use the correct endpoint path
    return api.post('/calendar/bookings', bookingData);
  },
  getBookingLink: (userId) => api.get(`/bookings/link/${userId}`)
};

export default api; 