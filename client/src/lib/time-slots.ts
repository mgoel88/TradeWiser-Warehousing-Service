
export const TIME_SLOTS = [
  { start: '00:00', end: '03:00', label: '12 AM - 3 AM' },
  { start: '03:00', end: '06:00', label: '3 AM - 6 AM' },
  { start: '06:00', end: '09:00', label: '6 AM - 9 AM' },
  { start: '09:00', end: '12:00', label: '9 AM - 12 PM' },
  { start: '12:00', end: '15:00', label: '12 PM - 3 PM' },
  { start: '15:00', end: '18:00', label: '3 PM - 6 PM' },
  { start: '18:00', end: '21:00', label: '6 PM - 9 PM' },
  { start: '21:00', end: '24:00', label: '9 PM - 12 AM' }
];

export function getAvailableTimeSlots(date: Date) {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  return TIME_SLOTS.filter(slot => {
    if (!isToday) return true;
    
    const [hours] = slot.start.split(':').map(Number);
    const slotTime = new Date(date);
    slotTime.setHours(hours, 0, 0, 0);
    
    return slotTime > now;
  });
}
