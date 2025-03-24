<template>
  <div class="calendar-error">
    <div class="error-container">
      <div class="error-icon">!</div>
      <h1>Connection Failed</h1>
      <p>Sorry, we couldn't connect to your Google Calendar.</p>
      <p v-if="errorMessage" class="error-details">{{ errorMessage }}</p>
      <p v-else>Please try again or contact support if the problem persists.</p>
      <div class="button-group">
        <button @click="tryAgain" class="primary-button">Try Again</button>
        <button @click="goToDashboard" class="secondary-button">Go to Dashboard</button>
      </div>
    </div>
  </div>
</template>

<script>
import { calendarAPI } from '@/services/api';

export default {
  name: 'CalendarError',
  data() {
    return {
      errorMessage: ''
    };
  },
  created() {
    // Get error message from URL if present
    if (this.$route.query.error) {
      this.errorMessage = decodeURIComponent(this.$route.query.error);
    }
  },
  methods: {
    tryAgain() {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.id) {
        calendarAPI.connectGoogleCalendar(user.id);
      } else {
        this.$router.push('/login');
      }
    },
    goToDashboard() {
      this.$router.push('/dashboard');
    }
  }
}
</script>

<style scoped>
.calendar-error {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f6f8;
}

.error-container {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  padding: 40px;
  text-align: center;
  max-width: 500px;
}

.error-icon {
  background-color: #f44336;
  color: white;
  width: 80px;
  height: 80px;
  line-height: 80px;
  font-size: 40px;
  border-radius: 50%;
  margin: 0 auto 20px;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

p {
  color: #666;
  margin-bottom: 10px;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.primary-button {
  background-color: #4169e1;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.primary-button:hover {
  background-color: #3151b7;
}

.secondary-button {
  background-color: #f5f6f8;
  color: #333;
  border: 1px solid #ddd;
  padding: 12px 24px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.secondary-button:hover {
  background-color: #e8e9eb;
}

.error-details {
  color: #721c24;
  background-color: #f8d7da;
  padding: 10px;
  border-radius: 5px;
  margin: 15px 0;
  font-size: 14px;
  text-align: left;
  word-break: break-word;
}
</style> 