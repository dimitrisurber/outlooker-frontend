import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import components from './plugins/components'

// Set up axios defaults
axios.defaults.baseURL = process.env.VUE_APP_API_URL

// Configure Swiss timezone
try {
  // Set Swiss timezone for all date operations
  process.env.TZ = 'Europe/Zurich';
  
  // Configure Intl to use Swiss timezone
  if (Intl) {
    Intl.DateTimeFormat.prototype.formatOriginal = Intl.DateTimeFormat.prototype.format;
    Intl.DateTimeFormat.prototype.format = function(date) {
      const options = this.resolvedOptions();
      options.timeZone = 'Europe/Zurich';
      return new Intl.DateTimeFormat(options.locale, options).formatOriginal(date);
    };
    console.log('Swiss timezone configuration applied');
  }
} catch (e) {
  console.error('Failed to set Swiss timezone configuration:', e);
}

const app = createApp(App)

// Initialize auth before mounting
const initAuth = async () => {
  const token = localStorage.getItem('token')
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }
  
  app.use(router)
  app.use(components)
  app.mount('#app')
}

initAuth()
