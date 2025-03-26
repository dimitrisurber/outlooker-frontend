<template>
  <div class="calendar-connected">
    <div class="success-container">
      <div class="success-icon">✓</div>
      <h1>Calendar Connected Successfully!</h1>
      <p>Your Google Calendar has been successfully connected to the booking system.</p>
      <div class="buttons">
        <button class="primary-button" @click="goToDashboard">Go to Dashboard</button>
        <button class="secondary-button" @click="closeWindow">Close Window</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CalendarConnected',
  methods: {
    goToDashboard() {
      this.$router.push('/dashboard');
    },
    closeWindow() {
      window.close();
    }
  }
}
</script>

<style scoped>
.calendar-connected {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 2rem;
}

.success-container {
  background: white;
  padding: 3rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.success-icon {
  font-size: 4rem;
  color: #42b983;
  margin-bottom: 1rem;
  height: 80px;
  width: 80px;
  line-height: 80px;
  border-radius: 50%;
  background-color: #f0faf5;
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