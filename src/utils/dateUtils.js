import { format, addDays, parseISO } from 'date-fns';

/**
 * Format a date using standard format
 * @param {Date|string} date - The date to format
 * @param {string} formatStr - The format string (date-fns format)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, formatStr = 'd MMM, yyyy') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
};

/**
 * Format a time string or time part of date
 * @param {string|Date} time - Time string (HH:mm or ISO) or Date object
 * @returns {string} Formatted time string
 */
export const formatTime = (time) => {
  if (!time) return '';
  
  // If it's already in HH:mm format, return it directly
  if (/^\d{2}:\d{2}$/.test(time)) {
    return time;
  }
  
  // Handle ISO string format (2025-03-24T09:00)
  if (time.includes('T')) {
    const timePart = time.split('T')[1];
    return timePart.substring(0, 5); // Return just HH:mm
  }
  
  // For any other format, try to extract hours and minutes
  try {
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return time;
  }
};

/**
 * Get current date
 * @returns {Date} Current date
 */
export const getCurrentDate = () => {
  return new Date();
};

/**
 * Add days to a date
 * @param {Date} date - The base date
 * @param {number} days - Number of days to add
 * @returns {Date} New date with days added
 */
export const addDaysToDate = (date, days) => {
  return addDays(date, days);
};

/**
 * Compare two dates
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export const compareDates = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
};

export default {
  formatDate,
  formatTime,
  getCurrentDate,
  addDaysToDate,
  compareDates
}; 