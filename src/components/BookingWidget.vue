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
      <!-- Show a loading overlay instead of replacing content when reloading -->
      <div v-if="isLoading && daysWithAvailableSlots.length > 0" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>Aktualisiere verfügbare Termine...</p>
      </div>
      
      <div v-if="daysWithAvailableSlots.length === 0 && !isLoading" class="no-available-days">
        <div class="empty-calendar-icon">📅</div>
        <h3>Keine verfügbaren Termine</h3>
        <p>Im nächsten Monat sind keine Termine verfügbar.</p>
        
        <!-- Debug info for admin users -->
        <div v-if="isAdmin" class="debug-message">
          <p><strong>Debug info:</strong> {{ allDaysWithSlots.value?.length || 0 }} raw days found in API data</p>
          <div v-if="allDaysWithSlots.value && allDaysWithSlots.value.length > 0">
            <p>Sample day data:</p>
            <pre>{{ JSON.stringify(allDaysWithSlots.value[0], null, 2) }}</pre>
          </div>
        </div>
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
            v-for="(slot) in day.validSlots" 
            :key="slot.time"
            class="time-slot"
            :class="{ 
              'selected': selectedTime === slot.time && selectedDate.toDateString() === day.date.toDateString()
            }"
            @click="selectTimeSlot(slot.time, day.date)"
          >
            {{ formatTime(slot.time.split('T')[1]) }}
          </button>
          <div v-if="day.validSlots.length === 0" class="no-slots">
            Keine verfügbaren Termine an diesem Tag
          </div>
        </div>
        
        <!-- Debug Information -->
        <div v-if="showDebugInfo" class="debug-info">
          <h3>Debug Information</h3>
          <div class="debug-section">
            <h5>Date: {{ day.date.toISOString().split('T')[0] }}</h5>
            <p>Total slots: {{ day.slots?.length || 0 }}</p>
            <p>Valid slots: {{ day.validSlots?.length || 0 }}</p>
          </div>
          <div class="debug-section">
            <h5>Available Slots:</h5>
            <pre>{{ day.validSlots }}</pre>
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
              {{ formatTime(slot.time) }} ({{ slot.position }}) - {{ slot.isAvailable ? 'AVAILABLE' : 'BOOKED' }}
            </li>
          </ul>
        </div>
        
        <!-- Adjacent Slots -->
        <div class="mt-2" v-if="selectedDateDebugInfo.adjacentSlots && selectedDateDebugInfo.adjacentSlots.length">
          <h4 class="font-medium">Adjacent Slots (next to bookings):</h4>
          <ul class="mt-1 text-sm">
            <li v-for="(slot, index) in selectedDateDebugInfo.adjacentSlots" :key="index"
                :class="{'text-red-500': !slot.isAvailable, 'text-green-600': slot.isAvailable}">
              {{ formatTime(slot.time) }} - {{ slot.isAvailable ? 'AVAILABLE' : 'BOOKED' }}
              <span v-if="slot.adjacentTo" class="text-gray-600">
                ({{ slot.position }} {{ slot.appointmentTitle ? `"${slot.appointmentTitle}"` : 'booked slot' }} at {{ formatTime(slot.adjacentTo) }})
              </span>
            </li>
          </ul>
        </div>
        
        <!-- Booked Slots -->
        <div class="mt-2" v-if="selectedDateDebugInfo.bookedSlots && selectedDateDebugInfo.bookedSlots.length">
          <h4 class="font-medium">Booked Slots:</h4>
          <ul class="mt-1 text-sm">
            <li v-for="(slot, index) in selectedDateDebugInfo.bookedSlots" :key="index" class="text-red-500">
              {{ formatTime(slot.time) }} - {{ slot.conflictWithEvent ? `Appointment: ${slot.conflictWithEvent.title}` : 'Booked' }}
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
    const selectedService = ref(null);
    const appointmentDuration = ref(30); // Default duration in minutes
    const allDaysWithSlots = ref([]);
    const isLoading = ref(false); // Set initial loading to false
    const errorMessage = ref('');
    
    // Check admin status
    const isAdmin = computed(() => {
      const user = JSON.parse(localStorage.getItem('user'));
      return user && user.role === 'admin';
    });

    // Format time for display - HH:MM without seconds
    const formatTime = (time) => {
      if (!time) return '';
      
      try {
        // If it's already in HH:MM format, return it
        if (time.match(/^\d{2}:\d{2}$/)) {
          return time;
        }
        
        // If it's ISO format (with T)
        if (time.includes('T')) {
          const [hours, minutes] = time.split('T')[1].split(':');
          return `${hours}:${minutes}`;
        }
        
        // If it has seconds (HH:MM:SS)
        if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
          return time.substring(0, 5);
        }
        
        // If it's a date object, format it
        if (time instanceof Date) {
          const hours = time.getHours().toString().padStart(2, '0');
          const minutes = time.getMinutes().toString().padStart(2, '0');
          return `${hours}:${minutes}`;
        }
        
        // Default case for any other format
        return time;
      } catch (error) {
        console.warn('Error formatting time:', error);
        return time;
      }
    };

    // Format date for display
    const formatDate = (date) => {
      if (!date) return '';
      return format(date, 'd MMM, yyyy');
    };

    // Format date header with German weekdays
    const formatDateHeader = (date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dateToCheck = new Date(date);
      dateToCheck.setHours(0, 0, 0, 0);
      
      const diffTime = dateToCheck - today;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      const weekday = format(dateToCheck, 'EEE');
      const dayMonth = format(dateToCheck, 'd.M.');
      
      const germanWeekdays = {
        'Mon': 'Montag', 'Tue': 'Dienstag', 'Wed': 'Mittwoch',
        'Thu': 'Donnerstag', 'Fri': 'Freitag', 'Sat': 'Samstag', 'Sun': 'Sonntag'
      };

      if (diffDays === 0) {
        return `<span>Heute,</span> <span class="bold">${germanWeekdays[weekday]}</span> <span>den</span> <span class="bold">${dayMonth}</span>`;
      } else if (diffDays === 1) {
        return `<span>Morgen,</span> <span class="bold">${germanWeekdays[weekday]}</span> <span>den</span> <span class="bold">${dayMonth}</span>`;
      } else if (diffDays > 1 && diffDays <= 6) {
        return `<span>Diesen</span> <span class="bold">${germanWeekdays[weekday]}</span> <span>den</span> <span class="bold">${dayMonth}</span>`;
      } else if (diffDays > 6 && diffDays <= 14) {
        return `<span>Nächsten</span> <span class="bold">${germanWeekdays[weekday]}</span> <span>den</span> <span class="bold">${dayMonth}</span>`;
      }
      
      return format(dateToCheck, 'd MMM, yyyy');
    };

    // Get available days from API response with filtering
    const daysWithAvailableSlots = computed(() => {
      if (!allDaysWithSlots.value || !Array.isArray(allDaysWithSlots.value)) {
        return [];
      }
      
      console.log(`Processing ${allDaysWithSlots.value.length} days from API`);
      
      // Process each day
      return allDaysWithSlots.value
        .filter(day => day && day.date) // Only keep days that have a date
        .map(day => {
          // Convert date string to Date object if needed
          let dateObj = day.date instanceof Date ? day.date : new Date(day.date + 'T00:00:00Z');
          
          // Get raw slots from the right property
          const rawSlots = day.availableTimes || day.slots || [];
          
          // Filter slots that are at least 15 minutes from now
          const filteredSlots = rawSlots.filter(slot => {
            if (!slot || !slot.time) return false;
            
            try {
              // Parse the slot time
              const slotTime = new Date(slot.time);
              const now = new Date();
              
              // Check if slot is at least 15 minutes in the future
              const diffMs = slotTime.getTime() - now.getTime();
              const diffMinutes = diffMs / (1000 * 60);
              
              return diffMinutes >= 15;
            } catch (error) {
              return false;
            }
          });
          
          // Apply non-fragmentation logic: only show boundary slots or slots with exactly 1 adjacent slot
          const nonFragmentedSlots = applyNonFragmentationLogic(filteredSlots);
          
          return {
            ...day,
            date: dateObj,
            validSlots: nonFragmentedSlots
          };
        })
        // Only keep days that have slots after filtering
        .filter(day => day.validSlots && day.validSlots.length > 0);
    });
    
    // Function to apply non-fragmentation logic
    const applyNonFragmentationLogic = (slots) => {
      if (!slots || slots.length === 0) return [];
      
      // Sort slots by time
      const sortedSlots = [...slots].sort((a, b) => {
        const timeA = new Date(a.time).getTime();
        const timeB = new Date(b.time).getTime();
        return timeA - timeB;
      });
      
      // Keep slots that are:
      // 1. First in a sequence
      // 2. Last in a sequence
      // 3. Have only one adjacent slot
      return sortedSlots.filter((slot, index) => {
        // First slot is always included
        if (index === 0) return true;
        
        // Last slot is always included
        if (index === sortedSlots.length - 1) return true;
        
        // For middle slots, check the gaps before and after
        const currentTime = new Date(slot.time).getTime();
        const prevTime = new Date(sortedSlots[index - 1].time).getTime();
        const nextTime = new Date(sortedSlots[index + 1].time).getTime();
        
        // Calculate gaps in minutes
        const prevGapMinutes = (currentTime - prevTime) / (1000 * 60);
        const nextGapMinutes = (nextTime - currentTime) / (1000 * 60);
        
        // If either gap is not the default duration (typically 30 min), 
        // then this is a boundary slot and should be kept
        return prevGapMinutes > appointmentDuration.value || 
               nextGapMinutes > appointmentDuration.value;
      });
    };

    // Helper function to check slot validity (for debugging)
    const isSlotValid = (slot) => {
      if (!slot || !slot.time) return false;
      
      try {
        const timeString = slot.time.split('T')[1];
        if (!timeString) return false;
        
        const [hours, minutes] = timeString.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return false;
        
        const slotDate = new Date(slot.time.split('T')[0]);
        const today = new Date();
        
        if (slotDate.toDateString() === today.toDateString()) {
          const currentHour = today.getHours();
          const currentMinute = today.getMinutes();
          const currentTimeInMinutes = currentHour * 60 + currentMinute;
          const slotTimeInMinutes = hours * 60 + minutes;
          
          if (slotTimeInMinutes < currentTimeInMinutes + 180) {
            return false;
          }
        }
        
        return true;
      } catch (error) {
        return false;
      }
    };
    
    // Helper function to get reason for slot invalidity (for debugging)
    const getSlotInvalidReason = (slot) => {
      if (!slot) return 'Slot is null or undefined';
      if (!slot.time) return 'Slot has no time property';
      
      try {
        const timeString = slot.time.split('T')[1];
        if (!timeString) return 'Invalid time format - no T delimiter';
        
        const [hours, minutes] = timeString.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return 'Invalid hours/minutes format';
        
        const slotDate = new Date(slot.time.split('T')[0]);
        const today = new Date();
        
        if (slotDate.toDateString() === today.toDateString()) {
          const currentHour = today.getHours();
          const currentMinute = today.getMinutes();
          const currentTimeInMinutes = currentHour * 60 + currentMinute;
          const slotTimeInMinutes = hours * 60 + minutes;
          
          if (slotTimeInMinutes < currentTimeInMinutes + 180) {
            return `Too soon - current: ${currentHour}:${currentMinute}, slot: ${hours}:${minutes}`;
          }
        }
        
        return 'Valid';
      } catch (error) {
        return `Error: ${error.message}`;
      }
    };

    // Fetch all available slots
    const fetchAllAvailableSlots = async () => {
      try {
        const userId = route.params.userId;
        if (!userId) {
          errorMessage.value = 'User ID is required';
          return;
        }
        
        isLoading.value = true;
        errorMessage.value = '';
        
        // Initialize if needed
        if (!allDaysWithSlots.value) {
          allDaysWithSlots.value = [];
        }
        
        // Check if calendar is connected
        try {
          const isConnected = await calendarAPI.checkConnectionStatus(userId);
          if (!isConnected) {
            errorMessage.value = 'Calendar is not connected. Please connect your Google Calendar first.';
            isLoading.value = false;
            return;
          }
        } catch (error) {
          console.error('Connection check error:', error);
        }
        
        // Fetch available slots
        const result = await calendarAPI.getNextMonthAvailability(userId, appointmentDuration.value);
        
        if (result.success && result.availableSlots) {
          allDaysWithSlots.value = Array.isArray(result.days) ? result.days : [];
          console.log("Using days array instead of availableSlots:", allDaysWithSlots.value);
        } else {
          errorMessage.value = result.error || 'Failed to fetch available slots';
        }
      } catch (error) {
        console.error('Failed to fetch available slots:', error);
        
        if (error.response) {
          if (error.response.status === 401) {
            errorMessage.value = 'Calendar not connected';
          } else if (error.response.status === 503) {
            errorMessage.value = 'Network connectivity issues';
          } else {
            errorMessage.value = 'Failed to fetch available slots';
          }
        } else {
          errorMessage.value = error.message || 'An unknown error occurred';
        }
      } finally {
        isLoading.value = false;
      }
    };
    
    // Reset schedules (admin action)
    const resetUserSchedules = async () => {
      try {
        const userId = route.params.userId;
        if (!userId) return;
        
        isLoading.value = true;
        errorMessage.value = '';
        
        await calendarAPI.resetSchedules(userId);
        await fetchAllAvailableSlots();
      } catch (error) {
        console.error('Failed to reset schedules:', error);
        errorMessage.value = 'Failed to reset schedules';
        isLoading.value = false;
      }
    };

    // Select a time slot and navigate to booking form
    const selectTimeSlot = async (time, date) => {
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
      
      // Navigate to booking page
      const userId = route.params.userId;
      
      try {
        const dateStr = date.toISOString().split('T')[0];
        const url = `/book/${userId}/confirm?date=${encodeURIComponent(dateStr)}&time=${encodeURIComponent(time)}&service=${encodeURIComponent(selectedService.value === 'rad' ? 'Rad wechseln' : 'Reifen wechseln')}`;
        await router.push(url);
      } catch (error) {
        console.error('Navigation error:', error);
        alert(`Navigation failed: ${error.message}`);
      }
    };

    // Select service type
    const selectService = async (service, duration) => {
      selectedService.value = service;
      appointmentDuration.value = duration;
      // Update the URL without reloading the page (optional, good UX)
      router.replace({ query: { ...route.query, service: service } });
      await fetchAllAvailableSlots();
    };

    // Reset service selection
    const changeService = () => {
      selectedService.value = null;
      appointmentDuration.value = 30;
      allDaysWithSlots.value = [];
      // Remove the service query parameter from URL (optional)
      const { service, ...restQuery } = route.query;
      router.replace({ query: restQuery });
    };
    
    // Toggle debug info display
    const showDebugInfo = ref(false);
    const toggleDebugInfo = () => {
      showDebugInfo.value = !showDebugInfo.value;
    };
    
    // Debug info helpers
    const selectedDateDebugInfo = computed(() => {
      if (!selectedDate.value) return null;
      
      // Format to YYYY-MM-DD for comparison
      const dateString = selectedDate.value.toISOString().split('T')[0];
      
      // Find the day in daysWithAvailableSlots (processed) or allDaysWithSlots (raw)
      // First try to find in processed days
      const processedDay = daysWithAvailableSlots.value.find(day => 
        day.date.toISOString().split('T')[0] === dateString
      );
      
      if (processedDay) {
        return processedDay.debug;
      }
      
      // If not found in processed, try raw data
      const rawDay = allDaysWithSlots.value.find(day => {
        if (day.date instanceof Date) {
          return day.date.toISOString().split('T')[0] === dateString;
        }
        return day.date === dateString;
      });
      
      return rawDay ? rawDay.debug : null;
    });
    
    const noSlotsForSelectedDate = computed(() => {
      if (!selectedDate.value) return true;
      
      const dateString = selectedDate.value.toISOString().split('T')[0];
      
      // First check processed days
      const processedDay = daysWithAvailableSlots.value.find(day => 
        day.date.toISOString().split('T')[0] === dateString
      );
      
      if (processedDay) {
        return processedDay.validSlots.length === 0;
      }
      
      // Otherwise check raw data
      const rawDay = allDaysWithSlots.value.find(day => {
        if (day.date instanceof Date) {
          return day.date.toISOString().split('T')[0] === dateString;
        }
        return day.date === dateString;
      });
      
      return !rawDay || !rawDay.slots || rawDay.slots.length === 0;
    });

    // Inspect raw data for debugging
    const inspectRawData = () => {
      console.log('Raw data:', JSON.parse(JSON.stringify(allDaysWithSlots.value)));
      
      const debugWindow = window.open('', 'Debug Data', 'width=800,height=600');
      debugWindow.document.write(`
        <html>
          <head>
            <title>Debug Data</title>
            <style>body{font-family:monospace;padding:20px}pre{background:#f5f5f5;padding:10px;border-radius:5px;overflow:auto}</style>
          </head>
          <body>
            <h2>Raw API Response Data</h2>
            <pre>${JSON.stringify(allDaysWithSlots.value, null, 2)}</pre>
          </body>
        </html>
      `);
    };

    // Initialize on mount - Check for query parameter
    onMounted(() => {
      const serviceQuery = route.query.service;
      if (serviceQuery === 'rad') {
        console.log('Pre-selecting service: Rad wechseln via query param');
        selectService('rad', 30);
      } else if (serviceQuery === 'reifen') {
        console.log('Pre-selecting service: Reifen wechseln via query param');
        selectService('reifen', 60);
      } else {
        // If no valid service query, don't fetch slots initially.
        // User needs to select a service first.
        console.log('No valid service pre-selected via query param.');
      }
    });

    return {
      selectedDate,
      selectedTime,
      formatTime,
      formatDate,
      formatDateHeader,
      selectTimeSlot,
      isLoading,
      errorMessage,
      fetchAllAvailableSlots,
      resetUserSchedules,
      showDebugInfo,
      toggleDebugInfo,
      inspectRawData,
      selectedDateDebugInfo,
      noSlotsForSelectedDate,
      isAdmin,
      daysWithAvailableSlots,
      appointmentDuration,
      selectedService,
      selectService,
      changeService,
      allDaysWithSlots
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

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
  border-radius: 15px;
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