import { Schedule } from '@/utils/schedule';
import { parseISO, addDays } from 'date-fns';

describe('Schedule', () => {
  let schedule;
  const testDate = parseISO('2024-03-01');
  
  beforeEach(() => {
    schedule = new Schedule({
      defaultDuration: 30,
      minDuration: 15,
      workingHours: {
        start: '09:00',
        end: '17:00'
      },
      breakTime: 5
    });
  });

  describe('generateTimeSlots', () => {
    it('should generate slots for empty calendar', () => {
      const slots = schedule.generateTimeSlots(testDate, []);
      
      expect(slots.length).toBe(32); // 8 hours with 15-min intervals
      expect(slots[0]).toEqual({
        start: '09:00',
        end: '09:30',
        available: true
      });
    });

    it('should respect existing events', () => {
      const existingEvents = [{
        start: '2024-03-01T10:00:00',
        end: '2024-03-01T11:00:00'
      }];

      const slots = schedule.generateTimeSlots(testDate, existingEvents);
      
      const blockedSlots = slots.filter(slot => 
        slot.start >= '10:00' && slot.start < '11:00'
      );
      
      expect(blockedSlots.length).toBe(0);
    });

    it('should handle break time between appointments', () => {
      const existingEvents = [{
        start: '2024-03-01T14:00:00',
        end: '2024-03-01T14:30:00'
      }];

      const slots = schedule.generateTimeSlots(testDate, existingEvents);
      const slotAfterEvent = slots.find(slot => slot.start === '14:35');
      
      expect(slotAfterEvent).toBeDefined();
      expect(slotAfterEvent.available).toBe(true);
    });
  });

  describe('isSlotAvailable', () => {
    it('should return true for available slot', () => {
      const start = parseISO('2024-03-01T09:00:00');
      const end = parseISO('2024-03-01T09:30:00');
      const existingEvents = [];

      expect(schedule.isSlotAvailable(start, end, existingEvents)).toBe(true);
    });

    it('should return false for overlapping slot', () => {
      const start = parseISO('2024-03-01T10:15:00');
      const end = parseISO('2024-03-01T10:45:00');
      const existingEvents = [{
        start: '2024-03-01T10:00:00',
        end: '2024-03-01T11:00:00'
      }];

      expect(schedule.isSlotAvailable(start, end, existingEvents)).toBe(false);
    });

    it('should respect break time', () => {
      const start = parseISO('2024-03-01T11:00:00');
      const end = parseISO('2024-03-01T11:30:00');
      const existingEvents = [{
        start: '2024-03-01T10:30:00',
        end: '2024-03-01T11:00:00'
      }];

      expect(schedule.isSlotAvailable(start, end, existingEvents)).toBe(false);
    });
  });

  describe('findNextAvailableSlot', () => {
    it('should find next available slot', () => {
      const after = parseISO('2024-03-01T13:00:00');
      const existingEvents = [{
        start: '2024-03-01T13:00:00',
        end: '2024-03-01T14:00:00'
      }];

      const nextSlot = schedule.findNextAvailableSlot(after, existingEvents);
      
      expect(nextSlot).toEqual({
        start: '14:05',
        end: '14:35',
        available: true
      });
    });

    it('should return null if no slots available', () => {
      const after = parseISO('2024-03-01T16:45:00');
      const existingEvents = [];

      const nextSlot = schedule.findNextAvailableSlot(after, existingEvents);
      
      expect(nextSlot).toBeNull();
    });
  });

  describe('calculateDuration', () => {
    it('should calculate duration correctly', () => {
      expect(schedule.calculateDuration('09:00', '09:30')).toBe(30);
      expect(schedule.calculateDuration('14:15', '14:30')).toBe(15);
      expect(schedule.calculateDuration('10:00', '11:00')).toBe(60);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple overlapping events', () => {
      const existingEvents = [
        {
          start: '2024-03-01T10:00:00',
          end: '2024-03-01T11:00:00'
        },
        {
          start: '2024-03-01T10:30:00',
          end: '2024-03-01T11:30:00'
        }
      ];

      const slots = schedule.generateTimeSlots(testDate, existingEvents);
      const blockedSlots = slots.filter(slot => 
        slot.start >= '10:00' && slot.start < '11:30'
      );
      
      expect(blockedSlots.length).toBe(0);
    });

    it('should handle events at day boundaries', () => {
      const existingEvents = [
        {
          start: '2024-03-01T08:00:00',
          end: '2024-03-01T09:30:00'
        },
        {
          start: '2024-03-01T16:30:00',
          end: '2024-03-01T18:00:00'
        }
      ];

      const slots = schedule.generateTimeSlots(testDate, existingEvents);
      
      expect(slots[0].start).toBe('09:35');
      expect(slots[slots.length - 1].end).toBe('16:30');
    });
  });
}); 