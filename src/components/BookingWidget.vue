<template>
  <div class="booking-widget">
    <div class="header">
      <h1>Service auswählen</h1>
    </div>

    <!-- Service Selection -->
    <div class="service-selection" v-if="!selectedService">
      <div class="service-tiles">
        <div 
          class="service-tile"
          @click="selectService('rad', 30)"
        >
          <h2>Räder wechseln</h2>
          <div class="service-duration">Dauer: 30 Minuten</div>
          <p class="service-description">
            Schneller und professioneller Radwechsel für Ihr Fahrzeug. Ideal für einzelne Räder oder wenn Sie bereits über die passenden Reifen verfügen.
          </p>
        </div>
        
        <div 
          class="service-tile"
          @click="selectService('reifen', 60)"
        >
          <h2>Reifen wechseln</h2>
          <div class="service-duration">Dauer: 60 Minuten</div>
          <p class="service-description">
            Kompletter Reifenwechsel inklusive Auswuchten und Montage. Perfekt für saisonalen Reifenwechsel oder wenn Sie neue Reifen benötigen.
          </p>
        </div>
      </div>
    </div>

    <!-- Selected Service Header -->
    <div v-if="selectedService" class="selected-service-header">
      <h2>{{ selectedService === 'rad' ? 'Rad wechseln' : 'Reifen wechseln' }}</h2>
      <div class="service-duration">Dauer: {{ appointmentDuration }} Minuten</div>
      <button class="change-service-button" @click="changeService">
        Service ändern
      </button>
    </div>

    <!-- Admin Actions -->
    <div class="admin-actions" v-if="isAdmin && selectedService">
      <button @click="resetUserSchedules" class="admin-button">
        Reset Test Schedules
      </button>
      <button @click="fetchAllAvailableSlots" class="admin-button">
        Refresh Slots
      </button>
      <button @click="toggleDebugInfo" class="admin-button">
        {{ showDebugInfo ? 'Hide' : 'Show' }} Debug Info
      </button>
      <button @click="inspectRawData" class="admin-button">
        Inspect Raw Data
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading && selectedService" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Lade verfügbare Termine...</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="errorMessage" class="error-state">
      <div class="error-icon">!</div>
      <p>{{ errorMessage }}</p>
      <button @click="fetchAllAvailableSlots" class="retry-button">
        Erneut versuchen
      </button>
    </div>

    <!-- Days List with Time Slots -->
    <div v-else-if="selectedService" class="days-list">
      <div v-if="daysWithAvailableSlots.length === 0" class="no-available-days">
        <div class="empty-calendar-icon">📅</div>
        <h3>Keine verfügbaren Termine</h3>
        <p>Im nächsten Monat sind keine Termine verfügbar.</p>
      </div>
      <div 
        v-else
        v-for="day in daysWithAvailableSlots"
        :key="day.index"
        class="day-section"
      >
        <div class="day-header">
          <h2 v-html="formatDateHeader(day.date)"></h2>
        </div>
        
        <div class="time-slots">
          <button 
            v-for="(slot) in getValidSlots(day.slots)" 
            :key="slot.time"
            class="time-slot"
            :class="{ 
              'selected': selectedTime === slot.time && selectedDate.toDateString() === day.date.toDateString()
            }"
            @click="selectTimeSlot(slot.time, day.date)"
          >
            {{ formatTime(slot.time.split('T')[1]) }}
          </button>
          <div v-if="day.slots.length === 0" class="no-slots">
            Keine verfügbaren Termine an diesem Tag
          </div>
        </div>
        
        <!-- Debug Information -->
        <div v-if="showDebugInfo" class="debug-info">
          <h3>Debug Information</h3>
          <div v-for="day in daysWithAvailableSlots" :key="day.date" class="debug-day">
            <h4>Date: {{ day.date }}</h4>
            <div class="debug-section">
              <h5>Available Slots:</h5>
              <pre>{{ getValidSlots(day.slots) }}</pre>
            </div>
            <div class="debug-section">
              <h5>Busy Times:</h5>
              <pre>{{ day.busyTimes || 'No busy times' }}</pre>
            </div>
            <div class="debug-section">
              <h5>Debug Info:</h5>
              <pre>{{ day.debugInfo || 'No debug info' }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- Selected Time Display -->
    <div class="selected-time" v-if="selectedTime">
      <h3>Appointment Time</h3>
      <p>{{ formatTime(selectedTime) }} - {{ formatDate(selectedDate) }}</p>
    </div>

    <!-- Debug Information for Selected Date -->
    <div class="mt-4" v-if="showDebugInfo && selectedDate && selectedDateDebugInfo">
      <div class="border border-gray-300 rounded p-3 bg-gray-50">
        <h3 class="font-semibold">Debug Info for {{ formatLocalDate(selectedDate) }}</h3>
        
        <!-- Basic Slot Information -->
        <div class="mt-2">
          <h4 class="font-medium">Slot Information:</h4>
          <p>Total Slots: {{ selectedDateDebugInfo.totalSlots || 0 }}</p>
          <p v-if="selectedDateDebugInfo.actualAvailableSlots && selectedDateDebugInfo.actualAvailableSlots.length">
            Available Slots: {{ selectedDateDebugInfo.actualAvailableSlots.length }}
          </p>
          <p v-else-if="noSlotsForSelectedDate">No available slots for this day</p>
        </div>
        
        <!-- Non-Fracturing Context -->
        <div class="mt-2">
          <h4 class="font-medium">Non-Fracturing Context:</h4>
          <p class="text-sm">Slots are made available only at boundaries (first/last of schedule) or adjacent to existing bookings to prevent calendar fragmentation.</p>
        </div>
        
        <!-- Boundary Slots -->
        <div class="mt-2" v-if="selectedDateDebugInfo.boundarySlots && selectedDateDebugInfo.boundarySlots.length">
          <h4 class="font-medium">Boundary Slots (first/last of schedule):</h4>
          <ul class="mt-1 text-sm">
            <li v-for="(slot, index) in selectedDateDebugInfo.boundarySlots" :key="index" 
                :class="{'text-red-500': !slot.isAvailable, 'text-green-600': slot.isAvailable}">
              {{ slot.time }} ({{ slot.position }}) - {{ slot.isAvailable ? 'AVAILABLE' : 'BOOKED' }}
            </li>
          </ul>
        </div>
        
        <!-- Adjacent Slots -->
        <div class="mt-2" v-if="selectedDateDebugInfo.adjacentSlots && selectedDateDebugInfo.adjacentSlots.length">
          <h4 class="font-medium">Adjacent Slots (next to bookings):</h4>
          <ul class="mt-1 text-sm">
            <li v-for="(slot, index) in selectedDateDebugInfo.adjacentSlots" :key="index"
                :class="{'text-red-500': !slot.isAvailable, 'text-green-600': slot.isAvailable}">
              {{ slot.time }} - {{ slot.isAvailable ? 'AVAILABLE' : 'BOOKED' }}
              <span v-if="slot.adjacentTo" class="text-gray-600">
                ({{ slot.position }} {{ slot.appointmentTitle ? `"${slot.appointmentTitle}"` : 'booked slot' }} at {{ slot.adjacentTo }})
              </span>
            </li>
          </ul>
        </div>
        
        <!-- Booked Slots -->
        <div class="mt-2" v-if="selectedDateDebugInfo.bookedSlots && selectedDateDebugInfo.bookedSlots.length">
          <h4 class="font-medium">Booked Slots:</h4>
          <ul class="mt-1 text-sm">
            <li v-for="(slot, index) in selectedDateDebugInfo.bookedSlots" :key="index" class="text-red-500">
              {{ slot.time }} - {{ slot.conflictWithEvent ? `Appointment: ${slot.conflictWithEvent.title}` : 'Booked' }}
            </li>
          </ul>
        </div>
        
        <!-- Booked Appointments -->
        <div class="mt-2" v-if="selectedDateDebugInfo.bookedAppointments && selectedDateDebugInfo.bookedAppointments.length">
          <h4 class="font-medium">Booked Appointments:</h4>
          <ul class="mt-1 text-sm bg-gray-100 p-2 rounded">
            <li v-for="(appt, index) in selectedDateDebugInfo.bookedAppointments" :key="index" class="mb-1">
              <div class="font-medium">{{ appt.title }}</div>
              <div>Time: {{ formatTime(appt.swissStartTime) }} - {{ formatTime(appt.swissEndTime) }} ({{ appt.duration }})</div>
              <div v-if="appt.description" class="text-xs text-gray-600">{{ appt.description }}</div>
            </li>
          </ul>
        </div>
        
        <!-- Detailed Debug Section -->
        <div class="mt-2" v-if="selectedDateDebugInfo.detailedDebug">
          <h4 class="font-medium">Detailed Debug:</h4>
          <pre class="mt-1 text-xs bg-gray-100 p-2 rounded whitespace-pre-wrap">{{ JSON.stringify(selectedDateDebugInfo.detailedDebug, null, 2) }}</pre>
        </div>
        <div v-else class="mt-2 text-sm text-gray-500">
          Detailed debug information not available
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { format, addDays } from 'date-fns';
import { calendarAPI } from '@/services/api';
import { useRoute, useRouter } from 'vue-router';

export default {
  name: 'BookingWidget',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const selectedDate = ref(new Date());
    const selectedTime = ref(null);
    const availableSlots = ref([]);
    const showDebugInfo = ref(false);
    const appointmentDuration = ref(30); // Default duration in minutes
    const loading = ref(false);
    const error = ref(null);
    const days = ref([]);
    const apiBaseUrl = process.env.VUE_APP_API_URL || '';
    const selectedService = ref(null);
    const vacationBlocks = ref([]);
    
    // Check admin status directly from localStorage
    const isAdmin = computed(() => {
      const user = JSON.parse(localStorage.getItem('user'));
      return user && user.role === 'admin';
    });
    
    // Swiss timezone
    const SWISS_TIMEZONE = 'Europe/Zurich';

    // Format a time string to 24-hour format
    const formatTime = (time) => {
      if (!time) return '';
      
      // If the time is already in HH:mm format, return it directly
      if (time.match(/^\d{2}:\d{2}$/)) {
        return time;
      }
      
      // For ISO string format (2025-03-24T09:00), extract just the time part
      if (time.includes('T')) {
        const timePart = time.split('T')[1];
        // Extract hours and minutes, ensuring we don't do any timezone conversion
        const [hours, minutes] = timePart.split(':');
        return `${hours}:${minutes}`;
      }
      
      // For any other format, try to extract hours and minutes
      const [hours, minutes] = time.split(':');
      if (hours && minutes) {
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      }
      
      return time;
    };

    // Convert a date to Swiss timezone using Intl
    const toSwissTime = (date) => {
      if (!date) return new Date();
      
      // Use Intl to format the date in Swiss timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: SWISS_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      // Format the date in Swiss timezone
      const formattedDate = formatter.format(new Date(date));
      
      // Parse the formatted string back to a Date object
      // Note: We're keeping the date in UTC to avoid double timezone conversion
      const [datePart, timePart] = formattedDate.split(', ');
      const [month, day, year] = datePart.split('/').map(num => parseInt(num, 10));
      const [hours, minutes, seconds] = timePart.split(':').map(num => parseInt(num, 10));
      
      const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
      return utcDate;
    };

    // Format a date using Swiss timezone
    const formatSwissDate = (date) => {
      if (!date) return '';
      const swissDate = toSwissTime(date);
      return format(swissDate, 'd MMM, yyyy');
    };

    // Define a state to store all days with their slots
    const allDaysWithSlots = ref([]);
    const isLoading = ref(true);
    const errorMessage = ref('');
    
    // Reset user schedules and create proper test schedules
    const resetUserSchedules = async () => {
      try {
        const userId = route.params.userId;
        if (!userId) {
          console.error('No userId found in route params');
          return;
        }
        
        isLoading.value = true;
        errorMessage.value = '';
        
        // Reset schedules
        await calendarAPI.resetSchedules(userId);
        
        // Refresh slots after reset
        await fetchAllAvailableSlots();
      } catch (error) {
        console.error('Failed to reset schedules:', error);
        errorMessage.value = 'Failed to reset schedules: ' + (error.message || 'Unknown error');
        isLoading.value = false;
      }
    };

    // Fetch all available slots for next month at once
    const fetchAllAvailableSlots = async () => {
      try {
        const userId = route.params.userId;
        if (!userId) {
          console.error('No userId found in route params');
          errorMessage.value = 'User ID is required';
          return;
        }
        
        isLoading.value = true;
        errorMessage.value = '';
        
        // First check if calendar is connected
        try {
          const isConnected = await calendarAPI.checkConnectionStatus(userId);
          if (!isConnected) {
            console.warn('User has not connected their calendar');
            errorMessage.value = 'Calendar is not connected. Please connect your Google Calendar first.';
            isLoading.value = false;
            return;
          }
        } catch (connectionError) {
          console.error('Error checking calendar connection:', connectionError);
        }

        // Get vacation blocks
        try {
          const vacationResponse = await calendarAPI.getVacationBlocks(userId);
          vacationBlocks.value = vacationResponse.blocks || [];
          console.log('Vacation blocks:', vacationBlocks.value);
        } catch (vacationError) {
          console.error('Error fetching vacation blocks:', vacationError);
          // Continue anyway as this is not critical
        }
        
        // Get all slots for the next month
        console.log('Fetching next month availability with appointment duration:', appointmentDuration.value);
        const result = await calendarAPI.getNextMonthAvailability(userId, appointmentDuration.value);
        console.log('All slots for next month:', result);
        
        if (result.success) {
          allDaysWithSlots.value = result.days;
        } else {
          console.error('Failed to fetch slots:', result.error);
          errorMessage.value = result.error || 'Failed to fetch available slots';
        }
      } catch (error) {
        console.error('Failed to fetch all available slots:', error);
        
        if (error.response) {
          if (error.response.status === 401) {
            errorMessage.value = error.response.data?.error || 'Calendar not connected';
          } else if (error.response.status === 503) {
            errorMessage.value = error.response.data?.error || 'Network connectivity issues';
          } else if (error.response.status === 404) {
            errorMessage.value = 'This feature is not available. The server API has changed.';
          } else {
            errorMessage.value = error.response.data?.error || 'Failed to fetch available slots';
          }
        } else {
          errorMessage.value = error.message || 'An unknown error occurred';
        }
      } finally {
        isLoading.value = false;
      }
    };

    // This improved getDaySlots is now more efficient since we have all data
    const getDaySlots = (date) => {
      const dateString = date.toISOString().split('T')[0];
      const dayData = allDaysWithSlots.value.find(day => day.date === dateString);
      
      // Return only available slots
      if (dayData && dayData.slots) {
        // Return the slots directly without modifying the time
        return dayData.slots;
      }
      
      return [];
    };

    const selectTimeSlot = async (time, date) => {
      console.log('Time slot selected:', time, date);
      selectedTime.value = time;
      selectedDate.value = date;
      
      // Trigger booking_start event with Google Ads tracking
      window.parent.postMessage({ 
        event: 'booking_start',
        googleAds: {
          event: 'conversion',
          send_to: 'AW-16946454602/K94kCLaEi7IaEMrA2ZA_'
        }
      }, '*');
      
      // Navigate to booking page immediately
      const userId = route.params.userId;
      console.log('Navigating to booking form with userId:', userId);
      
      // Use the URL structure that matches our new route
      try {
        // Keep the date in its original timezone and format
        const dateStr = date.toISOString().split('T')[0];
        const url = `/book/${userId}/confirm?date=${encodeURIComponent(dateStr)}&time=${encodeURIComponent(time)}&service=${encodeURIComponent(selectedService.value === 'rad' ? 'Rad wechseln' : 'Reifen wechseln')}`;
        console.log('Navigating to:', url);
        await router.push(url);
      } catch (error) {
        console.error('Navigation error:', error);
        alert(`Navigation failed: ${error.message}\nPlease check the console for more details.`);
      }
    };

    const getDate = (offset) => {
      // Get the date in Swiss timezone using native approach
      const date = addDays(new Date(), offset);
      return toSwissTime(date);
    };

    const getDayNumber = (offset) => {
      return format(getDate(offset), 'd');
    };

    const getWeekday = (offset) => {
      return format(getDate(offset), 'EEE');
    };

    const formatDate = (date) => {
      return formatSwissDate(date);
    };

    const germanWeekdays = {
      'Mon': 'Montag',
      'Tue': 'Dienstag',
      'Wed': 'Mittwoch',
      'Thu': 'Donnerstag',
      'Fri': 'Freitag',
      'Sat': 'Samstag',
      'Sun': 'Sonntag'
    };

    const formatDateHeader = (date) => {
      // Use Swiss timezone
      const today = toSwissTime(new Date());
      today.setHours(0, 0, 0, 0);
      
      const dateToCheck = toSwissTime(date);
      dateToCheck.setHours(0, 0, 0, 0);
      
      const diffTime = dateToCheck - today;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      const weekday = format(dateToCheck, 'EEE');
      const dayMonth = format(dateToCheck, 'd.M.');

      // Today
      if (diffDays === 0) {
        return `<span>Heute,</span> <span class="bold">${germanWeekdays[weekday]}</span> <span>den</span> <span class="bold">${dayMonth}</span>`;
      }
      // Tomorrow
      else if (diffDays === 1) {
        return `<span>Morgen,</span> <span class="bold">${germanWeekdays[weekday]}</span> <span>den</span> <span class="bold">${dayMonth}</span>`;
      }
      // Within current week (2-6 days ahead)
      else if (diffDays > 1 && diffDays <= 6) {
        return `<span>Diesen</span> <span class="bold">${germanWeekdays[weekday]}</span> <span>den</span> <span class="bold">${dayMonth}</span>`;
      }
      // Next week (7-14 days ahead)
      else if (diffDays > 6 && diffDays <= 14) {
        return `<span>Nächsten</span> <span class="bold">${germanWeekdays[weekday]}</span> <span>den</span> <span class="bold">${dayMonth}</span>`;
      }
      
      return format(dateToCheck, 'd MMM, yyyy');
    };

    // This function gets debug information for a specific day
    const getDayDebugInfo = (date) => {
      const dateString = date.toISOString().split('T')[0];
      const dayData = allDaysWithSlots.value.find(day => day.date === dateString);
      
      // Create a simpler debug object with all available data
      if (dayData) {
        // Log the full day data to help diagnose
        console.log(`Full data for ${dateString}:`, dayData);
        
        // Return everything we know about this day
        return {
          date: dateString,
          totalSlots: dayData.slots ? dayData.slots.length : 0,
          slots: dayData.slots || [],
          debug: dayData.debug || null,
          // Include a raw dump of the whole day object if debug info is missing
          rawData: !dayData.debug ? dayData : null
        };
      }
      
      return null;
    };

    // Fetch slots for all 14 days on mount
    onMounted(async () => {
      await fetchAllAvailableSlots();
      // Log to check if debug info exists in the response
      console.log('All days with slots after fetch:', allDaysWithSlots.value);
    });
    
    // Navigate to booking confirmation page
    const proceed = async () => {
      if (!selectedTime.value) return;
      
      const userId = route.params.userId;
      // Convert date to Swiss timezone manually
      const swissDate = toSwissTime(selectedDate.value);
      const url = `/book/${userId}/confirm?date=${encodeURIComponent(swissDate.toISOString())}&time=${encodeURIComponent(selectedTime.value)}&service=${encodeURIComponent(selectedService.value === 'rad' ? 'Rad wechseln' : 'Reifen wechseln')}`;
      console.log('Navigating to:', url);
      
      try {
        await router.push(url);
      } catch (error) {
        console.error('Navigation error:', error);
        alert(`Navigation failed: ${error.message}\nPlease check the console for more details.`);
      }
    };

    const toggleDebugInfo = () => {
      showDebugInfo.value = !showDebugInfo.value;
      console.log('Debug info toggled:', showDebugInfo.value);
    };

    const inspectRawData = () => {
      // Log the full raw data structure
      console.log('Raw allDaysWithSlots data:', JSON.parse(JSON.stringify(allDaysWithSlots.value)));
      
      // Create a popup with the debug data for better visualization
      const debugWindow = window.open('', 'Debug Data', 'width=800,height=600');
      debugWindow.document.write(`
        <html>
          <head>
            <title>Debug Data</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow: auto; }
            </style>
          </head>
          <body>
            <h2>Raw API Response Data</h2>
            <pre>${JSON.stringify(allDaysWithSlots.value, null, 2)}</pre>
          </body>
        </html>
      `);
    };

    const selectedDateDebugInfo = computed(() => {
      if (!selectedDate.value) return null;
      
      const dateString = selectedDate.value.toISOString().split('T')[0];
      const dayData = allDaysWithSlots.value.find(day => day.date === dateString);
      return dayData ? dayData.debug : null;
    });
    
    const noSlotsForSelectedDate = computed(() => {
      if (!selectedDate.value) return true;
      
      const dateString = selectedDate.value.toISOString().split('T')[0];
      const dayData = allDaysWithSlots.value.find(day => day.date === dateString);
      return !dayData || !dayData.slots || dayData.slots.length === 0;
    });

    // Update the computed property to handle vacation blocks
    const daysWithAvailableSlots = computed(() => {
      if (!allDaysWithSlots.value) return [];
      
      return allDaysWithSlots.value
        .map(day => {
          const dayDate = new Date(day.date + 'T00:00:00.000Z'); // Ensure consistent date format
          
          // Check if this day falls within any vacation block
          const isVacation = vacationBlocks.value.some(block => {
            const startDate = new Date(block.start_date + 'T00:00:00.000Z');
            const endDate = new Date(block.end_date + 'T00:00:00.000Z');
            
            // Compare dates without time components
            return dayDate >= startDate && dayDate <= endDate;
          });

          if (isVacation) {
            console.log(`Filtering out vacation day: ${day.date}`);
            return null; // Return null for vacation days to filter them out
          }

          return {
            ...day,
            date: dayDate,
            slots: day.slots || [], // Keep original slots if not a vacation day
            busyTimes: day.busyTimes || [],
            debugInfo: {
              date: day.date,
              slotsCount: day.slots.length,
              busyTimesCount: day.busyTimes?.length || 0,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
          };
        })
        .filter(day => {
          // Filter out:
          // 1. Null entries (vacation days)
          // 2. Sundays (day 0)
          // 3. Days with no slots
          return day && day.date.getDay() !== 0 && day.slots.length > 0;
        });
    });

    // Update the isDayInVacation helper to use the same date comparison logic
    const isDayInVacation = (date) => {
      if (!date) return false;
      
      const checkDate = new Date(date.toISOString().split('T')[0] + 'T00:00:00.000Z');
      
      return vacationBlocks.value.some(block => {
        const startDate = new Date(block.start_date + 'T00:00:00.000Z');
        const endDate = new Date(block.end_date + 'T00:00:00.000Z');
        
        return checkDate >= startDate && checkDate <= endDate;
      });
    };

    const getValidSlots = (slots) => {
      if (!slots) return [];
      return slots.filter((slot, index) => {
        const currentTime = slot.time.split('T')[1];
        const [hours, minutes] = currentTime.split(':').map(Number);
        const slotTimeInMinutes = hours * 60 + minutes;
        
        // Calculate when this slot would end based on appointment duration
        const slotEndTimeInMinutes = slotTimeInMinutes + appointmentDuration.value;
        
        // Get the day's schedules from the debug info
        const dayData = allDaysWithSlots.value.find(day => 
          day.date === slot.time.split('T')[0]
        );
        
        if (!dayData || !dayData.debug || !dayData.debug.schedules) {
          console.warn('No schedule data found for day:', slot.time.split('T')[0]);
          return false;
        }

        // Check if this is today's date
        const slotDate = new Date(slot.time.split('T')[0]);
        const today = new Date();
        const isToday = slotDate.toDateString() === today.toDateString();

        // If it's today, check if the slot is at least 1 hour in the future
        if (isToday) {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentTimeInMinutes = currentHour * 60 + currentMinute;
          
          // Add 1 hour (60 minutes) to current time
          const minimumTimeInMinutes = currentTimeInMinutes + 60;
          
          // If the slot starts before the minimum time, filter it out
          if (slotTimeInMinutes < minimumTimeInMinutes) {
            console.log(`Filtering out slot ${currentTime} as it's less than 1 hour in the future`);
            return false;
          }
        }
        
        // Check if this slot falls within any of the day's schedules
        const isValidTime = dayData.debug.schedules.some(schedule => {
          const [scheduleStartHour, scheduleStartMinute] = schedule.start_time.split(':').map(Number);
          const [scheduleEndHour, scheduleEndMinute] = schedule.end_time.split(':').map(Number);
          
          const scheduleStartInMinutes = scheduleStartHour * 60 + scheduleStartMinute;
          const scheduleEndInMinutes = scheduleEndHour * 60 + scheduleEndMinute;
          
          // Log schedule times for debugging
          console.log(`Checking slot ${currentTime} against schedule:`, {
            schedule: `${schedule.start_time} - ${schedule.end_time}`,
            slotStart: slotTimeInMinutes,
            slotEnd: slotEndTimeInMinutes,
            scheduleStart: scheduleStartInMinutes,
            scheduleEnd: scheduleEndInMinutes
          });
          
          // Slot must start within the schedule and end before or at the schedule end
          const isValid = slotTimeInMinutes >= scheduleStartInMinutes && 
                         slotEndTimeInMinutes <= scheduleEndInMinutes;
          
          if (isValid) {
            console.log(`Slot ${currentTime} is valid within schedule ${schedule.start_time} - ${schedule.end_time}`);
          }
          
          return isValid;
        });
        
        if (!isValidTime) {
          console.log(`Slot ${currentTime} is outside of all schedules`);
          return false;
        }
        
        // First slot in a block is always valid (if it's within a schedule)
        if (index === 0) return true;
        
        // Last slot in a block is always valid (if it's within a schedule)
        if (index === slots.length - 1) return true;
        
        // Get times of adjacent slots
        const prevTime = slots[index - 1].time.split('T')[1];
        const nextTime = slots[index + 1].time.split('T')[1];
        
        // If there's a gap before or after this slot, it's valid
        const minutesBefore = getMinutesDifference(prevTime, currentTime);
        const minutesAfter = getMinutesDifference(currentTime, nextTime);
        
        // If either gap is more than the appointment duration, this slot is valid
        return minutesBefore > appointmentDuration.value || minutesAfter > appointmentDuration.value;
      });
    };

    const getMinutesDifference = (time1, time2) => {
      const [hours1, minutes1] = time1.split(':').map(Number);
      const [hours2, minutes2] = time2.split(':').map(Number);
      return (hours2 * 60 + minutes2) - (hours1 * 60 + minutes1);
    };

    const fetchAvailability = async () => {
      try {
        loading.value = true;
        const response = await fetch(
          `${apiBaseUrl}/availability/next-two-weeks?userId=${route.params.userId}&duration=${appointmentDuration.value}`
        );
        const response2 = await fetch(
          `${apiBaseUrl}/availability/month?userId=${route.params.userId}&duration=${appointmentDuration.value}`
        );
        const data = await response.json();
        const data2 = await response2.json();
        console.log("Hitler");
        if (data.success) {
        console.log("Hitler", data2);
        }
        
        
        
        
        if (data.success) {
          days.value = data.days;
          // Update local duration if server returns a different value
          if (data.appointmentDuration) {
            appointmentDuration.value = data.appointmentDuration;
          }
        } else {
          console.error('Failed to fetch availability:', data.error);
          error.value = 'Failed to load available time slots';
        }
      } catch (err) {
        console.error('Error fetching availability:', err);
        error.value = 'Failed to load available time slots';
      } finally {
        loading.value = false;
      }
    };

    const selectService = async (service, duration) => {
      console.log(`Selecting service: ${service} with duration: ${duration} minutes`);
      selectedService.value = service;
      appointmentDuration.value = duration;
      await fetchAllAvailableSlots();
    };

    const changeService = () => {
      selectedService.value = null;
      appointmentDuration.value = 30;
      allDaysWithSlots.value = [];
    };

    return {
      selectedDate,
      selectedTime,
      availableSlots,
      getDate,
      getDayNumber,
      getWeekday,
      formatTime,
      formatDate,
      formatDateHeader,
      getDaySlots,
      selectTimeSlot,
      isLoading,
      errorMessage,
      fetchAllAvailableSlots,
      allDaysWithSlots,
      resetUserSchedules,
      showDebugInfo,
      getDayDebugInfo,
      proceed,
      toggleDebugInfo,
      inspectRawData,
      selectedDateDebugInfo,
      noSlotsForSelectedDate,
      isAdmin,
      daysWithAvailableSlots,
      getValidSlots,
      getMinutesDifference,
      appointmentDuration,
      fetchAvailability,
      selectedService,
      selectService,
      changeService,
      vacationBlocks,
      isDayInVacation
    };
  }
};
</script>

<style scoped>
.booking-widget {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.back-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.days-list {
  display: flex;
  flex-direction: column;
  gap: 30px;
  margin-bottom: 30px;
}

.day-section {
  background: #f5f6f8;
  border-radius: 15px;
  padding: 20px;
}

.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.day-header h2 {
  margin: 0;
  font-size: 1.2em;
}

.day-label {
  color: #666;
  font-weight: 500;
}

.time-slots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}

.time-slot {
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.time-slot:hover {
  background: #f0f0f0;
}

.time-slot.selected {
  background: #4169e1;
  color: white;
  border-color: #4169e1;
}

.no-slots {
  grid-column: 1 / -1;
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}

.legend {
  display: flex;
  gap: 20px;
  margin: 30px 0;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 5px;
}

.legend-color.not-available {
  background: #ffebee;
}

.legend-color.available {
  background: white;
  border: 1px solid #e0e0e0;
}

.legend-color.selected {
  background: #4169e1;
}

.selected-time {
  text-align: center;
  margin: 30px 0;
}

.proceed-button {
  width: 100%;
  padding: 15px;
  background: #4169e1;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.proceed-button:hover:not(:disabled) {
  background: #3151b7;
}

.proceed-button:disabled {
  background: #c5cae9;
  cursor: not-allowed;
}

.day-header h2 :deep(.bold) {
  font-weight: 700;
}

.day-header h2 :deep(span) {
  font-weight: 400;
}

.loading-state {
  text-align: center;
  padding: 50px;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4169e1;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 50px;
}

.error-icon {
  font-size: 40px;
  color: #4169e1;
  margin-bottom: 20px;
}

.retry-button {
  padding: 10px 20px;
  background: #4169e1;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.retry-button:hover {
  background: #3151b7;
}

.admin-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
  background-color: #fff3cd;
  padding: 10px;
  border-radius: 5px;
}

.admin-button {
  padding: 8px 16px;
  background: #17a2b8;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.admin-button:hover {
  background: #138496;
}

/* Debug information styles */
.debug-info {
  margin-top: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 5px;
  border: 1px solid #ddd;
  font-size: 0.9em;
}

.debug-info h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
  font-size: 1em;
}

