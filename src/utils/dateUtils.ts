export function parseTimeString(timeString: string): { hours: number; minutes: number } {
  if (!timeString || typeof timeString !== 'string') {
    throw new Error('Invalid time string');
  }
  const parts = timeString.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid time format. Expected format: HH:MM');
  }
  const [hours, minutes] = parts.map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error('Invalid time values');
  }
  return { hours, minutes };
}

export function setTimeOnDate(date: Date | string, timeString: string): Date {
  if (!date) {
    throw new Error('Invalid date');
  }
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date object');
  }
  
  const { hours, minutes } = parseTimeString(timeString);
  const newDate = new Date(dateObj);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
}

export function getTimeSlotDates(date: Date | string, timeSlotLabel: string): { startDate: Date; endDate: Date } {
  if (!timeSlotLabel || typeof timeSlotLabel !== 'string') {
    throw new Error('Invalid time slot label');
  }
  const parts = timeSlotLabel.split(' - ');
  if (parts.length !== 2) {
    throw new Error('Invalid time slot format. Expected format: HH:MM - HH:MM');
  }
  const [startTime, endTime] = parts;
  try {
    return {
      startDate: setTimeOnDate(date, startTime),
      endDate: setTimeOnDate(date, endTime)
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid time slot: ${errorMessage}`);
  }
}

export function formatDate(date: Date | string): string {
  if (!date) {
    throw new Error('Invalid date');
  }
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date format');
  }
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(date: Date | string): string {
  if (!date) {
    throw new Error('Invalid date');
  }
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date format');
  }
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) {
    return 'Date non disponible';
  }
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    return 'Date invalide';
  }
  return `${formatDate(d)} à ${formatTime(d)}`;
}
