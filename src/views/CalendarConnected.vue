<template>
  <div class="calendar-connected">
    <div class="success-container">
      <div class="success-icon">✓</div>
      <h1>Google Calendar Connected!</h1>
      <p>Your Google Calendar has been successfully connected to your account.</p>
      <p>You can now manage your appointments and availability.</p>
      <button @click="goToDashboard" class="primary-button">Go to Dashboard</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CalendarConnected',
  methods: {
    goToDashboard() {
      this.$router.push('/dashboard');
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
  background-color: #f5f6f8;
}

.success-container {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  padding: 40px;
  text-align: center;
  max-width: 500px;
}

.success-icon {
  background-color: #4caf50;
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

.primary-button {
  background-color: #4169e1;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
  transition: background-color 0.3s;
}

.primary-button:hover {
  background-color: #3151b7;
}
</style> 