<template>
  <div class="login-container">
    <form @submit.prevent="handleLogin" class="login-form">
      <h2>Login</h2>
      
      <div class="form-group">
        <label for="username">Username</label>
        <input 
          type="text" 
          id="username"
          v-model="username"
          required
          autocomplete="username"
        >
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input 
          type="password" 
          id="password"
          v-model="password"
          required
          autocomplete="current-password"
        >
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Logging in...' : 'Login' }}
      </button>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authAPI } from '@/services/api';

export default {
  name: 'LoginView',
  setup() {
    const router = useRouter();
    const username = ref('');
    const password = ref('');
    const error = ref('');
    const isLoading = ref(false);

    const handleLogin = async () => {
      try {
        isLoading.value = true;
        error.value = '';
        
        console.log('Attempting login for user:', username.value);
        
        // Call the login API
        const response = await authAPI.login({
          username: username.value,
          password: password.value
        });
        
        console.log('Login API response:', response.data);
        
        // Direct check for token in response
        if (!response.data.token) {
          console.error('No token in login response');
          throw new Error('No authentication token received from server');
        }
        
        // Auth check is redundant since login already sets the token,
        // but we'll do it anyway to ensure everything is working
        const isAuthenticated = await authAPI.checkAuth();
        
        if (isAuthenticated) {
          console.log('Successfully authenticated, redirecting to dashboard');
          router.push('/dashboard');
        } else {
          console.error('Authentication check failed after login');
          throw new Error('Authentication verification failed');
        }
      } catch (err) {
        console.error('Login error:', err);
        // Try to extract a user-friendly error message
        if (err.response?.data?.error) {
          error.value = err.response.data.error;
        } else if (err.message) {
          error.value = err.message;
        } else {
          error.value = 'Failed to login. Please try again.';
        }
      } finally {
        isLoading.value = false;
      }
    };

    return {
      username,
      password,
      error,
      isLoading,
      handleLogin
    };
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.login-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

button {
  width: 100%;
  padding: 0.75rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  background-color: #0056b3;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.875rem;
}
</style> 