<template>
  <div class="booking-success">
    <h1>Booking Confirmed!</h1>
    <div class="success-details">
      <p><strong>Name:</strong> {{ bookingDetails.name }}</p>
      <p><strong>Phone:</strong> {{ bookingDetails.phone }}</p>
      <p><strong>Date:</strong> {{ formatDate(bookingDetails.date) }}</p>
      <p><strong>Time:</strong> {{ formatTime(bookingDetails.time) }}</p>
      <p><strong>Duration:</strong> {{ bookingDetails.duration }} minutes</p>
      <p><strong>Car Manufacturer:</strong> {{ bookingDetails.manufacturer }}</p>
      <p><strong>Car Year:</strong> {{ bookingDetails.year }}</p>
    </div>
    <!-- ... rest of template ... -->
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { formatDate, formatTime } from '../utils/dateUtils';

const route = useRoute();
const bookingDetails = ref({
  name: route.params.name as string,
  phone: route.params.phone as string,
  date: route.params.date as string,
  time: route.params.time as string,
  manufacturer: route.params.manufacturer as string,
  year: route.params.year as string,
  eventId: route.params.eventId as string,
  duration: route.params.duration as string || '30' // Default to 30 minutes if not provided
});
</script>

<style scoped>
.booking-success {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.success-details {
  margin-top: 2rem;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background-color: #f8fafc;
}

.success-details p {
  margin: 0.5rem 0;
}
</style> 