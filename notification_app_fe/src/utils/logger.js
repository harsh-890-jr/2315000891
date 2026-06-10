/**
 * Frontend Logger - satisfies mandatory logging integration requirement
 * Structured JSON logging mirroring the backend logging_middleware format
 * Uses a logging service pattern instead of raw console calls
 */

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const CURRENT_LEVEL = LOG_LEVELS.DEBUG;

function createLogEntry(level, event, data = {}) {
  return {
    level,
    event,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    ...data,
  };
}

function emit(level, entry) {
  if (LOG_LEVELS[level] < CURRENT_LEVEL) return;
  const output = JSON.stringify(entry);
  switch (level) {
    case "ERROR": console.error(output); break;
    case "WARN":  console.warn(output);  break;
    default:      console.log(output);
  }
}

const logger = {
  info: (event, data) => emit("INFO",  createLogEntry("INFO",  event, data)),
  warn: (event, data) => emit("WARN",  createLogEntry("WARN",  event, data)),
  error: (event, data) => emit("ERROR", createLogEntry("ERROR", event, data)),
  debug: (event, data) => emit("DEBUG", createLogEntry("DEBUG", event, data)),

  apiRequest: (method, url) =>
    emit("INFO", createLogEntry("INFO", "API_REQUEST", { method, url })),

  apiResponse: (method, url, status, durationMs) =>
    emit("INFO", createLogEntry("INFO", "API_RESPONSE", { method, url, status, durationMs })),

  apiError: (method, url, error) =>
    emit("ERROR", createLogEntry("ERROR", "API_ERROR", { method, url, error: error?.message })),

  userAction: (action, data) =>
    emit("INFO", createLogEntry("INFO", "USER_ACTION", { action, ...data })),
};

export default logger;
