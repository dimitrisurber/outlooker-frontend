<template>
  <div class="booking-form">
    <div class="header">
      <button class="back-button" @click="$router.back()">←</button>
      <h1>Buchung abschließen</h1>
    </div>

    <div class="appointment-details">
      <h2>Termindetails</h2>
      <p><strong>Datum:</strong> {{ formatDate(appointmentDate) }}</p>
      <p><strong>Uhrzeit:</strong> {{ formatTime(appointmentTime) }}</p>
    </div>

    <form @submit.prevent="submitBooking" class="qodef-appontment-form-2">
      <div class="form-row qodef-col-2">
        <div class="form-group">
          <label for="name">Name</label>
          <input 
            type="text" 
            id="name" 
            v-model="form.name" 
            required
            class="wpcf7-form-control wpcf7-text wpcf7-validates-as-required"
            placeholder="Geben Sie Ihren vollständigen Namen ein"
          >
        </div>
        
        <div class="form-group">
          <label for="phone">Telefon</label>
          <input 
            type="tel" 
            id="phone" 
            v-model="form.phone" 
            required
            class="wpcf7-form-control wpcf7-tel wpcf7-validates-as-required wpcf7-text wpcf7-validates-as-tel"
            placeholder="z.B. 079 123 45 67"
            @input="formatPhoneNumber"
            :class="{'phone-error': phoneError}"
          >
          <div v-if="phoneError" class="error-message">
            Bitte geben Sie eine gültige Schweizer Telefonnummer ein
          </div>
        </div>
      </div>

      <div class="form-row qodef-col-2">
        <div class="form-group">
          <label for="manufacturer">Hersteller</label>
          <div class="select-wrapper">
            <v-select
              id="manufacturer"
              v-model="form.manufacturer"
              :options="carBrands"
              :searchable="true"
              :clearable="false"
              placeholder="—Bitte wählen Sie eine Option—"
              class="smart-select manufacturer-select"
              :class="{'wpcf7-validates-as-required': true}"
              required
            ></v-select>
          </div>
        </div>
        
        <div class="form-group">
          <label for="year">Jahr</label>
          <div class="select-wrapper">
            <v-select
              id="year"
              v-model="form.year"
              :options="carYears"
              :searchable="true"
              :clearable="false"
              placeholder="—Bitte wählen Sie eine Option—"
              class="smart-select year-select"
              :class="{'wpcf7-validates-as-required': true}"
              required
            ></v-select>
          </div>
        </div>
      </div>

      <!-- reCAPTCHA v3 badge will appear at the bottom right of the page -->
      <div v-if="recaptchaError" class="recaptcha-error">
        Sicherheitsüberprüfung fehlgeschlagen. Bitte versuchen Sie es erneut oder kontaktieren Sie uns.
      </div>

      <div class="form-notes">
        <span class="qodef-short-note">
          Bitte beachten Sie das wir so gut wie möglich ihre Terminwünsche beachten, aber
          nichts garantieren können
        </span>
        <br>
        <span class="qodef-short-note">
          Wir werden Sie kontaktieren so schnell wie möglich
        </span>
      </div>

      <div class="form-submit">
        <button 
          type="submit" 
          class="wpcf7-form-control wpcf7-submit qodef-button qodef-size--large qodef-layout--filled qodef-html--link qodef-m"
          :disabled="isSubmitting || phoneError"
        >
          <span class="qodef-m-text">{{ isSubmitting ? 'Wird gesendet...' : 'Absenden' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { calendarAPI } from '@/services/api';
import vSelect from 'vue-select';
import 'vue-select/dist/vue-select.css';

export default {
  name: 'BookingForm',
  components: {
    vSelect
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    
    const appointmentDate = ref(null);
    const appointmentTime = ref(null);
    const isSubmitting = ref(false);
    const recaptchaError = ref(false);
    const phoneError = ref(false);
    
    const carBrands = [
      'Acura', 'Alfa Romeo', 'Audi', 'Bentley', 'BMW', 'Buick', 'Cadillac', 
      'Chevrolet', 'Chrysler', 'Citroën', 'Dacia', 'Dodge', 'DS Automobiles', 
      'Fiat', 'Ford', 'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 
      'Jaguar', 'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Lincoln', 'Lotus', 
      'Lucid', 'Maserati', 'Mazda', 'Mercedes-Benz', 'Mercury', 'Mini', 
      'Mitsubishi', 'Nissan', 'Opel', 'Peugeot', 'Polestar', 'Pontiac', 
      'Porsche', 'Ram', 'Renault', 'Rivian', 'Rolls-Royce', 'Saab', 'Saturn', 
      'Scion', 'Seat', 'Skoda', 'Smart', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 
      'Volkswagen', 'Volvo'
    ];
    
    const currentYear = new Date().getFullYear();
    const carYears = Array.from({ length: 24 }, (_, i) => (currentYear - 23 + i).toString());
    
    const form = ref({
      name: '',
      phone: '',
      manufacturer: '',
      year: ''
    });

    // Swiss phone number validation
    const validateSwissPhoneNumber = (phone) => {
      // Remove all non-digit characters for validation
      const digitsOnly = phone.replace(/\D/g, '');
      
      // Swiss phone numbers can be:
      // - Mobile: 07X XXX XX XX (10 digits starting with 07)
      // - Landline: 0XX XXX XX XX (10 digits starting with 0 but not 07)
      // - International format: +41 7X XXX XX XX or +41 XX XXX XX XX
      
      // Check if it's a valid Swiss number
      if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
        return true;
      } else if (digitsOnly.startsWith('41') && digitsOnly.length === 11) {
        return true;
      } else if (digitsOnly.startsWith('0041') && digitsOnly.length === 13) {
        return true;
      }
      
      return false;
    };

    // Format Swiss phone number as user types
    const formatPhoneNumber = () => {
      let value = form.value.phone;
      
      // Remove all non-digit characters except +
      value = value.replace(/[^\d+]/g, '');
      
      // Format based on the input pattern
      if (value.startsWith('+41')) {
        // International format: +41 XX XXX XX XX
        if (value.length > 3) {
          value = '+41 ' + value.substring(3);
        }
        if (value.length > 6) {
          value = value.substring(0, 6) + ' ' + value.substring(6);
        }
        if (value.length > 10) {
          value = value.substring(0, 10) + ' ' + value.substring(10);
        }
        if (value.length > 13) {
          value = value.substring(0, 13) + ' ' + value.substring(13);
        }
      } else if (value.startsWith('0')) {
        // National format: 0XX XXX XX XX
        if (value.length > 3) {
          value = value.substring(0, 3) + ' ' + value.substring(3);
        }
        if (value.length > 7) {
          value = value.substring(0, 7) + ' ' + value.substring(7);
        }
        if (value.length > 10) {
          value = value.substring(0, 10) + ' ' + value.substring(10);
        }
      }
      
      form.value.phone = value;
      
      // Validate the phone number
      phoneError.value = form.value.phone.length > 0 && !validateSwissPhoneNumber(form.value.phone);
    };

    // Load reCAPTCHA v3
    const loadRecaptchaScript = () => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?render=6LdNrvwqAAAAAKxVDZG9t4sQ1nb9xCP4w_Lci-6p';
        script.async = true;
        script.defer = true;
        
        script.onload = resolve;
        script.onerror = reject;
        
        document.head.appendChild(script);
      });
    };

    

    // Submit booking
    const submitBooking = async () => {
      if (isSubmitting.value) return;
      
      if (!validateSwissPhoneNumber(form.value.phone)) {
        phoneError.value = true;
        return;
      }
      
      isSubmitting.value = true;
      recaptchaError.value = false;
      
      try {
        // Get reCAPTCHA token
        let recaptchaToken = '';
        try {
          if (window.grecaptcha) {
            recaptchaToken = await window.grecaptcha.execute(process.env.VUE_APP_RECAPTCHA_SITE_KEY, {action: 'submit'});
          }
        } catch (recaptchaError) {
          console.error('reCAPTCHA error:', recaptchaError);
          // Continue without token in development
          if (process.env.NODE_ENV !== 'development') {
            throw new Error('Sicherheitsüberprüfung fehlgeschlagen');
          }
        }
        
        // Prepare booking data
        const bookingData = {
          userId: route.params.userId,
          appointmentDate: appointmentDate.value,
          appointmentTime: appointmentTime.value,
          customerDetails: {
            name: form.value.name,
            phone: form.value.phone,
            carManufacturer: form.value.manufacturer,
            carYear: form.value.year
          },
          recaptchaToken
        };
        
        // Submit booking to API
        const response = await calendarAPI.createBooking(bookingData);
        
        console.log('Booking successful:', response);
        
        // Redirect to confirmation page with details
        router.push({
          path: '/booking-confirmation',
          query: {
            name: form.value.name,
            date: appointmentDate.value.toISOString(),
            time: appointmentTime.value,
            manufacturer: form.value.manufacturer,
            year: form.value.year,
            phone: form.value.phone,
            // Include additional information needed for calendar integration
            description: `Reifen wechseln bei Garage Wertli\nPhone: ${form.value.phone}\nCar: ${form.value.manufacturer} (${form.value.year})`,
            location: 'Neunbrunnenstrasse 255, 8046 Zürich'
          }
        });
      } catch (error) {
        console.error('Booking error:', error);
        
        if (error.message && error.message.includes('Sicherheitsüberprüfung')) {
          recaptchaError.value = true;
        } else {
          alert(`Buchung fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`);
        }
      } finally {
        isSubmitting.value = false;
      }
    };

    // Format date for display
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return format(date, 'EEEE, d. MMMM yyyy', { locale: de });
    };

    // Format time for display
    const formatTime = (timeString) => {
      if (!timeString) return '';
      return timeString;
    };

    onMounted(() => {
      // Load appointment details from route query parameters
      appointmentDate.value = route.query.date;
      appointmentTime.value = route.query.time;
      
      // Load reCAPTCHA
      loadRecaptchaScript().catch(error => {
        console.error('Failed to load reCAPTCHA:', error);
        recaptchaError.value = true;
      });
    });

    return {
      form,
      appointmentDate,
      appointmentTime,
      isSubmitting,
      recaptchaError,
      phoneError,
      carBrands,
      carYears,
      formatDate,
      formatTime,
      formatPhoneNumber,
      submitBooking
    };
  }
};
</script>

