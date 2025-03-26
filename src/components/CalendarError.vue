<template>
  <div class="calendar-error">
    <div class="error-container">
      <div class="error-icon">!</div>
      <h1>Calendar Connection Failed</h1>
      <p v-if="error">{{ error }}</p>
      <p v-else>There was an error connecting your Google Calendar. Please try again.</p>
      <div class="buttons">
        <button class="primary-button" @click="retryConnection">Try Again</button>
        <button class="secondary-button" @click="goToDashboard">Back to Dashboard</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CalendarError',
  computed: {
    error() {
      return this.$route.query.error;
    }
  },
  methods: {
    retryConnection() {
      // Get userId from localStorage or Vuex store
      const userId = localStorage.getItem('userId');
      if (userId) {
        window.location.href = `/api/calendar/auth?userId=${userId}`;
      } else {
        this.$router.push('/dashboard');
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
  background-color: #f5f5f5;
  padding: 2rem;
}

.error-container {
  background: white;
  padding: 3rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.error-icon {
  font-size: 3rem;
  color: #dc3545;
  margin-bottom: 1rem;
  height: 80px;
  width: 80px;
  line-height: 80px;
  border-radius: 50%;
  background-color: #fdf1f1;
  margin: 0 auto 1.5rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.8rem;
}

p {
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.primary-button,
.secondary-button {
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.primary-button {
  background-color: #42b983;
  color: white;
}

.primary-button:hover {
  background-color: #3aa876;
}

.secondary-button {
  background-color: #e0e0e0;
  color: #2c3e50;
}

.secondary-button:hover {
  background-color: #d0d0d0;
}
</style> 