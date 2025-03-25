<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1>Dashboard</h1>
      <nav class="nav-menu">
        <router-link 
          to="/dashboard" 
          class="nav-link"
          active-class="active"
        >
          Home
        </router-link>
        <router-link 
          v-if="isAdmin"
          to="/users" 
          class="nav-link"
          active-class="active"
        >
          User Management
        </router-link>
      </nav>
      <base-button 
        variant="danger" 
        @click="logout" 
        class="logout-button"
      >
        Logout
      </base-button>
    </header>

    <main class="dashboard-content">
      <div class="flex-row">
      <div class="calendar-section">
        <div v-if="!isCalendarConnected" class="connect-calendar">
          <p>Connect your Google Calendar to start managing appointments</p>
          <base-button 
            variant="primary"
            @click="connectCalendar" 
            :loading="isLoading"
            class="google-button"
          >
            <img 
              src="@/assets/google-calendar-icon.svg" 
              alt="Google Calendar"
              class="google-icon"
            >
            {{ isLoading ? 'Connecting...' : 'Connect Calendar' }}
          </base-button>
        </div>

        <div v-else class="calendar-connected">
          <div class="success-message">
            <span class="checkmark">✓</span>
            Connected account: {{ calendarEmail }}
          </div>

          <div v-if="!isGoogleCalendarAvailable" class="api-warning">
            <p>⚠️ Google Calendar API is currently unavailable.</p>
            <base-button 
              variant="warning"
              @click="checkGoogleCalendarStatus" 
              :loading="isCheckingApiStatus"
              class="refresh-button"
            >
              Check Again
            </base-button>
          </div>
          <base-button 
            variant="danger"
            @click="disconnectCalendar" 
            class="disconnect-button"
          >
            Disconnect
          </base-button>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>
      
      <div class="booking-link-section">
        <h2>Your Booking Link</h2>
        <div class="link-container">
          <input 
            ref="linkInput"
            v-model="bookingLink" 
            readonly
            class="link-input"
          />
          <button 
            variant="primary"
            @click="copyLink"
            class="copy-button"
          >
            {{ copied ? 'Copied!' : 'Copy Link' }}
          </button>
        </div>
        <p class="help-text">Share this link with your customers to let them book appointments</p>
      </div>
      
      
        <div v-if="isCalendarConnected" class="schedule-section">
          <h3>Working Hours</h3>
          <div class="schedules-section">
            <div v-for="(schedule, index) in schedules" :key="index" class="schedule-item">
              <div class="schedule-days">
                <label>
                  <input type="checkbox" v-model="schedule.mon"> Mon
                </label>
                <label>
                  <input type="checkbox" v-model="schedule.tue"> Tue
                </label>
                <label>
                  <input type="checkbox" v-model="schedule.wed"> Wed
                </label>
                <label>
                  <input type="checkbox" v-model="schedule.thu"> Thu
                </label>
                <label>
                  <input type="checkbox" v-model="schedule.fri"> Fri
                </label>
                <label>
                  <input type="checkbox" v-model="schedule.sat"> Sat
                </label>
              </div>

              <div class="schedule-times">
                <input type="time" v-model="schedule.from">
                to
                <input type="time" v-model="schedule.to">
              </div>

              <div class="schedule-actions">
                <button 
                  v-if="schedule.id && !schedule.isModified"
                  variant="danger"
                  :loading="schedule.isSubmitting"
                  @click="deleteSchedule(index)"
                  :disabled="schedule.isSubmitting"
                  class="delete-button"
                >
                  {{ schedule.isSubmitting ? 'Deleting...' : 'Delete' }}
                </button>
                
                <base-button 
                  v-if="schedule.isModified"
                  variant="warning"
                  :loading="schedule.isSubmitting"
                  @click="updateSchedule(index)"
                >
                  {{ schedule.isSubmitting ? 'Updating...' : 'Update' }}
                </base-button>
                
                <base-button 
                  v-if="!schedule.id"
                  variant="success"
                  :loading="schedule.isSubmitting"
                  @click="saveSchedule(index)"
                >
                  {{ schedule.isSubmitting ? 'Saving...' : 'Save' }}
                </base-button>
              </div>
            </div>
            
            <base-button 
              variant="primary"
              @click="addNewSchedule" 
              class="add-button"
            >
              Add New Schedule
            </base-button>
          </div>
        </div>

        <AvailableSlots 
          v-if="isCalendarConnected"
          class="available-slots-section"
        />
      </div>
    </main>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { calendarAPI, authAPI } from '@/services/api';
