import axios from 'axios';


const API_URL = 'http://localhost:3000/api';

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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
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
    const response = await api.post('/auth/login', credentials);
    const { token, user } = response.data;
    
    if (!token) throw new Error('No token received');
    
    // Store auth data
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Set auth header
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return response;
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
      if (!token) return false;

      // Set token in header before verification
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await api.get('/auth/verify');
      console.log('Auth check response:', response.data);
      
      return response.data.valid;
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      return false;
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
      const response = await api.post('/bookings', bookingData);
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
  createBooking: (bookingData) => api.post('/bookings', bookingData),
  getBookingLink: (userId) => api.get(`/bookings/link/${userId}`)
};

export default api; 