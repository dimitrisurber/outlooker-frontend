import { addMinutes, parseISO, format, isWithinInterval } from 'date-fns';

export class Schedule {
  constructor(config = {}) {
    this.defaultDuration = config.defaultDuration || 30;
    this.minDuration = config.minDuration || 15;
    this.workingHours = config.workingHours || {
      start: '09:00',
      end: '17:00'
    };
    this.breakTime = config.breakTime || 0; // minutes between appointments
  }

  /**
   * Generate available time slots based on existing events
   * @param {Date} date - The date to generate slots for
   * @param {Array} existingEvents - Array of existing calendar events
   * @returns {Array} Available time slots
   */
  generateTimeSlots(date, existingEvents = []) {
    const slots = [];
    const startTime = parseISO(`${format(date, 'yyyy-MM-dd')}T${this.workingHours.start}`);
    const endTime = parseISO(`${format(date, 'yyyy-MM-dd')}T${this.workingHours.end}`);
    
    let currentTime = startTime;
    
    while (currentTime < endTime) {
      const slotEnd = addMinutes(currentTime, this.defaultDuration);
      
      if (this.isSlotAvailable(currentTime, slotEnd, existingEvents)) {
        slots.push({
          start: format(currentTime, 'HH:mm'),
          end: format(slotEnd, 'HH:mm'),
          available: true
        });
      }
      
      currentTime = addMinutes(currentTime, this.minDuration);
    }
    
    return slots;
  }

  /**
   * Check if a time slot is available
   * @param {Date} start - Start time
   * @param {Date} end - End time
   * @param {Array} existingEvents - Array of existing calendar events
   * @returns {boolean}
   */
  isSlotAvailable(start, end, existingEvents) {
    // Add break time to slot end
    const slotEndWithBreak = addMinutes(end, this.breakTime);

    return !existingEvents.some(event => {
      const eventStart = parseISO(event.start);
      const eventEnd = parseISO(event.end);

      return (
        isWithinInterval(start, { start: eventStart, end: eventEnd }) ||
        isWithinInterval(end, { start: eventStart, end: eventEnd }) ||
        isWithinInterval(eventStart, { start, end: slotEndWithBreak })
      );
    });
  }

  /**
   * Find next available slot after a specific time
   * @param {Date} after - Time to start searching from
   * @param {Array} existingEvents - Array of existing calendar events
   * @returns {Object|null} Next available slot or null if none found
   */
  findNextAvailableSlot(after, existingEvents) {
    const slots = this.generateTimeSlots(after, existingEvents);
    const afterTime = format(after, 'HH:mm');
    
    return slots.find(slot => slot.start > afterTime && slot.available) || null;
  }

  /**
   * Calculate duration between two times
   * @param {string} start - Start time (HH:mm)
   * @param {string} end - End time (HH:mm)
   * @returns {number} Duration in minutes
   */
  calculateDuration(start, end) {
    const startDate = parseISO(`2000-01-01T${start}`);
    const endDate = parseISO(`2000-01-01T${end}`);
    return Math.round((endDate - startDate) / (1000 * 60));
  }
} 