import AvailableSlots from '@/components/AvailableSlots.vue';

export default {
  name: 'DashboardView',
  components: {
    AvailableSlots
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const isCalendarConnected = ref(false);
    const isLoading = ref(true);
    const error = ref('');
    const schedules = ref([]);
    const bookingLink = ref('');
    const copied = ref(false);
    const linkInput = ref(null);
    const isGeneratingLink = ref(true);
    const isGoogleCalendarAvailable = ref(true);
    const isCheckingApiStatus = ref(false);
    const isAdmin = ref(false);
    const loading = ref(false);
    const isConnected = ref(false);
    const calendarEmail = ref('');

    const connectCalendar = async () => {
      try {
        isLoading.value = true;
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
          throw new Error('User ID not found');
        }
        
        calendarAPI.connectGoogleCalendar(user.id);
      } catch (error) {
        console.error('Failed to connect calendar:', error);
        if (error.message === 'Not authenticated') {
          router.push('/login');
        } else {
          error.value = error.message || 'Failed to connect calendar';
        }
      } finally {
        isLoading.value = false;
      }
    };

    const disconnectCalendar = async () => {
      try {
        isLoading.value = true;
        error.value = '';
        
        await calendarAPI.disconnect();
        isCalendarConnected.value = false;
        console.log('Calendar disconnected successfully');
        
        // Clear schedules when disconnecting
        schedules.value = [];
      } catch (error) {
        console.error('Failed to disconnect calendar:', error);
        error.value = error.message || 'Failed to disconnect calendar';
      } finally {
        isLoading.value = false;
      }
    };

    const createEmptySchedule = () => ({
      mon: false,
      tue: false,
      wed: false,
      thu: false,
      fri: false,
      sat: false,
      from: '09:00',
      to: '17:00',
      isSubmitting: false,
      isModified: false
    });

    const watchScheduleChanges = (index) => {
      const schedule = schedules.value[index];
      ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'from', 'to'].forEach(prop => {
        watch(() => schedule[prop], () => {
          schedule.isModified = true;
        });
      });
    };

    const updateSchedule = async (index) => {
      try {
        const schedule = schedules.value[index];
        schedule.isSubmitting = true;

        const days = [];
        if (schedule.mon) days.push('MON');
        if (schedule.tue) days.push('TUE');
        if (schedule.wed) days.push('WED');
        if (schedule.thu) days.push('THU');
        if (schedule.fri) days.push('FRI');
        if (schedule.sat) days.push('SAT');

        const scheduleData = {
          days,
          startTime: schedule.from,
          endTime: schedule.to
        };

        console.log('Updating schedule:', scheduleData);
        await calendarAPI.updateSchedule(schedule.id, scheduleData);
        schedule.isModified = false;
        console.log('Schedule updated successfully');
        
        await fetchSchedules();
      } catch (err) {
        console.error('Failed to update schedule:', err);
        
        // Set specific message for network issues
        if (err.message.includes('Network Error') || 
            err.message.includes('timeout') ||
            err.code === 'ECONNABORTED' ||
            err.response?.status >= 500) {
          error.value = 'Network connectivity issues. Unable to update schedule.';
        } else {
          error.value = err.response?.data?.error || 'Failed to update schedule';
        }
      } finally {
        schedules.value[index].isSubmitting = false;
      }
    };

    const fetchSchedules = async () => {
      try {
        isLoading.value = true;
        error.value = '';

        const user = JSON.parse(localStorage.getItem('user'));
        console.log('Fetching schedules for user:', user);

        const fetchedSchedules = await calendarAPI.getSchedules(user.id);
        console.log('Received schedules:', fetchedSchedules);
        
        schedules.value = fetchedSchedules.map(schedule => {
          console.log('Processing schedule with days:', schedule.days);
          // Normalize days to uppercase for comparison
          const normalizedDays = schedule.days.map(day => day.toUpperCase());
          return {
            id: schedule.id,
            mon: normalizedDays.includes('MON'),
            tue: normalizedDays.includes('TUE'),
            wed: normalizedDays.includes('WED'),
            thu: normalizedDays.includes('THU'),
            fri: normalizedDays.includes('FRI'),
            sat: normalizedDays.includes('SAT'),
            from: schedule.startTime,
            to: schedule.endTime,
            isSubmitting: false,
            isModified: false
          };
        });

        schedules.value.forEach((_, index) => {
          watchScheduleChanges(index);
        });
      } catch (err) {
        console.error('Failed to fetch schedules:', err);
        
        // Set specific message for network issues
        if (err.message.includes('Network Error') || 
            err.message.includes('timeout') ||
            err.code === 'ECONNABORTED' ||
            err.response?.status >= 500) {
          error.value = 'Network connectivity issues. Unable to fetch schedules.';
          
          // Default empty schedules
          schedules.value = [];
        } else {
          error.value = err.response?.data?.error || 'Failed to load schedules';
        }
      } finally {
        isLoading.value = false;
      }
    };

    const logout = () => {
      authAPI.logout();
      router.push('/login');
    };

    const generateBookingLink = () => {
      const user = JSON.parse(localStorage.getItem('user'));
      const baseUrl = window.location.origin;
      bookingLink.value = `${baseUrl}/book/${user.id}`;
    };

    const copyLink = () => {
      linkInput.value.select();
      document.execCommand('copy');
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 2000);
    };

    const deleteSchedule = async (index) => {
      const schedule = schedules.value[index];
      schedule.isSubmitting = true;
      
      try {
        await calendarAPI.deleteSchedule(schedule.id);
        schedules.value.splice(index, 1);
      } catch (err) {
        console.error('Failed to delete schedule:', err);
        
        // Set specific message for network issues
        if (err.message.includes('Network Error') || 
            err.message.includes('timeout') ||
            err.code === 'ECONNABORTED' ||
            err.response?.status >= 500) {
          error.value = 'Network connectivity issues. Unable to delete schedule.';
        } else {
          error.value = err.response?.data?.error || 'Failed to delete schedule';
        }
      } finally {
        schedule.isSubmitting = false;
      }
    };

    const saveSchedule = async (index) => {
      try {
        const schedule = schedules.value[index];
        schedule.isSubmitting = true;

        const days = [];
        if (schedule.mon) days.push('MON');
        if (schedule.tue) days.push('TUE');
        if (schedule.wed) days.push('WED');
        if (schedule.thu) days.push('THU');
        if (schedule.fri) days.push('FRI');
        if (schedule.sat) days.push('SAT');

        const scheduleData = {
          days,
          startTime: schedule.from,
          endTime: schedule.to
        };

        console.log('Saving schedule:', scheduleData);
        const response = await calendarAPI.createSchedule(scheduleData);
        schedule.id = response.id;
        console.log('Schedule saved successfully');
        
        await fetchSchedules(); // Refresh schedules
      } catch (err) {
        console.error('Failed to save schedule:', err);
        
        // Set specific message for network issues
        if (err.message.includes('Network Error') || 
            err.message.includes('timeout') ||
            err.code === 'ECONNABORTED' ||
            err.response?.status >= 500) {
          error.value = 'Network connectivity issues. Unable to save schedule.';
        } else {
          error.value = err.response?.data?.error || 'Failed to save schedule';
        }
      } finally {
        schedules.value[index].isSubmitting = false;
      }
    };

    const addNewSchedule = () => {
      schedules.value.push(createEmptySchedule());
    };

    const checkGoogleCalendarStatus = async () => {
      try {
        isCheckingApiStatus.value = true;
        error.value = '';
        
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
          throw new Error('User not found');
        }
        
        console.log('Checking Google Calendar API status for user:', user.id);
        const isAvailable = await calendarAPI.checkGoogleCalendarAvailability();
        isGoogleCalendarAvailable.value = isAvailable.available;
        
        console.log('Google Calendar API status:', isAvailable);
        
        // If calendar API is available again, refresh schedules
        if (isAvailable.available) {
          await fetchSchedules();
        }
      } catch (err) {
        console.error('Failed to check Google Calendar API status:', err);
        isGoogleCalendarAvailable.value = false;
        
        // Set specific error message for network issues
        if (err.message.includes('Network Error') || 
            err.message.includes('timeout') ||
            err.code === 'ECONNABORTED') {
          error.value = 'Network connectivity issues. Unable to check Google Calendar API status.';
        } else {
          error.value = err.message || 'Failed to check Google Calendar API status';
        }
      } finally {
        isCheckingApiStatus.value = false;
      }
    };

    const checkCalendarStatus = async () => {
      isLoading.value = true;
      error.value = '';
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
          throw new Error('User not found');
        }
        
        isCalendarConnected.value = await calendarAPI.checkConnectionStatus(user.id);
        
        if (isCalendarConnected.value) {
          try {
            const calendarInfo = await calendarAPI.getCalendarInfo(user.id);
            if (calendarInfo && calendarInfo.email) {
              calendarEmail.value = calendarInfo.email;
            } else {
              console.error('Calendar info missing email:', calendarInfo);
              error.value = 'Could not retrieve calendar email';
            }
          } catch (infoError) {
            console.error('Failed to get calendar info:', infoError);
            error.value = 'Could not retrieve calendar information';
          }
        }
      } catch (err) {
        console.error('Failed to check calendar connection:', err);
        error.value = err.message;
        isCalendarConnected.value = false;
      } finally {
        isLoading.value = false;
      }
    };

    onMounted(async () => {
      // Set admin status
      const user = JSON.parse(localStorage.getItem('user'));
      isAdmin.value = user && user.role === 'admin';

      // Check for connection status from URL params
      if (route.query.connected === 'true') {
        isCalendarConnected.value = true;
      } else if (route.query.error) {
        error.value = decodeURIComponent(route.query.error);
      }

      // Verify connection status and get calendar info
      await checkCalendarStatus();

      if (isCalendarConnected.value) {
        await fetchSchedules();
        // Check if Google Calendar API is available
        await checkGoogleCalendarStatus();
      }

      generateBookingLink();
    });

    return {
      isAdmin,
      isCalendarConnected,
      isLoading,
      error,
      connectCalendar,
      disconnectCalendar,
      logout,
      schedules,
      createEmptySchedule,
      updateSchedule,
      deleteSchedule,
      saveSchedule,
      addNewSchedule,
      bookingLink,
      copied,
      linkInput,
      copyLink,
      isGeneratingLink,
      isGoogleCalendarAvailable,
      isCheckingApiStatus,
      checkGoogleCalendarStatus,
      loading,
      isConnected,
      calendarEmail,
      checkCalendarStatus
    };
  }
};
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.dashboard-header {
  background-color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 2rem;
  align-items: center;
}

