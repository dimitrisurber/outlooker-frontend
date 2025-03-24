<template>
  <div class="booking-confirmation">
    <div class="header">
      <h1>Buchung bestätigt!</h1>
    </div>

    <div class="confirmation-details">
      <div class="success-icon">✓</div>
      <h2>Vielen Dank, {{ customerName }}!</h2>
      <p>Ihr Termin wurde erfolgreich gebucht.</p>
      
      <div class="appointment-info">
        <p><strong>Datum:</strong> {{ formatDate(appointmentDate) }}</p>
        <p><strong>Uhrzeit:</strong> {{ formatTime(appointmentTime) }}</p>
      </div>
      
      <p class="confirmation-message">
        Eine Bestätigungs-E-Mail wurde an Ihre E-Mail-Adresse gesendet.
        Bitte überprüfen Sie Ihren Posteingang für weitere Details.
      </p>
    </div>

    <button class="home-button" @click="goHome">Zurück zur Startseite</button>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default {
  name: 'BookingConfirmation',
  setup() {
    const route = useRoute();
    const router = useRouter();
    
    const appointmentDate = ref(null);
    const appointmentTime = ref(null);
    const customerName = ref('');

    onMounted(() => {
      // Get data from URL query parameters
      if (route.query.date) {
        appointmentDate.value = new Date(route.query.date);
      }
      
      if (route.query.time) {
        appointmentTime.value = route.query.time;
      }
      
      if (route.query.name) {
        customerName.value = route.query.name;
      }
      
      // Redirect to success page with necessary data
      redirectToSuccessPage();
    });
    
    // Redirect to success page with appointment details
    const redirectToSuccessPage = () => {
      // Build query params for success page
      const params = new URLSearchParams({
        name: customerName.value,
        date: appointmentDate.value ? appointmentDate.value.toISOString() : '',
        time: appointmentTime.value || '',
        description: `Termin für ${customerName.value}`,
        location: 'Werkstatt' // You can customize this as needed
      });
      
      // Navigate to success page
      router.replace(`/success?${params.toString()}`);
    };

    const formatDate = (date) => {
      if (!date) return '';
      return format(date, 'EEEE, d. MMMM yyyy', { locale: de });
    };

    const formatTime = (time) => {
      if (!time) return '';
      
      // Handle ISO string format (2025-03-24T09:00)
      if (time.includes('T')) {
        time = time.split('T')[1];
      }
      
      // Handle HH:mm format
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours));
      date.setMinutes(parseInt(minutes));
      return format(date, 'HH:mm', { locale: de }) + ' Uhr';
    };

    const goHome = () => {
      router.push('/');
    };

    return {
      appointmentDate,
      appointmentTime,
      customerName,
      formatDate,
      formatTime,
      goHome
    };
  }
};
</script>

<style scoped>
.booking-confirmation {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 20px;
  text-align: center;
}

.header {
  margin-bottom: 30px;
}

.confirmation-details {
  background: #f5f6f8;
  border-radius: 15px;
  padding: 30px;
  margin-bottom: 30px;
}

.success-icon {
  width: 80px;
  height: 80px;
  background: #4caf50;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  margin: 0 auto 20px;
}

.appointment-info {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin: 20px 0;
  text-align: left;
}

.confirmation-message {
  color: #666;
  line-height: 1.6;
}

.home-button {
  padding: 15px 30px;
  background: #4169e1;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.home-button:hover {
  background: #3151b7;
}
</style> 