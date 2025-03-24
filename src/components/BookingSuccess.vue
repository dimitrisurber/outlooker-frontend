<template>
  <div class="booking-success">
    <div class="success-card">
      <div class="icon-wrapper">
        <div class="success-icon">✓</div>
      </div>
      <h1>Buchung erfolgreich!</h1>
      <p class="message">Vielen Dank für Ihre Buchung, <strong>{{ customerName }}</strong>.</p>
      <div class="details">
        <div class="detail-item">
          <span class="label">Termin:</span>
          <span class="value">{{ formatDate(appointmentDate) }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Uhrzeit:</span>
          <span class="value">{{ formatTime(appointmentTime) }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Leistung:</span>
          <span class="value">Reifen wechseln</span>
        </div>
        <div class="detail-item">
          <span class="label">Ort:</span>
          <span class="value">Garage Wertli, Neunbrunnenstrasse 255, 8046 Zürich</span>
        </div>
      </div>
      <p class="follow-up">
        Wir haben Ihren Termin erfolgreich in unserem System eingetragen. 
        Eine Bestätigung wurde an Ihr Gerät gesendet.
      </p>
      
      <!-- Calendar Integration Options -->
      <div class="calendar-options">
        <h3>Termin zum Kalender hinzufügen</h3>
        <div class="calendar-buttons">
          <a :href="googleCalendarUrl" target="_blank" class="calendar-button google">
            <div class="icon">
              <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17,4V2h-2v2H9V2H7v2H3v18h18V4H17z M10,18H6v-4h4V18z M10,13H6V9h4V13z M15,18h-4v-4h4V18z M15,13h-4V9h4V13z M20,18
                h-4v-4h4V18z M20,13h-4V9h4V13z" fill="currentColor"/>
              </svg>
            </div>
            <span>Google Kalender</span>
          </a>
          <a :href="outlookCalendarUrl" target="_blank" class="calendar-button outlook">
            <div class="icon">
              <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-9 14H7V9h3v8zm8 0h-6v-1h6v1zm0-3h-6v-1h6v1zm0-3h-6V9h6v1zm-9-1h-2v-2h2v2z" fill="currentColor"/>
              </svg>
            </div>
            <span>Outlook Kalender</span>
          </a>
          <a :href="icsFileUrl" download="appointment.ics" class="calendar-button ics">
            <div class="icon">
              <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
              </svg>
            </div>
            <span>ICS Datei downloaden</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useRoute, useRouter } from 'vue-router';

export default {
  name: 'BookingSuccess',
  setup() {
    const route = useRoute();
    const router = useRouter();
    
    // Get booking details from query params
    const customerName = route.query.name || 'Kunde';
    const appointmentDate = route.query.date || '';
    const appointmentTime = route.query.time || '';
    
    // Get location and description from query params
    const location = route.query.location || '';
    const description = route.query.description || '';
    
    // Format date for display
    const formatDate = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return format(date, 'EEEE, d. MMMM yyyy', { locale: de });
      } catch (error) {
        console.error('Date formatting error:', error);
        return dateString;
      }
    };
    
    // Format time for display
    const formatTime = (timeString) => {
      if (!timeString) return '';
      
      // If it's an ISO string with date and time (2025-03-25T16:30)
      if (timeString.includes('T')) {
        try {
          const time = new Date(timeString);
          return format(time, 'HH:mm', { locale: de });
        } catch (error) {
          // If parsing fails, just return the original
          return timeString.split('T')[1] || timeString;
        }
      }
      
      return timeString;
    };
    
    // Parse appointment date and time into Date objects
    const getStartEndDates = () => {
      let startDate, endDate;
      
      try {
        // Parse appointment date and time
        if (appointmentTime.includes('T')) {
          // Full ISO date-time string
          startDate = new Date(appointmentTime);
        } else {
          // Separate date and time
          startDate = new Date(`${appointmentDate}T${appointmentTime}`);
        }
        
        // End time is 30 minutes after start time
        endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + 30);
        
        return { startDate, endDate };
      } catch (error) {
        console.error('Error parsing dates:', error);
        return { 
          startDate: new Date(), 
          endDate: new Date(new Date().setMinutes(new Date().getMinutes() + 30)) 
        };
      }
    };
    
    // Generate Google Calendar URL
    const googleCalendarUrl = (() => {
      const { startDate, endDate } = getStartEndDates();
      
      const formatGoogleCalendarDate = (date) => {
        return date.toISOString().replace(/-|:|\.\d+/g, '');
      };
      
      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: `Reifen wechseln bei Garage Wertli - ${customerName}`,
        dates: `${formatGoogleCalendarDate(startDate)}/${formatGoogleCalendarDate(endDate)}`,
        details: description || `Reifen wechseln bei Garage Wertli\nTermin für ${customerName}`,
        location: location || 'Neunbrunnenstrasse 255, 8046 Zürich'
      });
      
      return `https://calendar.google.com/calendar/render?${params.toString()}`;
    })();
    
    // Generate Outlook Calendar URL
    const outlookCalendarUrl = (() => {
      const { startDate, endDate } = getStartEndDates();
      
      const formatOutlookDate = (date) => {
        return date.toISOString();
      };
      
      const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        subject: `Reifen wechseln bei Garage Wertli - ${customerName}`,
        startdt: formatOutlookDate(startDate),
        enddt: formatOutlookDate(endDate),
        body: description || `Reifen wechseln bei Garage Wertli\nTermin für ${customerName}`,
        location: location || 'Neunbrunnenstrasse 255, 8046 Zürich'
      });
      
      return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
    })();
    
    // Generate ICS file URL
    const icsFileUrl = (() => {
      const { startDate, endDate } = getStartEndDates();
      
      const formatICSDate = (date) => {
        return date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, -1) + 'Z';
      };
      
      const escapeICSText = (text) => {
        return text.replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n');
      };
      
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Garage Wertli//Reifen wechseln//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `DTSTART:${formatICSDate(startDate)}`,
        `DTEND:${formatICSDate(endDate)}`,
        `SUMMARY:${escapeICSText(`Reifen wechseln bei Garage Wertli - ${customerName}`)}`,
        `DESCRIPTION:${escapeICSText(description || `Reifen wechseln bei Garage Wertli\nTermin für ${customerName}`)}`,
        `LOCATION:${escapeICSText(location || 'Neunbrunnenstrasse 255, 8046 Zürich')}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');
      
      // Create a Blob containing the ICS content
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      
      // Create a URL for the Blob
      return URL.createObjectURL(blob);
    })();
    
    // Go back to home page
    const goHome = () => {
      router.push('/');
    };
    
    return {
      customerName,
      appointmentDate,
      appointmentTime,
      formatDate,
      formatTime,
      goHome,
      googleCalendarUrl,
      outlookCalendarUrl,
      icsFileUrl
    };
  }
};
</script>

<style scoped>
.booking-success {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f7f9fc;
}

.success-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 40px;
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.icon-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.success-icon {
  background-color: #4caf50;
  color: white;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: bold;
}

h1 {
  margin-bottom: 20px;
  color: #333;
  font-size: 24px;
}

.message {
  margin-bottom: 30px;
  font-size: 18px;
  color: #555;
}

.details {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 25px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.detail-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.label {
  font-weight: 600;
  color: #555;
}

.value {
  color: #333;
}

.follow-up {
  margin-bottom: 20px;
  color: #666;
  line-height: 1.6;
}

.calendar-options {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 25px;
}

.calendar-options h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
  color: #444;
}

.calendar-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.calendar-button {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  color: white;
}

.calendar-button .icon {
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-button.google {
  background-color: #4285f4;
}

.calendar-button.google:hover {
  background-color: #3367d6;
}

.calendar-button.outlook {
  background-color: #0078d4;
}

.calendar-button.outlook:hover {
  background-color: #0062ad;
}

.calendar-button.ics {
  background-color: #555;
}

.calendar-button.ics:hover {
  background-color: #444;
}

.actions {
  margin-top: 30px;
}

.home-button {
  background-color: #4169e1;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.home-button:hover {
  background-color: #3151b7;
}

@media (min-width: 576px) {
  .calendar-buttons {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .calendar-button {
    flex: 1;
    min-width: 180px;
    justify-content: center;
  }
}
</style> 