.dashboard-content {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}


/* Bottom row - half width items */
.calendar-section,
.booking-link-section,
.schedule-section,
.available-slots-section {
  flex: 0 0 calc(50% - 1rem);
  box-sizing: border-box;
  min-width: 300px;
  max-width: calc(50% - 1rem);
}

/* Mobile layout */
@media (max-width: 768px) {
  .dashboard-content {
    padding: 1rem;
    gap: 1rem;
  }
  
  .schedule-section,
  .available-slots-section {
    flex: 0 0 100%;
    max-width: 100%;
    min-width: auto;
  }
}

/* Add container for bottom row */
.flex-row {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: space-between;
  gap: 2rem;
  width: 100%;
}

.calendar-section {
  background: white;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.connect-calendar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  border-radius: 8px;
}

.connect-calendar p {
  margin: 0;
}

.google-icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
}

.calendar-connected {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.success-message {
  color: #28a745;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.checkmark {
  font-size: 1.5rem;
}

.logout-button {
  /* Custom styling on top of BaseButton */
}

.error-message {
  color: #dc3545;
  margin: 0;
  padding: 0.25rem 0.5rem;
  background-color: #f8d7da;
  border-radius: 4px;
  font-size: 0.9rem;
}

.nav-menu {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.nav-link {
  padding: 0.5rem 1rem;
  color: #666;
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.2s;
}

.nav-link:hover {
  background-color: #f8f9fa;
  color: #333;
}

.nav-link.active {
  background-color: #007bff;
  color: white;
}

.schedule-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.schedules-section {
  margin-top: 1rem;
  overflow-x: auto;
}

.schedule-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
}

.schedule-days {
  flex: 5;
}

.schedule-times {
  flex: 3;
}

.schedule-actions {
  flex: 1;
  text-align: right;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.available-slots-section {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.booking-link-section {
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.link-container {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
}

.help-text {
  color: #666;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.copy-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.copy-button:hover {
  background-color: #0056b3;
}

.delete-button {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.delete-button:hover {
  background-color: #c82333;
}

.api-warning {
  color: #ffc107;
  margin: 0;
  padding: 0.25rem 0.5rem;
  background-color: #fff3cd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.refresh-button {
  background-color: #ffc107;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.refresh-button:hover {
  background-color: #e6a800;
}

.calendar-info {
  margin: 10px 0;
  color: #666;
  font-size: 0.9em;
}

.calendar-email {
  margin: 0;
  padding: 5px 0;
}
</style> 