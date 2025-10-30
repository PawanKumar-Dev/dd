/**
 * Secure Logger Utility
 *
 * Only logs in development environment.
 * In production, logs are suppressed for security.
 */

const isDevelopment = process.env.NODE_ENV === "development";

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};

/**
 * Server-side logger (for API routes and server components)
 * Logs to console in all environments for server monitoring
 */
export const serverLogger = {
  log: (...args: any[]) => {
    console.log(...args);
  },

  error: (...args: any[]) => {
    console.error(...args);
  },

  warn: (...args: any[]) => {
    console.warn(...args);
  },

  info: (...args: any[]) => {
    console.info(...args);
  },
};
