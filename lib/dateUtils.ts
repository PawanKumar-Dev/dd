/**
 * Date utility functions for Indian timezone (IST)
 * All dates and times in the application should use these functions
 */

// Indian timezone options
const INDIAN_TIMEZONE = 'Asia/Kolkata';
const INDIAN_LOCALE = 'en-IN';

/**
 * Format a date to Indian date format (DD/MM/YYYY)
 */
export function formatIndianDate(date: string | Date): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '-';
  }
  
  return dateObj.toLocaleDateString(INDIAN_LOCALE, {
    timeZone: INDIAN_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format a date to Indian date and time format (DD/MM/YYYY, HH:MM AM/PM)
 */
export function formatIndianDateTime(date: string | Date): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '-';
  }
  
  return dateObj.toLocaleString(INDIAN_LOCALE, {
    timeZone: INDIAN_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format a date to Indian time format (HH:MM AM/PM)
 */
export function formatIndianTime(date: string | Date): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '-';
  }
  
  return dateObj.toLocaleTimeString(INDIAN_LOCALE, {
    timeZone: INDIAN_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format a date to Indian long date format (DD Month YYYY)
 */
export function formatIndianLongDate(date: string | Date): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '-';
  }
  
  return dateObj.toLocaleDateString(INDIAN_LOCALE, {
    timeZone: INDIAN_TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Format a date to Indian long date and time format (DD Month YYYY, HH:MM AM/PM)
 */
export function formatIndianLongDateTime(date: string | Date): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '-';
  }
  
  return dateObj.toLocaleString(INDIAN_LOCALE, {
    timeZone: INDIAN_TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get current date in Indian timezone
 */
export function getCurrentIndianDate(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: INDIAN_TIMEZONE }));
}

/**
 * Format currency in Indian format (₹1,23,456.78)
 */
export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat(INDIAN_LOCALE, {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format number in Indian format (1,23,456)
 */
export function formatIndianNumber(number: number): string {
  return new Intl.NumberFormat(INDIAN_LOCALE).format(number);
}