.debug-section {
  margin-bottom: 15px;
}

.debug-section strong {
  color: #555;
  display: block;
  margin-bottom: 5px;
  border-bottom: 1px solid #eee;
  padding-bottom: 3px;
}

.debug-item {
  padding: 3px 6px;
  margin: 2px 0;
  border-radius: 3px;
  display: inline-block;
  margin-right: 5px;
  font-family: monospace;
}

.debug-item.booked {
  background-color: #ffebee;
  color: #d32f2f;
}

.debug-item.available {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.debug-item.unavailable {
  background-color: #f5f5f5;
  color: #757575;
}

.debug-item.conflict {
  background-color: #ffebee;
  color: #d32f2f;
}

.debug-empty {
  color: #999;
  font-style: italic;
  padding: 3px 0;
}

/* Add styling for pre tag */
.debug-info pre {
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  overflow: auto;
  font-size: 12px;
  white-space: pre-wrap;
  max-height: 300px;
}

/* Styles for appointment display */
.debug-appointment {
  margin: 10px 0;
  padding: 8px;
  border-radius: 5px;
  background-color: #f0f4f8;
  border-left: 3px solid #4169e1;
}

.appointment-time {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.time-badge {
  padding: 3px 6px;
  border-radius: 3px;
  font-family: monospace;
  font-weight: bold;
}

.time-badge.booked {
  background-color: #ffebee;
  color: #d32f2f;
}

.duration-badge {
  margin-left: 10px;
  font-size: 0.85em;
  color: #666;
  font-style: italic;
}

.appointment-title {
  font-weight: bold;
  margin-bottom: 3px;
}

.appointment-description {
  font-size: 0.9em;
  color: #555;
  white-space: pre-wrap;
}

.no-available-days {
  text-align: center;
  padding: 50px;
}

.empty-calendar-icon {
  font-size: 40px;
  color: #4169e1;
  margin-bottom: 20px;
}

.service-selection {
  margin: 20px 0;
}

.service-tiles {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.service-tile {
  background: #f5f6f8;
  border-radius: 15px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.service-tile:hover {
  background: #e8eaf6;
  border-color: #4169e1;
}

.service-tile h2 {
  margin: 0 0 10px 0;
  color: #4169e1;
}

.service-duration {
  font-weight: 500;
  color: #666;
  margin-bottom: 10px;
}

.service-description {
  margin: 0;
  color: #444;
  line-height: 1.5;
}

.selected-service-header {
  background: #e8eaf6;
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.selected-service-header h2 {
  margin: 0 0 5px 0;
  color: #4169e1;
}

.change-service-button {
  margin-top: 10px;
  padding: 8px 16px;
  background: #4169e1;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.change-service-button:hover {
  background: #3151b7;
}
</style> 