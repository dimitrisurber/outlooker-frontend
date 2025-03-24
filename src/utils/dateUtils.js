import { format, addDays, parseISO } from 'date-fns';

// Swiss timezone
export const SWISS_TIMEZONE = 'Europe/Zurich';

/**
 * Convert a date to Swiss timezone using Intl
 * @param {Date|string} date - The date to convert
 * @returns {Date} Date object in Swiss timezone
 */
export const toSwissTime = (date) => {
  if (!date) return new Date();
  
  // Convert string to date if needed
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  
  // Use Intl to format the date in Swiss timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: SWISS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Format the date in Swiss timezone
  const formattedDate = formatter.format(inputDate);
  
  // Parse the formatted string back to a Date object
  const [month, day, year, hour, minute, second] = formattedDate
    .replace(',', '')
    .replace(/\//g, ' ')
    .replace(':', ' ')
    .replace(':', ' ')
    .split(' ')
    .map(n => parseInt(n, 10));
  
  return new Date(year, month - 1, day, hour, minute, second);
};

/**
 * Format a date using Swiss timezone
 * @param {Date|string} date - The date to format
 * @param {string} formatStr - The format string (date-fns format)
 * @returns {string} Formatted date string
 */
export const formatSwissDate = (date, formatStr = 'd MMM, yyyy') => {
  if (!date) return '';
  const swissDate = toSwissTime(date);
  return format(swissDate, formatStr);
};

/**
 * Format a time string or time part of date in Swiss timezone
 * @param {string|Date} time - Time string (HH:mm or ISO) or Date object
 * @returns {string} Formatted time string
 */
export const formatSwissTime = (time) => {
  if (!time) return '';
  
  let date;
  
  if (time instanceof Date) {
    date = time;
  } else {
    // Handle ISO string format (2025-03-24T09:00)
    let hours, minutes;
    
    if (time.includes('T')) {
      [hours, minutes] = time.split('T')[1].split(':');
    } else {
      // Handle HH:mm format
      [hours, minutes] = time.split(':');
    }
    
    // Create a date object with the time
    date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
  }
  
  // Convert to Swiss timezone
  const swissDate = toSwissTime(date);
  return format(swissDate, 'h:mm a');
};

/**
 * Get current date in Swiss timezone
 * @returns {Date} Current date in Swiss timezone
 */
export const getCurrentSwissDate = () => {
  return toSwissTime(new Date());
};

/**
 * Add days to a date in Swiss timezone
 * @param {Date} date - The base date
 * @param {number} days - Number of days to add
 * @returns {Date} New date with days added, in Swiss timezone
 */
export const addDaysInSwissTime = (date, days) => {
  const swissDate = toSwissTime(date);
  return addDays(swissDate, days);
};

/**
 * Compare two dates in Swiss timezone
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export const compareSwissDates = (date1, date2) => {
  const swiss1 = toSwissTime(date1);
  const swiss2 = toSwissTime(date2);
  
  if (swiss1 < swiss2) return -1;
  if (swiss1 > swiss2) return 1;
  return 0;
};

export default {
  SWISS_TIMEZONE,
  toSwissTime,
  formatSwissDate,
  formatSwissTime,
  getCurrentSwissDate,
  addDaysInSwissTime,
  compareSwissDates
}; 