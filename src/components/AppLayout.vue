<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="logo">
        <router-link to="/">WhatsApp Calendar Bookr</router-link>
      </div>
      <nav class="main-nav">
        <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
        <router-link to="/calendar" class="nav-link">Calendar</router-link>
        <router-link to="/bookings" class="nav-link">Bookings</router-link>
      </nav>
      <div class="user-menu">
        <button @click="logout" class="logout-button">Logout</button>
      </div>
    </header>
    
    <main class="app-content">
      <!-- This is where the page content will be rendered -->
      <slot></slot>
    </main>
    
    <footer class="app-footer">
      <p>&copy; 2023 WhatsApp Calendar Bookr</p>
    </footer>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';
import { authAPI } from '@/services/api';

export default {
  name: 'AppLayout',
  setup() {
    const router = useRouter();
    
    const logout = async () => {
      try {
        await authAPI.logout();
        localStorage.removeItem('token');
        router.push('/login');
      } catch (error) {
        console.error('Logout failed:', error);
      }
    };
    
    return {
      logout
    };
  }
};
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: #4285f4;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.logo a {
  color: white;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
}

.main-nav {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 0;
  position: relative;
}

.nav-link:hover {
  color: #f1f1f1;
}

.nav-link.router-link-active {
  font-weight: bold;
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: white;
}

.user-menu {
  display: flex;
  align-items: center;
}

.logout-button {
  background: transparent;
  border: 1px solid white;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.logout-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.app-content {
  flex: 1;
  padding: 1rem;
  background-color: #f9f9f9;
}

.app-footer {
  background-color: #f1f1f1;
  padding: 1rem;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
}
</style> 