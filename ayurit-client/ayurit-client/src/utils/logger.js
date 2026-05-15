/**
 * Logging utility for development vs production
 * In production, all debug logs are automatically suppressed
 */

const isDev = import.meta.env.DEV;

export const logger = {
  // Debug logs - suppressed in production
  debug: (namespace, message, data) => {
    if (isDev) {
      console.debug(`[${namespace}]`, message, data || '');
    }
  },

  // Info logs - shown in production
  info: (namespace, message, data) => {
    console.info(`[${namespace}]`, message, data || '');
  },

  // Warning logs - shown in production
  warn: (namespace, message, data) => {
    console.warn(`[${namespace}]`, message, data || '');
  },

  // Error logs - shown in production
  error: (namespace, message, data) => {
    console.error(`[${namespace}]`, message, data || '');
  },
};

export default logger;
