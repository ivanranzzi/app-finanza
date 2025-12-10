export const APP_TIMEZONE = 'Europe/Rome';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
};

export const formatDateShort = (date: Date) => {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: APP_TIMEZONE
  }).format(date);
};

export const getDayName = (date: Date) => {
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'short',
    timeZone: APP_TIMEZONE
  }).format(date).toUpperCase();
};

// Returns YYYY-MM-DD in Italy Timezone
export const getItalyDateStr = (date: Date) => {
  // en-CA locale naturally outputs YYYY-MM-DD format
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: APP_TIMEZONE
  }).format(date);
};