<style>
/* Import Vue Select CSS */
@import 'vue-select/dist/vue-select.css';

/* Custom styles for Vue Select */
.v-select {
  --vs-border-color: #e0e0e0;
  --vs-border-width: 1px;
  --vs-border-radius: 4px;
  --vs-controls-color: #555;
  --vs-search-input-color: #333;
  --vs-dropdown-bg: #fff;
  --vs-dropdown-color: #333;
  --vs-dropdown-option-color: #333;
  --vs-selected-bg: #f0f0f0;
  --vs-selected-color: #333;
}

.v-select .vs__dropdown-toggle {
  padding: 11px 0;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  height: 46px;
  background-color: white;
}

.v-select .vs__search::placeholder {
  color: #999;
}

.v-select .vs__selected {
  font-weight: 500;
  margin: 0 2px 0 6px;
}

.v-select .vs__dropdown-menu {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.v-select .vs__dropdown-option {
  padding: 10px 12px;
}

.v-select .vs__dropdown-option--highlight {
  background: #4169e1;
  color: white;
}

.v-select .vs__actions {
  padding-right: 10px;
}

.v-select .vs__clear {
  display: none;
}

/* Fix for dropdown positioning */
.select-wrapper {
  position: relative;
  width: 100%;
}

.select-wrapper .vs__dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  margin-top: 4px;
}
</style>

<style scoped>
.booking-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
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

.appointment-details {
  background: #f5f6f8;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.appointment-details h2 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.2em;
}

.qodef-appontment-form-2 {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.qodef-col-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  width: 100%;
  margin-bottom: 0;
  position: relative;
}

label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
}

input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
  height: 46px;
}

.phone-error {
  border-color: #d32f2f;
}

.error-message {
  color: #d32f2f;
  font-size: 12px;
  margin-top: 4px;
}

.form-notes {
  margin: 10px 0;
}

.qodef-short-note {
  color: #666;
  font-size: 14px;
  font-style: italic;
  line-height: 1.5;
}

.form-submit {
  margin-top: 10px;
}

.wpcf7-submit {
  padding: 12px 24px;
  background: #4169e1;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
  height: 46px;
}

.wpcf7-submit:hover:not(:disabled) {
  background: #3151b7;
}

.wpcf7-submit:disabled {
  background: #c5cae9;
  cursor: not-allowed;
}

.recaptcha-error {
  color: #d32f2f;
  font-size: 14px;
  margin: 10px 0;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
  text-align: center;
}

@media (max-width: 768px) {
  .qodef-col-2, .form-row {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}
</style> 