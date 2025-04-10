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

        <!-- Add Vacation Blocker Section -->
        <div v-if="isCalendarConnected" class="vacation-section">
          <h3>Vacation Blocks</h3>
          <div class="vacation-blocks">
            <div v-for="(block, index) in vacationBlocks" 
                 :key="block.id || index" 
                 class="vacation-block">
              <div class="block-dates">
                <div class="date-input-group">
                  <label>Start Date</label>
                  <input 
                    type="date" 
                    v-model="block.startDate"
                    :min="new Date().toISOString().split('T')[0]"
                    @change="validateBlockDates(index); block.isModified = true"
                  >
                </div>
                <div class="date-input-group">
                  <label>End Date</label>
                  <input 
                    type="date" 
                    v-model="block.endDate"
                    :min="block.startDate"
                    @change="validateBlockDates(index); block.isModified = true"
                  >
                </div>
              </div>
              <div class="block-actions">
                <button 
                  v-if="block.id && !block.isModified"
                  @click="deleteVacationBlock(index)"
                  :disabled="block.isSubmitting"
                  class="delete-button"
                >
                  {{ block.isSubmitting ? 'Deleting...' : 'Delete' }}
                </button>
                <base-button 
                  v-if="block.isModified"
                  variant="warning"
                  :loading="block.isSubmitting"
                  @click="updateVacationBlock(index)"
                >
                  {{ block.isSubmitting ? 'Updating...' : 'Update' }}
                </base-button>
                <base-button 
                  v-if="!block.id"
                  variant="success"
                  :loading="block.isSubmitting"
                  @click="saveVacationBlock(index)"
                  :disabled="block.isSubmitting || !isValidBlock(block)"
                >
                  {{ block.isSubmitting ? 'Saving...' : 'Save' }}
                </base-button>
              </div>
            </div>
            
            <base-button 
              variant="primary"
              @click="addNewVacationBlock" 
              class="add-button"
            >
              Add Vacation Block
            </base-button>
          </div>
        </div>


      </div>

      <!-- Booked Appointments Section -->
      <div v-if="isCalendarConnected && bookings.length > 0" class="bookings-section">
        <h3>Booked Appointments</h3>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Service</th>
                <th>Email</th>
                <th>Notes</th>
                <th>Car</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="booking in bookings" :key="booking.id">
                <td>{{ formatDate(booking.appointment_date) }}</td>
                <td>{{ booking.appointment_time }}</td>
                <td>{{ booking.customer_name }}</td>
                <td>{{ booking.customer_phone }}</td>
                <td>{{ booking.service || 'N/A' }}</td>
                <td>{{ booking.customer_email || 'N/A' }}</td>
                <td>{{ booking.notes || 'N/A' }}</td>
                <td>{{ formatCarInfo(booking) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else-if="isCalendarConnected" class="bookings-section no-bookings">
        <h3>Booked Appointments</h3>
        <p>No bookings found.</p>
      </div>
      <!-- End Booked Appointments Section -->
    </main>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { calendarAPI, authAPI } from '@/services/api';
import { format, parseISO } from 'date-fns';

export default {
  name: 'DashboardView',
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
    const vacationBlocks = ref([]);
    const bookings = ref([]);
    const isLoadingBookings = ref(false);

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

        try {
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
        } catch (scheduleError) {
          console.error('Failed to fetch schedules:', scheduleError);
          
          // Initialize with default schedules if API is not available
          if (scheduleError.message.includes('404')) {
            console.log('Schedules API not available, using default schedules');
            // Provide a default schedule
            schedules.value = [
              {
                id: 'default1',
                mon: true,
                tue: true,
                wed: true,
                thu: true,
                fri: true,
                sat: false,
                from: '09:00',
                to: '17:00',
                isSubmitting: false,
                isModified: false
              }
            ];
          } else {
            // Set specific message for network issues
            if (scheduleError.message.includes('Network Error') || 
                scheduleError.message.includes('timeout') ||
                scheduleError.code === 'ECONNABORTED' ||
                scheduleError.response?.status >= 500) {
              error.value = 'Network connectivity issues. Unable to fetch schedules.';
            } else {
              error.value = scheduleError.response?.data?.error || 'Failed to load schedules';
            }
            
            // Default empty schedules
            schedules.value = [];
          }
        }
      } catch (err) {
        console.error('Unexpected error in fetchSchedules:', err);
        error.value = err.message || 'An unexpected error occurred';
        schedules.value = [];
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
        
        // Don't call fetchSchedules here - it's already called in onMounted
        // and causes duplicate 404 errors when called here
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
        
        // Get connection status with fallback
        try {
          isCalendarConnected.value = await calendarAPI.checkConnectionStatus(user.id);
        } catch (connectionError) {
          console.error('Failed to check connection status:', connectionError);
          error.value = 'Could not check calendar connection';
          isCalendarConnected.value = false;
        }
        
        if (isCalendarConnected.value) {
          try {
            const calendarInfo = await calendarAPI.getCalendarInfo(user.id);
            
            // Safely extract email with fallback
            if (calendarInfo) {
              calendarEmail.value = calendarInfo.email || user.username || user.id || 'Unknown account';
            } else {
              console.error('Calendar info is undefined/null');
              error.value = 'Could not retrieve calendar information';
              calendarEmail.value = user.username || user.id || 'Unknown account';
            }
          } catch (infoError) {
            console.error('Failed to get calendar info:', infoError);
            // Don't fail the whole component for this error
            error.value = 'Could not retrieve calendar information';
            // Set a default value so the UI doesn't break
            calendarEmail.value = user.username || user.id || 'Unknown account';
          }
        }
      } catch (err) {
        console.error('Failed to check calendar connection:', err);
        error.value = err.message || 'Failed to check calendar connection';
        isCalendarConnected.value = false;
      } finally {
        isLoading.value = false;
      }
    };

    const fetchVacationBlocks = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user?.id) {
          throw new Error('User ID is required');
        }
        
        console.log('Fetching vacation blocks');
        const response = await calendarAPI.getVacationBlocks(user.id);
        
        // Check for both property names (vacationBlocks or blocks) to make it resilient
        const blocks = response.vacationBlocks || response.blocks || [];
        console.log('Vacation blocks response transformed:', blocks);
        
        vacationBlocks.value = blocks.map(block => {
          // Format dates to ensure YYYY-MM-DD format for date inputs
          let startDate = block.startDate;
          let endDate = block.endDate;
          
          // If dates are not in YYYY-MM-DD format, try to convert them
          if (startDate && !startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            try {
              const date = new Date(startDate);
              if (!isNaN(date.getTime())) {
                startDate = date.toISOString().split('T')[0];
              }
            } catch (e) {
              console.error('Error formatting startDate:', e);
            }
          }
          
          if (endDate && !endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            try {
              const date = new Date(endDate);
              if (!isNaN(date.getTime())) {
                endDate = date.toISOString().split('T')[0];
              }
            } catch (e) {
              console.error('Error formatting endDate:', e);
            }
          }
          
          return {
            id: block.id,
            startDate: startDate,
            endDate: endDate,
            description: block.description || '',
            isSubmitting: false,
            isModified: false
          };
        });
        console.log('Fetched vacation blocks:', vacationBlocks.value);
      } catch (err) {
        console.error('Failed to fetch vacation blocks:', err);
        error.value = err.message || 'Failed to load vacation blocks';
        // Initialize with empty array on error
        vacationBlocks.value = [];
      }
    };

    const createEmptyVacationBlock = () => ({
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      description: '',
      isSubmitting: false,
      isModified: false
    });

    const validateBlockDates = (index) => {
      const block = vacationBlocks.value[index];
      if (block.startDate && block.endDate) {
        const startDate = new Date(block.startDate);
        const endDate = new Date(block.endDate);
        if (startDate > endDate) {
          block.startDate = block.endDate;
        }
      }
    };

    const isValidBlock = (block) => {
      const startDate = new Date(block.startDate);
      const endDate = new Date(block.endDate);
      const today = new Date();
      return startDate <= endDate && startDate >= today;
    };

    const saveVacationBlock = async (index) => {
      try {
        const block = vacationBlocks.value[index];
        block.isSubmitting = true;

        const blockData = {
          startDate: block.startDate,
          endDate: block.endDate
        };

        console.log('Saving vacation block:', blockData);
        const response = await calendarAPI.createVacationBlock(blockData);
        block.id = response.id;
        console.log('Vacation block saved successfully');
        
        await fetchVacationBlocks();
      } catch (err) {
        console.error('Failed to save vacation block:', err);
        
        // Set specific message for network issues
        if (err.message.includes('Network Error') || 
            err.message.includes('timeout') ||
            err.code === 'ECONNABORTED' ||
            err.response?.status >= 500) {
          error.value = 'Network connectivity issues. Unable to save vacation block.';
        } else {
          error.value = err.response?.data?.error || 'Failed to save vacation block';
        }
      } finally {
        vacationBlocks.value[index].isSubmitting = false;
      }
    };

    const deleteVacationBlock = async (index) => {
      const block = vacationBlocks.value[index];
      block.isSubmitting = true;
      
      try {
        await calendarAPI.deleteVacationBlock(block.id);
        vacationBlocks.value.splice(index, 1);
      } catch (err) {
        console.error('Failed to delete vacation block:', err);
        
        // Set specific message for network issues
        if (err.message.includes('Network Error') || 
            err.message.includes('timeout') ||
            err.code === 'ECONNABORTED' ||
            err.response?.status >= 500) {
          error.value = 'Network connectivity issues. Unable to delete vacation block.';
        } else {
          error.value = err.response?.data?.error || 'Failed to delete vacation block';
        }
      } finally {
        vacationBlocks.value[index].isSubmitting = false;
      }
    };

    const addNewVacationBlock = () => {
      vacationBlocks.value.push(createEmptyVacationBlock());
    };

    const updateVacationBlock = async (index) => {
      try {
        const block = vacationBlocks.value[index];
        block.isSubmitting = true;

        const blockData = {
          startDate: block.startDate,
          endDate: block.endDate
        };

        console.log('Updating vacation block:', blockData);
        await calendarAPI.updateVacationBlock(block.id, blockData);
        block.isModified = false;
        console.log('Vacation block updated successfully');
        
        await fetchVacationBlocks();
      } catch (err) {
        console.error('Failed to update vacation block:', err);
        
        if (err.message.includes('Network Error') || 
            err.message.includes('timeout') ||
            err.code === 'ECONNABORTED' ||
            err.response?.status >= 500) {
          error.value = 'Network connectivity issues. Unable to update vacation block.';
        } else {
          error.value = err.response?.data?.error || 'Failed to update vacation block';
        }
      } finally {
        vacationBlocks.value[index].isSubmitting = false;
      }
    };

    const fetchBookings = async () => {
      isLoadingBookings.value = true;
      try {
        console.log('Fetching bookings...');
        try {
          const fetchedBookings = await calendarAPI.getBookings();
          bookings.value = fetchedBookings || [];
          console.log(`Fetched ${bookings.value.length} bookings.`);
        } catch (bookingError) {
          console.error('Failed to fetch bookings:', bookingError);
          
          // Handle 404 case specially - API not implemented
          if (bookingError.message.includes('404')) {
            console.log('Bookings API not available');
            bookings.value = []; // Empty array, not null
          } else {
            error.value = bookingError.message || 'Failed to load bookings';
            bookings.value = []; // Clear bookings on error
          }
        }
      } catch (err) {
        console.error('Unexpected error in fetchBookings:', err);
        error.value = err.message || 'An unexpected error occurred';
        bookings.value = []; // Clear bookings on error
      } finally {
        isLoadingBookings.value = false;
      }
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        // Assuming dateString is in YYYY-MM-DD format
        return format(parseISO(dateString), 'dd MMM yyyy');
      } catch (e) {
        console.error('Error formatting date:', dateString, e);
        return dateString; // Return original if formatting fails
      }
    };

    const formatCarInfo = (booking) => {
      if (!booking.car_manufacturer) return 'N/A';
      let info = booking.car_manufacturer;
      if (booking.car_year) {
        info += ` (${booking.car_year})`;
      }
      return info;
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
        await fetchVacationBlocks();
        await fetchBookings();
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
      checkCalendarStatus,
      vacationBlocks,
      createEmptyVacationBlock,
      validateBlockDates,
      isValidBlock,
      saveVacationBlock,
      deleteVacationBlock,
      updateVacationBlock,
      addNewVacationBlock,
      fetchVacationBlocks,
      bookings,
      isLoadingBookings,
      formatDate,
      formatCarInfo
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

.calendar-section,
.booking-link-section,
.schedule-section,
.available-slots-section,
.vacation-section {
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
  .available-slots-section,
  .vacation-section {
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

.vacation-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-top: 0; /* Remove top margin since it's now in the flex layout */
}

.vacation-blocks {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.vacation-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.block-dates {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.block-dates input[type="date"] {
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.block-actions {
  display: flex;
  gap: 0.5rem;
}

.save-button {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.save-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.save-button:hover:not(:disabled) {
  background-color: #218838;
}

.bookings-section {
  flex: 0 0 100%; /* Take full width */
  box-sizing: border-box;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-top: 2rem; /* Add some space above */
}

.bookings-section h3 {
  margin-bottom: 1rem;
}

.table-container {
  overflow-x: auto; /* Allow horizontal scrolling on small screens */
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

th, td {
  border: 1px solid #dee2e6;
  padding: 0.75rem;
  text-align: left;
  vertical-align: top;
  white-space: nowrap; /* Prevent text wrapping initially */
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
}

tbody tr:nth-child(even) {
  background-color: #f8f9fa;
}

/* Allow notes to wrap */
td:nth-child(7) { 
  white-space: normal;
}

.no-bookings p {
  color: #6c757d;
}
</style> 