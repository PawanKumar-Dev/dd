/**
 * Secure Logger Utility
 *
 * Only logs in development environment.
 * In production, logs are suppressed for security.
 */

import * as fs from "fs";
import * as path from "path";

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
const logFilePath = path.join(process.cwd(), "auth-debug.log");

export const serverLogger = {
  log: (...args: any[]) => {
    const message = `[${new Date().toISOString()}] [LOG] ${args.join(" ")}\n`;
    try {
      fs.appendFileSync(logFilePath, message);
    } catch (e) {
      // Ignore file write errors
    }
    console.log(...args);
  },

  error: (...args: any[]) => {
    const message = `[${new Date().toISOString()}] [ERROR] ${args.join(" ")}\n`;
    try {
      fs.appendFileSync(logFilePath, message);
    } catch (e) {
      // Ignore file write errors
    }
    console.error(...args);
  },

  warn: (...args: any[]) => {
    const message = `[${new Date().toISOString()}] [WARN] ${args.join(" ")}\n`;
    try {
      fs.appendFileSync(logFilePath, message);
    } catch (e) {
      // Ignore file write errors
    }
    console.warn(...args);
  },

  info: (...args: any[]) => {
    const message = `[${new Date().toISOString()}] [INFO] ${args.join(" ")}\n`;
    try {
      fs.appendFileSync(logFilePath, message);
    } catch (e) {
      // Ignore file write errors
    }
    console.info(...args);
  },
};
