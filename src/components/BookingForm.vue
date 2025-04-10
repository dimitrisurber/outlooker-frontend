<template>
  <div class="booking-form">
    <div class="header">
      <h1>Buchung abschließen</h1>
    </div>

    <div class="appointment-details">
      <h2>Termindetails</h2>
      <p><strong>Datum:</strong> {{ formatDate(appointmentDate) }}</p>
      <p><strong>Uhrzeit:</strong> {{ formatTime(appointmentTime) }}</p>
      <p><strong>Ort:</strong> Garage Wertli, Neunbrunnenstrasse 255, 8046 Zürich</p>
    </div>

    <div class="service-details" :class="{ 'error': !form.service }">
        <p v-if="form.service"><strong>Service:</strong> {{ form.service }}</p>
        <p v-else class="error-message">Service wurde nicht ausgewählt. Bitte gehen Sie zurück und wählen Sie einen Service.</p>
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
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="form.email" 
            class="wpcf7-form-control wpcf7-text"
            placeholder="beispiel@email.com"
          >
          <div class="helper-text">
            Wenn Sie eine Email angeben senden wir Ihnen eine Termineinladung
          </div>
        </div>
        
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
      </div>

      <div class="form-row qodef-col-2">
        <div class="form-group">
          <label for="year">Baujahr</label>
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
        <span class="">
          Wir geben unser Bestes, Ihre Terminwünsche zu berücksichtigen – aber manchmal kommt einfach etwas dazwischen. Bitte haben Sie Verständnis, dass wir nichts garantieren können.
        </span>
        <br>
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
      email: '',
      manufacturer: '',
      year: '',
      service: route.query.service || '',
      date: '',
      time: '',
      userId: route.params.userId,
      duration: 30 // Default duration in minutes
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
        // Check if already loaded
        if (window.grecaptcha) {
          console.log('reCAPTCHA already loaded');
          return resolve(window.grecaptcha);
        }
        
        // Check if reCAPTCHA is enabled in environment config
        const recaptchaEnabled = process.env.VUE_APP_RECAPTCHA_ENABLED !== 'false';
        if (!recaptchaEnabled) {
          console.log('reCAPTCHA is disabled by configuration');
          return resolve(null);
        }
        
        // Use environment variable for site key
        const siteKey = process.env.VUE_APP_RECAPTCHA_SITE_KEY;
        if (!siteKey) {
          console.error('reCAPTCHA site key not configured');
          return reject(new Error('reCAPTCHA site key missing'));
        }
        
        console.log('Loading reCAPTCHA with site key:', siteKey);
        
        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          console.log('reCAPTCHA script loaded successfully');
          // Ensure grecaptcha is ready
          window.grecaptcha.ready(() => {
            console.log('reCAPTCHA is ready');
            resolve(window.grecaptcha);
          });
        };
        
        script.onerror = (error) => {
          console.error('Error loading reCAPTCHA script:', error);
          reject(new Error('Failed to load reCAPTCHA script'));
        };
        
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
        // Check if reCAPTCHA is enabled in environment config
        const recaptchaEnabled = process.env.VUE_APP_RECAPTCHA_ENABLED !== 'false';
        
        // Get reCAPTCHA token if enabled
        let recaptchaToken = '';
        
        if (recaptchaEnabled) {
          try {
            // Try to load reCAPTCHA if not already loaded
            if (!window.grecaptcha) {
              console.log('reCAPTCHA not loaded, trying to load it now');
              await loadRecaptchaScript();
            }
            
            if (window.grecaptcha) {
              console.log('Executing reCAPTCHA to get token');
              const siteKey = process.env.VUE_APP_RECAPTCHA_SITE_KEY;
              
              if (!siteKey) {
                console.error('reCAPTCHA site key not configured');
                throw new Error('reCAPTCHA configuration error');
              }
              
              // Make sure grecaptcha is ready
              await new Promise(resolve => {
                if (window.grecaptcha.ready) {
                  window.grecaptcha.ready(resolve);
                } else {
                  resolve(); // If no ready function, continue anyway
                }
              });
              
              // Execute reCAPTCHA
              recaptchaToken = await window.grecaptcha.execute(siteKey, {action: 'submit'});
              console.log('Got reCAPTCHA token:', recaptchaToken.substring(0, 10) + '...');
              
              if (!recaptchaToken || recaptchaToken.trim() === '') {
                throw new Error('Empty reCAPTCHA token received');
              }
            } else {
              throw new Error('reCAPTCHA not available');
            }
          } catch (recaptchaError) {
            console.error('reCAPTCHA error:', recaptchaError);
            
            // In development, continue without token
            if (process.env.NODE_ENV === 'development') {
              console.warn('Development mode: continuing without reCAPTCHA token');
            } else {
              // In production, show error and stop
              recaptchaError.value = true;
              throw new Error('Sicherheitsüberprüfung fehlgeschlagen. Bitte versuchen Sie es erneut oder aktivieren Sie JavaScript.');
            }
          }
        } else {
          console.log('reCAPTCHA is disabled by configuration, continuing without token');
        }
        
        // Ensure appointmentDate is a proper Date object
        let formattedDate;
        if (appointmentDate.value) {
          const dateObj = (appointmentDate.value instanceof Date) 
            ? appointmentDate.value 
            : new Date(appointmentDate.value);
          
          if (isNaN(dateObj.getTime())) {
            console.error('Invalid date format:', appointmentDate.value);
            throw new Error('Ungültiges Datumsformat. Bitte wählen Sie ein gültiges Datum.');
          }
          
          formattedDate = dateObj.toISOString();
          console.log('Formatted appointment date:', formattedDate);
        } else {
          console.error('Missing appointment date');
          throw new Error('Bitte wählen Sie ein Datum für Ihren Termin.');
        }
        
        // Prepare booking data
        const bookingData = {
          userId: route.params.userId,
          appointmentDate: formattedDate,
          appointmentTime: appointmentTime.value,
          customerDetails: {
            name: form.value.name,
            phone: form.value.phone,
            email: form.value.email,
            carManufacturer: form.value.manufacturer,
            carYear: form.value.year,
            service: form.value.service
          },
          duration: form.value.duration
        };
        
        // Only add recaptchaToken if we actually have one
        if (recaptchaToken && recaptchaToken.trim() !== '') {
          bookingData.recaptchaToken = recaptchaToken;
        }
        
        console.log('Submitting booking with data:', {...bookingData, recaptchaToken: recaptchaToken ? 'Present (hidden)' : 'Missing'});
        
        // Submit booking to API
        const response = await calendarAPI.createBooking(bookingData);
        
        console.log('Booking successful:', response);
        
        // Trigger booking_success event with Google Ads tracking
        window.parent.postMessage({ 
          event: 'booking_success',
          googleAds: {
            event: 'conversion',
            send_to: 'AW-16946454602/K94kCLaEi7IaEMrA2ZA_'
          }
        }, '*');
        
        // Redirect to confirmation page with details
        router.push({
          path: '/booking-confirmation',
          query: {
            name: form.value.name,
            date: formattedDate,
            time: appointmentTime.value,
            manufacturer: form.value.manufacturer,
            year: form.value.year,
            phone: form.value.phone,
            email: form.value.email,
            // Include additional information needed for calendar integration
            description: `Reifen wechseln bei Garage Wertli\nPhone: ${form.value.phone}\nCar: ${form.value.manufacturer} (${form.value.year})`,
            location: 'Neunbrunnenstrasse 255, 8046 Zürich'
          }
        });
      } catch (error) {
        console.error('Booking error:', error);
        
        // Trigger booking_error event with Google Ads tracking
        window.parent.postMessage({ 
          event: 'booking_error',
          googleAds: {
            event: 'conversion',
            send_to: 'AW-16946454602/K94kCLaEi7IaEMrA2ZA_'
          },
          error: error.message || 'Unbekannter Fehler'
        }, '*');
        
        if (error.message && error.message.includes('Sicherheitsüberprüfung')) {
          recaptchaError.value = true;
        } else {
          alert(`Buchung fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`);
        }
      } finally {
        isSubmitting.value = false;
      }
    };

    // Format time for display
    const formatTime = (timeString) => {
      if (!timeString) return '';
      
      // If it's already in HH:mm format, return it directly
      if (/^\d{2}:\d{2}$/.test(timeString)) {
        return timeString;
      }
      
      // Handle ISO string format (2025-03-25T16:30)
      if (timeString.includes('T')) {
        const timePart = timeString.split('T')[1];
        return timePart.substring(0, 5); // Return just HH:mm
      }
      
      // For any other format, try to extract hours and minutes
      try {
        const [hours, minutes] = timeString.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      } catch (error) {
        console.error('Error formatting time:', error);
        return timeString;
      }
    };

    // Format date for display
    const formatDate = (dateValue) => {
      if (!dateValue) return '';
      
      let date;
      if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        // Try to parse the date string
        date = new Date(dateValue);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.error('Invalid date in formatDate:', dateValue);
          return dateValue.toString(); // Return the original string if parsing fails
        }
      }
      
      try {
        return format(date, 'EEEE, d. MMMM yyyy', { locale: de });
      } catch (error) {
        console.error('Error formatting date:', error);
        return dateValue.toString();
      }
    };

    onMounted(() => {
      // Load appointment details from route query parameters
      const dateParam = route.query.date;
      if (dateParam) {
        try {
          // Try to parse the date string to a proper Date object
          const dateObj = new Date(dateParam);
          if (!isNaN(dateObj.getTime())) {
            appointmentDate.value = dateObj;
            console.log('Appointment date set as Date object:', appointmentDate.value);
            
            // Ensure we have the date set in the form too
            form.value.date = dateParam;
          } else {
            console.error('Invalid date from URL:', dateParam);
            appointmentDate.value = dateParam; // Keep the string version as fallback
            form.value.date = dateParam;
          }
        } catch (error) {
          console.error('Error parsing date from URL:', error);
          appointmentDate.value = dateParam; // Keep the string version as fallback
          form.value.date = dateParam;
        }
      } else {
        console.warn('No date parameter found in URL');
      }
      
      // Set appointment time from route
      appointmentTime.value = route.query.time;
      // Ensure we have the time set in the form too
      form.value.time = route.query.time;
      
      // Set service from route
      form.value.service = route.query.service || '';
      console.log('Service from URL:', route.query.service);
      
      // Debug info
      console.log('Booking form initialized with:', {
        date: appointmentDate.value,
        time: appointmentTime.value,
        service: form.value.service,
        userId: form.value.userId
      });
      
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

.service-details {
  background: #f5f6f8;
  border-radius: 8px;
  padding: 15px 20px;
  margin: 10px 0;
  border: 1px solid transparent;
}

.service-details.error {
  background: #ffebee;
  border-color: #d32f2f;
}

.service-details p {
  margin: 0;
  font-size: 1.1em;
}

.service-details .error-message {
  color: #d32f2f;
  font-size: 1em;
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

.helper-text {
  color: #666;
  font-size: 0.85em;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .qodef-col-2, .form-row {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}
</style> 