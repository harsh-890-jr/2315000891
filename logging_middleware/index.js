const express = require("express");
const { requestLogger, errorLogger } = require("./logger");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ✅ Apply custom logging middleware globally
app.use(requestLogger);

// --- Sample Routes ---
app.get("/", (req, res) => {
  res.json({
    message: "Logging Middleware is active",
    requestId: req.requestId,
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/error-demo", (req, res, next) => {
  const err = new Error("Intentional demo error");
  err.status = 500;
  next(err);
});

// ✅ Error logger (must be after routes)
app.use(errorLogger);

// Generic error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    requestId: req.requestId,
  });
});

app.listen(PORT, () => {
  console.log(
    JSON.stringify({
      event: "SERVER_START",
      port: PORT,
      timestamp: new Date().toISOString(),
    })
  );
});

module.exports = app;
