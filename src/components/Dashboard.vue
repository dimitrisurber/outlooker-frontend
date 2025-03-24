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

    // Convert schedule to backend format
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
    schedule.isModified = false; // Reset modified flag after successful update
    console.log('Schedule updated successfully');
    
    await fetchSchedules(); // Refresh schedules
  } catch (error) {
    console.error('Failed to update schedule:', error);
    error.value = error.response?.data?.error || 'Failed to update schedule';
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
    
    // Convert schedules to frontend format
    schedules.value = fetchedSchedules.map(schedule => ({
      id: schedule.id,
      mon: schedule.days.includes('MON'),
      tue: schedule.days.includes('TUE'),
      wed: schedule.days.includes('WED'),
      thu: schedule.days.includes('THU'),
      fri: schedule.days.includes('FRI'),
      sat: schedule.days.includes('SAT'),
      from: schedule.startTime,
      to: schedule.endTime,
      isSubmitting: false,
      isModified: false
    }));

    // Set up watchers for each schedule
    schedules.value.forEach((_, index) => {
      watchScheduleChanges(index);
    });
  } catch (error) {
    console.error('Failed to fetch schedules:', error);
    error.value = error.response?.data?.error || 'Failed to load schedules';
  } finally {
    isLoading.value = false;
  }
};

<template>
  <!-- ... other template code ... -->
  <div v-for="(schedule, index) in schedules" :key="index" class="schedule-item">
    <!-- ... schedule checkboxes and time inputs ... -->
    
    <div class="schedule-actions">
      <button 
        v-if="schedule.id && !schedule.isModified"
        @click="deleteSchedule(index)"
        :disabled="schedule.isSubmitting"
        class="delete-button"
      >
        {{ schedule.isSubmitting ? 'Deleting...' : 'Delete' }}
      </button>
      
      <button 
        v-if="schedule.isModified"
        @click="updateSchedule(index)"
        :disabled="schedule.isSubmitting"
        class="update-button"
      >
        {{ schedule.isSubmitting ? 'Updating...' : 'Update' }}
      </button>
      
      <button 
        v-if="!schedule.id"
        @click="saveSchedule(index)"
        :disabled="schedule.isSubmitting"
        class="save-button"
      >
        {{ schedule.isSubmitting ? 'Saving...' : 'Save' }}
      </button>
    </div>
  </div>
  <!-- ... -->
</template>

<style scoped>
/* ... existing styles ... */

.update-button {
  background-color: #ffc107;
  color: #000;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.update-button:hover {
  background-color: #e0a800;
}

.update-button:disabled {
  background-color: #ffd54f;
  cursor: not-allowed;
}
</style> 