<template>
  <div class="service-selector">
    <div v-if="!userId" class="error-container">
      <h2>Invalid Access</h2>
      <p class="error-message">This booking page requires a valid user ID.</p>
      <p class="help-text">Please ensure you're using the correct booking link provided to you.</p>
    </div>
    <div v-else>
      <h2>Select Service Type</h2>
      <div class="service-options">
        <div 
          class="service-option"
          :class="{ selected: selectedService === 'rad' }"
          @click="selectService('rad')"
        >
          <h3>Rad Service</h3>
          <p>Duration: 30 minutes</p>
          <p>Basic wheel service and maintenance</p>
        </div>
        <div 
          class="service-option"
          :class="{ selected: selectedService === 'reifen' }"
          @click="selectService('reifen')"
        >
          <h3>Reifen Service</h3>
          <p>Duration: 60 minutes</p>
          <p>Complete tire service and replacement</p>
        </div>
      </div>
      <button 
        class="continue-button"
        :disabled="!selectedService"
        @click="continueToBooking"
      >
        Continue to Booking
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ServiceSelector',
  data() {
    return {
      selectedService: null
    }
  },
  computed: {
    userId() {
      return this.$route.params.userId;
    }
  },
  methods: {
    selectService(service) {
      this.selectedService = service;
    },
    continueToBooking() {
      if (this.selectedService && this.userId) {
        this.$router.push({
          name: 'booking',
          params: { userId: this.userId },
          query: { service: this.selectedService }
        });
      }
    }
  },
  created() {
    // If no userId is present, redirect to dashboard after a short delay
    if (!this.userId) {
      setTimeout(() => {
        this.$router.push('/dashboard');
      }, 3000);
    }
  }
}
</script>

<style scoped>
.service-selector {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.error-container {
  text-align: center;
  padding: 3rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #2c3e50;
}

.service-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.service-option {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.service-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.service-option.selected {
  border-color: #42b983;
  background-color: #f0faf5;
}

.service-option h3 {
  margin: 0 0 1rem;
  color: #2c3e50;
}

.service-option p {
  margin: 0.5rem 0;
  color: #666;
}

.continue-button {
  display: block;
  width: 100%;
  max-width: 300px;
  margin: 2rem auto 0;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  color: white;
  background-color: #42b983;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.continue-button:disabled {
  background-color: #a8a8a8;
  cursor: not-allowed;
}

.continue-button:not(:disabled):hover {
  background-color: #3aa876;
}

.error-message {
  color: #dc3545;
  font-size: 1.1rem;
  margin: 1rem 0;
}

.help-text {
  color: #666;
  margin-top: 1rem;
}
</style> 