const { v4: uuidv4 } = require("uuid");

/**
 * Custom HTTP Request/Response Logger Middleware
 * Logs: requestId, method, url, statusCode, responseTime, ip, userAgent
 */
function requestLogger(req, res, next) {
  const requestId = uuidv4();
  const startTime = Date.now();

  // Attach requestId to request object for downstream use
  req.requestId = requestId;

  // Log incoming request
  const incomingLog = {
    requestId,
    event: "REQUEST",
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers["user-agent"] || "unknown",
    timestamp: new Date().toISOString(),
  };

  console.log(JSON.stringify(incomingLog));

  // Override res.end to capture response
  const originalEnd = res.end.bind(res);
  res.end = function (...args) {
    const responseTime = Date.now() - startTime;

    const outgoingLog = {
      requestId,
      event: "RESPONSE",
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTimeMs: responseTime,
      timestamp: new Date().toISOString(),
    };

    console.log(JSON.stringify(outgoingLog));
    return originalEnd(...args);
  };

  next();
}

/**
 * Error Logger Middleware
 */
function errorLogger(err, req, res, next) {
  const errorLog = {
    requestId: req.requestId || "N/A",
    event: "ERROR",
    method: req.method,
    url: req.originalUrl,
    errorMessage: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  };

  console.error(JSON.stringify(errorLog));
  next(err);
}

module.exports = { requestLogger, errorLogger };
