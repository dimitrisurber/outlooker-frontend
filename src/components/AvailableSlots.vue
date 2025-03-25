<template>
  <div class="available-slots">
    <h2>Available Slots</h2>
    <div v-if="isLoading" class="loading">
      Loading available slots...
    </div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else class="table-container">
      <table class="slots-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="slot in availableSlots" 
              :key="`${slot.date}-${slot.time}`"
              class="slot-row">
            <td>{{ formatDate(slot.date) }}</td>
            <td>{{ formatTime(slot.time) }}</td>
            

          </tr>
          <tr v-if="availableSlots.length === 0">
            <td colspan="3" class="no-slots">
              No available slots found
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { calendarAPI } from '@/services/api';
import { format, addDays, parseISO, addMinutes, isWithinInterval } from 'date-fns';

export default {
  name: 'AvailableSlots',
  setup() {
    const availableSlots = ref([]);
    const isLoading = ref(true);
    const error = ref(null);

    const calculateAvailableSlots = async () => {
      try {
        isLoading.value = true;
        error.value = null;

        const user = JSON.parse(localStorage.getItem('user'));
        console.log('Getting schedules for user:', user);

        // Get schedules
        const schedules = await calendarAPI.getSchedules(user.id);
        console.log('Received schedules:', schedules);

        if (!schedules?.length) {
          error.value = 'No schedules set';
          return;
        }

        // Get calendar events for next 7 days
        const startDate = new Date();
        const endDate = addDays(startDate, 7);
        
        const eventsResponse = await calendarAPI.getEvents(
          startDate,
          endDate,
          user.id
        );
        const busySlots = eventsResponse.data.events || [];
        console.log('Busy slots:', busySlots);

        // Generate available slots
        const slots = [];
        let currentDate = startDate;

        while (currentDate <= endDate) {
          const dayName = format(currentDate, 'EEE').toUpperCase();
          
          // Find schedule for this day
          const daySchedule = schedules.find(s => s.days.includes(dayName));
          
          if (daySchedule) {
            // Generate 30-minute slots within schedule
            const startTime = parseISO(`2000-01-01T${daySchedule.startTime}`);
            const endTime = parseISO(`2000-01-01T${daySchedule.endTime}`);
            let slotTime = startTime;

            while (slotTime < endTime) {
              const slotEndTime = addMinutes(slotTime, 30);
              const slotDateTime = new Date(currentDate);
              slotDateTime.setHours(slotTime.getHours(), slotTime.getMinutes());

              // Check if slot conflicts with any busy slots
              const isSlotAvailable = !busySlots.some(event => {
                if (!event.start || !event.end) return false;
                const eventStart = new Date(event.start.dateTime || event.start.date);
                const eventEnd = new Date(event.end.dateTime || event.end.date);
                return isWithinInterval(slotDateTime, { start: eventStart, end: eventEnd }) ||
                       isWithinInterval(addMinutes(slotDateTime, 30), { start: eventStart, end: eventEnd });
              });

              if (isSlotAvailable) {
                slots.push({
                  date: format(currentDate, 'yyyy-MM-dd'),
                  time: format(slotTime, 'HH:mm'),
                  dateTime: slotDateTime.toISOString()
                });
              }

              slotTime = slotEndTime;
            }
          }

          currentDate = addDays(currentDate, 1);
        }

        console.log('Generated available slots:', slots);
        availableSlots.value = slots;
      } catch (error) {
        console.error('Error calculating available slots:', error);
        error.value = error.response?.data?.error || 'Failed to calculate available slots';
      } finally {
        isLoading.value = false;
      }
    };

    const formatDate = (dateStr) => {
      return format(parseISO(dateStr), 'EEE, MMM d');
    };

    const formatTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, 'h:mm a');
    };

    const bookSlot = (slot) => {
      console.log('Booking slot:', slot);
      // TODO: Implement booking functionality
    };

    onMounted(() => {
      calculateAvailableSlots();
    });

    return {
      availableSlots,
      isLoading,
      error,
      formatDate,
      formatTime,
      bookSlot
    };
  }
};
</script>

<style scoped>
.available-slots {
  padding: 1rem;
}

.table-container {
  overflow-x: auto;
  margin-top: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slots-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.slots-table th,
.slots-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.slots-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.slot-row:hover {
  background-color: #f8f9fa;
}

.book-button {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.9rem;
}

.book-button:hover {
  background: #0056b3;
}

.loading {
  text-align: center;
  color: #666;
  padding: 2rem;
}

.error {
  color: #dc3545;
  text-align: center;
  padding: 2rem;
}

.no-slots {
  text-align: center;
  color: #666;
  padding: 2rem;
}

/* Responsive styles */
@media (max-width: 640px) {
  .table-container {
    margin: 0 -1rem;
    border-radius: 0;
  }
  
  .slots-table {
    min-width: 100%;
  }
  
  .slots-table th,
  .slots-table td {
    padding: 0.75rem;
  }
  
  .book-button {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }
}
</style> 